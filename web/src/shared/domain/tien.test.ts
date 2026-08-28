import { describe, it, expect } from 'vitest'
import { type Dong, dong, dinhDang, rutGon } from './tien'

describe('dong() — cổng duy nhất tạo ra kiểu Dong', () => {
  it('nhận số nguyên', () => {
    expect(dong(2_400_000)).toBe(2_400_000)
    expect(dong(0)).toBe(0)
    expect(dong(-800_000)).toBe(-800_000) // số âm hợp lệ: bút toán rút quỹ
  })

  it('từ chối số thập phân — đây là cả lý do file này tồn tại', () => {
    expect(() => dong(2400.5)).toThrow(/số nguyên/)
    expect(() => dong(0.1 + 0.2)).toThrow(/số nguyên/)
  })

  it('từ chối NaN và Infinity', () => {
    expect(() => dong(Number.NaN)).toThrow()
    expect(() => dong(Number.POSITIVE_INFINITY)).toThrow()
  })

  it('gán number thường vào Dong là LỖI BIÊN DỊCH', () => {
    // @ts-expect-error — number thường không gán được vào Dong.
    // Nếu branded type bị phá, dòng dưới hết lỗi ⇒ tsc báo "Unused '@ts-expect-error'"
    // ⇒ `npm run typecheck` fail. Test này tự bảo vệ chính nó.
    const sai: Dong = 150_000
    expect(sai).toBe(150_000) // lúc chạy vẫn là số thường, không có chi phí gì
  })
})

describe('dinhDang() — dạng đầy đủ, hiện khi bồ chạm vào', () => {
  it('chấm ngăn hàng nghìn, hậu tố đ', () => {
    expect(dinhDang(dong(6_990_000))).toBe('6.990.000đ')
    expect(dinhDang(dong(235_000))).toBe('235.000đ')
    expect(dinhDang(dong(0))).toBe('0đ')
  })

  it('không bao giờ có phần thập phân (§10 cấm "6.990.000,00 VNĐ")', () => {
    expect(dinhDang(dong(6_990_000))).not.toContain(',')
  })

  it('dùng cùng một dấu âm với rutGon()', () => {
    // Intl trả gạch nối ASCII; nếu không đổi thì cùng một số hiện "−200k" khi
    // rút gọn nhưng "-200.000đ" khi chạm vào.
    expect(dinhDang(dong(-200_000))).toBe('−200.000đ')
    expect(dinhDang(dong(-200_000))).not.toContain('-')
  })
})

describe('rutGon() — dạng ngắn, hiện ở cỡ lớn', () => {
  // ─── Hai mốc do mockup ghim ────────────────────────────────────────────────
  it('lỗ donut màn ②: 6.120.000 → "6,12tr"', () => {
    expect(rutGon(dong(6_120_000))).toBe('6,12tr')
  })

  it('biểu đồ chênh lệch màn ②: 520.000 → "520k"', () => {
    expect(rutGon(dong(520_000))).toBe('520k')
  })

  // ─── Quy tắc Khôi chốt 18/08/2026 ──────────────────────────────────────────
  it('lấy 2 chữ số thập phân', () => {
    expect(rutGon(dong(6_990_000))).toBe('6,99tr')
    expect(rutGon(dong(35_500))).toBe('35,5k')
  })

  it('số 0 ở cuối phần thập phân thì bỏ đi', () => {
    expect(rutGon(dong(6_900_000))).toBe('6,9tr') // 6,90 → 6,9
    expect(rutGon(dong(6_000_000))).toBe('6tr') //   6,00 → 6
    expect(rutGon(dong(1_500_000))).toBe('1,5tr')
    expect(rutGon(dong(1_000_000))).toBe('1tr')
    expect(rutGon(dong(50_000))).toBe('50k')
  })

  // ─── Ba quyết định tôi chọn thay, đảo ngược được ────────────────────────────
  it('CẮT BỎ phần dư, không làm tròn lên', () => {
    // Làm tròn sẽ ra "7tr" — hiện số LỚN HƠN thực tế, đi ngược §9.3 "không tông chê".
    // Muốn đổi sang làm tròn: sửa Math.floor thành Math.round trong catHaiSo().
    expect(rutGon(dong(6_999_000))).toBe('6,99tr')
    expect(rutGon(dong(999_999))).toBe('999,99k')
  })

  it('dưới 1.000đ thì hiện đầy đủ, không dùng "k"', () => {
    expect(rutGon(dong(1_000))).toBe('1k')
    expect(rutGon(dong(999))).toBe('999đ')
    expect(rutGon(dong(500))).toBe('500đ')
    expect(rutGon(dong(0))).toBe('0đ')
  })

  it('số âm dùng dấu trừ toán học U+2212 như mockup', () => {
    expect(rutGon(dong(-200_000))).toBe('−200k')
    expect(rutGon(dong(-6_990_000))).toBe('−6,99tr')
    expect(rutGon(dong(-200_000))).not.toContain('-') // KHÔNG phải gạch nối
  })

  // ─── Bẫy dấu phẩy động ─────────────────────────────────────────────────────
  it('không sai một xu vì dấu phẩy động', () => {
    // Cách viết ngây thơ Math.floor(n / 1_000_000 * 100) cho ra 6,11tr ở ca này,
    // vì 6.12 * 100 = 611.9999999999999 trong dấu phẩy động nhị phân.
    expect(rutGon(dong(6_120_000))).toBe('6,12tr')
    expect(rutGon(dong(1_070_000))).toBe('1,07tr')
    expect(rutGon(dong(8_290_000))).toBe('8,29tr')
  })
})
