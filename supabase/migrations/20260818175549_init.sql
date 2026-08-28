-- 0001 INIT — bảng lõi. §6.1, §14.
--
-- Quy ước xuyên suốt mọi migration:
--   · Tiền là bigint đơn vị ĐỒNG, không bao giờ numeric/float (§14 quy ước 1).
--     Để bigint thì tầng TypeScript nhận được number nguyên, khớp thẳng với
--     branded type Dong bên shared/domain mà không phải chuyển đổi ở giữa.
--   · Thời gian lưu timestamptz UTC, LƯU THÊM cột ngay_local date (§14 quy ước 2).
--     Giao dịch 00:30 ngày 29 giờ VN có mốc UTC là 17:30 ngày 28 — không có cột
--     ngay_local thì mọi truy vấn theo ngày đều lệch.
--   · Không xoá cứng bao giờ: đổi trạng thái + ghi lý do (§13).
--   · ID mang tiền tố đọc được (§6.1) để nhìn log biết ngay đang xem bảng nào.
--
-- KHÔNG SỬA FILE NÀY SAU KHI ĐÃ CHẠY (§14 quy ước 7) — viết migration mới.

create extension if not exists pgcrypto;

/**
 * Sinh id dạng 'TXN-a3f2c9d1e8b4'. Tiền tố để đọc log, phần sau lấy từ uuid.
 * 12 ký tự hex ⇒ ~2,8e14 khả năng; ở quy mô ~10.000 dòng/năm (§3) xác suất trùng
 * là không đáng kể, và primary key vẫn chặn nếu có.
 */
create or replace function sinh_id(tien_to text)
returns text
language sql
volatile
as $$
  select tien_to || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
$$;

/** Cập nhật cột sua_luc mỗi lần UPDATE. */
create or replace function dat_sua_luc()
returns trigger
language plpgsql
as $$
begin
  new.sua_luc := now();
  return new;
end;
$$;

-- ── danh_muc ─────────────────────────────────────────────────────────────────

create table danh_muc (
  id            text primary key default sinh_id('CAT'),
  user_id       uuid not null references auth.users(id) on delete cascade,
  ten           text not null,
  -- Hiện dưới tên nút, là thứ giữ cho việc phân loại nhất quán suốt 12 tháng (§7.1).
  dinh_nghia    text not null default '',
  -- Slot màu 1–6 khớp §11.1. Null dành cho danh mục hệ thống "Chưa biết xếp đâu",
  -- vốn cố ý không chiếm slot dữ liệu để không tranh chỗ trên donut với danh mục thật.
  slot          smallint check (slot between 1 and 6),
  icon          text not null default 'plus',
  -- Định nghĩa có phiên bản: đổi giữa chừng thì số liệu cũ mang nghĩa khác số liệu
  -- mới. Không có cột này, biểu đồ so sánh 12 tháng sẽ nói dối (§7.1).
  hieu_luc_tu   date not null default current_date,
  la_he_thong   boolean not null default false,
  thu_tu        smallint not null default 0,
  trang_thai    text not null default 'active' check (trang_thai in ('active', 'archived')),
  tao_luc       timestamptz not null default now(),
  sua_luc       timestamptz not null default now()
);

-- Trần cứng 6 danh mục chi: bảng màu §11.1 chỉ kiểm định 6 slot; danh mục thứ 7
-- không có màu hợp lệ, mà cấp màu tự động sẽ phá kiểm định ΔE mù màu.
create unique index danh_muc_slot_duy_nhat on danh_muc (user_id, slot) where slot is not null;
create index danh_muc_theo_user on danh_muc (user_id, trang_thai);

-- ── chu_ky ───────────────────────────────────────────────────────────────────

