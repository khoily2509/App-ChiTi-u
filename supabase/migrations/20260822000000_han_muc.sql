-- 0008 han_muc — "hũ" từng danh mục (§7.6).
--
-- Grain là (chu kỳ, danh mục), KHÔNG phải (danh mục): hạn mức đổi theo từng chu
-- kỳ, còn danh_muc là bảng config dùng chung mọi chu kỳ. Đặt cột so_tien lên
-- danh_muc thì tháng sau đổi hũ là số liệu tháng trước đổi theo — đúng loại lỗi
-- snapshot_json ở §6.3 sinh ra để chặn.
--
-- Khoá chính ghép cùng khuôn cau_hinh(user_id, khoa) ở 0001 — không thêm khái
-- niệm mới, và tự chặn một danh mục có hai hạn mức trong cùng chu kỳ.

create table han_muc (
  user_id     uuid   not null references auth.users(id) on delete cascade,
  chu_ky_id   text   not null references chu_ky(id)   on delete cascade,
  danh_muc_id text   not null references danh_muc(id) on delete restrict,
  so_tien     bigint not null check (so_tien > 0),
  tao_luc     timestamptz not null default now(),
  sua_luc     timestamptz not null default now(),
  primary key (chu_ky_id, danh_muc_id)
);

create index han_muc_theo_user on han_muc (user_id, chu_ky_id);

-- so_tien > 0 chứ không >= 0: hũ 0đ và KHÔNG có hũ là hai chuyện khác nhau về
-- ý nghĩa nhưng giống hệt nhau về hành vi. Bỏ hũ thì xoá dòng, đừng đặt về 0 —
-- nếu không, màn ② sẽ phải hiện một thanh rỗng cho hũ mà bồ đã thôi không dùng.

-- CỐ Ý KHÔNG có ràng buộc "tổng hạn mức <= ngân sách" (§7.6).
-- Đã chốt cho phần chưa phân bổ được để dư, mà ràng buộc cứng ở DB sẽ chặn luôn
-- cả trường hợp bồ đặt vượt rồi chỉnh lại ngay sau đó. Cảnh báo mềm ở UI là đủ —
-- cùng lý do §7.3 chọn hiện mờ kèm lý do thay vì ẩn lựa chọn đi.

-- Cũng KHÔNG có cột "đã tiêu trong hũ": đó là SUM(giao_dich) lọc theo chu kỳ và
-- danh mục. Quy tắc vàng §6.3 — không bao giờ lưu số đã tính được.

alter table han_muc enable row level security;

create policy han_muc_chu_so_huu on han_muc
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create trigger han_muc_sua_luc before update on han_muc
  for each row execute function dat_sua_luc();
