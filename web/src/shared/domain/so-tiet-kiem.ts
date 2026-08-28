/**
 * SỔ TIẾT KIỆM — §7.10. Hàm thuần, không biết gì về DB.
 *
 * Năm hình thức trả lãi ở ngân hàng Việt Nam dùng CHUNG một công thức; chúng chỉ
 * khác nhau ở LỊCH tiền lãi tới tay bồ. Nên ở đây có đúng một phép tính lãi và
 * một hàm rải nó ra thành lịch.
 */

import { dong, type Dong } from './tien'
import { themThang, themNgay, soNgayGiua, type NgayLocal } from './chu-ky'

/** Khi nào tiền lãi tới tay bồ. `khong_ky_han` không có ngày đáo hạn. */
export type LichTraLai = 'dau_ky' | 'cuoi_ky' | 'hang_thang' | 'hang_quy' | 'khong_ky_han'

export type SoTietKiem = {
  goc: Dong
  /** ĐIỂM CƠ BẢN: 5,5%/năm = 550. Số nguyên để phép nhân ra tiền là chính xác. */
  laiSuatNam: number
  ngayGui: NgayLocal
  /** `null` chỉ hợp lệ với `khong_ky_han`. */
  kyHanThang: number | null
  lichTraLai: LichTraLai
}

export type LanTraLai = { ngay: NgayLocal; soTien: Dong }

const DIEM_CO_BAN = 10_000
const NGAY_MOT_NAM = 365

/** Ngày đáo hạn. `null` với sổ không kỳ hạn — nó không đáo hạn bao giờ. */
export function ngayDaoHan(s: SoTietKiem): NgayLocal | null {
  if (s.kyHanThang === null) return null
  return themThang(s.ngayGui, s.kyHanThang)
}

/**
 * Số ngày tiền thực sự nằm trong sổ.
 *
 * `soNgayGiua` tính CẢ HAI đầu, còn lãi thì tính theo hiệu — gửi 15/03 đáo hạn
 * 15/09 là **184 ngày**, không phải 185. Lệch một ngày là lệch tiền, mà bồ đối
 * chiếu với giấy của bank sẽ thấy ngay (§9.3).
 */
export function soNgayGui(tu: NgayLocal, den: NgayLocal): number {
  return Math.max(0, soNgayGiua(tu, den) - 1)
}

/**
 * Công thức DUY NHẤT cho cả năm hình thức: `gốc × %/năm × số ngày ÷ 365`.
 *
 * Toàn số nguyên, làm tròn XUỐNG. Nhân hết trước rồi mới chia một lần: chia sớm
 * là mất phần lẻ ở mỗi bước. Tích lớn nhất có thể gặp — 1 tỷ đồng, 20%/năm,
 * 36 tháng — là 2,2×10¹⁵, vẫn dưới `Number.MAX_SAFE_INTEGER` (9,0×10¹⁵) nên phép
 * nhân là chính xác tuyệt đối, không có sai số dấu phẩy động.
 */
export function tongLai(goc: Dong, laiSuatNam: number, soNgay: number): Dong {
  if (soNgay <= 0 || laiSuatNam <= 0) return dong(0)
  return dong(Math.floor((goc * laiSuatNam * soNgay) / (DIEM_CO_BAN * NGAY_MOT_NAM)))
}

/** Lãi tính tới một ngày bất kỳ — dùng cho sổ không kỳ hạn và cho tiến độ. */
export function laiTinhToi(s: SoTietKiem, den: NgayLocal): Dong {
  return tongLai(s.goc, s.laiSuatNam, soNgayGui(s.ngayGui, den))
}

/** Lãi trọn kỳ hạn. `null` với sổ không kỳ hạn — chưa biết bao giờ dừng. */
export function laiTronKy(s: SoTietKiem): Dong | null {
  const dh = ngayDaoHan(s)
  if (dh === null) return null
  return tongLai(s.goc, s.laiSuatNam, soNgayGui(s.ngayGui, dh))
}

/**
 * Rải tiền lãi ra thành lịch nhận.
 *
 * Chia đều thì phần lẻ rơi vãi: 5.500.000 ÷ 12 = 458.333,33. Làm tròn xuống mỗi
 * kỳ rồi dồn phần dư vào KỲ CUỐI, y hệt luật "kỳ cuối chỉ trả phần còn lại" của
 * khoản nợ quỹ ở §7.3. Tổng cộng lại luôn khớp đúng `laiTronKy()`.
 *
 * Sổ không kỳ hạn trả rỗng: lãi cộng dồn theo ngày, không có lần trả nào định sẵn.
 */
