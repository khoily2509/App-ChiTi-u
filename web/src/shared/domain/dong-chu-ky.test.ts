import { describe, it, expect } from 'vitest'
import { dong } from './tien'
import { ngayLocal } from './chu-ky'
import { tinhQuyetToanHu, taoSnapshotChuKy, phanTich8ChuKy } from './dong-chu-ky'

describe('tinhQuyetToanHu() — tính số dư từng hũ để bồ chọn (§7.6)', () => {
  it('tính đúng số dư và tiền đã chi cho từng hũ', () => {
    const dsHu = [
      { danhMucId: 'DM1', ten: 'Ăn uống', hanMuc: dong(4_000_000) },
      { danhMucId: 'DM2', ten: 'Giải trí', hanMuc: dong(1_000_000) },
    ]
    const daChiMap = new Map([
      ['DM1', dong(3_700_000)], // Dư 300k
      ['DM2', dong(700_000)],   // Dư 300k
    ])

    const qt = tinhQuyetToanHu(dsHu, daChiMap)
    expect(qt).toHaveLength(2)
    expect(qt[0]!.soDu).toBe(300_000)
    expect(qt[1]!.soDu).toBe(300_000)
    expect(qt[0]!.luaChon).toBe('gop_thang_moi')
  })

  it('hũ tiêu vượt hạn mức thì số dư = 0 (không âm)', () => {
    const dsHu = [{ danhMucId: 'DM1', ten: 'Mĩ phẩm', hanMuc: dong(500_000) }]
    const daChiMap = new Map([['DM1', dong(600_000)]])

    const qt = tinhQuyetToanHu(dsHu, daChiMap)
    expect(qt[0]!.soDu).toBe(0)
  })
})

describe('taoSnapshotChuKy() — tạo bản ghi bất biến', () => {
  it('tính đúng tỷ lệ để dành và lưu đủ thông tin', () => {
    const snap = taoSnapshotChuKy({
      chuKyId: 'CK-1',
      ngayBatDau: ngayLocal('2026-07-30'),
      ngayKetThuc: ngayLocal('2026-08-27'),
      tongThu: dong(10_000_000),
      tongChi: dong(7_000_000),
      tongDeDanh: dong(2_500_000),
      quyetToanHu: [],
    })

    expect(snap.tyLeDeDanh).toBe(25)
    expect(snap.tongChi).toBe(7_000_000)
    expect(snap.dongLuc).toBeDefined()
  })
})

describe('phanTich8ChuKy() — chuỗi 8 chu kỳ cho biểu đồ', () => {
  it('lấy tối đa 8 chu kỳ gần nhất và định dạng nhãn tháng', () => {
    const snaps = Array.from({ length: 10 }, (_, i) => {
      const thang = String((i % 9) + 1).padStart(2, '0')
      return taoSnapshotChuKy({
        chuKyId: `CK-${i}`,
        ngayBatDau: ngayLocal(`2026-${thang}-01`),
        ngayKetThuc: ngayLocal(`2026-${thang}-28`),
        tongThu: dong(10_000_000),
        tongChi: dong(6_000_000),
        tongDeDanh: dong(2_000_000),
        quyetToanHu: [],
      })
    })

    const pt = phanTich8ChuKy(snaps)
    expect(pt).toHaveLength(8)
    expect(pt[7]!.chuKyId).toBe('CK-9')
  })
})
