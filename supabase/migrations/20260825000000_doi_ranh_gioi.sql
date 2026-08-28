-- 0010 ĐỔI RANH GIỚI CHU KỲ TRONG MỘT GIAO DỊCH NGUYÊN KHỐI — §7.2 rule 1 & 3.
--
-- Lỗi tìm được khi đi thử luồng (25/08/2026): bấm "ngày lương trễ 1 ngày" thì
-- báo lỗi ràng buộc và không đổi được gì. Ràng buộc không sai — code sai.
--
-- Dời ngày bắt đầu chu kỳ này phải kéo theo ngày kết thúc chu kỳ trước, và
-- trong lúc mới đổi được một trong hai thì hai khoảng NHẤT ĐỊNH phải hoặc chạm
-- nhau hoặc hở ra:
--
--   đang có:  trước [30/06 → 30/07]   này [31/07 → 30/08]
--   muốn có:  trước [30/06 → 31/07]   này [01/08 → 30/08]
--
--   nong "trước" ra trước  ⇒ chạm nhau ngày 31/07  ⇒ EXCLUDE chặn, hỏng hẳn
--   dời "này" đi trước     ⇒ hở ngày 31/07         ⇒ qua được, nhưng nếu app
--                                                     chết ngay lúc đó thì các
--                                                     khoản ngày 31/07 không
--                                                     thuộc chu kỳ nào cả
--
-- Sửa cái CO LẠI trước thì tránh được lỗi ràng buộc ở CẢ HAI chiều — đó là đường
-- lui `coLaiTruoc()` bên client dùng khi migration này chưa chạy, và đã đo trên
-- DB thật: sai thứ tự cho 23P01 cả hai chiều, đúng thứ tự qua cả hai chiều.
--
-- Nhưng nó vẫn để hở một khoảnh khắc, mà §7.2 rule 1 nói "không chồng lấn, KHÔNG
-- HỞ". Muốn hết hẳn trạng thái nửa vời thì cả hai lệnh phải nằm trong MỘT giao
-- dịch và hoãn kiểm tra ràng buộc tới lúc chốt. Đó là việc của file này.

-- `initially immediate` giữ nguyên hành vi cũ cho mọi đường ghi khác: chèn hai
-- chu kỳ chồng lấn bằng SQL tay vẫn bị chặn NGAY, không đợi tới cuối giao dịch.
-- Chỉ hàm bên dưới mới chủ động hoãn.
alter table chu_ky drop constraint chu_ky_khong_chong_lan;

alter table chu_ky
  add constraint chu_ky_khong_chong_lan
  exclude using gist (
    user_id with =,
    daterange(ngay_bat_dau_thuc_te, ngay_ket_thuc, '[]') with &&
  )
  deferrable initially immediate;

-- security invoker (mặc định): RLS vẫn áp theo người gọi. §5 nói RLS là lớp bảo
-- vệ DUY NHẤT — một hàm chạy bằng quyền người tạo sẽ chọc thủng đúng lớp đó.
create or replace function doi_ranh_gioi_chu_ky(
  p_truoc_id        text,
  p_truoc_ket_thuc  date,
  p_nay_id          text,
  p_nay_bat_dau     date
) returns void
language plpgsql
as $$
begin
  set constraints chu_ky_khong_chong_lan deferred;

  if p_truoc_id is not null then
    update chu_ky set ngay_ket_thuc = p_truoc_ket_thuc where id = p_truoc_id;
  end if;

  update chu_ky set ngay_bat_dau_thuc_te = p_nay_bat_dau where id = p_nay_id;
end;
$$;

-- Kiểm chứng theo §13: gọi hàm này để dời ranh giới cả hai chiều đều phải chạy
-- được; còn chèn hai chu kỳ chồng lấn bằng SQL trực tiếp thì vẫn phải bị từ chối.
