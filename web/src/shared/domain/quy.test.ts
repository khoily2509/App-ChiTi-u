import { describe, it, expect } from 'vitest'
import { dong } from './tien'
import {
  type BienDong,
  soDu,
  tongDeDanh,
  coTheLayTuQuy,
  tranTraNo,
  tranConLai,
  luaChonKyHan,
  kyHanMacDinh,
  canBayLuaChon,
  NGUONG_BAY_LUA_CHON,
} from './quy'

const d = dong
const bd = (loai: BienDong['loai'], soTien: number): BienDong => ({ loai, soTien: d(soTien) })

/** Thu nhập 9tr ⇒ trần 15% = 1.350.000đ, con số §7.3 dùng làm ví dụ xuyên suốt. */
const TRAN_9TR = d(1_350_000)

describe('soDu() — tổng bút toán, không lưu sẵn', () => {
  it('cộng cả chiều vào lẫn chiều ra', () => {
    expect(
      soDu([bd('so_du_ban_dau', 3_200_000), bd('gop', 500_000), bd('rut', -200_000)]),
    ).toBe(3_500_000)
  })

  it('quỹ chưa có bút toán nào thì bằng 0', () => {
    expect(soDu([])).toBe(0)
  })
})

describe('tongDeDanh() — AT-11, số dư ban đầu không được tính là để dành', () => {
  const co = [bd('so_du_ban_dau', 3_200_000), bd('gop', 500_000)]

  it('loại trừ so_du_ban_dau', () => {
    expect(soDu(co)).toBe(3_700_000)
    expect(tongDeDanh(co)).toBe(500_000)
  })

  it('điền số dư ban đầu KHÔNG làm đổi tỷ lệ để dành của chu kỳ', () => {
    const truoc = tongDeDanh([bd('gop', 500_000)])
    const sau = tongDeDanh([bd('gop', 500_000), bd('so_du_ban_dau', 3_200_000)])
    expect(sau).toBe(truoc)
  })
})

describe('coTheLayTuQuy() — AT-16, quỹ 0đ mà chi vượt ngân sách', () => {
  it('quỹ trống thì không lấy được, kèm lý do', () => {
    const r = coTheLayTuQuy(d(0), d(800_000))
    expect(r.duoc).toBe(false)
    expect(r.duoc === false && r.lyDo).toMatch(/trống/)
  })

  it('quỹ có nhưng không đủ thì cũng không lấy được', () => {
    const r = coTheLayTuQuy(d(300_000), d(800_000))
    expect(r.duoc).toBe(false)
    expect(r.duoc === false && r.lyDo).toMatch(/300.000đ/)
  })

  it('quỹ đủ thì lấy được', () => {
    expect(coTheLayTuQuy(d(3_200_000), d(800_000)).duoc).toBe(true)
    expect(coTheLayTuQuy(d(800_000), d(800_000)).duoc).toBe(true)
  })

  it('không vượt ngân sách thì không có gì để chặn', () => {
    expect(coTheLayTuQuy(d(0), d(0)).duoc).toBe(true)
  })
})

describe('tranTraNo() — 15% thu nhập thấp nhất 3 chu kỳ gần nhất', () => {
  it('thu nhập 9tr cho trần 1.350.000đ', () => {
    expect(tranTraNo([d(9_000_000)])).toBe(1_350_000)
  })

  it('lấy thấp nhất, không lấy trung bình', () => {
    expect(tranTraNo([d(9_000_000), d(12_000_000), d(10_000_000)])).toBe(1_350_000)
  })

  it('chỉ xét 3 chu kỳ gần nhất', () => {
    // 6tr là chu kỳ cũ, đã ra khỏi cửa sổ 3 chu kỳ
    expect(tranTraNo([d(6_000_000), d(9_000_000), d(10_000_000), d(10_000_000)])).toBe(
      1_350_000,
    )
  })

  it('chưa đủ 3 chu kỳ vẫn tính được (§7.8, không được kẹt ở chu kỳ đầu)', () => {
    expect(tranTraNo([d(10_000_000)])).toBe(1_500_000)
    expect(tranTraNo([d(10_000_000), d(9_000_000)])).toBe(1_350_000)
  })

  it('chưa có thu nhập nào thì trần bằng 0, không ném lỗi', () => {
    expect(tranTraNo([])).toBe(0)
    expect(tranTraNo([d(0)])).toBe(0)
  })
})

