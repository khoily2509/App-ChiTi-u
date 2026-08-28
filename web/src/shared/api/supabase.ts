/**
 * Client Supabase — MỘT nơi duy nhất (§14 cấu trúc thư mục).
 *
 * §5 chọn gọi thẳng PostgREST từ trình duyệt thay vì tự viết lớp API ở giữa:
 * Supabase đã cho sẵn REST + RLS, bọc lại chỉ tốn công. Đổi lại, khoá anon nằm
 * trong bundle — nên RLS là thứ DUY NHẤT bảo vệ dữ liệu, không phải khoá.
 * Đã kiểm chứng: ghi bằng khoá anon chưa đăng nhập bị trả 42501.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url =
  import.meta.env.VITE_SUPABASE_URL ||
  (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL : '') ||
  'https://mock.supabase.co'
const key =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_ANON_KEY : '') ||
  'mock-anon-key'

export const sb = createClient<Database>(url, key, {
  auth: {
    // Giữ phiên qua các lần mở app: bồ đăng nhập một lần rồi thôi. Magic link
    // mỗi lần mở là ma sát đủ lớn để bỏ app (§1 S1).
    persistSession: true,
    autoRefreshToken: true,
  },
})

/** Kiểu dòng của một bảng, lấy thẳng từ schema đã sinh. */
export type Dong<B extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][B]['Row']

/** Kiểu dữ liệu để CHÈN vào một bảng. */
export type DongMoi<B extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][B]['Insert']

/**
 * Ném lỗi kèm ngữ cảnh thay vì trả `{ data, error }` cho từng nơi tự xử lý.
 *
 * §7.2 rule 2 và §7.8 đều dựa trên nguyên tắc: hỏng thì phải LỘ RA, không được
 * im lặng. Trả về null khi lỗi là cách nhanh nhất để một khoản chi biến mất mà
 * không ai biết — đúng thứ tiêu chí S3 cấm.
 */
/**
 * Suy kiểu từ CHÍNH object trả về (`R['data']`) chứ không khai `{ data: T | null }`.
 *
 * Cách khai kia để TypeScript tự chọn T giữa `Row` và `null`, và nó chọn sai —
 * kết quả là `never`, mọi truy cập thuộc tính đều đỏ mà thông báo lỗi không chỉ
 * ra nguyên nhân. Lấy `R['data']` thì không còn chỗ nào để suy sai.
 */
export function bocLoi<R extends { data: unknown; error: unknown }>(
  kq: R,
  viec: string,
): NonNullable<R['data']> {
  const loi = kq.error as { message?: string } | null
  if (loi) throw new Error(`${viec}: ${loi.message ?? String(loi)}`)
  if (kq.data === null || kq.data === undefined) {
    throw new Error(`${viec}: không có dữ liệu trả về`)
  }
  return kq.data as NonNullable<R['data']>
}

/**
 * Như `bocLoi` nhưng KHÔNG đòi có dữ liệu trả về — chỉ ném khi thật sự có lỗi.
 *
 * Dùng cho những lời gọi mà `data: null` là kết quả ĐÚNG, không phải dấu hiệu
 * hỏng. Có đúng hai loại như vậy:
 *
 *   ① Hàm SQL khai `returns void`. PostgREST trả 204 không thân, supabase-js
 *      dịch thành `{ data: null, error: null }`. Đưa vào `bocLoi` là nó ném
 *      "không có dữ liệu trả về" trong khi database vừa làm xong việc hoàn hảo.
 *   ② Nhánh KHÔNG-LÀM-GÌ viết thành `Promise.resolve({ data: null, error: null })`
 *      để giữ chữ ký đồng nhất với nhánh có làm.
 *
 * Đây là lỗi thật, sống trên bản chạy thật từ 27/08 tới 28/08/2026: đổi ngày
 * lương báo đỏ "Dời ranh giới chu kỳ: không có dữ liệu trả về" trong khi ranh
 * giới đã dời đúng dưới DB. Nó chỉ xuất hiện SAU khi migration 0010 chạy — trước
 * đó code đi đường lui nên không chạm nhánh này, còn tôi thì thử lại bằng gọi API
 * trực tiếp chứ không qua giao diện. Bài học: đổi hạ tầng làm ĐỔI ĐƯỜNG CODE ĐI,
 * nên phải thử lại đúng đường đó chứ không phải đúng kết quả đó.
 *
 * Cố ý tách thành hàm riêng thay vì nới lỏng `bocLoi`: `bocLoi` chặn `data: null`
 * là có lý do — đó là cách một khoản chi biến mất mà không ai biết (§13, S3).
 * Nới nó ra là mất lưới an toàn ở hàng chục chỗ khác chỉ để chiều hai chỗ này.
 */
export function nemNeuLoi(kq: { error: unknown; data?: unknown }, viec: string): void {
  const loi = kq.error as { message?: string } | null
  if (loi) throw new Error(`${viec}: ${loi.message ?? String(loi)}`)
}
