/**
 * Giao dịch — ghi và đọc. Đây là đường đi của TÍNH NĂNG SỐ 1 (§8).
 */

import { sb, bocLoi, type Dong } from './supabase'
import { type Dong as Tien, dong } from '@/shared/domain/tien'
import { homNay, ngayLocal, type NgayLocal } from '@/shared/domain/chu-ky'
import type { ChiTheoDanhMuc } from '@/shared/domain/donut'

export type GiaoDichDb = Dong<'giao_dich'>

/**
 * Đã ghi khoản nào trong lần mở app này chưa.
 *
 * `performance.now()` đếm từ lúc trang bắt đầu tải, nên nó chỉ bằng "thời gian
 * kể từ khi mở app" ở ĐÚNG giao dịch đầu tiên. Từ khoản thứ hai trở đi nó chỉ
 * nói app đã mở bao lâu rồi — đo thật cho thấy 80 giây cho một khoản chỉ mất
 * 6,6 giây để nhập.
 *
 * S2 (§1) hỏi "mở app → lưu xong", tức là đúng cái luồng mở-app-để-ghi. Nên chỉ
 * ghi cột đó cho khoản đầu tiên; các khoản sau để null còn hơn ghi số vô nghĩa,
 * vì số vô nghĩa nằm lẫn trong dữ liệu sẽ kéo trung vị lên và làm S2 trông như
 * trượt trong khi thực tế không phải.
 */
let daGhiTrongPhien = false

export type GhiNhanh = {
  userId: string
  chuKyId: string
  danhMucId: string
  soTien: Tien
  ghiChu?: string
  /**
   * `performance.now()` lúc màn nhập mở ra. Dùng để đo riêng thao tác nhập liệu.
   * Mốc "mở app" thì không cần truyền: `performance.now()` vốn đã đếm từ lúc
   * trang bắt đầu tải, nên tự nó chính là số mili giây kể từ khi mở app.
   */
  batDauLuc?: number
}

/**
 * Ghi một khoản chi.
 *
 * Vào thẳng `da_xac_nhan`: bồ đang nhìn màn hình, đó chính là sự xác nhận. Chỉ
 * /api/ingest (Siri, OCR) mới tạo `cho_xac_nhan` — fail closed (§6.4, §13).
 *
 * `ngay_local` lấy từ homNay() theo giờ Việt Nam, không lấy từ đồng hồ máy:
 * giao dịch lúc 00:30 giờ VN có mốc UTC là hôm trước, ghi nhầm ngày là hỏng
 * đúng hoa cúc và ranh giới chu kỳ (§14 quy ước 2).
 */
export async function ghiChi(g: GhiNhanh): Promise<GiaoDichDb> {
  const ngay: NgayLocal = homNay()

  const row = bocLoi(
    await sb
      .from('giao_dich')
      .insert({
        user_id: g.userId,
        chu_ky_id: g.chuKyId,
        loai: 'chi',
        danh_muc_id: g.danhMucId,
        so_tien: g.soTien,
        ghi_chu: g.ghiChu ?? null,
        trang_thai: 'da_xac_nhan',
        nguon: 'thu_cong',
        ngay_local: ngay,
      })
      .select()
      .single(),
    'Ghi khoản chi',
  )

  // Đo S2 bằng HAI mốc (migration 0006). §1 đặt "mở app → lưu xong ≤ 5 giây" là
  // tiêu chí thành công thứ hai, nhưng không có cách đo thì sau 90 ngày không ai
  // biết đạt hay không.
  //
  // performance.now() đếm từ lúc trang bắt đầu tải, nên bản thân nó đã là số mili
  // giây kể từ khi mở app. Hiệu với batDauLuc cho ra phần thao tác nhập liệu.
  const bayGio = performance.now()
  await sb.from('su_kien').insert({
    user_id: g.userId,
    ma: 'TXN_CONFIRMED',
    doi_tuong: row.id,
    du_lieu: { so_tien: g.soTien, danh_muc_id: g.danhMucId },
    duration_ms: g.batDauLuc ? Math.round(bayGio - g.batDauLuc) : null,
    duration_app_ms: daGhiTrongPhien ? null : Math.round(bayGio),
  })
  daGhiTrongPhien = true

  return row
}

/**
 * Giao dịch của một chu kỳ, mới nhất trước. Đã loại các khoản đã huỷ.
 *
 * Sắp xếp theo HAI cột chứ không một. `xay_ra_luc` là thời điểm bồ chọn, nên
 * nhiều khoản trùng giờ nhau y hệt là chuyện thường — và khi bằng nhau thì
 * Postgres trả về thứ tự tuỳ ý. Hậu quả nhìn thấy được: huỷ một khoản xong thì
 * cả danh sách tự xáo lại, đọc như thể app vừa sửa thứ gì đó không ai đụng vào.
 */
