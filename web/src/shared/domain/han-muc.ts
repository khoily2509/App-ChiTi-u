/**
 * HŨ — hạn mức từng danh mục (§7.6).
 *
 * Hàm thuần. Hạn mức là con số DUY NHẤT được lưu; "đã dùng", "còn lại", "phần
 * trăm" đều dẫn xuất từ giao dịch (§6.3).
 */

import { dong, type Dong } from './tien'
import type { ChiTheoDanhMuc } from './donut'

export type Hu = {
  danhMucId: string
  hanMuc: Dong
  daDung: Dong
}

export type TrangThaiHu = Hu & {
  /** ÂM khi đã vượt hũ — đây là chỗ được phép trả số âm, khác `homNayConTieuDuoc`. */
  conLai: Dong
  /** Có thể >100. Không cắt ở 100 vì bồ cần biết vượt bao nhiêu. */
  phanTram: number
  daVuot: boolean
}

/**
 * Ghép hạn mức đã đặt với số đã tiêu.
 *
 * Danh mục KHÔNG có hạn mức thì không xuất hiện ở đây — không có hũ và hũ 0đ là
 * hai chuyện khác nhau (xem ràng buộc `so_tien > 0` ở migration 0008). Ngược lại,
 * hũ đã đặt mà chưa tiêu đồng nào vẫn phải có mặt: bồ cần thấy hũ còn nguyên.
 */
export function trangThaiHu(hanMuc: Hu[]): TrangThaiHu[] {
  return hanMuc.map((h) => {
    const conLai = h.hanMuc - h.daDung
    return {
      ...h,
      conLai: dong(conLai),
      phanTram: Math.round((h.daDung / h.hanMuc) * 100),
      daVuot: conLai < 0,
    }
  })
}

/**
 * Phần ngân sách chưa xếp vào hũ nào — §7.6 gọi là "tiêu chung".
 *
 * Trả ÂM khi bồ đặt hũ vượt quá ngân sách. Không kẹp về 0: đó là tình huống thật
 * và bồ cần thấy để chỉnh, che đi thì hũ hứa nhiều hơn số tiền đang có.
 * `null` khi chưa có ngân sách (§7.8) — chưa biết mẫu số thì không nói gì cả.
 */
export function chuaPhanBo(nganSach: Dong | null, tongHanMuc: Dong): Dong | null {
  if (nganSach === null) return null
  return dong(nganSach - tongHanMuc)
}

/** Làm tròn XUỐNG bội của 10.000đ — số tiêu thật hiếm khi tròn, mà hũ thì nên tròn. */
const BUOC = 10_000

/**
 * Đề xuất hũ cho chu kỳ tới, dựa trên số đã tiêu THẬT ở chu kỳ trước (§7.6).
 *
 * Vì sao không để bồ tự đoán ở chu kỳ đầu: §7.1 nói ma sát lớn nhất là phải nghĩ,
 * và "tháng này Sinh hoạt bao nhiêu" là câu chưa ai trả lời được khi chưa có dữ
 * liệu. Đề xuất bằng số thật thì bồ chỉ cần gật hoặc chỉnh.
 *
 * Làm tròn XUỐNG chứ không lên: tổng đề xuất luôn ≤ số đã tiêu thật, nên gật
 * theo không bao giờ vô tình nới ngân sách. Cùng nguyên tắc "thà báo thiếu vài
 * đồng còn hơn cuối chu kỳ hụt" của `homNayConTieuDuoc`.
 *
 * Danh mục hệ thống "Chưa biết xếp đâu" (slot null) bị loại — nó không có hũ
 * (§7.6), tiền tiêu qua nó trừ vào phần tiêu chung.
 */
export function deXuatHanMuc(chiChuKyTruoc: ChiTheoDanhMuc[]): Hu[] {
  return chiChuKyTruoc
    .filter((c) => c.slot !== null && c.soTien >= BUOC)
    .map((c) => ({
      danhMucId: c.danhMucId,
      hanMuc: dong(Math.floor(c.soTien / BUOC) * BUOC),
      daDung: dong(0),
    }))
}
