-- 0004 QUỸ & SỔ BÚT TOÁN — §7.3. Gồm cả RLS cho các bảng tạo ở đây.

-- ── quy ──────────────────────────────────────────────────────────────────────

-- Quỹ dự phòng = quỹ KHÔNG có đích. "Mua xe" = quỹ CÓ so_tien_dich + icon xe.
-- Cùng một object, khác nhau ở chỗ có đích hay không (§7.3).
create table quy (
  id              text primary key default sinh_id('FND'),
  user_id         uuid not null references auth.users(id) on delete cascade,
  ten             text not null,
  so_tien_dich    bigint check (so_tien_dich > 0),   -- null = quỹ dự phòng
  -- Lưu SLUG (§11.5), không lưu SVG: nhét SVG vào DB thì đổi bộ icon sau này
  -- phải sửa từng dòng dữ liệu.
  icon            text not null default 'plant',
  -- Quỹ dự phòng để 'tu_do', mọi mục tiêu dài hạn để 'khoa' — nếu tiền "mua nhà"
  -- bị mượn âm thầm mỗi lần lỡ tay thì mục tiêu mất hết ý nghĩa (§7.3).
  cho_phep_muon   text not null default 'khoa'
                  check (cho_phep_muon in ('tu_do', 'hoi_truoc', 'khoa')),
  thu_tu          smallint not null default 0,
  trang_thai      text not null default 'dang_chay'
                  check (trang_thai in ('dang_chay', 'tam_dung', 'hoan_thanh', 'bo')),
  tao_luc         timestamptz not null default now(),
  sua_luc         timestamptz not null default now()
);

create index quy_theo_user on quy (user_id, trang_thai, thu_tu);

-- ── khoan_muon_quy ───────────────────────────────────────────────────────────

create table khoan_muon_quy (
  id                text primary key default sinh_id('BRW'),
  user_id           uuid not null references auth.users(id) on delete cascade,
  quy_id            text not null references quy(id) on delete restrict,
  chu_ky_muon_id    text not null references chu_ky(id) on delete restrict,
  so_tien           bigint not null check (so_tien > 0),
  -- 'linh_hoat' BẮT BUỘC phải có: nợ vượt 6 × trần thì cả 1/3/6 tháng đều không
  -- hợp lệ và app sẽ kẹt không cho chọn được gì (§7.3).
  ky_han            text not null check (ky_han in ('1', '3', '6', 'linh_hoat')),
  so_tien_moi_ky    bigint not null check (so_tien_moi_ky > 0),
  con_lai           bigint not null check (con_lai >= 0),
  trang_thai        text not null default 'dang_no'
                    check (trang_thai in ('dang_no', 'dang_tra', 'da_tra_het', 'xoa_no')),
  tao_luc           timestamptz not null default now(),
  sua_luc           timestamptz not null default now(),

  constraint khoan_muon_con_lai_khong_vuot check (con_lai <= so_tien)
);

create index khoan_muon_dang_tra on khoan_muon_quy (user_id, trang_thai)
  where trang_thai in ('dang_no', 'dang_tra');

-- ── bien_dong_quy ────────────────────────────────────────────────────────────

-- Số dư quỹ = SUM(so_tien), KHÔNG BAO GIỜ lưu sẵn (§6.3 quy tắc vàng).
create table bien_dong_quy (
  id              text primary key default sinh_id('FMV'),
  user_id         uuid not null references auth.users(id) on delete cascade,
  quy_id          text not null references quy(id) on delete restrict,
  chu_ky_id       text references chu_ky(id) on delete set null,
  -- Dương = vào quỹ, âm = ra khỏi quỹ. Không tách hai cột, để tổng luôn là một
  -- phép SUM duy nhất, không có chỗ cho lỗi dấu.
  so_tien         bigint not null check (so_tien <> 0),
  -- 'so_du_ban_dau' là loại riêng, KHÔNG phải 'gop': nếu tính là góp thì tỷ lệ
  -- để dành chu kỳ đầu vọt lên vô lý và tạo đỉnh giả làm méo mọi biểu đồ so sánh
  -- về sau (§7.3, AT-11).
  loai            text not null
                  check (loai in ('so_du_ban_dau', 'gop', 'rut', 'muon', 'tra_no')),
  khoan_muon_id   text references khoan_muon_quy(id) on delete restrict,
  ghi_chu         text,
  ngay_local      date not null,
  tao_luc         timestamptz not null default now(),

  -- Bút toán mượn/trả nợ bắt buộc trỏ về khoản nợ, nếu không thì không truy được
  -- tiền đã đi đâu.
  constraint bien_dong_muon_phai_co_khoan check (
    (loai in ('muon', 'tra_no')) = (khoan_muon_id is not null)
  )
);

create index bien_dong_theo_quy on bien_dong_quy (user_id, quy_id);
create index bien_dong_theo_chu_ky on bien_dong_quy (user_id, chu_ky_id);

