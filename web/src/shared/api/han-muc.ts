/**
 * Hạn mức từng danh mục — "hũ" (§7.6).
 *
 * Chỉ `so_tien` được lưu. "Đã dùng" luôn tính từ giao dịch, không có cột nào
 * giữ nó (§6.3).
 */

import { sb, bocLoi } from './supabase'
import type { NgayLocal } from '@/shared/domain/chu-ky'
import { chiTheoDanhMuc } from './giao-dich'
import { dong } from '@/shared/domain/tien'
import { deXuatHanMuc, type Hu } from '@/shared/domain/han-muc'

/** Nguồn của con số — §12.1 cần biết bồ gật theo đề xuất hay tự gõ. */
export type NguonDat = 'de_xuat' | 'tu_chinh'

/**
 * Hũ của một chu kỳ, đã ghép sẵn số đã tiêu.
 *
 * Hũ đã đặt mà chưa tiêu đồng nào vẫn có mặt với `daDung = 0` — bồ cần thấy hũ
 * còn nguyên. Ngược lại, danh mục đã tiêu mà KHÔNG có hũ thì không xuất hiện:
 * tiền đó thuộc phần "tiêu chung", không thuộc hũ nào.
 */
export async function danhSachHu(chuKyId: string): Promise<Hu[]> {
  const [hm, chi] = await Promise.all([
    bocLoi(
      await sb.from('han_muc').select('danh_muc_id, so_tien').eq('chu_ky_id', chuKyId),
      'Đọc hạn mức',
    ),
    chiTheoDanhMuc(chuKyId),
  ])

  const daTieu = new Map(chi.map((c) => [c.danhMucId, c.soTien]))
  return hm.map((h) => ({
    danhMucId: h.danh_muc_id,
    hanMuc: dong(h.so_tien),
    daDung: dong(daTieu.get(h.danh_muc_id) ?? 0),
  }))
}

/**
 * Đặt hoặc sửa hạn mức. `soTien = 0` nghĩa là BỎ hũ — xoá dòng chứ không đặt về 0.
 *
 * Hũ 0đ và không có hũ giống hệt nhau về hành vi nhưng khác nhau về ý nghĩa;
 * migration 0008 chặn hũ 0đ để chỉ còn đúng một cách biểu diễn "thôi không dùng
 * hũ này nữa", nếu không màn ② phải hiện một thanh rỗng chẳng để làm gì.
 */
export async function datHanMuc(
  userId: string,
  chuKyId: string,
  danhMucId: string,
  soTien: number,
  nguon: NguonDat,
): Promise<void> {
  const [cu] = bocLoi(
    await sb
      .from('han_muc')
      .select('so_tien')
      .eq('chu_ky_id', chuKyId)
      .eq('danh_muc_id', danhMucId),
    'Đọc hạn mức cũ',
  )

  if (soTien <= 0) {
    if (!cu) return
    bocLoi(
      await sb
        .from('han_muc')
        .delete()
        .eq('chu_ky_id', chuKyId)
        .eq('danh_muc_id', danhMucId)
        .select(),
      'Bỏ hạn mức',
    )
  } else {
    bocLoi(
      await sb
        .from('han_muc')
        .upsert(
          { user_id: userId, chu_ky_id: chuKyId, danh_muc_id: danhMucId, so_tien: soTien },
          { onConflict: 'chu_ky_id,danh_muc_id' },
        )
        .select(),
      'Đặt hạn mức',
    )
  }

  await sb.from('su_kien').insert({
    user_id: userId,
    ma: 'ENVELOPE_SET',
    doi_tuong: chuKyId,
    du_lieu: {
      cat_id: danhMucId,
      cu: cu?.so_tien ?? null,
      moi: soTien > 0 ? soTien : null,
      nguon,
    },
  })
}

/**
 * Hạn mức KHÔNG kèm số đã tiêu. Truy vấn nhẹ, một bảng.
 *
 * Màn ① chỉ cần tổng để tính phần "tiêu chung" (§7.6), và màn đặt hũ chỉ cần con
 * số đang đặt. Gọi `danhSachHu()` ở hai chỗ đó sẽ kéo thêm cả bảng giao dịch —
 * thêm truy vấn vào đúng đường đo S2 ("mở app → lưu xong ≤ 5 giây", §1).
 */
export async function hanMucThoi(chuKyId: string): Promise<Hu[]> {
  const ds = bocLoi(
    await sb.from('han_muc').select('danh_muc_id, so_tien').eq('chu_ky_id', chuKyId),
    'Đọc hạn mức',
  )
  return ds.map((h) => ({ danhMucId: h.danh_muc_id, hanMuc: dong(h.so_tien), daDung: dong(0) }))
}

/**
 * Hạn mức gợi ý cho chu kỳ này, lấy từ số đã tiêu THẬT ở chu kỳ liền trước (§7.6).
 *
 * Rỗng khi chưa có chu kỳ nào trước đó — đúng quy tắc "chu kỳ 1 không có hũ".
 */
export async function deXuatTuChuKyTruoc(ngayBatDau: NgayLocal): Promise<Hu[]> {
  const truoc = await chuKyLienTruoc(ngayBatDau)
  if (!truoc) return []
  return deXuatHanMuc(await chiTheoDanhMuc(truoc.id))
}

/**
 * Chu kỳ liền trước, hoặc `null` nếu đây là chu kỳ đầu tiên.
 *
 * So bằng `ngay_bat_dau_thuc_te` chứ không bằng thứ tự tạo: §7.2 cho phép sửa
 * ngày lương, nên chu kỳ tạo sau vẫn có thể bắt đầu trước.
 */
export async function chuKyLienTruoc(
  ngayBatDau: NgayLocal,
): Promise<{ id: string; ngay_bat_dau_thuc_te: string; ngay_ket_thuc: string } | null> {
  // Nhận thẳng NGÀY thay vì id: tầng gọi đã cầm cả object chu kỳ rồi, đi hỏi lại
  // chỉ để lấy một cột là thêm một lượt mạng nối đuôi — và thêm một chỗ có thể
  // đọc ra giá trị khác với thứ màn hình đang hiện.
  //
  // Kiểu `NgayLocal` chứ không phải `string`: lúc đầu tôi để `string`, và một chỗ
  // gọi vẫn truyền `chuKyId` — cả hai đều là `string` nên `tsc` cho qua, lỗi chỉ
  // nổ lúc chạy dưới dạng "invalid input syntax for type date". Branded type biến
  // đúng loại nhầm lẫn đó thành lỗi biên dịch.
  const [truoc] = bocLoi(
    await sb
      .from('chu_ky')
      .select('id, ngay_bat_dau_thuc_te, ngay_ket_thuc')
      .lt('ngay_bat_dau_thuc_te', ngayBatDau)
      .order('ngay_bat_dau_thuc_te', { ascending: false })
      .limit(1),
    'Tìm chu kỳ trước',
  )
  return truoc ?? null
}