describe('luaChonKyHan() — bảng §7.3', () => {
  const moiKyCua = (no: number) =>
    Object.fromEntries(luaChonKyHan(d(no), TRAN_9TR).map((l) => [String(l.kyHan), l]))

  it('nợ 800.000đ: cả ba kỳ hạn đều hợp lệ', () => {
    const l = moiKyCua(800_000)
    expect(l['1']!.moiKy).toBe(800_000)
    expect(l['1']!.hopLe).toBe(true)
    expect(l['3']!.hopLe).toBe(true)
    expect(l['6']!.hopLe).toBe(true)
  })

  it('nợ 2.000.000đ: 1 tháng vượt trần', () => {
    const l = moiKyCua(2_000_000)
    expect(l['1']!.hopLe).toBe(false)
    expect(l['3']!.hopLe).toBe(true)
    expect(l['6']!.hopLe).toBe(true)
  })

  it('nợ 4.500.000đ: chỉ 6 tháng hợp lệ', () => {
    const l = moiKyCua(4_500_000)
    expect(l['1']!.hopLe).toBe(false)
    expect(l['3']!.moiKy).toBe(1_500_000)
    expect(l['3']!.hopLe).toBe(false)
    expect(l['6']!.moiKy).toBe(750_000)
    expect(l['6']!.hopLe).toBe(true)
  })

  it('AT-10 — nợ 9.000.000đ: cả ba kỳ hạn cố định đều vượt trần', () => {
    const l = moiKyCua(9_000_000)
    expect(l['1']!.hopLe).toBe(false)
    expect(l['3']!.hopLe).toBe(false)
    expect(l['6']!.moiKy).toBe(1_500_000)
    expect(l['6']!.hopLe).toBe(false)
  })

  it('AT-10 — chỉ "Trả linh hoạt" chọn được: 6 kỳ × 1.350.000 + kỳ 7 = 900.000', () => {
    const lh = luaChonKyHan(d(9_000_000), TRAN_9TR).find((l) => l.kyHan === 'linh_hoat')!
    expect(lh.hopLe).toBe(true)
    expect(lh.soKy).toBe(7)
    expect(lh.moiKy).toBe(1_350_000)
    expect(lh.kyCuoi).toBe(900_000)
    // Tổng phải khớp đúng số nợ — không thu thừa, không thu thiếu
    expect(lh.moiKy * (lh.soKy - 1) + lh.kyCuoi).toBe(9_000_000)
  })

  it('lựa chọn không hợp lệ luôn kèm lý do nêu rõ con số (§7.3)', () => {
    const l = moiKyCua(2_000_000)['1']!
    expect(l.lyDo).toContain('2.000.000đ/kỳ')
    expect(l.lyDo).toContain('1.350.000đ')
  })

  it('mọi kỳ hạn đều có tổng khớp đúng số nợ', () => {
    for (const no of [800_000, 2_000_000, 4_500_000, 9_000_000, 1_000_001]) {
      for (const l of luaChonKyHan(d(no), TRAN_9TR)) {
        expect(l.moiKy * (l.soKy - 1) + l.kyCuoi).toBe(no)
      }
    }
  })

  it('kỳ cuối không bao giờ lớn hơn các kỳ trước', () => {
    for (const no of [800_000, 2_000_000, 4_500_000, 9_000_000, 1_000_001]) {
      for (const l of luaChonKyHan(d(no), TRAN_9TR)) {
        expect(l.kyCuoi).toBeLessThanOrEqual(l.moiKy)
        expect(l.kyCuoi).toBeGreaterThan(0)
      }
    }
  })

  it('linh_hoat luôn có mặt khi trần > 0, kể cả nợ rất lớn — nếu không app sẽ kẹt', () => {
    for (const no of [300_000, 9_000_000, 50_000_000]) {
      const ds = luaChonKyHan(d(no), TRAN_9TR)
      expect(ds.some((l) => l.kyHan === 'linh_hoat' && l.hopLe)).toBe(true)
    }
  })

  it('trần bằng 0 thì không lựa chọn nào hợp lệ, và lý do nói đúng nguyên nhân', () => {
    const ds = luaChonKyHan(d(800_000), d(0))
    expect(ds.every((l) => !l.hopLe)).toBe(true)
    expect(ds[0]!.lyDo).toMatch(/chưa có thu nhập/i)
  })
})

