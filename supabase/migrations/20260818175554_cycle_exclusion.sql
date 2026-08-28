-- 0003 RÀNG BUỘC CHU KỲ — §7.2 rule 1: không chồng lấn, không hở.
--
-- §7.2 nói rõ ràng buộc này phải ở TẦNG DB, không ở UI. Lý do: tầng domain
-- (shared/domain/chu-ky.ts) đã dựng chu kỳ bằng cách dẫn xuất từ danh sách ngày
-- lương nên không thể sai — nhưng đó chỉ đúng với dữ liệu đi qua app. Bất kỳ
-- đường ghi nào khác (SQL tay, script phục hồi, Worker) đều cần lưới an toàn này.

create extension if not exists btree_gist;

-- daterange(..., '[]') bao gồm cả hai đầu, khớp với soNgayGiua() bên domain vốn
-- cũng tính cả hai đầu. Lệch quy ước ở đây sẽ cho phép hai chu kỳ dính nhau một
-- ngày mà DB vẫn nhận.
alter table chu_ky
  add constraint chu_ky_khong_chong_lan
  exclude using gist (
    user_id with =,
    daterange(ngay_bat_dau_thuc_te, ngay_ket_thuc, '[]') with &&
  );

-- Kiểm chứng theo §13: chèn hai chu kỳ chồng lấn bằng SQL trực tiếp phải bị từ chối.
