/**
 * CHÊNH LỆCH — so chi tiêu chu kỳ này với chu kỳ liền trước (§10 màn ②).
 *
 * Hàm thuần. Câu hỏi biểu đồ này trả lời là "tháng này khác tháng trước chỗ nào",
 * không phải "tháng này tiêu có nhiều không" — cái đó đã có donut và hũ.
 */

import { dong, type Dong } from './tien'
import type { ChiTheoDanhMuc } from './donut'

export type ChenhLech = {
  danhMucId: string
  slot: number | null
  kyNay: Dong
  kyTruoc: Dong
  /** ÂM = tiêu ít hơn kỳ trước. Đây là chỗ được phép trả số âm. */
  thayDoi: Dong
  /**
   * `null` khi kỳ trước KHÔNG tiêu đồng nào — chia cho 0.
   * §7.8 cấm hiện `∞`; tầng UI nói "mới" thay vì một con số vô nghĩa.
   */
  phanTram: number | null
}

/**
 * Ghép hai chu kỳ lại.
 *
 * Giữ THỨ TỰ SLOT, không sắp theo mức thay đổi. Màn ② đã có donut và thanh hũ
 * cùng xếp theo slot; đổi thứ tự ở khối thứ ba buộc mắt phải dò lại từ đầu mỗi
 * lần chuyển khối. Độ dài thanh đã nói ai thay đổi nhiều nhất rồi, không cần
 * sắp xếp nói hộ.
 *
 * Danh mục chỉ xuất hiện ở MỘT trong hai kỳ vẫn phải có mặt: bỏ hẳn một mục
 * tháng trước tiêu nhiều là thông tin đáng giá nhất của biểu đồ này.
 */
export function chenhLech(kyNay: ChiTheoDanhMuc[], kyTruoc: ChiTheoDanhMuc[]): ChenhLech[] {
  const nay = new Map(kyNay.map((c) => [c.danhMucId, c]))
  const truoc = new Map(kyTruoc.map((c) => [c.danhMucId, c]))

  const moiId = [...new Set([...nay.keys(), ...truoc.keys()])]

  return moiId
    .map((id) => {
      const a = nay.get(id)
      const b = truoc.get(id)
      const soNay = a?.soTien ?? 0
      const soTruoc = b?.soTien ?? 0
      return {
        danhMucId: id,
        slot: a?.slot ?? b?.slot ?? null,
        kyNay: dong(soNay),
        kyTruoc: dong(soTruoc),
        thayDoi: dong(soNay - soTruoc),
        phanTram: soTruoc > 0 ? Math.round(((soNay - soTruoc) / soTruoc) * 100) : null,
      }
    })
    .filter((c) => c.kyNay > 0 || c.kyTruoc > 0)
    .sort((a, b) => (a.slot ?? 99) - (b.slot ?? 99))
}

/**
 * Mức thay đổi lớn nhất — mẫu số để quy mọi thanh về tỉ lệ.
 *
 * Lấy trị tuyệt đối lớn nhất của CẢ HAI chiều rồi dùng chung cho cả hai bên vạch
 * 0. Nếu mỗi bên tự co giãn theo cực đại của riêng nó thì thanh "tăng 50.000đ"
 * có thể dài bằng thanh "giảm 2.000.000đ" — biểu đồ nói dối trong khi mọi con số
 * bên cạnh đều đúng.
 */
export function mocLon(ds: ChenhLech[]): Dong {
  return dong(ds.reduce((m, c) => Math.max(m, Math.abs(c.thayDoi)), 0))
}

/** Tổng chi cả kỳ đổi bao nhiêu — dòng tóm tắt trên đầu biểu đồ. */
export function tongThayDoi(ds: ChenhLech[]): Dong {
  return dong(ds.reduce((t, c) => t + c.thayDoi, 0))
}