-- Chặn số dư quỹ âm (§7.3, AT-16).
--
-- Không viết được bằng CHECK vì ràng buộc trải trên nhiều dòng. Trigger chạy sau
-- mỗi lần ghi và tính lại tổng của đúng quỹ đó.
--
-- Vì sao cần: onboarding không hỏi về quỹ nên quỹ khởi đầu 0đ, mà chu kỳ đầu lại
-- là chu kỳ dễ vượt ngân sách nhất — bấm "[Lấy từ quỹ]" trên quỹ rỗng là đường
-- gần như chắc chắn đi qua ở tháng đầu. §7.8 cấm hiện số âm ra màn hình; chặn
-- ngay ở DB thì con số âm không bao giờ tồn tại để mà hiện.
--
-- deferrable initially deferred: kiểm lúc commit chứ không phải từng dòng, để
-- một transaction rút rồi bù lại vẫn chạy được.
create or replace function chan_so_du_am()
returns trigger
language plpgsql
as $fn$
declare
  ton bigint;
  quy_can_kiem text := coalesce(new.quy_id, old.quy_id);
begin
  select coalesce(sum(so_tien), 0) into ton
  from bien_dong_quy where quy_id = quy_can_kiem;

  if ton < 0 then
    raise exception 'So du quy % khong duoc am (dang la %)', quy_can_kiem, ton
      using errcode = 'check_violation';
  end if;

  return null;
end;
$fn$;

create constraint trigger bien_dong_khong_am
  after insert or update or delete on bien_dong_quy
  deferrable initially deferred
  for each row execute function chan_so_du_am();

-- ── quyet_dinh_mua ───────────────────────────────────────────────────────────

create table quyet_dinh_mua (
  id            text primary key default sinh_id('DEC'),
  user_id       uuid not null references auth.users(id) on delete cascade,
  ten_mon       text,
  so_tien       bigint not null check (so_tien > 0),
  danh_muc_id   text references danh_muc(id) on delete set null,
  -- Bậc để nguội neo theo % thu nhập để ngưỡng tự giãn khi thu nhập tăng (§7.4).
  bac_de_nguoi  text check (bac_de_nguoi in ('24h', '48h', '7ngay')),
  nguoi_den     timestamptz,
  trang_thai    text not null default 'dang_can_nhac'
                check (trang_thai in ('dang_can_nhac', 'da_mua', 'da_bo_qua', 'het_han')),
  giao_dich_id  text references giao_dich(id) on delete set null,
  tao_luc       timestamptz not null default now(),
  sua_luc       timestamptz not null default now()
);

create index quyet_dinh_dang_cho on quyet_dinh_mua (user_id, trang_thai, nguoi_den);

-- ── push_subscription ────────────────────────────────────────────────────────

create table push_subscription (
  id          text primary key default sinh_id('SUB'),
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null,
  p256dh      text not null,
  auth        text not null,
  -- Subscription iOS hết hạn âm thầm: server trả 404/410 thì đánh dấu 'dead'
  -- rồi app tự đăng ký lại mỗi lần mở (§5).
  trang_thai  text not null default 'active' check (trang_thai in ('active', 'dead')),
  tao_luc     timestamptz not null default now(),

  constraint push_endpoint_duy_nhat unique (user_id, endpoint)
);

-- ── Khoá ngoại còn thiếu từ 0001 ─────────────────────────────────────────────

-- giao_dich.quy_id để trống khoá ngoại ở 0001 vì bảng quy chưa tồn tại lúc đó.
alter table giao_dich
  add constraint giao_dich_quy_fk foreign key (quy_id) references quy(id) on delete restrict;

-- ── Trigger sua_luc ──────────────────────────────────────────────────────────

create trigger quy_sua_luc before update on quy
  for each row execute function dat_sua_luc();
create trigger khoan_muon_sua_luc before update on khoan_muon_quy
  for each row execute function dat_sua_luc();
create trigger quyet_dinh_sua_luc before update on quyet_dinh_mua
  for each row execute function dat_sua_luc();

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table quy               enable row level security;
alter table khoan_muon_quy    enable row level security;
alter table bien_dong_quy     enable row level security;
alter table quyet_dinh_mua    enable row level security;
alter table push_subscription enable row level security;

create policy quy_chu_so_huu on quy
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy khoan_muon_chu_so_huu on khoan_muon_quy
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy bien_dong_chu_so_huu on bien_dong_quy
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy quyet_dinh_chu_so_huu on quyet_dinh_mua
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy push_chu_so_huu on push_subscription
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Sổ bút toán là chứng từ tiền bạc: huỷ bằng bút toán ngược, không xoá dòng (§13).
create policy bien_dong_khong_xoa on bien_dong_quy
  as restrictive for delete to authenticated using (false);
