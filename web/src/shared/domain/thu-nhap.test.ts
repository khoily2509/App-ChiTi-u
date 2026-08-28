import { describe, it, expect } from 'vitest'
import { khenThuNhapTang } from './thu-nhap'

describe('khenThuNhapTang() — khen khi trung bình trượt 3 chu kỳ tăng >= 5% (§7.5, §9.2)', () => {
  it('chưa đủ 4 chu kỳ để so 2 cửa sổ trượt 3 kỳ => IM LẶNG (trả null)', () => {
    expect(khenThuNhapTang([])).toBeNull()
    expect(khenThuNhapTang([9000000])).toBeNull()
    expect(khenThuNhapTang([9000000, 9000000])).toBeNull()
    expect(khenThuNhapTang([9000000, 9000000, 10000000])).toBeNull()
  })

  it('thu nhập tăng >= 5% giữa 2 cửa sổ 3 kỳ => khen ấm áp', () => {
    // Cửa sổ 1: [9tr, 9tr, 9tr] => TB 9tr
    // Cửa sổ 2: [9tr, 9tr, 12tr] => TB 10tr (tăng 11.11%)
    const kq = khenThuNhapTang([9000000, 9000000, 9000000, 12000000])
    expect(kq).not.toBeNull()
    expect(kq?.tang).toBe(true)
    expect(kq?.phanTramTang).toBe(11)
    expect(kq?.cauKhen).toContain('tăng 11%')
  })

  it('thu nhập giảm => IM LẶNG HOÀN TOÀN, không có câu nào phán xét', () => {
    // Cửa sổ 1: [10tr, 10tr, 10tr] => TB 10tr
    // Cửa sổ 2: [10tr, 10tr, 8tr] => TB 9.33tr (giảm)
    const kq = khenThuNhapTang([10000000, 10000000, 10000000, 8000000])
    expect(kq).toBeNull()
  })

  it('thu nhập tăng dưới 5% => không khen, tránh ồn ào', () => {
    // Cửa sổ 1: [9tr, 9tr, 9tr] => TB 9tr
    // Cửa sổ 2: [9tr, 9tr, 9.3tr] => TB 9.1tr (tăng 1.1%)
    const kq = khenThuNhapTang([9000000, 9000000, 9000000, 9300000])
    expect(kq).toBeNull()
  })
})
