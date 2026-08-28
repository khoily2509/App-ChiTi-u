/**
 * DONUT — chia tổng chi thành các lát để vẽ vành tròn màn ② (§10).
 *
 * Hàm thuần, không biết gì về SVG: trả tỉ lệ 0..1, tầng UI tự nhân với chu vi
 * (§14 quy ước 3). Nhờ vậy đổi cách vẽ sau này không phải đụng vào phép chia.
 */

import { dong, type Dong } from './tien'

export type LatDonut = {
  danhMucId: string
  soTien: Dong
  /** Tỉ lệ THẬT 0..1, không làm tròn — dùng để VẼ. */
  tiLe: number
  /** Vị trí bắt đầu tích luỹ 0..1 — dùng để VẼ. */
  batDau: number
  /** Số nguyên, cả bộ cộng lại đúng 100 — dùng để HIỆN CHỮ. */
  phanTram: number
}

export type ChiTheoDanhMuc = {
  danhMucId: string
  soTien: Dong
  /** 1–6 theo §11.1. `null` = "Chưa biết xếp đâu" — danh mục hệ thống. */
  slot: number | null
}

/**
 * Vì sao có HAI con số cho cùng một lát:
 *
 * `tiLe` là tỉ lệ thật, dùng vẽ — cộng lại luôn đúng 1, không tích luỹ sai số,
 * và lát tí hon vẫn còn là một nét mảnh chứ không biến mất.
 *
 * `phanTram` là số nguyên để hiện chữ. Làm tròn từng cái một thì 6 danh mục dễ
 * cộng ra 99% hoặc 101% — bồ nhìn thấy ngay và mất tin vào mọi con số khác.
 * Dùng phương pháp phần dư lớn nhất: chia sàn trước, rồi phát thêm 1% cho những
 * lát có phần dư lớn nhất cho tới khi đủ 100.
 *
 * So phần dư bằng SỐ NGUYÊN (`soTien * 100 % tong`) chứ không bằng số thực — số
 * thực có thể cho hai phần dư bằng nhau thành lệch nhau một hạt bụi, và thứ tự
 * phát 1% sẽ đổi tuỳ máy. Nguyên tắc §14 quy ước 1 vẫn áp ở đây dù đây không
 * phải tiền.
 */
export function latDonut(chi: ChiTheoDanhMuc[]): LatDonut[] {
  const coTien = chi.filter((c) => c.soTien > 0)
  if (coTien.length === 0) return []

  // Thứ tự slot LÀ cơ chế an toàn mù màu (§11.1) — hai màu cạnh nhau trên vành
  // đã được kiểm định ΔE. Sắp xếp lại theo số tiền sẽ phá đúng cơ chế đó, nên
  // KHÔNG BAO GIỜ sort theo soTien. "Chưa biết xếp đâu" (slot null) xuống cuối:
  // nó là trạng thái tạm, không nên tranh chỗ với danh mục thật (§7.1).
  const theoSlot = [...coTien].sort((a, b) => (a.slot ?? 99) - (b.slot ?? 99))

  const tong = theoSlot.reduce((t, c) => t + c.soTien, 0)

  const san = theoSlot.map((c) => Math.floor((c.soTien * 100) / tong))
  const du = theoSlot.map((c) => (c.soTien * 100) % tong)

  let conThieu = 100 - san.reduce((t, n) => t + n, 0)
  const thuTuPhat = du
    .map((d, i) => ({ d, i }))
    // Phần dư bằng nhau thì ưu tiên lát tiền lớn hơn, rồi tới thứ tự slot. Có
    // luật rõ ràng để cùng dữ liệu luôn ra cùng kết quả, không phụ thuộc sort.
    .sort((a, b) => b.d - a.d || theoSlot[b.i]!.soTien - theoSlot[a.i]!.soTien || a.i - b.i)
  for (const { i } of thuTuPhat) {
    if (conThieu <= 0) break
    san[i]! += 1
    conThieu -= 1
  }

  let moc = 0
  return theoSlot.map((c, i) => {
    const tiLe = c.soTien / tong
    const lat: LatDonut = {
      danhMucId: c.danhMucId,
      soTien: dong(c.soTien),
      tiLe,
      batDau: moc,
      phanTram: san[i]!,
    }
    moc += tiLe
    return lat
  })
}