describe('kyHanMacDinh() — chọn sẵn kỳ hạn ngắn nhất còn hợp lệ', () => {
  it('nợ 800.000đ → 1 tháng', () => {
    expect(kyHanMacDinh(luaChonKyHan(d(800_000), TRAN_9TR))).toBe(1)
  })

  it('nợ 2.000.000đ → 3 tháng', () => {
    expect(kyHanMacDinh(luaChonKyHan(d(2_000_000), TRAN_9TR))).toBe(3)
  })

  it('nợ 4.500.000đ → 6 tháng', () => {
    expect(kyHanMacDinh(luaChonKyHan(d(4_500_000), TRAN_9TR))).toBe(6)
  })

  it('nợ 9.000.000đ → trả linh hoạt', () => {
    expect(kyHanMacDinh(luaChonKyHan(d(9_000_000), TRAN_9TR))).toBe('linh_hoat')
  })

  it('không có lựa chọn hợp lệ thì trả null, không mặc định bừa', () => {
    expect(kyHanMacDinh(luaChonKyHan(d(800_000), d(0)))).toBeNull()
  })
})

describe('canBayLuaChon() — nợ nhỏ thì đừng bắt bồ quyết', () => {
  it('dưới 300.000đ thì trả luôn một kỳ', () => {
    expect(canBayLuaChon(d(299_999))).toBe(false)
    expect(canBayLuaChon(d(NGUONG_BAY_LUA_CHON))).toBe(true)
  })
})

describe('tranConLai() — AT-17, nợ chồng nợ', () => {
  it('trần áp cho TỔNG mọi khoản đang trả, không phải 15% mỗi khoản', () => {
    expect(tranConLai(TRAN_9TR, d(1_000_000))).toBe(350_000)
  })

  it('đang trả kịch trần thì khoản mới không còn chỗ', () => {
    expect(tranConLai(TRAN_9TR, TRAN_9TR)).toBe(0)
    expect(tranConLai(TRAN_9TR, d(2_000_000))).toBe(0)
  })

  it('khoản nợ mới tự giãn kỳ hạn để tổng không vượt trần', () => {
    // Đang trả 1.000.000/kỳ, còn 350.000 chỗ. Nợ mới 600.000đ.
    const conLai = tranConLai(TRAN_9TR, d(1_000_000))
    const ds = luaChonKyHan(d(600_000), conLai)

    expect(ds.find((l) => l.kyHan === 1)!.hopLe).toBe(false) // 600.000 > 350.000
    expect(ds.find((l) => l.kyHan === 3)!.hopLe).toBe(true) // 200.000 <= 350.000
    expect(kyHanMacDinh(ds)).toBe(3)

    // Tổng trả mỗi kỳ không vượt trần — chính là điều kiện tránh vòng xoáy nợ
    const moiKyMoi = ds.find((l) => l.kyHan === 3)!.moiKy
    expect(1_000_000 + moiKyMoi).toBeLessThanOrEqual(TRAN_9TR)
  })
})

describe('tongDeDanh() — tiền LÃI không phải tiền để dành (§7.10)', () => {
  it('loại lãi bank trả, y như loại số dư ban đầu', () => {
    const bd: BienDong[] = [
      { loai: 'so_du_ban_dau', soTien: dong(50_000_000) },
      { loai: 'gop', soTien: dong(2_000_000) },
      { loai: 'lai', soTien: dong(730_000) },
    ]
    // Số dư thấy hết; tỷ lệ để dành chỉ tính khoản bồ thật sự để dành ra.
    expect(soDu(bd)).toBe(52_730_000)
    expect(tongDeDanh(bd)).toBe(2_000_000)
  })
})
