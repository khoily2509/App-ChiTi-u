import { describe, it, expect } from 'vitest'
import {
  trichXuatSoTien,
  doanDanhMuc,
  phanTichTinNhanGiaoDich,
} from './phan-tich-giao-dich'

describe('trichXuatSoTien() — nhận diện số tiền Việt Nam', () => {
  it('nhận diện định dạng k: 45k, 120k', () => {
    expect(trichXuatSoTien('Cafe sáng 45k')).toBe(45_000)
    expect(trichXuatSoTien('Ăn trưa 120k cùng đồng nghiệp')).toBe(120_000)
  })

  it('nhận diện định dạng SMS ngân hàng VCB / Techcom: -45,000VND', () => {
    expect(trichXuatSoTien('TK 12345 -45,000VND tai HIGHLANDS COFFEE')).toBe(45_000)
    expect(trichXuatSoTien('GD: -150.000VND tai GRAB VIETNAM')).toBe(150_000)
  })

  it('nhận diện định dạng Momo: Thanh toán thành công 35.000đ', () => {
    expect(trichXuatSoTien('Giao dịch thành công 35.000đ cho The Coffee House')).toBe(35_000)
    expect(trichXuatSoTien('Thanh toán 65.000 đ tại GS25')).toBe(65_000)
  })
})

describe('doanDanhMuc() — phân loại danh mục thông minh', () => {
  it('nhận diện Ăn uống từ quán cafe / thức ăn', () => {
    const res1 = doanDanhMuc('Highlands Coffee Ho Guom')
    expect(res1.danhMuc).toBe('an_uong')
    expect(res1.tuKhoa).toBe('highlands')

    const res2 = doanDanhMuc('ShopeeFood com tam')
    expect(res2.danhMuc).toBe('an_uong')
  })

  it('nhận diện Đi lại từ Grab / Be / Xăng', () => {
    const res = doanDanhMuc('Chuyen di GrabCar den san bay')
    expect(res.danhMuc).toBe('di_lai')
  })

  it('nhận diện Mua sắm từ Shopee / Lazada / Zara', () => {
    const res = doanDanhMuc('Thanh toan don hang Shopee')
    expect(res.danhMuc).toBe('mua_sam')
  })

  it('nhận diện Y tế từ Long Châu / Pharmacity', () => {
    const res = doanDanhMuc('Mua thuoc tai Nha thuoc Long Chau')
    expect(res.danhMuc).toBe('y_te')
  })
})

describe('phanTichTinNhanGiaoDich() — phân tích tổng hợp', () => {
  it('bóc tách đầy đủ số tiền, mô tả và danh mục gợi ý', () => {
    const sms = 'TK 0071001234567 -55,000VND tai Phuc Long Coffee. So du: 5,420,000VND.'
    const kq = phanTichTinNhanGiaoDich(sms)

    expect(kq.soTien).toBe(55_000)
    expect(kq.danhMucGoiY).toBe('an_uong')
    expect(kq.doChinhXac).toBeGreaterThanOrEqual(70)
  })
})
