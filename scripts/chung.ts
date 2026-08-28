/**
 * Phần dùng chung của backup và phục hồi.
 *
 * Không có phụ thuộc ngoài: Node 24 đã có sẵn `fetch` và chạy được TypeScript
 * trực tiếp. Script sao lưu mà phải `npm install` mới chạy được là script sẽ
 * hỏng vào đúng lúc cần đến nó nhất.
 */

import { readFileSync } from 'node:fs'

/**
 * Thứ tự này là thứ tự PHỤC HỒI, bị ràng buộc bởi khoá ngoại:
 * bảng nào bị bảng khác trỏ tới thì phải có trước.
 * Sai thứ tự thì restore đổ ngay ở dòng đầu tiên.
 */
export const BANG = [
  'danh_muc',
  'chu_ky',
  'quy',
  'thu_nhap',
  // han_muc BỊ BỎ QUÊN từ lúc tạo bảng (migration 0008) tới 28/08/2026 — sao lưu
  // suốt thời gian đó không có hũ chi tiêu, và phục hồi sẽ xoá sạch chúng vĩnh
  // viễn. Đúng thứ §1 xếp là một trong hai cách dự án chết, mà lại là loại chỉ lộ
  // ra ĐÚNG NGÀY cần dùng tới bản sao lưu.
  //
  // Vị trí trong mảng KHÔNG tuỳ ý: phục hồi chạy xuôi mảng còn xoá chạy ngược, nên
  // han_muc phải đứng SAU danh_muc và chu_ky (nó tham chiếu cả hai) và TRƯỚC chúng
  // khi đảo lại. Đặt ở đây thoả cả hai chiều.
  'han_muc',
  'khoan_muon_quy',
  'giao_dich',
  'bien_dong_quy',
  'quyet_dinh_mua',
  'cau_hinh',
  'cau_dong_vien',
  'su_kien',
  'push_subscription',
] as const

export type TenBang = (typeof BANG)[number]

export type BanSaoLuu = {
  phien_ban: 1
  tao_luc: string
  du_an: string
  bang: Record<string, unknown[]>
}

/** Đọc .env ở gốc repo. Không dùng thư viện — chỉ cần KEY=VALUE từng dòng. */
/**
 * Gỡ khoảng trắng, dấu nháy và cặp <> còn sót khi dán đè chỗ giữ chỗ.
 *
 * Áp cho CẢ .env LẪN biến môi trường. Lúc đầu tôi chỉ làm sạch đường .env, nên
 * khoá dán thừa một dấu nháy vào GitHub Secret sẽ hỏng — mà lỗi hiện ra là
 * "Invalid API key", chỉ về sai hướng hoàn toàn.
 */
function lamSach(s: string): string {
  return s.trim().replace(/^["'<]+|[">']+$/g, '')
}

export function docMoiTruong(): { url: string; key: string } {
  // Biến môi trường THẮNG file .env. Trên máy thì đọc .env cho tiện; khi chạy
  // tự động (GitHub Actions) không có file nào cả, khoá đến từ Secrets. Một hàm
  // phục vụ cả hai chỗ, không phải giữ hai bản cấu hình lệch nhau.
  const tuEnv = { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY }
  if (tuEnv.url || tuEnv.key) {
    // Thiếu MỘT trong hai thì báo thẳng, đừng lặng lẽ rơi xuống đọc .env — trên
    // CI không có .env nên lỗi hiện ra sẽ là "không đọc được .env", chỉ sai hướng
    // hoàn toàn so với nguyên nhân thật là đặt thiếu tên Secret.
    const thieu = [!tuEnv.url && 'SUPABASE_URL', !tuEnv.key && 'SUPABASE_SERVICE_ROLE_KEY']
      .filter(Boolean)
      .join(', ')
    if (thieu) throw new Error(`Có biến môi trường nhưng THIẾU: ${thieu}`)
    return { url: lamSach(tuEnv.url!), key: lamSach(tuEnv.key!) }
  }

  const duongDan = new URL('../.env', import.meta.url)
  let noiDung: string
  try {
    noiDung = readFileSync(duongDan, 'utf8')
  } catch {
    throw new Error(
      `Không đọc được ${duongDan.pathname}.\n` +
        'Tạo file .env ở gốc repo với SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY.',
    )
  }

  const bien = new Map<string, string>()
  for (const dong of noiDung.split('\n')) {
    const sach = dong.trim()
    if (!sach || sach.startsWith('#')) continue
    const i = sach.indexOf('=')
    if (i > 0) {
      // Gỡ dấu nháy và cặp <> còn sót lại khi dán đè chỗ giữ chỗ. Bỏ qua bước
      // này thì lỗi hiện ra là "Invalid API key" — chỉ về sai hướng hoàn toàn.
      bien.set(sach.slice(0, i).trim(), lamSach(sach.slice(i + 1)))
    }
  }

  const url = bien.get('SUPABASE_URL')
  const key = bien.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) {
    throw new Error('Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env')
  }
  return { url, key }
}

/**
 * Gọi PostgREST. Dùng service_role nên BỎ QUA RLS — đây là lý do khoá này không
 * bao giờ được nằm trong web/ hay lên git.
 */
export async function goiRest(
  { url, key }: { url: string; key: string },
  duong: string,
  init: RequestInit = {},
): Promise<Response> {
  const r = await fetch(`${url}/rest/v1/${duong}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
  if (!r.ok) {
    throw new Error(`${init.method ?? 'GET'} ${duong} → ${r.status}: ${await r.text()}`)
  }
  return r
}

/** Lấy toàn bộ dòng của một bảng, phân trang để không đụng trần 1000 dòng của PostgREST. */
export async function docHetBang(
  moiTruong: { url: string; key: string },
  bang: string,
): Promise<unknown[]> {
  const KICH_THUOC = 1000
  const tatCa: unknown[] = []
  for (let tu = 0; ; tu += KICH_THUOC) {
    const r = await goiRest(moiTruong, `${bang}?select=*&limit=${KICH_THUOC}&offset=${tu}`)
    const phan = (await r.json()) as unknown[]
    tatCa.push(...phan)
    if (phan.length < KICH_THUOC) break
  }
  return tatCa
}

/** Tuần ISO dạng '2026-W34' — khoá chống trùng của WEEKLY_BACKUP (§12). */
export function tuanIso(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  // Thứ Năm của tuần hiện tại quyết định năm ISO.
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7))
  const dauNam = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  const soTuan = Math.ceil(((t.getTime() - dauNam.getTime()) / 86_400_000 + 1) / 7)
  return `${t.getUTCFullYear()}-W${String(soTuan).padStart(2, '0')}`
}