/**
 * Quỹ này có nhận thêm tiền giữa chừng được không?
 *
 * Quỹ thường thì luôn được. Sổ tiết kiệm CÓ KỲ HẠN thì không — ngân hàng Việt
 * Nam không cho nạp thêm vào sổ đang chạy, muốn gửi thêm là mở sổ mới.
 *
 * Đây không phải rào cản app tự dựng cho vui. Bỏ thêm tiền vào sổ đang chạy làm
 * số lãi hiện ra SAI hẳn: công thức tính lãi trên gốc kể từ ngày gửi, nên 100k
 * bỏ vào hôm nay lại được trả lãi ngược cho 94 ngày nó chưa từng nằm trong sổ.
 * Con số đó ngân hàng sẽ không trả, mà app thì hứa.
 *
 * Sổ KHÔNG KỲ HẠN thì ngược lại — gửi rút lúc nào cũng được, nên vẫn nhận góp.
 */
export function nhanThemDuoc(s: SoTietKiem | null): boolean {
  return s === null || s.lichTraLai === 'khong_ky_han'
}

export function lichTraLai(s: SoTietKiem): LanTraLai[] {
  const tong = laiTronKy(s)
  const dh = ngayDaoHan(s)
  if (tong === null || dh === null) return []

  if (s.lichTraLai === 'dau_ky') return [{ ngay: s.ngayGui, soTien: tong }]
  if (s.lichTraLai === 'cuoi_ky') return [{ ngay: dh, soTien: tong }]

  const buoc = s.lichTraLai === 'hang_thang' ? 1 : 3
  const soLan = Math.floor(s.kyHanThang! / buoc)
  if (soLan <= 0) return [{ ngay: dh, soTien: tong }]

  const moiLan = Math.floor(tong / soLan)
  return Array.from({ length: soLan }, (_, i) => ({
    ngay: themThang(s.ngayGui, (i + 1) * buoc),
    soTien: dong(i === soLan - 1 ? tong - moiLan * (soLan - 1) : moiLan),
  }))
}

/**
 * Đã đi được bao nhiêu phần trăm kỳ hạn. `null` với sổ không kỳ hạn (§7.8 — chưa
 * có mẫu số thì không nói gì cả, không hiện 0%).
 */
export function tienDo(s: SoTietKiem, homNay: NgayLocal): number | null {
  const dh = ngayDaoHan(s)
  if (dh === null) return null
  const tong = soNgayGui(s.ngayGui, dh)
  if (tong <= 0) return null
  return Math.min(100, Math.max(0, Math.round((soNgayGui(s.ngayGui, homNay) / tong) * 100)))
}

/** Còn bao nhiêu ngày tới đáo hạn. Âm nghĩa là đã quá hạn mà chưa tất toán. */
export function conBaoNhieuNgay(s: SoTietKiem, homNay: NgayLocal): number | null {
  const dh = ngayDaoHan(s)
  if (dh === null) return null
  return soNgayGiua(homNay, dh) - 1
}

/** Ngày nhắc trước đáo hạn — §7.10 chốt ĐÚNG MỘT thông báo, 7 ngày trước. */
export function ngayNhacDaoHan(s: SoTietKiem): NgayLocal | null {
  const dh = ngayDaoHan(s)
  return dh === null ? null : themNgay(dh, -7)
}

/**
 * Đọc lãi suất bồ gõ thành ĐIỂM CƠ BẢN. "5,5" và "5.5" đều ra 550.
 *
 * Người Việt gõ dấu phẩy, bàn phím số của máy cho dấu chấm — chấp cả hai chứ
 * đừng bắt bồ nhớ dùng cái nào. Trả `null` khi không đọc được, để tầng UI nói
 * một câu tử tế thay vì lặng lẽ hiểu thành 0.
 *
 * Cắt ở hai chữ số thập phân vì bank cũng chỉ niêm yết tới đó, và làm tròn XUỐNG
 * để app không bao giờ hứa lãi cao hơn hợp đồng.
 */
export function diemCoBanTu(s: string): number | null {
  const sach = s.trim().replace(',', '.').replace('%', '').trim()
  if (!/^\d+(\.\d+)?$/.test(sach)) return null
  const [nguyen, le = ''] = sach.split('.')
  const haiSo = (le + '00').slice(0, 2)
  const diem = Number(nguyen) * 100 + Number(haiSo)
  return diem > 0 && diem <= 10_000 ? diem : null
}

/** Ngược lại — để hiện lên ô nhập. 550 ⇒ "5,5". */
export function laiSuatChu(diem: number): string {
  return String(diem / 100).replace('.', ',')
}
