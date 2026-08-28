/**
 * CÂN NHẮC MUA — TÍNH NĂNG SỐ 9 / MÀN ④ (§6.2).
 *
 * Nhập số tiền A, trả lời 4 câu hỏi:
 * 1. % ngân sách chu kỳ: A / ngan_sach
 * 2. % phần còn lại: A / (ngan_sach - da_chi)
 * 3. Trì hoãn mục tiêu: "Chiếc xe xa thêm N ngày"
 * 4. Lối thoát bù sang chu kỳ sau: "Chu kỳ sau để dành thêm X đ/ngày là về đúng lịch"
 *
 * Cơ chế để nguội theo % thu nhập:
 *   · < 5% thu nhập: 24h
 *   · 5% - 20% thu nhập: 48h
 *   · > 20% thu nhập: 7 ngày (168h)
 */

import { type Dong as Tien, dong } from './tien'

export type MucTieuUuTien = {
  ten: string
  soTienDich: Tien
  soDuHienTai: Tien
}

export type ThamSoCanNhac = {
  soTienMua: Tien
  nganSachChuKy: Tien
  daChi: Tien
  thuNhapChuKy: Tien
  soNgayTrongChuKy: number
  soNgayConLai: number
  mucTieu?: MucTieuUuTien | null
}

export type KetQuaCanNhac = {
  soTienMua: Tien
  phanTramNganSach: number
  phanTramConLai: number
  nganSachConLaiSauMua: Tien
  biVuotNganSach: boolean
  soNgayChamMucTieu: number | null
  cauMucTieu: string | null
  phanTramThieuMucTieu: number | null
  gioDeNguoi: 24 | 48 | 168
  nhanDeNguoi: string
  keHoachBu: string
}

export function tinhThoiGianDeNguoi(soTien: Tien, thuNhap: Tien): { gio: 24 | 48 | 168; nhan: string } {
  if (thuNhap <= 0) return { gio: 24, nhan: '24 giờ (1 ngày)' }
  const pt = (soTien / thuNhap) * 100
  if (pt < 5) return { gio: 24, nhan: '24 giờ (1 ngày)' }
  if (pt <= 20) return { gio: 48, nhan: '48 giờ (2 ngày)' }
  return { gio: 168, nhan: '7 ngày' }
}

export function canNhacMua(p: ThamSoCanNhac): KetQuaCanNhac {
  const {
    soTienMua,
    nganSachChuKy,
    daChi,
    thuNhapChuKy,
    soNgayTrongChuKy,
    soNgayConLai: _soNgayConLai,
    mucTieu,
  } = p

  const ptNganSach = nganSachChuKy > 0 ? Math.round((soTienMua / nganSachChuKy) * 100) : 100
  const conLai = Math.max(0, nganSachChuKy - daChi)
  const ptConLai = conLai > 0 ? Math.round((soTienMua / conLai) * 100) : 100

  const conLaiSauMua = dong(conLai - soTienMua)
  const biVuot = conLaiSauMua < 0

  // 3. Trì hoãn mục tiêu
  let soNgayCham: number | null = null
  let cauMucTieu: string | null = null
  let ptThieu: number | null = null

  if (mucTieu && mucTieu.soTienDich > mucTieu.soDuHienTai) {
    const thieu = mucTieu.soTienDich - mucTieu.soDuHienTai
    ptThieu = Math.min(100, Math.round((soTienMua / thieu) * 100))

    // Tốc độ để dành giả định: 15% thu nhập / 30 ngày hoặc tối thiểu 50.000đ/ngày
    const deDanhMoiNgay = Math.max(50_000, Math.round((thuNhapChuKy * 0.15) / Math.max(1, soNgayTrongChuKy)))
    soNgayCham = Math.max(1, Math.ceil(soTienMua / deDanhMoiNgay))
    cauMucTieu = `${mucTieu.ten} xa thêm ${soNgayCham} ngày`
  }

  // 4. Lối thoát / Kế hoạch bù
  const ngayTinh = Math.max(1, soNgayTrongChuKy)
  const buMoiNgay = dong(Math.round(soTienMua / ngayTinh))
  const keHoachBu = `Chu kỳ sau để dành thêm ${new Intl.NumberFormat('vi-VN').format(buMoiNgay)}đ/ngày là về đúng lịch 🌿`

  // 5. Để nguội
  const { gio, nhan } = tinhThoiGianDeNguoi(soTienMua, thuNhapChuKy)

  return {
    soTienMua,
    phanTramNganSach: ptNganSach,
    phanTramConLai: ptConLai,
    nganSachConLaiSauMua: conLaiSauMua,
    biVuotNganSach: biVuot,
    soNgayChamMucTieu: soNgayCham,
    cauMucTieu,
    phanTramThieuMucTieu: ptThieu,
    gioDeNguoi: gio,
    nhanDeNguoi: nhan,
    keHoachBu,
  }
}