export async function theoChuKy(chuKyId: string): Promise<GiaoDichDb[]> {
  return bocLoi(
    await sb
      .from('giao_dich')
      .select('*')
      .eq('chu_ky_id', chuKyId)
      .neq('trang_thai', 'da_huy')
      .order('xay_ra_luc', { ascending: false })
      .order('tao_luc', { ascending: false }),
    'Đọc giao dịch theo chu kỳ',
  )
}

/**
 * Tổng CHI của chu kỳ — cộng trên dữ liệu ĐÃ TẢI, không đi hỏi lại.
 *
 * Trước đây đây là một truy vấn riêng, trong khi `theoChuKy()` vừa tải về đúng
 * những dòng đó rồi. Hai lượt mạng cho cùng một tập dữ liệu, mà lượt sau còn nối
 * đuôi lượt trước — đo thật trên production tốn thêm ~100ms mỗi lần mở app.
 *
 * Chỉ cộng `loai = 'chi'`. Để dành (`chuyen_vao_quy`) KHÔNG vào tổng chi — nếu
 * cộng vào thì để dành 3tr sẽ hiện thành "đã tiêu 3tr", làm sai tỷ lệ để dành,
 * donut và hạn mức (§6.2).
 */
export function congChi(giaoDich: readonly GiaoDichDb[]): Tien {
  return dong(
    giaoDich
      .filter((g) => g.loai === 'chi' && g.trang_thai !== 'da_huy')
      .reduce((t, g) => t + g.so_tien, 0),
  )
}

/**
 * Huỷ một giao dịch. KHÔNG xoá cứng (§13) — đổi trạng thái và bắt buộc có lý do.
 * Ràng buộc CHECK ở DB cũng từ chối huỷ mà thiếu lý do.
 */
export async function huy(id: string, userId: string, lyDo: string): Promise<void> {
  bocLoi(
    await sb
      .from('giao_dich')
      .update({ trang_thai: 'da_huy', ly_do_huy: lyDo })
      .eq('id', id)
      .select()
      .single(),
    'Huỷ giao dịch',
  )
  await sb.from('su_kien').insert({
    user_id: userId,
    ma: 'TXN_CANCELLED',
    doi_tuong: id,
    du_lieu: { ly_do: lyDo },
  })
}

/**
 * Tổng chi từng danh mục trong chu kỳ — nguyên liệu của donut màn ② (§10).
 *
 * Cộng ở JS chứ không nhờ SQL gộp nhóm: một chu kỳ chỉ có vài chục tới vài trăm
 * dòng (§3 đã đo — quy mô này không cần lo hiệu năng), đổi lại phép cộng nằm ở
 * chỗ đọc được và test được thay vì trốn trong chuỗi truy vấn.
 *
 * Lấy kèm `danh_muc(slot)` trong cùng một lượt: `latDonut()` cần slot để giữ
 * đúng thứ tự an toàn mù màu (§11.1), và tách thành hai lượt gọi thì có lúc
 * chúng lệch nhau (bồ đổi danh mục giữa hai lượt).
 */
export async function chiTheoDanhMuc(chuKyId: string): Promise<ChiTheoDanhMuc[]> {
  const ds = bocLoi(
    await sb
      .from('giao_dich')
      .select('so_tien, danh_muc_id, danh_muc(slot)')
      .eq('chu_ky_id', chuKyId)
      .eq('loai', 'chi')
      .neq('trang_thai', 'da_huy'),
    'Tổng chi theo danh mục',
  )

  const gop = new Map<string, { soTien: number; slot: number | null }>()
  for (const g of ds) {
    // loai='chi' luôn có danh_muc_id (ràng buộc CHECK ở migration 0001), nhưng
    // kiểu sinh ra từ DB vẫn để nullable vì cột dùng chung cho 4 loại giao dịch.
    if (!g.danh_muc_id) continue
    const cu = gop.get(g.danh_muc_id)
    if (cu) cu.soTien += g.so_tien
    else gop.set(g.danh_muc_id, { soTien: g.so_tien, slot: g.danh_muc?.slot ?? null })
  }

  return [...gop].map(([danhMucId, v]) => ({
    danhMucId,
    soTien: dong(v.soTien),
    slot: v.slot,
  }))
}

/**
 * Danh sách ngày đã ghi của 8 tuần gần nhất để vẽ vườn hoa (§9.2, §10).
 */
export async function ngayDaGhiTamTuan(tuNgay: NgayLocal): Promise<NgayLocal[]> {
  const ds = bocLoi(
    await sb
      .from('giao_dich')
      .select('ngay_local')
      .neq('trang_thai', 'da_huy')
      .gte('ngay_local', tuNgay),
    'Đọc ngày đã ghi 8 tuần',
  )
  return ds.map((d) => ngayLocal(d.ngay_local))
}
