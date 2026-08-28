-- 0005 SEED — dữ liệu mặc định cho tài khoản mới.
--
-- Làm bằng TRIGGER trên auth.users chứ không phải script chạy tay: tài khoản nào
-- tạo sau này cũng có sẵn danh mục, và script phục hồi (AT-14) không phải nhớ
-- seed lại thủ công.
--
-- Hàm idempotent — chạy lại trên user đã có dữ liệu thì không nhân đôi.

create or replace function seed_nguoi_dung_moi(uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  -- ── 5 danh mục theo Ý ĐỊNH (§7.1) ──────────────────────────────────────────
  -- Ăn uống CỐ Ý gộp vào Sinh hoạt: ma sát lớn nhất khi ghi chi tiêu không phải
  -- gõ số mà là chọn danh mục. Phân loại theo ý định ("một mình / với người
  -- khác") quyết định nhanh hơn phân loại theo món đồ.
  -- Slot 6 để trống cho bồ tự đặt tên; trần cứng 6 vì bảng màu §11.1 chỉ kiểm
  -- định 6 slot.
  insert into danh_muc (user_id, ten, dinh_nghia, slot, icon, thu_tu)
  select uid, x.ten, x.dinh_nghia, x.slot, x.icon, x.slot
  from (values
    ('Sinh hoạt',           'Ăn ngoài một mình, mua đồ ăn cho bản thân, đi siêu thị, đồ dùng thiết yếu', 1::smallint, 'bowl-steam'),
    ('Phát triển bản thân', 'Học, sách, khoá học',                                                       2,           'book-open'),
    ('Giải trí',            'Đi ăn với bạn bè, đi chơi, mua vui',                                         3,           'martini'),
    ('Đầu tư',              'Tiền bỏ ra để sinh lời',                                                     4,           'plant'),
    ('Mĩ phẩm',             'Skincare, makeup',                                                           5,           'lipstick')
  ) as x(ten, dinh_nghia, slot, icon)
  where not exists (select 1 from danh_muc d where d.user_id = uid and d.slot = x.slot);

  -- Danh mục hệ thống, không xoá được (§7.1 ràng buộc 3). Không chiếm slot màu
  -- để không tranh chỗ trên donut với danh mục thật.
  -- Không có lối thoát này thì lưỡng lự → không ghi → bỏ app.
  insert into danh_muc (user_id, ten, dinh_nghia, slot, icon, la_he_thong, thu_tu)
  select uid, 'Chưa biết xếp đâu',
         'Lưu nhanh khi chưa chắc xếp vào đâu. Phân loại lại ở buổi tổng kết Chủ Nhật.',
         null, 'question', true, 99
  where not exists (select 1 from danh_muc d where d.user_id = uid and d.la_he_thong);

  -- ── Cấu hình (§14 quy ước 5) ───────────────────────────────────────────────
  -- Mọi ngưỡng neo theo % thu nhập, không neo số cứng, để tự giãn khi thu nhập
  -- tăng (§2). Đổi được mà không cần deploy lại.
  insert into cau_hinh (user_id, khoa, gia_tri, mo_ta)
  select uid, x.khoa, x.gia_tri::jsonb, x.mo_ta
  from (values
    ('tran_tra_no_phan_tram',  '15',              'Trần trả nợ quỹ mỗi kỳ, % thu nhập thấp nhất 3 chu kỳ gần nhất (§7.3)'),
    ('nguong_bay_lua_chon',    '300000',          'Nợ dưới mức này thì trả luôn 1 kỳ, không bày lựa chọn (§7.3)'),
    ('gio_nhac',               '"21:00"',         'Giờ nhắc ghi chi tiêu, theo giờ Việt Nam'),
    ('bac_de_nguoi',           '{"nho":5,"vua":20}', 'Ngưỡng % thu nhập chia bậc để nguội 24h/48h/7 ngày (§7.4)'),
    ('moc_canh_bao_ngan_sach', '[50,80,100]',     'Mốc % ngân sách bắn thông báo, mỗi mốc 1 lần/chu kỳ (§7.6)'),
    ('moc_muc_tieu',           '[25,50,75,100]',  'Mốc % mục tiêu bắn chúc mừng (§12 GOAL_MILESTONE)'),
    ('so_canh_hoa_du',         '5',               'Đủ bao nhiêu cánh thì nhuỵ chuyển vàng (§9.2)'),
    ('ngay_khong_lap_cau',     '14',              'Không lặp lại một câu động viên trong bao nhiêu ngày (§9.3)')
  ) as x(khoa, gia_tri, mo_ta)
  where not exists (select 1 from cau_hinh c where c.user_id = uid and c.khoa = x.khoa);

  -- ── Câu động viên (§9.3) ───────────────────────────────────────────────────
  -- Ba tông cho phép: mừng · trung tính thông tin · quan tâm. KHÔNG có tông chê.
  -- Mỗi câu cảnh báo bắt buộc kèm một hành động cụ thể, không được chỉ phán xét.
  -- So sánh với chính bồ ở chu kỳ trước, không bao giờ so với người khác.
  insert into cau_dong_vien (user_id, loai, noi_dung)
  select uid, x.loai, x.noi_dung
  from (values
    ('nhac_ghi',      'Hôm nay chưa có ghi chép nào — thêm nhanh nhé 👇'),
    ('nhac_ghi',      'Ghi một dòng thôi cũng được, 5 giây là xong 🌱'),
    ('sap_vuot',      'Chu kỳ này đã dùng {phan_tram}% ngân sách, còn {so_ngay} ngày.'),
    ('sap_vuot',      'Còn {con_lai} cho {so_ngay} ngày tới — khoảng {moi_ngay}/ngày.'),
    ('hoa_sap_du',    'Còn 1 ngày nữa là hoa nở đủ 🌼'),
    ('hoa_du',        'Tuần này hoa nở đủ. Nhuỵ vàng rồi ✨'),
    ('moc_muc_tieu',  '{ten_quy}: {phan_tram}%. Thêm {con_thieu} nữa là qua mốc tiếp theo.'),
    ('tra_xong_no',   'Đã trả xong khoản mượn quỹ. Quỹ về nguyên trạng 💚'),
    ('thu_nhap_tang', 'Thu nhập trung bình 3 chu kỳ gần đây tăng {phan_tram}% — mừng nhé 🎉'),
    ('khong_tieu',    'Đã quyết định không tiêu {so_tien}. Cộng dồn tới giờ: {tong}.')
  ) as x(loai, noi_dung)
  where not exists (select 1 from cau_dong_vien c where c.user_id = uid and c.noi_dung = x.noi_dung);
end;
$fn$;

-- ── Trigger cho tài khoản mới ────────────────────────────────────────────────

create or replace function xu_ly_nguoi_dung_moi()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  perform seed_nguoi_dung_moi(new.id);
  return new;
end;
$fn$;

drop trigger if exists nguoi_dung_moi_seed on auth.users;
create trigger nguoi_dung_moi_seed
  after insert on auth.users
  for each row execute function xu_ly_nguoi_dung_moi();

-- ── Bù cho tài khoản đã tạo trước migration này ──────────────────────────────

do $bu$
declare u record;
begin
  for u in select id from auth.users loop
    perform seed_nguoi_dung_moi(u.id);
  end loop;
end;
$bu$;
