import { describe, it, expect } from 'vitest'
import { dong } from './tien'
import { ngayLocal, themThang, type NgayLocal } from './chu-ky'
import {
  ngayDaoHan,
  soNgayGui,
  tongLai,
  laiTronKy,
  laiTinhToi,
  lichTraLai,
  tienDo,
  conBaoNhieuNgay,
  ngayNhacDaoHan,
  diemCoBanTu,
  laiSuatChu,
  type SoTietKiem, nhanThemDuoc } from './so-tiet-kiem'

const n = (s: string): NgayLocal => ngayLocal(s)

/** Sổ của bồ: có kỳ hạn, trả lãi ĐẦU KỲ (§7.10, H5 chốt 22/08/2026). */
const so = (p: Partial<SoTietKiem> = {}): SoTietKiem => ({
  goc: dong(100_000_000),
  laiSuatNam: 550, // 5,5%/năm tính bằng điểm cơ bản
  ngayGui: n('2026-03-15'),
  kyHanThang: 12,
  lichTraLai: 'dau_ky',
  ...p,
})

describe('themThang() — kẹp về ngày cuối tháng', () => {
  it('31/01 + 1 tháng = 28/02, KHÔNG tràn sang 03/03', () => {
    expect(themThang(n('2026-01-31'), 1)).toBe('2026-02-28')
  })

  it('kẹp đúng cả năm nhuận', () => {
    expect(themThang(n('2028-01-31'), 1)).toBe('2028-02-29')
    expect(themThang(n('2028-02-29'), 12)).toBe('2029-02-28')
  })

  it('31/03 + 1 tháng = 30/04', () => {
    expect(themThang(n('2026-03-31'), 1)).toBe('2026-04-30')
  })

  it('qua năm và trừ tháng', () => {
    expect(themThang(n('2026-12-15'), 1)).toBe('2027-01-15')
    expect(themThang(n('2026-01-15'), -1)).toBe('2025-12-15')
  })
})

describe('soNgayGui() — tính theo HIỆU, không tính cả hai đầu', () => {
  it('sổ 6 tháng 15/03 → 15/09 là 184 ngày, không phải 182,5 cũng không phải 185', () => {
    // §7.10: lấy số_tháng÷12 thay vì ngày_thật÷365 sẽ lệch với giấy của bank.
    expect(soNgayGui(n('2026-03-15'), n('2026-09-15'))).toBe(184)
  })

  it('cùng ngày ⇒ 0', () => {
    expect(soNgayGui(n('2026-03-15'), n('2026-03-15'))).toBe(0)
  })

  it('không trả số âm khi ngày đích ở trước', () => {
    expect(soNgayGui(n('2026-03-15'), n('2026-01-01'))).toBe(0)
  })
})

describe('tongLai() — MỘT công thức cho cả năm hình thức (§7.10)', () => {
  it('100 triệu · 5,5%/năm · trọn 365 ngày = 5.500.000đ', () => {
    expect(tongLai(dong(100_000_000), 550, 365)).toBe(5_500_000)
  })

  it('điểm cơ bản giữ đúng hai chữ số thập phân của lãi suất', () => {
    // 5,35%/năm — bank niêm yết tới đây, float sẽ làm tròn sai
    expect(tongLai(dong(100_000_000), 535, 365)).toBe(5_350_000)
  })

  it('làm tròn XUỐNG, không bao giờ báo lãi nhiều hơn thực tế', () => {
    // 10.000.000 × 5,5% × 100/365 = 150.684,93…
    expect(tongLai(dong(10_000_000), 550, 100)).toBe(150_684)
  })

  it('chính xác tuyệt đối ở đầu vào lớn nhất có thể gặp', () => {
    // 1 tỷ · 20%/năm · 36 tháng — tích 2,2×10¹⁵, dưới MAX_SAFE_INTEGER
    const r = tongLai(dong(1_000_000_000), 2000, 1096)
    expect(Number.isSafeInteger(r)).toBe(true)
    expect(r).toBe(Math.floor((1_000_000_000 * 2000 * 1096) / (10_000 * 365)))
  })

  it('chưa gửi ngày nào, hoặc lãi suất 0 ⇒ 0đ', () => {
    expect(tongLai(dong(100_000_000), 550, 0)).toBe(0)
    expect(tongLai(dong(100_000_000), 0, 365)).toBe(0)
  })
})

