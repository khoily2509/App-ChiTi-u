import { describe, it, expect } from 'vitest'
import { dong } from './tien'
import { chenhLech, mocLon, tongThayDoi } from './chenh-lech'
import type { ChiTheoDanhMuc } from './donut'

const d = dong
const chi = (bo: [string, number, number | null][]): ChiTheoDanhMuc[] =>
  bo.map(([danhMucId, soTien, slot]) => ({ danhMucId, soTien: d(soTien), slot }))

/** Bộ số thật của mockup cho kỳ này. */
const NAY = chi([
  ['CAT-1', 3_310_000, 1],
  ['CAT-2', 450_000, 2],
  ['CAT-3', 1_430_000, 3],
])

describe('chenhLech() — §10 màn ②', () => {
  it('tính đúng cả hai chiều', () => {
    const ds = chenhLech(chi([['a', 1_200_000, 1]]), chi([['a', 1_000_000, 1]]))
    expect(ds[0]!.thayDoi).toBe(200_000)
    expect(ds[0]!.phanTram).toBe(20)

    const giam = chenhLech(chi([['a', 800_000, 1]]), chi([['a', 1_000_000, 1]]))
    expect(giam[0]!.thayDoi).toBe(-200_000)
    expect(giam[0]!.phanTram).toBe(-20)
  })

  it('danh mục MỚI — kỳ trước 0đ ⇒ phần trăm null, KHÔNG phải vô cực (§7.8)', () => {
    const ds = chenhLech(chi([['a', 500_000, 1]]), [])
    expect(ds[0]!.thayDoi).toBe(500_000)
    expect(ds[0]!.phanTram).toBeNull()
  })

  it('danh mục BỎ HẲN vẫn phải có mặt — đó là thông tin đáng giá nhất', () => {
    const ds = chenhLech([], chi([['a', 900_000, 1]]))
    expect(ds).toHaveLength(1)
    expect(ds[0]!.kyNay).toBe(0)
    expect(ds[0]!.thayDoi).toBe(-900_000)
    expect(ds[0]!.phanTram).toBe(-100)
  })

  it('giữ THỨ TỰ SLOT, không sắp theo mức thay đổi', () => {
    // Slot 5 đổi nhiều nhất nhưng vẫn đứng sau slot 1 — màn ② có ba khối cùng
    // xếp theo slot, đảo một khối là bắt mắt dò lại từ đầu.
    const ds = chenhLech(
      chi([
        ['to', 5_000_000, 5],
        ['nho', 1_000, 1],
      ]),
      chi([
        ['to', 100_000, 5],
        ['nho', 900, 1],
      ]),
    )
    expect(ds.map((c) => c.danhMucId)).toEqual(['nho', 'to'])
  })

  it('"Chưa biết xếp đâu" (slot null) xuống cuối', () => {
    const ds = chenhLech(
      chi([
        ['tam', 100, null],
        ['that', 100, 6],
      ]),
      [],
    )
    expect(ds.map((c) => c.danhMucId)).toEqual(['that', 'tam'])
  })

  it('lấy được slot ngay cả khi danh mục chỉ có ở kỳ trước', () => {
    const ds = chenhLech([], chi([['a', 500_000, 3]]))
    expect(ds[0]!.slot).toBe(3)
  })

  it('không tiêu ở cả hai kỳ thì không xuất hiện', () => {
    expect(chenhLech(chi([['a', 0, 1]]), chi([['a', 0, 1]]))).toEqual([])
  })

  it('chưa có kỳ trước thì mọi mục đều là mới', () => {
    const ds = chenhLech(NAY, [])
    expect(ds).toHaveLength(3)
    expect(ds.every((c) => c.phanTram === null)).toBe(true)
  })

  it('cả hai kỳ đều rỗng', () => {
    expect(chenhLech([], [])).toEqual([])
  })
})

describe('mocLon() — mẫu số chung cho CẢ HAI chiều', () => {
  it('lấy trị tuyệt đối lớn nhất bất kể chiều nào', () => {
    const ds = chenhLech(
      chi([
        ['a', 50_000, 1],
        ['b', 0, 2],
      ]),
      chi([
        ['a', 0, 1],
        ['b', 2_000_000, 2],
      ]),
    )
    // Thanh giảm 2tr mới là cực đại, dù nó nằm bên kia vạch 0
    expect(mocLon(ds)).toBe(2_000_000)
  })

  it('mỗi bên tự co giãn thì biểu đồ nói dối — mốc chung tránh được', () => {
    const ds = chenhLech(
      chi([
        ['tang', 50_000, 1],
        ['giam', 0, 2],
      ]),
      chi([
        ['tang', 0, 1],
        ['giam', 2_000_000, 2],
      ]),
    )
    const moc = mocLon(ds)
    const rong = (x: number) => Math.abs(x) / moc
    expect(rong(ds.find((c) => c.danhMucId === 'tang')!.thayDoi)).toBeCloseTo(0.025)
    expect(rong(ds.find((c) => c.danhMucId === 'giam')!.thayDoi)).toBe(1)
  })

  it('không có thay đổi nào thì trả 0, tầng UI tự tránh chia cho 0', () => {
    expect(mocLon([])).toBe(0)
    expect(mocLon(chenhLech(chi([['a', 100, 1]]), chi([['a', 100, 1]])))).toBe(0)
  })
})

describe('tongThayDoi()', () => {
  it('cộng cả hai chiều lại', () => {
    const ds = chenhLech(
      chi([
        ['a', 1_200_000, 1],
        ['b', 300_000, 2],
      ]),
      chi([
        ['a', 1_000_000, 1],
        ['b', 800_000, 2],
      ]),
    )
    // +200.000 và −500.000
    expect(tongThayDoi(ds)).toBe(-300_000)
  })

  it('khớp với hiệu hai tổng chi', () => {
    const truoc = chi([
      ['a', 1_000_000, 1],
      ['b', 800_000, 2],
    ])
    const nay = chi([
      ['a', 1_200_000, 1],
      ['c', 500_000, 3],
    ])
    const tongNay = nay.reduce((t, c) => t + c.soTien, 0)
    const tongTruoc = truoc.reduce((t, c) => t + c.soTien, 0)
    expect(tongThayDoi(chenhLech(nay, truoc))).toBe(tongNay - tongTruoc)
  })
})
