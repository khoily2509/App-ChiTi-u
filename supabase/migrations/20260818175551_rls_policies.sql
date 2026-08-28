-- 0002 RLS — Row Level Security cho các bảng ở 0001.
--
-- §5 chọn gọi thẳng Supabase REST từ trình duyệt, nên khoá anon nằm trong bundle
-- là đúng thiết kế. Điều đó có nghĩa RLS là thứ DUY NHẤT bảo vệ dữ liệu — không
-- phải khoá. Chưa chạy file này thì đừng đưa dữ liệu thật vào.
--
-- Bảng quỹ có RLS riêng trong 0004 vì lúc này chúng chưa tồn tại.

-- Dùng (select auth.uid()) thay vì auth.uid(): Postgres tính một lần cho cả câu
-- lệnh thay vì tính lại từng dòng.

alter table danh_muc      enable row level security;
alter table chu_ky        enable row level security;
alter table thu_nhap      enable row level security;
alter table giao_dich     enable row level security;
alter table cau_hinh      enable row level security;
alter table cau_dong_vien enable row level security;
alter table su_kien       enable row level security;

-- ── Bảng người dùng toàn quyền trên dữ liệu của chính mình ───────────────────

create policy danh_muc_chu_so_huu on danh_muc
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy chu_ky_chu_so_huu on chu_ky
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy thu_nhap_chu_so_huu on thu_nhap
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy giao_dich_chu_so_huu on giao_dich
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy cau_hinh_chu_so_huu on cau_hinh
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy cau_dong_vien_chu_so_huu on cau_dong_vien
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ── su_kien: append-only ─────────────────────────────────────────────────────

-- Audit log là ràng buộc bắt buộc của §2. Cho đọc và ghi thêm, KHÔNG cho sửa,
-- KHÔNG cho xoá — cố ý không tạo policy UPDATE/DELETE. Không có policy nghĩa là
-- không ai qua được, kể cả chính chủ. Chỉ service role (Worker) mới bỏ qua RLS.
create policy su_kien_doc on su_kien
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy su_kien_ghi_them on su_kien
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- ── Không xoá cứng ───────────────────────────────────────────────────────────

-- §13: "Không xoá cứng — da_huy + lý do + ghi su_kien". Policy FOR ALL ở trên
-- vốn cho phép DELETE, nên phải chặn lại bằng rule riêng. Sau lệnh này, DELETE
-- trên giao_dich luôn thất bại kể cả khi gọi bằng khoá đúng.
create policy giao_dich_khong_xoa on giao_dich
  as restrictive
  for delete to authenticated
  using (false);

create policy chu_ky_khong_xoa on chu_ky
  as restrictive
  for delete to authenticated
  using (false);
