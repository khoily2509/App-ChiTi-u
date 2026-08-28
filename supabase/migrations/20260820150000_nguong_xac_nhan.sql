-- 0007 NGƯỠNG XÁC NHẬN SỐ LỚN.
--
-- Màn ghi nhanh nhập theo đơn vị nghìn, nên thừa một chữ số là sai GẤP MƯỜI LẦN:
-- gõ 100 ra 100.000đ, lỡ tay thành 1000 là 1.000.000đ. Không có gì cản lại.
-- Với app mà S3 là "không mất / sai dữ liệu" thì đây là chỗ phải chặn.
--
-- Trên ngưỡng này thì hỏi lại một câu trước khi lưu. Dưới ngưỡng vẫn giữ nguyên
-- đường 3 chạm — không được để việc chặn lỗi hiếm làm chậm việc thường xuyên.
--
-- Để trong cau_hinh chứ không hardcode: §14 quy ước 5 xếp "ngưỡng cảnh báo" vào
-- nhóm người-không-phải-kỹ-sư có thể muốn đổi, sửa được mà không cần deploy lại.
--
-- ⚠️ 1.000.000đ là số CỨNG do Khôi chốt 20/08/2026, hơi lệch với §2 ("mọi ngưỡng
-- tiền neo theo % thu nhập để tự giãn khi thu nhập tăng"). Trên thu nhập 9tr thì
-- nó tương đương ~11%. Nếu về sau thu nhập tăng mà ngưỡng đứng yên, hộp xác nhận
-- sẽ bật lên quá thường xuyên và bồ sẽ bấm qua theo phản xạ — lúc đó nó hết tác
-- dụng. Cân nhắc đổi sang phần trăm khi có đủ dữ liệu thu nhập.

create or replace function seed_nguoi_dung_moi(uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
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

  insert into danh_muc (user_id, ten, dinh_nghia, slot, icon, la_he_thong, thu_tu)
  select uid, 'Chưa biết xếp đâu',
         'Lưu nhanh khi chưa chắc xếp vào đâu. Phân loại lại ở buổi tổng kết Chủ Nhật.',
         null, 'question', true, 99
  where not exists (select 1 from danh_muc d where d.user_id = uid and d.la_he_thong);

  insert into cau_hinh (user_id, khoa, gia_tri, mo_ta)
  select uid, x.khoa, x.gia_tri::jsonb, x.mo_ta
  from (values
    ('tran_tra_no_phan_tram',  '15',                 'Trần trả nợ quỹ mỗi kỳ, % thu nhập thấp nhất 3 chu kỳ gần nhất (§7.3)'),
    ('nguong_bay_lua_chon',    '300000',             'Nợ dưới mức này thì trả luôn 1 kỳ, không bày lựa chọn (§7.3)'),
    ('gio_nhac',               '"21:00"',            'Giờ nhắc ghi chi tiêu, theo giờ Việt Nam'),
    ('bac_de_nguoi',           '{"nho":5,"vua":20}', 'Ngưỡng % thu nhập chia bậc để nguội 24h/48h/7 ngày (§7.4)'),
    ('moc_canh_bao_ngan_sach', '[50,80,100]',        'Mốc % ngân sách bắn thông báo, mỗi mốc 1 lần/chu kỳ (§7.6)'),
    ('moc_muc_tieu',           '[25,50,75,100]',     'Mốc % mục tiêu bắn chúc mừng (§12 GOAL_MILESTONE)'),
    ('so_canh_hoa_du',         '5',                  'Đủ bao nhiêu cánh thì nhuỵ chuyển vàng (§9.2)'),
    ('ngay_khong_lap_cau',     '14',                 'Không lặp lại một câu động viên trong bao nhiêu ngày (§9.3)'),
    ('nguong_xac_nhan_so_lon', '1000000',            'Trên mức này thì hỏi lại trước khi lưu, chặn lỗi thừa chữ số')
  ) as x(khoa, gia_tri, mo_ta)
  where not exists (select 1 from cau_hinh c where c.user_id = uid and c.khoa = x.khoa);

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

-- Bù khoá mới cho tài khoản đã tạo trước migration này.
do $bu$
declare u record;
begin
  for u in select id from auth.users loop
    perform seed_nguoi_dung_moi(u.id);
  end loop;
end;
$bu$;