describe('ngayDaoHan() và các mốc', () => {
  it('12 tháng từ 15/03/2026', () => {
    expect(ngayDaoHan(so())).toBe('2027-03-15')
  })

  it('sổ không kỳ hạn KHÔNG có ngày đáo hạn', () => {
    const kkh = so({ kyHanThang: null, lichTraLai: 'khong_ky_han' })
    expect(ngayDaoHan(kkh)).toBeNull()
    expect(laiTronKy(kkh)).toBeNull()
    expect(tienDo(kkh, n('2026-06-15'))).toBeNull()
    expect(conBaoNhieuNgay(kkh, n('2026-06-15'))).toBeNull()
    expect(ngayNhacDaoHan(kkh)).toBeNull()
  })

  it('nhắc đúng 7 ngày trước đáo hạn — §7.10 chốt ĐÚNG MỘT thông báo', () => {
    expect(ngayNhacDaoHan(so())).toBe('2027-03-08')
  })

  it('quá hạn chưa tất toán thì số ngày còn lại ÂM, không kẹp về 0', () => {
    expect(conBaoNhieuNgay(so(), n('2027-03-25'))).toBe(-10)
  })
})

describe('lichTraLai() — năm hình thức, cùng một TỔNG', () => {
  const TONG = 5_500_000 // 100tr · 5,5% · 365 ngày

  it('mọi lịch đều cộng lại đúng bằng laiTronKy()', () => {
    for (const lich of ['dau_ky', 'cuoi_ky', 'hang_thang', 'hang_quy'] as const) {
      const s = so({ lichTraLai: lich })
      const cong = lichTraLai(s).reduce((t, l) => t + l.soTien, 0)
      expect(cong, lich).toBe(laiTronKy(s))
    }
  })

  it('trả đầu kỳ — nhận trọn ngay hôm gửi (sổ của bồ)', () => {
    const l = lichTraLai(so({ lichTraLai: 'dau_ky' }))
    expect(l).toEqual([{ ngay: '2026-03-15', soTien: TONG }])
  })

  it('trả cuối kỳ — nhận trọn lúc đáo hạn', () => {
    const l = lichTraLai(so({ lichTraLai: 'cuoi_ky' }))
    expect(l).toEqual([{ ngay: '2027-03-15', soTien: TONG }])
  })

  it('hàng tháng — 12 lần, KỲ CUỐI ôm phần dư nên tổng khớp tuyệt đối', () => {
    // 5.500.000 ÷ 12 = 458.333,33… — chia đều thì hụt 4đ
    const l = lichTraLai(so({ lichTraLai: 'hang_thang' }))
    expect(l).toHaveLength(12)
    expect(l[0]!.soTien).toBe(458_333)
    expect(l[11]!.soTien).toBe(458_337)
    expect(l.reduce((t, x) => t + x.soTien, 0)).toBe(TONG)
  })

  it('hàng quý — 4 lần, cách nhau đúng 3 tháng', () => {
    const l = lichTraLai(so({ lichTraLai: 'hang_quy' }))
    expect(l.map((x) => x.ngay)).toEqual([
      '2026-06-15',
      '2026-09-15',
      '2026-12-15',
      '2027-03-15',
    ])
    expect(l[0]!.soTien).toBe(1_375_000)
  })

  it('sổ không kỳ hạn không có lịch — lãi cộng dồn theo ngày', () => {
    expect(lichTraLai(so({ kyHanThang: null, lichTraLai: 'khong_ky_han' }))).toEqual([])
  })

  it('kỳ hạn ngắn hơn một quý thì gộp về một lần lúc đáo hạn', () => {
    const l = lichTraLai(so({ kyHanThang: 1, lichTraLai: 'hang_quy' }))
    expect(l).toHaveLength(1)
    expect(l[0]!.ngay).toBe('2026-04-15')
  })
})

