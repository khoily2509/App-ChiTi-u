/**
 * THU NHẬP — LOGIC TÀI CHÍNH & ĐỘNG VIÊN (§7.5, §9.2, §12 INCOME_TREND_UP).
 *
 * So sánh trung bình trượt 3 chu kỳ, không so 2 tháng liền:
 * - Thưởng Tết hoặc lương biến động tháng lẻ không làm tháng sau bị coi là "giảm".
 * - Chưa đủ 3 chu kỳ (ít nhất 4 chu kỳ để so 2 cửa sổ trượt) => IM LẶNG HOÀN TOÀN (Pha 5).
 * - Tuyệt đối không có câu nào phản ứng với chiều giảm (§7.5).
 */

export type KetQuaKhenThuNhap = {
  tang: boolean
  phanTramTang: number
  cauKhen: string
}

export function khenThuNhapTang(
  lichSuThuNhap: readonly number[],
): KetQuaKhenThuNhap | null {
  // Cần ít nhất 4 chu kỳ để so sánh 2 cửa sổ trượt 3 kỳ liên tiếp
  if (lichSuThuNhap.length < 4) return null

  const len = lichSuThuNhap.length
  const n0 = lichSuThuNhap[len - 4] ?? 0
  const n1 = lichSuThuNhap[len - 3] ?? 0
  const n2 = lichSuThuNhap[len - 2] ?? 0
  const n3 = lichSuThuNhap[len - 1] ?? 0

  // 3 chu kỳ trước: [len-4, len-3, len-2]
  const tbTruoc = (n0 + n1 + n2) / 3
  // 3 chu kỳ gần nhất: [len-3, len-2, len-1]
  const tbNay = (n1 + n2 + n3) / 3

  if (tbTruoc <= 0) return null

  const pt = ((tbNay - tbTruoc) / tbTruoc) * 100

  // Ngưỡng khen: tăng >= 5%
  if (pt >= 5) {
    const lamTron = Math.round(pt)
    return {
      tang: true,
      phanTramTang: lamTron,
      cauKhen: `Thu nhập trung bình 3 tháng gần nhất tăng ${lamTron}% — vững vàng lắm 🌱`,
    }
  }

  // Tăng dưới 5%, giữ nguyên hoặc giảm => IM LẶNG
  return null
}