create table chu_ky (
  id                        text primary key default sinh_id('CYC'),
  user_id                   uuid not null references auth.users(id) on delete cascade,
  ngay_bat_dau_du_kien      date not null,
  ngay_bat_dau_thuc_te      date not null,
  ngay_ket_thuc             date not null,
  -- Trừ sẵn để dành trước khi tiêu (§7.2). Mặc định 0 ở chu kỳ đầu vì bồ chưa biết
  -- để dành bao nhiêu là hợp lý; đặt cao quá là vượt ngân sách ngay tháng đầu rồi
  -- lấn quỹ — đúng vòng xoáy nợ §7.3 sợ nhất.
  so_tien_de_danh_dinh_muc  bigint not null default 0 check (so_tien_de_danh_dinh_muc >= 0),
  trang_thai                text not null default 'du_kien'
                            check (trang_thai in ('du_kien', 'dang_chay', 'da_dong')),
  -- Ngoại lệ duy nhất của quy tắc "không bao giờ lưu số đã tính được" (§6.3) — có
  -- chủ đích, để sửa danh mục hôm nay không làm đổi báo cáo tháng trước.
  snapshot_json             jsonb,
  tao_luc                   timestamptz not null default now(),
  sua_luc                   timestamptz not null default now(),

  constraint chu_ky_thu_tu_ngay check (ngay_ket_thuc >= ngay_bat_dau_thuc_te),
  -- Đã đóng thì bắt buộc có snapshot, nếu không thì "bất biến" chỉ là lời hứa suông.
  constraint chu_ky_dong_phai_co_snapshot
    check (trang_thai <> 'da_dong' or snapshot_json is not null)
);

create index chu_ky_theo_user on chu_ky (user_id, ngay_bat_dau_thuc_te desc);
-- Ràng buộc không chồng lấn nằm ở 0003 vì cần extension btree_gist.

-- ── thu_nhap ─────────────────────────────────────────────────────────────────

create table thu_nhap (
  id                  text primary key default sinh_id('INC'),
  user_id             uuid not null references auth.users(id) on delete cascade,
  chu_ky_id           text not null references chu_ky(id) on delete restrict,
  -- Để sẵn từ migration đầu dù UI chỉ hiện một nguồn: thêm cột sau tốn hơn nhiều
  -- so với để trống (§7.5). Bảng nguon_thu_nhap hoãn tới khi thật sự có nguồn thứ hai.
  nguon_thu_nhap_id   text,
  so_tien             bigint not null check (so_tien >= 0),
  trang_thai          text not null default 'du_kien'
                      check (trang_thai in ('du_kien', 'thuc_nhan')),
  ngay_local          date not null,
  tao_luc             timestamptz not null default now(),
  sua_luc             timestamptz not null default now()
);

create index thu_nhap_theo_chu_ky on thu_nhap (user_id, chu_ky_id);

-- ── giao_dich ────────────────────────────────────────────────────────────────

create table giao_dich (
  id            text primary key default sinh_id('TXN'),
  user_id       uuid not null references auth.users(id) on delete cascade,
  -- Cho phép null: giao dịch "trôi nổi" khi chưa thuộc chu kỳ nào phải LỘ RA để UI
  -- cảnh báo, không được im lặng bỏ qua (§7.2 rule 2). Đó là cách dữ liệu biến mất
  -- mà không ai biết.
  chu_ky_id     text references chu_ky(id) on delete set null,
  loai          text not null check (loai in ('chi', 'thu', 'chuyen_vao_quy', 'rut_tu_quy')),
  danh_muc_id   text references danh_muc(id) on delete restrict,
  quy_id        text,  -- khoá ngoại thêm ở 0004 vì bảng quy tạo sau
  so_tien       bigint not null check (so_tien > 0),
  ghi_chu       text,

  -- Nhập tay vào thẳng 'da_xac_nhan' (bồ đang nhìn màn hình, đó chính là sự xác
  -- nhận); chỉ /api/ingest mới tạo 'cho_xac_nhan' — fail closed (§13).
  trang_thai    text not null default 'da_xac_nhan'
                check (trang_thai in ('cho_xac_nhan', 'da_xac_nhan', 'da_huy')),
  ly_do_huy     text,
  nguon         text not null default 'thu_cong' check (nguon in ('thu_cong', 'siri', 'ocr')),
  -- Khoá chống trùng do PHÍA GỌI sinh (§12): Shortcut sinh UUID mỗi lần chạy. Khoá
  -- suy ra từ nội dung sẽ nuốt mất giao dịch thật khi bồ mua hai món giống hệt nhau
  -- trong cùng một phút — vi phạm S3 "0 sự cố mất bản ghi".
  idempotency_key text,

  xay_ra_luc    timestamptz not null default now(),
  ngay_local    date not null,
  tao_luc       timestamptz not null default now(),
  sua_luc       timestamptz not null default now(),

  -- Bốn loại giao dịch, mỗi loại có bộ trường bắt buộc riêng (§6.2). "Để dành"
  -- KHÔNG phải danh mục chi: nếu là danh mục thì để dành 3tr sẽ hiện thành "đã tiêu
  -- 3tr", làm sai tỷ lệ để dành, donut và hạn mức.
  constraint giao_dich_truong_theo_loai check (
    case loai
      when 'chi'            then danh_muc_id is not null and quy_id is null
      when 'thu'            then danh_muc_id is null     and quy_id is null
      when 'chuyen_vao_quy' then danh_muc_id is null     and quy_id is not null
      when 'rut_tu_quy'     then danh_muc_id is null     and quy_id is not null
    end
  ),
  constraint giao_dich_huy_phai_co_ly_do
    check (trang_thai <> 'da_huy' or ly_do_huy is not null)
);

