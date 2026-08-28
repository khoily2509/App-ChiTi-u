import { describe, it, expect } from 'vitest'
import { dong } from './tien'
import { latDonut, type ChiTheoDanhMuc } from './donut'

const d = dong

function chi(...bo: [string, number, number | null][]): ChiTheoDanhMuc[] {
  return bo.map(([danhMucId, soTien, slot]) => ({ danhMucId, soTien: d(soTien), slot }))
}

/** Bộ số thật của §15 AT — donut mockup, tổng đúng 6.120.000đ. */
const THAT = chi(
  ['CAT-1', 3_310_000, 1],
  ['CAT-2', 450_000, 2],
  ['CAT-3', 1_430_000, 3],
  ['CAT-4', 330_000, 4],
  ['CAT-5', 600_000, 5],
)

describe('latDonut() — vành donut màn ②', () => {
  it('tỉ lệ vẽ cộng lại đúng 1', () => {
    const tong = latDonut(THAT).reduce((t, l) => t + l.tiLe, 0)
    expect(tong).toBeCloseTo(1, 12)
  })

  it('lát nối tiếp nhau không hở, không chồng', () => {
    const lat = latDonut(THAT)
    expect(lat[0]!.batDau).toBe(0)
    for (let i = 1; i < lat.length; i++) {
      expect(lat[i]!.batDau).toBeCloseTo(lat[i - 1]!.batDau + lat[i - 1]!.tiLe, 12)
    }
  })

  it('giữ nguyên THỨ TỰ SLOT, không sắp lại theo số tiền', () => {
    // Slot lớn nhưng tiền ít vẫn phải nằm sau slot nhỏ tiền nhiều — thứ tự slot
    // là cơ chế an toàn mù màu (§11.1), sort theo tiền là phá nó.
    const lat = latDonut(chi(['a', 100_000, 5], ['b', 9_000_000, 1]))
    expect(lat.map((l) => l.danhMucId)).toEqual(['b', 'a'])
  })

  it('"Chưa biết xếp đâu" (slot null) xuống cuối', () => {
    const lat = latDonut(chi(['tam', 500_000, null], ['that', 100_000, 6]))
    expect(lat.map((l) => l.danhMucId)).toEqual(['that', 'tam'])
  })
})

describe('phanTram — số hiện ra cho bồ đọc', () => {
  it('cộng lại đúng 100, không phải 99 hay 101', () => {
    expect(latDonut(THAT).reduce((t, l) => t + l.phanTram, 0)).toBe(100)
  })

  it('cộng đúng 100 với MỌI tổ hợp, kể cả bộ số dễ vỡ nhất', () => {
    // Ba phần bằng nhau là ca kinh điển: 33,33% × 3 làm tròn xuống ra 99.
    // Bảy lát bằng nhau cũng vậy: 14,28% × 7 = 99,96.
    const boDe = [
      chi(['a', 1_000_000, 1], ['b', 1_000_000, 2], ['c', 1_000_000, 3]),
      chi(['a', 1, 1], ['b', 1, 2], ['c', 1, 3], ['d', 1, 4], ['e', 1, 5], ['f', 1, 6]),
      chi(['a', 999_999, 1], ['b', 1, 2]),
      chi(['a', 7, 1], ['b', 11, 2], ['c', 13, 3]),
    ]
    for (const bo of boDe) {
      expect(latDonut(bo).reduce((t, l) => t + l.phanTram, 0)).toBe(100)
    }
  })

  it('một danh mục duy nhất ⇒ 100%', () => {
    const lat = latDonut(chi(['a', 6_120_000, 1]))
    expect(lat).toHaveLength(1)
    expect(lat[0]!.phanTram).toBe(100)
    expect(lat[0]!.tiLe).toBe(1)
  })

  it('lát tí hon vẫn tồn tại để vẽ, dù phần trăm làm tròn về 0', () => {
    // 5.000đ trên 6 triệu = 0,08%. Chữ hiện 0% thì UI phải tự đổi thành "<1%",
    // nhưng lát vẫn phải có tiLe > 0 để còn là một nét trên vành.
    const lat = latDonut(chi(['to', 6_000_000, 1], ['ti', 5_000, 2]))
    const ti = lat.find((l) => l.danhMucId === 'ti')!
    expect(ti.phanTram).toBe(0)
    expect(ti.tiLe).toBeGreaterThan(0)
  })

  it('cùng dữ liệu luôn cho cùng kết quả, không phụ thuộc thứ tự đầu vào', () => {
    const xuoi = latDonut(chi(['a', 7, 1], ['b', 11, 2], ['c', 13, 3]))
    const nguoc = latDonut(chi(['c', 13, 3], ['b', 11, 2], ['a', 7, 1]))
    expect(nguoc).toEqual(xuoi)
  })
})

describe('§7.8 — chưa có dữ liệu thì trả rỗng, không chia cho 0', () => {
  it('chưa chi gì', () => {
    expect(latDonut([])).toEqual([])
  })

  it('có danh mục nhưng tất cả đều 0đ', () => {
    expect(latDonut(chi(['a', 0, 1], ['b', 0, 2]))).toEqual([])
  })

  it('danh mục 0đ bị loại, không thành lát 0%', () => {
    const lat = latDonut(chi(['a', 1_000_000, 1], ['b', 0, 2]))
    expect(lat.map((l) => l.danhMucId)).toEqual(['a'])
  })
})
