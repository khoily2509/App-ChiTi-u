-- 0011 THU HỒI QUYỀN GỌI HÀM — vá lỗ hổng tìm được ở audit 27/08/2026.
--
-- Postgres mặc định cấp EXECUTE trên hàm mới cho PUBLIC, và Supabase phơi mọi
-- hàm trong schema public ra thành endpoint RPC. Hệ quả: hai hàm dưới đây gọi
-- được từ Internet mà KHÔNG cần đăng nhập. Đã đo bằng khoá công khai moi từ
-- chính bundle trình duyệt:
--
--   POST /rest/v1/rpc/seed_nguoi_dung_moi  {"uid": "<uuid của bồ>"}   → HTTP 204
--   POST /rest/v1/rpc/sinh_id              {"tien_to": "HACK"}        → HTTP 200
--
-- `seed_nguoi_dung_moi` là security definer, tức là nó BỎ QUA RLS. Hiện tại chưa
-- gây hại thật vì mọi lệnh insert bên trong đều có `where not exists`, nhưng đó
-- là một tính chất rất dễ vô tình phá: chỉ cần sau này ai đó thêm một dòng insert
-- không kèm điều kiện là thành đường ghi dữ liệu vào tài khoản người khác.
-- Không nên để an toàn của hệ thống phụ thuộc vào việc nhớ giữ một tính chất.
--
-- Hai vấn đề nữa của cùng lỗ hổng đó:
--
--   ① Máy dò tài khoản. uid có thật trả 204, uid bịa trả 409 (khoá ngoại). Đưa
--      một uuid vào là biết nó có phải tài khoản thật hay không.
--   ② Không có rate limit. Đo được 20 lời gọi ghi vào 4 bảng trong 228ms. Auth
--      của Supabase CÓ chặn (429 over_email_send_rate_limit), nhưng tầng PostgREST
--      thì không chặn gì cả.

-- Trigger `nguoi_dung_moi_seed` vẫn chạy bình thường sau lệnh này: nó gọi hàm
-- dưới quyền người TẠO hàm (security definer), không phải quyền anon.
revoke all on function seed_nguoi_dung_moi(uuid) from public, anon, authenticated;

-- `sinh_id` không bỏ qua RLS nên nhẹ hơn, nhưng nó vẫn là một endpoint tính toán
-- mở cho cả Internet. Các cột `default sinh_id('TXN')` vẫn chạy được: giá trị mặc
-- định được tính dưới quyền người ghi vào bảng, không qua đường RPC.
revoke all on function sinh_id(text) from public, anon;

-- Hàm 0010 thì để nguyên cho `authenticated`: nó là security invoker, RLS vẫn áp
-- đúng theo người gọi, và app cần gọi nó thật.
revoke all on function doi_ranh_gioi_chu_ky(text, date, text, date) from public, anon;
grant execute on function doi_ranh_gioi_chu_ky(text, date, text, date) to authenticated;

-- Kiểm chứng theo §13: sau lệnh này, gọi hai hàm đầu bằng khoá công khai phải trả
-- 404 PGRST202 (PostgREST không còn thấy hàm), còn app đăng nhập rồi vẫn đổi được
-- ngày lương bình thường.
