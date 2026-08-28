-- 0006 ĐO THỜI GIAN — hai mốc cho tiêu chí S2.
--
-- §1 định nghĩa S2 là "mở app → lưu xong ≤ 5 giây". Một cột không đủ để trả lời
-- cả hai câu hỏi khác nhau mà ta cần biết:
--
--   duration_ms      từ lúc MÀN NHẬP mở ra → đo riêng thao tác nhập liệu.
--                    Đây là con số nói lên thiết kế bàn phím và nút số tắt tốt
--                    tới đâu, không bị nhiễu bởi thời gian tải app.
--
--   duration_app_ms  từ lúc MỞ APP → chính là S2 theo đúng chữ trong §1.
--                    Bao gồm cả tải trang, đăng nhập lại, và số chạm phải đi qua
--                    trước khi tới màn nhập.
--
-- Ghi cả hai vì dữ liệu chỉ ghi được MỘT lần nhưng đọc được nhiều năm. Thêm cột
-- sau khi đã chạy vài tháng thì mất luôn phần lịch sử đó.
--
-- Về sau khi có shortcut Siri mở thẳng vào màn nhập (§4.1 đường 3), hiệu số giữa
-- hai cột chính là cái giá phải trả cho việc đi vòng qua màn ①.

alter table su_kien add column duration_app_ms integer;

comment on column su_kien.duration_ms is
  'Mili giây từ lúc màn nhập mở ra tới khi lưu xong. Đo riêng thao tác nhập liệu.';
comment on column su_kien.duration_app_ms is
  'Mili giây từ lúc mở app tới khi lưu xong. Đây là S2 theo đúng §1.';
