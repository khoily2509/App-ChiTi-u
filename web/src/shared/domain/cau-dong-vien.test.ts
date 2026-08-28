import { describe, it, expect } from 'vitest'
import { chonCauDongVien, CAU_DONG_VIEN_MAC_DINH, type CauDongVien } from './cau-dong-vien'

describe('chonCauDongVien() — tông giọng và chống lặp 14 ngày (§9.3)', () => {
  it('chọn đúng câu theo tông yêu cầu', () => {
    const cau = chonCauDongVien(CAU_DONG_VIEN_MAC_DINH, 'mung', '2026-08-28')
    expect(cau?.tong).toBe('mung')
  })

  it('loại trừ câu vừa dùng trong vòng 14 ngày', () => {
    const ds: CauDongVien[] = [
      { id: 'C1', tong: 'mung', noiDung: 'Câu 1', lanDungCuoi: '2026-08-20' }, // 8 ngày trước (chưa đủ 14 ngày)
      { id: 'C2', tong: 'mung', noiDung: 'Câu 2', lanDungCuoi: '2026-08-10' }, // 18 ngày trước (hợp lệ)
    ]
    const kq = chonCauDongVien(ds, 'mung', '2026-08-28', 14)
    expect(kq?.id).toBe('C2')
  })

  it('cảnh báo quan tâm phải có hành động cụ thể', () => {
    const cau = chonCauDongVien(CAU_DONG_VIEN_MAC_DINH, 'quan_tam', '2026-08-28')
    expect(cau?.hanhDong).toBeDefined()
    expect(cau?.hanhDong?.length).toBeGreaterThan(5)
  })
})
