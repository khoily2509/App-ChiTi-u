import { describe, it, expect } from 'vitest'
import { dong } from './tien'
import { trangThaiHu, chuaPhanBo, deXuatHanMuc, type Hu } from './han-muc'
import type { ChiTheoDanhMuc } from './donut'

const d = dong
const hu = (danhMucId: string, hanMuc: number, daDung: number): Hu => ({
  danhMucId,
  hanMuc: d(hanMuc),
  daDung: d(daDung),
})

describe('trangThaiHu() — §7.6', () => {
  it('hũ còn nguyên', () => {
    const [t] = trangThaiHu([hu('a', 1_200_000, 0)])
    expect(t!.conLai).toBe(1_200_000)
    expect(t!.phanTram).toBe(0)
    expect(t!.daVuot).toBe(false)
  })

  it('hũ đã tiêu một phần', () => {
    const [t] = trangThaiHu([hu('a', 1_200_000, 900_000)])
    expect(t!.conLai).toBe(300_000)
    expect(t!.phanTram).toBe(75)
  })

  it('vượt hũ thì conLai ÂM và phần trăm vượt 100 — không cắt, không chặn', () => {
    // §7.6 ràng buộc 2: vượt hũ KHÔNG bị chặn, chỉ hiện thanh đã tràn. Ràng buộc
    // thật là ngân sách tổng, không phải hũ.
    const [t] = trangThaiHu([hu('a', 1_000_000, 1_450_000)])
    expect(t!.conLai).toBe(-450_000)
    expect(t!.phanTram).toBe(145)
    expect(t!.daVuot).toBe(true)
  })

  it('tiêu đúng bằng hạn mức thì CHƯA tính là vượt', () => {
    const [t] = trangThaiHu([hu('a', 1_000_000, 1_000_000)])
    expect(t!.conLai).toBe(0)
    expect(t!.phanTram).toBe(100)
    expect(t!.daVuot).toBe(false)
  })

  it('giữ nguyên thứ tự truyền vào — thứ tự slot là việc của tầng gọi', () => {
    const ds = trangThaiHu([hu('a', 100, 0), hu('b', 100, 0), hu('c', 100, 0)])
    expect(ds.map((t) => t.danhMucId)).toEqual(['a', 'b', 'c'])
  })
})

describe('chuaPhanBo() — phần "tiêu chung" (§7.6)', () => {
  it('còn dư thì trả phần dư', () => {
    expect(chuaPhanBo(d(7_000_000), d(5_000_000))).toBe(2_000_000)
  })

  it('chưa đặt hũ nào thì cả ngân sách là tiêu chung', () => {
    expect(chuaPhanBo(d(7_000_000), d(0))).toBe(7_000_000)
  })

  it('phân bổ vừa khít', () => {
    expect(chuaPhanBo(d(7_000_000), d(7_000_000))).toBe(0)
  })

  it('đặt hũ VƯỢT ngân sách thì trả số âm, không kẹp về 0', () => {
    // Che đi thì hũ hứa nhiều hơn số tiền đang có mà bồ không biết.
    expect(chuaPhanBo(d(7_000_000), d(9_000_000))).toBe(-2_000_000)
  })

  it('chưa có ngân sách thì trả null, không trả 0 (§7.8)', () => {
    expect(chuaPhanBo(null, d(1_000_000))).toBeNull()
  })
})

describe('deXuatHanMuc() — đề xuất bằng số đã tiêu thật (§7.6)', () => {
  const chi = (bo: [string, number, number | null][]): ChiTheoDanhMuc[] =>
    bo.map(([danhMucId, soTien, slot]) => ({ danhMucId, soTien: d(soTien), slot }))

  it('làm tròn XUỐNG bội 10.000đ', () => {
    const dx = deXuatHanMuc(chi([['a', 4_137_500, 1]]))
    expect(dx[0]!.hanMuc).toBe(4_130_000)
  })

  it('tổng đề xuất KHÔNG BAO GIỜ vượt số đã tiêu thật', () => {
    // Gật theo đề xuất thì không vô tình nới ngân sách rộng ra.
    const that = chi([
      ['a', 4_137_500, 1],
      ['b', 1_209_999, 2],
      ['c', 603_001, 3],
    ])
    const tongThat = that.reduce((t, c) => t + c.soTien, 0)
    const tongDeXuat = deXuatHanMuc(that).reduce((t, h) => t + h.hanMuc, 0)
    expect(tongDeXuat).toBeLessThanOrEqual(tongThat)
  })

  it('loại "Chưa biết xếp đâu" — danh mục hệ thống không có hũ', () => {
    const dx = deXuatHanMuc(
      chi([
        ['that', 500_000, 1],
        ['tam', 800_000, null],
      ]),
    )
    expect(dx.map((h) => h.danhMucId)).toEqual(['that'])
  })

  it('loại khoản quá nhỏ, không đẻ ra hũ 0đ', () => {
    // Làm tròn xuống 9.000đ ra 0đ — mà hũ 0đ bị migration 0008 chặn, và một cái
    // hũ cho khoản 9 nghìn thì cũng chẳng để làm gì.
    expect(deXuatHanMuc(chi([['a', 9_000, 1]]))).toEqual([])
    expect(deXuatHanMuc(chi([['a', 10_000, 1]]))[0]!.hanMuc).toBe(10_000)
  })

  it('chu kỳ trước chưa tiêu gì thì không đề xuất gì', () => {
    expect(deXuatHanMuc([])).toEqual([])
  })
})