describe('laiTinhToi() và tienDo()', () => {
  it('lãi giữa chừng tính theo số ngày đã nằm trong sổ', () => {
    // 15/03 → 15/09 là 184 ngày: 100tr × 5,5% × 184/365
    expect(laiTinhToi(so(), n('2026-09-15'))).toBe(2_772_602)
  })

  it('tiến độ 0% ngày gửi, 100% ngày đáo hạn', () => {
    expect(tienDo(so(), n('2026-03-15'))).toBe(0)
    expect(tienDo(so(), n('2027-03-15'))).toBe(100)
  })

  it('không vượt 100% dù đã quá hạn', () => {
    expect(tienDo(so(), n('2027-06-15'))).toBe(100)
  })
})

describe('diemCoBanTu() — đọc lãi suất bồ gõ', () => {
  it('chấp cả dấu phẩy lẫn dấu chấm', () => {
    expect(diemCoBanTu('5,5')).toBe(550)
    expect(diemCoBanTu('5.5')).toBe(550)
  })

  it('giữ đúng hai chữ số thập phân bank niêm yết', () => {
    expect(diemCoBanTu('5,35')).toBe(535)
    expect(diemCoBanTu('4,95')).toBe(495)
  })

  it('số nguyên và khoảng trắng thừa', () => {
    expect(diemCoBanTu('6')).toBe(600)
    expect(diemCoBanTu('  5,5 % ')).toBe(550)
  })

  it('cắt XUỐNG ở hai chữ số, không làm tròn lên', () => {
    // Thà báo lãi thấp hơn hợp đồng còn hơn hứa cao hơn
    expect(diemCoBanTu('5,999')).toBe(599)
  })

  it('trả null khi không đọc được, KHÔNG lặng lẽ thành 0', () => {
    for (const x of ['', 'abc', '-5', '5,5,5', '0', '  ']) {
      expect(diemCoBanTu(x), x).toBeNull()
    }
  })

  it('chặn số vô lý trên 100%/năm', () => {
    expect(diemCoBanTu('101')).toBeNull()
    expect(diemCoBanTu('100')).toBe(10_000)
  })

  it('đi vòng lại đúng chuỗi ban đầu', () => {
    for (const s of ['5,5', '5,35', '6', '12,75']) {
      expect(laiSuatChu(diemCoBanTu(s)!).replace(/,00$/, '')).toBe(s.replace(/,0+$/, ''))
    }
  })
})

describe('nhanThemDuoc() — sổ có kỳ hạn không nhận nạp thêm', () => {
  const so = (lich: SoTietKiem['lichTraLai']): SoTietKiem => ({
    goc: dong(50_000_000),
    laiSuatNam: 550,
    ngayGui: ngayLocal('2026-05-23'),
    kyHanThang: 6,
    lichTraLai: lich,
  })

  it('quỹ thường (không phải sổ) thì luôn nhận được', () => {
    expect(nhanThemDuoc(null)).toBe(true)
  })

  it('cả bốn kiểu CÓ kỳ hạn đều từ chối', () => {
    for (const l of ['dau_ky', 'cuoi_ky', 'hang_thang', 'hang_quy'] as const) {
      expect(nhanThemDuoc(so(l))).toBe(false)
    }
  })

  it('KHÔNG kỳ hạn thì nhận — gửi rút lúc nào cũng được', () => {
    expect(nhanThemDuoc(so('khong_ky_han'))).toBe(true)
  })

  it('vì sao chặn: nạp thêm làm lãi hiện ra sai hẳn', () => {
    // Đúng ca đã bắt được lúc đi thử luồng: sổ 50tr mở 23/05, hôm nay 25/08 bỏ
    // thêm 100k. Công thức tính lãi trên gốc KỂ TỪ NGÀY GỬI, nên 100k vừa bỏ vào
    // được trả lãi ngược cho 94 ngày nó chưa từng nằm trong sổ.
    const truoc = laiTinhToi(so('dau_ky'), ngayLocal('2026-08-25'))
    const sau = laiTinhToi({ ...so('dau_ky'), goc: dong(50_100_000) }, ngayLocal('2026-08-25'))
    expect(truoc).toBe(708_219)
    expect(sau).toBe(709_635)
    // 1.416đ lãi khống. Nhỏ ở đây, nhưng lớn dần theo số tiền — và ngân hàng
    // không trả đồng nào trong đó.
    expect(sau - truoc).toBe(1_416)
  })
})
