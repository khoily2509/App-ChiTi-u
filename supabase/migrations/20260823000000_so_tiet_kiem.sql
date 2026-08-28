-- 0009 Sổ tiết kiệm = quỹ CÓ LÃI SUẤT (§7.10).
--
-- Không phải hệ thống mới. Quỹ vốn đã là "số dư = SUM bút toán vào/ra", đã có
-- vòng đời, đã có màn hình. Sổ tiết kiệm khác quỹ thường đúng ba thứ: có lãi
-- suất, có ngày gửi, có kỳ hạn. Bốn cột nullable, một giá trị enum.
--
-- cho_phep_muon='khoa' (mặc định của quy) khớp sẵn với thực tế: rút trước hạn
-- thì lãi bị tính lại về lãi suất không kỳ hạn, gần như mất sạch phần lãi. Đó là
-- quy định chung của NHNN chứ không phải rào cản app tự dựng.

alter table quy
  -- ĐIỂM CƠ BẢN (1/100 của 1%), số nguyên: 5,5%/năm = 550; 5,35%/năm = 535.
  -- Bank niêm yết tới hai chữ số thập phân, mà §14 quy ước 1 cấm float cho mọi
  -- thứ đi vào phép tính tiền. Điểm cơ bản giữ được đúng hai chữ số đó bằng số
  -- nguyên, nên phép nhân ra tiền lãi là chính xác tuyệt đối, không có sai số.
  add column lai_suat_nam  integer check (lai_suat_nam > 0),
  add column ngay_gui      date,
  add column ky_han_thang  smallint check (ky_han_thang > 0),
  add column lich_tra_lai  text
    check (lich_tra_lai in ('dau_ky', 'cuoi_ky', 'hang_thang', 'hang_quy', 'khong_ky_han'));

-- Bốn cột đi cùng nhau hoặc cùng vắng mặt. Có lãi suất mà thiếu ngày gửi thì
-- không tính được gì; thiếu lịch trả lãi thì không biết tiền lãi tới tay khi nào.
-- Cho phép nửa vời là để dữ liệu hỏng nằm im tới lúc bồ mở màn ⑤ mới lộ ra.
--
-- 'khong_ky_han' là ngoại lệ DUY NHẤT được thiếu kỳ hạn — nó vốn không có ngày
-- đáo hạn nào.
alter table quy add constraint so_tiet_kiem_du_bo check (
  (lai_suat_nam is null and ngay_gui is null and ky_han_thang is null
     and lich_tra_lai is null)
  or
  (lai_suat_nam is not null and ngay_gui is not null and lich_tra_lai is not null
     and (ky_han_thang is not null or lich_tra_lai = 'khong_ky_han'))
);

-- Tiền lãi bank trả THẬT. Khác 'gop' ở chỗ nó không phải tiền bồ để dành ra, nên
-- bị loại khỏi tỷ lệ để dành y như 'so_du_ban_dau' (§7.10).
alter table bien_dong_quy drop constraint bien_dong_quy_loai_check;
alter table bien_dong_quy add constraint bien_dong_quy_loai_check
  check (loai in ('so_du_ban_dau', 'gop', 'rut', 'muon', 'tra_no', 'lai'));
