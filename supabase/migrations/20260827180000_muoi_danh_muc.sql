-- 0013 NỚI TRẦN DANH MỤC LÊN 10 + CHỌN CÁI NÀO HIỆN Ở MÀN CHÍNH.
--
-- Khôi chốt 27/08/2026: bỏ trần cứng 6, tối đa 10.
--
-- Trần 6 không phải con số tuỳ tiện — §7.1 đặt nó vì bảng màu §11.1 chỉ có 6 màu
-- đã kiểm định cho người mù màu đỏ-lục, và cấp màu tự động cho slot thứ 7 sẽ phá
-- vỡ kiểm định đó. Nên nới trần bắt buộc phải giải xong bài toán màu TRƯỚC.
--
-- Đã giải: bốn màu mới chọn bằng cách đặt SÀN an toàn (ΔE ≥ 9 với người mù đỏ-lục
-- theo Viénot 1999 + CIEDE2000, ≥ 16 với thị giác thường, lệch hue ≥ 24°) rồi
-- trong số đạt sàn lấy màu DỊU NHẤT. Sáu màu gốc giữ nguyên từng ký tự. Toàn bộ
-- phép đo đó giờ nằm trong `mu-mau.test.ts` và chạy mỗi lần test — trước đây nó
-- chỉ là một câu trong tài liệu, không có gì chặn nếu ai đó sửa một mã hex.
--
-- Vì sao dừng ở 10 chứ không mở vô hạn: mỗi màu thêm vào lại ép các màu cũ sát
-- nhau hơn. 10 là mức còn giữ được khoảng cách không tệ hơn bộ 6 gốc.

alter table danh_muc drop constraint danh_muc_slot_check;
alter table danh_muc add constraint danh_muc_slot_check check (slot between 1 and 10);

-- ── Chọn danh mục nào hiện ở lưới ghi nhanh ──────────────────────────────────
--
-- Lưới ghi nhanh trên màn ① chứa tối đa 6 ô — đó là giới hạn của MÀN HÌNH, đo
-- thật trên iPhone 13 ở Pha 3.5: quá 6 thì lưới đẩy thanh nhịp tuần xuống dưới
-- nếp gấp, mà ghi nhanh là tính năng số 1 (§8).
--
-- Nên khi có nhiều hơn 6 danh mục, bồ chọn cái nào nằm ngoài màn chính. Những
-- cái còn lại vẫn ghi được, chỉ là qua nút "+" thay vì chạm thẳng.
--
-- Mặc định `true`: năm danh mục seed sẵn và cái thứ sáu bồ tự thêm đều nên có
-- mặt ngay. Việc chọn lọc chỉ bắt đầu có nghĩa từ cái thứ bảy trở đi.
alter table danh_muc
  add column if not exists hien_man_chinh boolean not null default true;

comment on column danh_muc.hien_man_chinh is
  'Có nằm trên lưới ghi nhanh của màn ① không. Lưới chứa tối đa 6 ô (§7.1).';

-- Kiểm chứng theo §13: sau lệnh này, chèn danh mục slot 7–10 phải chạy được;
-- slot 11 và slot 0 vẫn phải bị từ chối.