create unique index giao_dich_idempotency
  on giao_dich (user_id, idempotency_key) where idempotency_key is not null;
create index giao_dich_theo_ngay on giao_dich (user_id, ngay_local desc);
create index giao_dich_theo_chu_ky on giao_dich (user_id, chu_ky_id, trang_thai);
-- Giao dịch trôi nổi phải tra ra được ngay để hiện cảnh báo.
create index giao_dich_troi_noi on giao_dich (user_id) where chu_ky_id is null;

-- ── cau_hinh ─────────────────────────────────────────────────────────────────

-- §14 quy ước 5: mọi thứ người-không-phải-kỹ-sư có thể muốn đổi đều vào DB — hạn
-- mức, giờ nhắc, mốc mục tiêu, bậc để nguội, TRẦN 15%, ngưỡng cảnh báo.
create table cau_hinh (
  user_id   uuid not null references auth.users(id) on delete cascade,
  khoa      text not null,
  gia_tri   jsonb not null,
  mo_ta     text,
  sua_luc   timestamptz not null default now(),
  primary key (user_id, khoa)
);

-- ── cau_dong_vien ────────────────────────────────────────────────────────────

-- §9.3: câu chữ nằm trong bảng, KHÔNG nhét vào code. Đây là mục file tự đánh dấu
-- "rủi ro cao nhất của dự án" — sửa lời phải sửa được mà không cần deploy lại.
create table cau_dong_vien (
  id              text primary key default sinh_id('MSG'),
  user_id         uuid not null references auth.users(id) on delete cascade,
  loai            text not null,
  dieu_kien       jsonb,
  noi_dung        text not null,
  -- Không lặp lại một câu trong vòng 14 ngày (§9.3 luật 2).
  lan_dung_cuoi   timestamptz,
  trang_thai      text not null default 'active' check (trang_thai in ('active', 'archived')),
  tao_luc         timestamptz not null default now()
);

create index cau_dong_vien_chon on cau_dong_vien (user_id, loai, trang_thai, lan_dung_cuoi);

-- ── su_kien ──────────────────────────────────────────────────────────────────

-- Audit log append-only (§2, §12.1). Không sửa, không xoá. Chỉ hệ thống ghi.
create table su_kien (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  ma          text not null,          -- TXN_CONFIRMED, CYCLE_BOUNDARY_CHANGED, ...
  doi_tuong   text,                   -- id bản ghi liên quan
  du_lieu     jsonb not null default '{}'::jsonb,
  -- Đo tiêu chí S2 "mở app → lưu xong ≤ 5 giây" (§1). Không có cột này thì sau 90
  -- ngày không ai biết S2 đạt hay không.
  duration_ms integer,
  tao_luc     timestamptz not null default now()
);

create index su_kien_theo_ma on su_kien (user_id, ma, tao_luc desc);
create index su_kien_theo_doi_tuong on su_kien (user_id, doi_tuong);

-- ── Trigger sua_luc ──────────────────────────────────────────────────────────

create trigger danh_muc_sua_luc before update on danh_muc
  for each row execute function dat_sua_luc();
create trigger chu_ky_sua_luc before update on chu_ky
  for each row execute function dat_sua_luc();
create trigger thu_nhap_sua_luc before update on thu_nhap
  for each row execute function dat_sua_luc();
create trigger giao_dich_sua_luc before update on giao_dich
  for each row execute function dat_sua_luc();
