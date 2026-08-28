/**
 * Cấu hình — §14 quy ước 5: mọi thứ người-không-phải-kỹ-sư có thể muốn đổi đều
 * nằm trong DB, sửa được mà không cần deploy lại. Gồm trần 15%, giờ nhắc, các
 * mốc cảnh báo, bậc để nguội, ngưỡng xác nhận số lớn.
 */

import { sb, bocLoi } from './supabase'
import type { Json } from './database.types'

export type CauHinh = Map<string, unknown>

export async function docCauHinh(): Promise<CauHinh> {
  const ds = bocLoi(await sb.from('cau_hinh').select('khoa,gia_tri'), 'Đọc cấu hình')
  return new Map(ds.map((c) => [c.khoa, c.gia_tri]))
}

/**
 * Đọc một khoá kiểu số, có giá trị dự phòng.
 *
 * Dự phòng KHÔNG phải để tiện: nếu một khoá bị xoá nhầm hoặc migration seed chưa
 * chạy, app phải vẫn dùng được thay vì đổ. Nhưng dự phòng luôn phải là giá trị
 * AN TOÀN — ở đây là ngưỡng thấp, tức hỏi lại nhiều hơn chứ không phải ít hơn.
 */
export function soCauHinh(ch: CauHinh, khoa: string, duPhong: number): number {
  const v = ch.get(khoa)
  return typeof v === 'number' ? v : duPhong
}

/** Trên mức này thì hỏi lại trước khi lưu (§7.8, chặn lỗi thừa chữ số). */
export const NGUONG_XAC_NHAN_DU_PHONG = 1_000_000

/** Đọc một khoá kiểu chuỗi. Không có thì trả `null` để tầng gọi tự quyết. */
export function chuoiCauHinh(ch: CauHinh, khoa: string): string | null {
  const v = ch.get(khoa)
  return typeof v === 'string' ? v : null
}

/**
 * Ghi một khoá cấu hình.
 *
 * `upsert` vì `cau_hinh` có khoá chính ghép `(user_id, khoa)` — lần đầu là chèn,
 * các lần sau là sửa, và tầng gọi không cần biết mình đang ở lần nào.
 */
export async function datCauHinh(
  userId: string,
  khoa: string,
  // Json chứ không unknown: cột gia_tri là jsonb, và kiểu sinh từ DB đã nói rõ
  // cái gì lưu được. Để unknown là ném việc kiểm tra sang lúc chạy.
  giaTri: Json,
): Promise<void> {
  bocLoi(
    await sb
      .from('cau_hinh')
      .upsert({ user_id: userId, khoa, gia_tri: giaTri }, { onConflict: 'user_id,khoa' })
      .select(),
    'Ghi cấu hình',
  )
}
