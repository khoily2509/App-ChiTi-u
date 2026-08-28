-- 0012 ẨN DANH MỤC THÌ NHẢ SLOT RA — §7.1 trần cứng 6 nghĩa là 6 CÙNG LÚC.
--
-- Chỉ mục cũ giữ slot của cả danh mục đã ẩn:
--
--   create unique index danh_muc_slot_duy_nhat
--     on danh_muc (user_id, slot) where slot is not null;
--
-- Hệ quả tìm được lúc thử luồng (27/08/2026): ẩn "Đầu tư" đi rồi thêm danh mục
-- mới thì màn hình thấy slot 4 trống nên bày nút "+ Thêm danh mục", mà lệnh chèn
-- lại trả 23505 duplicate key. Bày ra một nút bấm vào là lỗi — đúng thứ màn đó
-- được viết ra để tránh.
--
-- Gốc rễ là hai cách hiểu khác nhau về "trần cứng 6":
--   ① 6 danh mục cùng lúc          ← ý của §7.1, vì lý do là bảng màu chỉ có 6
--   ② 6 danh mục trong cả đời app  ← thứ chỉ mục cũ thật sự áp
--
-- §7.1 nói rõ lý do của trần: "bảng màu §11.1 chỉ kiểm định 6 slot". Đó là ràng
-- buộc về thứ ĐANG HIỆN trên màn hình, không phải về tổng số từng tồn tại. Nên ①
-- mới đúng.
--
-- Danh mục đã ẩn VẪN GIỮ giá trị `slot` của nó — không đặt về null — để biểu đồ
-- các chu kỳ cũ còn tô đúng màu như lúc bồ nhìn thấy nó. Chỉ là nó thôi chiếm
-- chỗ của danh mục đang dùng.

drop index if exists danh_muc_slot_duy_nhat;

create unique index danh_muc_slot_duy_nhat
  on danh_muc (user_id, slot)
  where slot is not null and trang_thai = 'active';

-- Kiểm chứng theo §13: ẩn một danh mục rồi thêm danh mục mới vào đúng slot đó
-- phải chạy được; còn hai danh mục ĐANG DÙNG mà trùng slot thì vẫn phải bị chặn.
