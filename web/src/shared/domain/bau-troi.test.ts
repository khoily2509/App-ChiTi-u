import { describe, it, expect } from 'vitest'
import { gioVN, bauTroiTheoGio, bauTroiHienTai, docChonBauTroi, sinhSao } from './bau-troi'

describe('gioVN() — giờ Việt Nam, không phải giờ máy', () => {
  it('quy đổi từ mốc UTC sang UTC+7', () => {
    expect(gioVN(new Date('2026-08-23T00:00:00Z'))).toBe(7)
    expect(gioVN(new Date('2026-08-23T10:00:00Z'))).toBe(17)
  })

  it('qua nửa đêm giờ VN', () => {
    // 17:30 UTC = 00:30 hôm sau giờ VN
    expect(gioVN(new Date('2026-08-23T17:30:00Z'))).toBe(0)
    expect(gioVN(new Date('2026-08-23T16:59:00Z'))).toBe(23)
  })
})

describe('bauTroiTheoGio() — mốc lấy từ mockup v3', () => {
  it('05:00–10:59 là bình minh', () => {
    expect(bauTroiTheoGio(5)).toBe('binh_minh')
    expect(bauTroiTheoGio(10)).toBe('binh_minh')
  })

  it('11:00–17:59 là hoàng hôn', () => {
    expect(bauTroiTheoGio(11)).toBe('hoang_hon')
    expect(bauTroiTheoGio(17)).toBe('hoang_hon')
  })

  it('18:00–04:59 là ngân hà — khoảng này VẮT QUA NỬA ĐÊM', () => {
    // Chỗ dễ sai nhất: không viết được bằng một phép so sánh khoảng liên tục
    expect(bauTroiTheoGio(18)).toBe('ngan_ha')
    expect(bauTroiTheoGio(23)).toBe('ngan_ha')
    expect(bauTroiTheoGio(0)).toBe('ngan_ha')
    expect(bauTroiTheoGio(4)).toBe('ngan_ha')
  })

  it('phủ kín 24 giờ, không giờ nào rơi ra ngoài', () => {
    for (let g = 0; g < 24; g++) {
      expect(['binh_minh', 'hoang_hon', 'ngan_ha']).toContain(bauTroiTheoGio(g))
    }
  })

  it('đúng ba ranh giới chuyển cảnh', () => {
    expect(bauTroiTheoGio(4)).not.toBe(bauTroiTheoGio(5))
    expect(bauTroiTheoGio(10)).not.toBe(bauTroiTheoGio(11))
    expect(bauTroiTheoGio(17)).not.toBe(bauTroiTheoGio(18))
  })
})

describe('bauTroiHienTai() — lựa chọn của bồ thắng đồng hồ', () => {
  it('tu_dong thì theo giờ', () => {
    expect(bauTroiHienTai('tu_dong', 8)).toBe('binh_minh')
    expect(bauTroiHienTai('tu_dong', 20)).toBe('ngan_ha')
  })

  it('chốt cảnh rồi thì giờ nào cũng giữ nguyên cảnh đó', () => {
    for (let g = 0; g < 24; g++) {
      expect(bauTroiHienTai('ngan_ha', g)).toBe('ngan_ha')
      expect(bauTroiHienTai('binh_minh', g)).toBe('binh_minh')
    }
  })
})

describe('docChonBauTroi() — giá trị lạ trong DB không được làm đổ app', () => {
  it('nhận đúng bốn giá trị hợp lệ', () => {
    for (const v of ['tu_dong', 'binh_minh', 'hoang_hon', 'ngan_ha']) {
      expect(docChonBauTroi(v)).toBe(v)
    }
  })

  it('mọi thứ khác về tu_dong', () => {
    for (const v of [null, undefined, 0, '', 'BINH_MINH', 'mưa', {}, []]) {
      expect(docChonBauTroi(v)).toBe('tu_dong')
    }
  })
})

describe('sinhSao() — bầu trời phải đứng yên giữa các lần mở app', () => {
  it('cùng hạt giống ⇒ cùng trường sao, từng ngôi một', () => {
    expect(sinhSao()).toEqual(sinhSao())
  })

  it('khác hạt giống ⇒ khác trường sao', () => {
    expect(sinhSao(20, 1)).not.toEqual(sinhSao(20, 2))
  })

  it('phép nhân nằm trong 32 bit, không mất bit như PRNG của mockup', () => {
    // Mockup dùng phép nhân thường: 20260821 × 1103515245 = 2,2×10¹⁶, vượt
    // MAX_SAFE_INTEGER. Math.imul cho kết quả đúng trong 32 bit.
    const sao = sinhSao(200)
    expect(sao.every((s) => Number.isFinite(s.x) && Number.isFinite(s.y))).toBe(true)
    // Trùng lặp nhiều nghĩa là chu kỳ PRNG quá ngắn — dấu hiệu mất bit
    const rieng = new Set(sao.map((s) => `${s.x},${s.y}`))
    expect(rieng.size).toBeGreaterThan(190)
  })

  it('mọi ngôi sao nằm trong khung và ở 68% phía trên', () => {
    for (const s of sinhSao(300)) {
      expect(s.x).toBeGreaterThanOrEqual(0)
      expect(s.x).toBeLessThanOrEqual(100)
      expect(s.y).toBeGreaterThanOrEqual(0)
      expect(s.y).toBeLessThanOrEqual(68)
      expect(s.r).toBeGreaterThan(0)
      expect(s.mo).toBeGreaterThan(0)
      expect(s.mo).toBeLessThanOrEqual(0.88)
    }
  })

  it('đúng số lượng yêu cầu', () => {
    expect(sinhSao(7)).toHaveLength(7)
    expect(sinhSao()).toHaveLength(130)
  })
})
