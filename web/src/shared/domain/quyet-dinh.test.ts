import { describe, it, expect } from 'vitest'
import { dong } from './tien'
import { canNhacMua, tinhThoiGianDeNguoi } from './quyet-dinh'

describe('tinhThoiGianDeNguoi() — 3 bậc % thu nhập (§6.2)', () => {
  const thuNhap = dong(10_000_000)

  it('< 5% thu nhập (dưới 500k) => 24 giờ', () => {
    expect(tinhThoiGianDeNguoi(dong(300_000), thuNhap).gio).toBe(24)
    expect(tinhThoiGianDeNguoi(dong(490_000), thuNhap).gio).toBe(24)
  })

  it('5% - 20% thu nhập (500k - 2tr) => 48 giờ', () => {
    expect(tinhThoiGianDeNguoi(dong(500_000), thuNhap).gio).toBe(48)
    expect(tinhThoiGianDeNguoi(dong(1_500_000), thuNhap).gio).toBe(48)
    expect(tinhThoiGianDeNguoi(dong(2_000_000), thuNhap).gio).toBe(48)
  })

  it('> 20% thu nhập (trên 2tr) => 7 ngày (168 giờ)', () => {
    expect(tinhThoiGianDeNguoi(dong(2_500_000), thuNhap).gio).toBe(168)
    expect(tinhThoiGianDeNguoi(dong(5_000_000), thuNhap).gio).toBe(168)
  })
})

describe('canNhacMua() — 4 chỉ số tài chính và lối thoát bù', () => {
  it('tính đúng % ngân sách và % phần còn lại', () => {
    const kq = canNhacMua({
      soTienMua: dong(500_000),
      nganSachChuKy: dong(5_000_000),
      daChi: dong(2_000_000), // Còn lại 3tr
      thuNhapChuKy: dong(10_000_000),
      soNgayTrongChuKy: 30,
      soNgayConLai: 15,
      mucTieu: {
        ten: 'Mua xe Vision',
        soTienDich: dong(30_000_000),
        soDuHienTai: dong(15_000_000),
      },
    })

    expect(kq.phanTramNganSach).toBe(10) // 500k / 5tr = 10%
    expect(kq.phanTramConLai).toBe(17) // 500k / 3tr = 16.67% ~ 17%
    expect(kq.soNgayChamMucTieu).toBeGreaterThan(0)
    expect(kq.cauMucTieu).toContain('Mua xe Vision xa thêm')
    expect(kq.keHoachBu).toContain('Chu kỳ sau để dành thêm')
    expect(kq.gioDeNguoi).toBe(48) // 500k = 5% của 10tr
  })

  it('phát hiện vượt ngân sách khi số tiền mua lớn hơn phần còn lại', () => {
    const kq = canNhacMua({
      soTienMua: dong(2_000_000),
      nganSachChuKy: dong(5_000_000),
      daChi: dong(4_000_000), // Còn lại 1tr, mua 2tr => vượt 1tr
      thuNhapChuKy: dong(10_000_000),
      soNgayTrongChuKy: 30,
      soNgayConLai: 5,
    })

    expect(kq.biVuotNganSach).toBe(true)
    expect(kq.nganSachConLaiSauMua).toBe(-1_000_000)
  })
})
