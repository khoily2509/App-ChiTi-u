/**
 * HỆ THỐNG CÂU ĐỘNG VIÊN & TÔNG GIỌNG (§9.3).
 *
 * Ba tông cho phép:
 *   · mừng (tiết kiệm tốt, đạt mốc hoa, tăng thu nhập)
 *   · trung tính thông tin (số liệu, thời gian, hạn mức)
 *   · quan tâm (gần hết ngân sách, lối thoát chi tiêu)
 *
 * Ba luật bắt buộc:
 *   1. Câu chữ là dữ liệu cấu hình, không hardcode bừa bãi.
 *   2. Không lặp lại một câu trong 14 ngày.
 *   3. Mọi cảnh báo BẮT BUỘC kèm một hành động cụ thể (actionable remedy).
 */

export type TongGiong = 'mung' | 'trung_tinh' | 'quan_tam'

export type CauDongVien = {
  id: string
  tong: TongGiong
  noiDung: string
  hanhDong?: string
  dieuKien?: string
  lanDungCuoi?: string | null // ISO date string (YYYY-MM-DD)
}

export const CAU_DONG_VIEN_MAC_DINH: CauDongVien[] = [
  {
    id: 'MUNG_01',
    tong: 'mung',
    noiDung: 'Ghi chép đều đặn lắm, hoa cúc tuần này đẹp rực rỡ 🌼',
  },
  {
    id: 'MUNG_02',
    tong: 'mung',
    noiDung: 'Tiến độ để dành đang tăng dần, rất vững vàng ✨',
  },
  {
    id: 'TT_01',
    tong: 'trung_tinh',
    noiDung: 'Hôm nay ghi một khoản là nhịp tuần thêm một cánh nở 🌱',
  },
  {
    id: 'TT_02',
    tong: 'trung_tinh',
    noiDung: 'Mỗi khoản chi đều được ghi nhận rõ ràng 🌿',
  },
  {
    id: 'QT_01',
    tong: 'quan_tam',
    noiDung: 'Ngân sách còn lại đang vơi dần',
    hanhDong: 'Tiêu gọn lại trong những ngày tới là về đúng mức nhé 🌿',
  },
  {
    id: 'QT_02',
    tong: 'quan_tam',
    noiDung: 'Một số hũ đã chạm hạn mức',
    hanhDong: 'Chạm vào danh mục để xem số dư còn lại trước khi chi tiêu ✨',
  },
]

/**
 * Chọn câu động viên phù hợp theo tông, loại trừ những câu đã dùng trong 14 ngày qua.
 */
export function chonCauDongVien(
  danhSach: readonly CauDongVien[],
  tong: TongGiong,
  ngayHienTai: string, // YYYY-MM-DD
  khoangCachNgay = 14,
): CauDongVien | null {
  const dsTheoTong = danhSach.filter((c) => c.tong === tong)
  if (dsTheoTong.length === 0) return null

  const nayMs = new Date(`${ngayHienTai}T00:00:00Z`).getTime()
  const nguongMs = khoangCachNgay * 86_400_000

  // Lọc những câu chưa dùng hoặc đã dùng cách đây > 14 ngày
  const hopLe = dsTheoTong.filter((c) => {
    if (!c.lanDungCuoi) return true
    const truocMs = new Date(`${c.lanDungCuoi}T00:00:00Z`).getTime()
    return nayMs - truocMs >= nguongMs
  })

  // Nếu câu nào cũng vừa dùng thì lấy câu dùng lâu nhất
  if (hopLe.length === 0) {
    return (
      [...dsTheoTong].sort((a, b) => {
        const aMs = a.lanDungCuoi ? new Date(`${a.lanDungCuoi}T00:00:00Z`).getTime() : 0
        const bMs = b.lanDungCuoi ? new Date(`${b.lanDungCuoi}T00:00:00Z`).getTime() : 0
        return aMs - bMs
      })[0] ?? null
    )
  }

  return hopLe[0] ?? null
}
