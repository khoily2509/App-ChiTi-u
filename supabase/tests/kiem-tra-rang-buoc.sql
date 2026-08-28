-- KIỂM TRA RÀNG BUỘC TẦNG DB — §13.
--
-- Chạy trong Supabase SQL Editor. Toàn bộ nằm trong transaction và kết thúc bằng
-- ROLLBACK nên KHÔNG để lại dữ liệu nào.
--
-- Cần: đã tạo sẵn một tài khoản ở Authentication → Users.
-- Kiểm hai thứ mà REST không kiểm được vì cần quyền ghi:
--   · chu kỳ chồng lấn phải bị từ chối  (0003, §7.2 rule 1)
--   · số dư quỹ âm phải bị từ chối      (0004, §7.3, AT-16)

begin;

do $kiem$
declare
  uid        uuid;
  ck_id      text;
  quy_id_1   text;
  ket_qua    text := '';
begin
  select id into uid from auth.users order by created_at limit 1;
  if uid is null then
    raise exception 'Chưa có tài khoản nào. Vào Authentication → Users → Add user rồi chạy lại.';
  end if;

  -- ── 1. Chu kỳ không được chồng lấn ─────────────────────────────────────────
  insert into chu_ky (user_id, ngay_bat_dau_du_kien, ngay_bat_dau_thuc_te, ngay_ket_thuc, trang_thai)
  values (uid, '2026-07-31', '2026-07-31', '2026-08-30', 'dang_chay')
  returning id into ck_id;

  begin
    insert into chu_ky (user_id, ngay_bat_dau_du_kien, ngay_bat_dau_thuc_te, ngay_ket_thuc, trang_thai)
    values (uid, '2026-08-15', '2026-08-15', '2026-09-15', 'dang_chay');
    ket_qua := ket_qua || E'\n  ✗ HỎNG  chu kỳ chồng lấn KHÔNG bị chặn';
  exception when exclusion_violation then
    ket_qua := ket_qua || E'\n  ✓ OK    chu kỳ chồng lấn bị từ chối';
  end;

  -- Chu kỳ liền kề, không chồng lấn ⇒ PHẢI chèn được (không được chặn nhầm).
  begin
    insert into chu_ky (user_id, ngay_bat_dau_du_kien, ngay_bat_dau_thuc_te, ngay_ket_thuc, trang_thai)
    values (uid, '2026-08-31', '2026-08-31', '2026-09-29', 'du_kien');
    ket_qua := ket_qua || E'\n  ✓ OK    chu kỳ liền kề vẫn chèn được';
  exception when exclusion_violation then
    ket_qua := ket_qua || E'\n  ✗ HỎNG  chặn nhầm cả chu kỳ không chồng lấn';
  end;

  -- ── 2. Số dư quỹ không được âm ─────────────────────────────────────────────
  insert into quy (user_id, ten, cho_phep_muon)
  values (uid, 'Quỹ kiểm thử', 'tu_do')
  returning id into quy_id_1;

  insert into bien_dong_quy (user_id, quy_id, chu_ky_id, so_tien, loai, ngay_local)
  values (uid, quy_id_1, ck_id, 100000, 'so_du_ban_dau', '2026-08-01');

  -- Rút quá số dư: 100.000 có, rút 800.000 ⇒ tổng −700.000 ⇒ phải bị chặn.
  begin
    insert into bien_dong_quy (user_id, quy_id, chu_ky_id, so_tien, loai, ngay_local)
    values (uid, quy_id_1, ck_id, -800000, 'rut', '2026-08-02');
    -- Trigger là DEFERRABLE nên chỉ nổ lúc commit; ép kiểm ngay bằng SET CONSTRAINTS.
    set constraints bien_dong_khong_am immediate;
    ket_qua := ket_qua || E'\n  ✗ HỎNG  số dư quỹ âm KHÔNG bị chặn';
  exception when check_violation then
    ket_qua := ket_qua || E'\n  ✓ OK    số dư quỹ âm bị từ chối';
  end;

  raise notice E'\n══ KẾT QUẢ ══%\n', ket_qua;
end
$kiem$;

rollback;

-- Sau khi chạy: mở tab "Messages"/"Notices" để xem kết quả.
-- Cả bốn dòng phải là ✓. Bất kỳ dòng ✗ nào cũng là ràng buộc không hoạt động.
