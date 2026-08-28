import { describe, it, expect } from 'vitest'
import { trichXuatThamSoIntent, taoUrlShortcut } from './shortcut'

describe('trichXuatThamSoIntent() — bóc tách intent từ URL', () => {
  it('bóc tách đúng các tham số query URL', () => {
    const query = '?action=ghi&soTien=45000&danhMucId=DM_AN_UONG&ghiChu=Pho+bo'
    const intent = trichXuatThamSoIntent(query)

    expect(intent).not.toBeNull()
    expect(intent?.soTien).toBe(45_000)
    expect(intent?.danhMucId).toBe('DM_AN_UONG')
    expect(intent?.ghiChu).toBe('Pho bo')
    expect(intent?.tuDong).toBe(false)
  })

  it('hỗ trợ cờ tuDong=true', () => {
    const query = '?action=ghi&tien=35000&auto=true'
    const intent = trichXuatThamSoIntent(query)

    expect(intent?.soTien).toBe(35_000)
    expect(intent?.tuDong).toBe(true)
  })

  it('trả về null nếu action không phải ghi', () => {
    expect(trichXuatThamSoIntent('?action=xem')).toBeNull()
    expect(trichXuatThamSoIntent('')).toBeNull()
  })
})

describe('taoUrlShortcut() — tạo URL cho Apple Shortcuts', () => {
  it('tạo đúng định dạng query URL', () => {
    const url = taoUrlShortcut('https://sobo.app', {
      soTien: 50_000,
      danhMucId: 'DM1',
      ghiChu: 'Cơm tấm',
    })

    expect(url).toContain('action=ghi')
    expect(url).toContain('soTien=50000')
    expect(url).toContain('danhMucId=DM1')
  })
})
