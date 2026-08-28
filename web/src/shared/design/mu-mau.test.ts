import { describe, it, expect } from 'vitest'
import { SLOT } from './mau'
import { moPhong, deltaE, capGanNhat, capGanNhatThuong } from './mu-mau'

/**
 * KIỂM ĐỊNH MÙ MÀU CHO BẢNG MÀU — biến ràng buộc §11.1 thành thứ chạy được.
 *
 * Trước file này, "6 màu đã kiểm định mù màu" chỉ là một câu trong tài liệu.
 * Không có gì chặn nếu ai đó sửa một mã hex rồi làm hai lát donut trùng nhau với
 * 8% đàn ông — và lỗi kiểu đó không bao giờ tự lộ ra khi người sửa nhìn bằng mắt
 * thường.
 */

const MAU = SLOT.map((s) => s.mau)

/** Sáu màu gốc, đo bằng chính công cụ này. Đây là MỐC — nới trần không được tệ hơn. */
const SAU_MAU_GOC = ['#3b8841', '#835cbe', '#c65d26', '#008b9e', '#c75374', '#b59600']

describe('công cụ mô phỏng phải đúng ở những ca đã biết chắc', () => {
  it('đỏ thuần hiện ra vàng sẫm với mắt lưỡng sắc, không còn là đỏ', () => {
    for (const kieu of ['protan', 'deutan'] as const) {
      const [r, g, b] = moPhong('#ff0000', kieu)
      expect(r).toBeGreaterThan(90) //  đỏ và lục xấp xỉ nhau ⇒ ra vàng
      expect(Math.abs(r - g)).toBeLessThan(30)
      expect(b).toBeLessThan(60) //     gần như không còn thành phần lam
    }
  })

  it('đỏ và lục xa nhau khi nhìn thường, gần lại hẳn khi mù đỏ-lục', () => {
    const thuong = capGanNhatThuong(['#ff0000', '#00ff00']).deltaE
    const mu = capGanNhat(['#ff0000', '#00ff00'], 'deutan').deltaE
    expect(thuong).toBeGreaterThan(80)
    expect(mu).toBeLessThan(thuong / 3)
  })

  it('lam và vàng KHÔNG gần lại — mù đỏ-lục không đụng tới trục đó', () => {
    const thuong = capGanNhatThuong(['#0000ff', '#ffff00']).deltaE
    const mu = capGanNhat(['#0000ff', '#ffff00'], 'deutan').deltaE
    expect(mu).toBeGreaterThan(thuong * 0.9)
  })

  it('cùng một màu thì khoảng cách bằng 0', () => {
    expect(deltaE(moPhong('#c65d26', 'protan'), moPhong('#c65d26', 'protan'))).toBeCloseTo(0, 6)
  })
})

describe('bảng màu 10 slot không được tệ hơn bộ 6 màu gốc', () => {
  // Mốc đo được, không phải con số chọn bừa: chính bộ 6 màu đã dùng suốt từ Pha 0.
  const mocProtan = capGanNhat(SAU_MAU_GOC, 'protan').deltaE
  const mocDeutan = capGanNhat(SAU_MAU_GOC, 'deutan').deltaE
  const mocThuong = capGanNhatThuong(SAU_MAU_GOC).deltaE

  it('mù đỏ (protan): 10 màu không sát nhau hơn 6 màu gốc', () => {
    const { deltaE: d, cap } = capGanNhat(MAU, 'protan')
    expect(
      d,
      `slot ${cap[0] + 1} và ${cap[1] + 1} quá sát nhau với người mù đỏ`,
    ).toBeGreaterThanOrEqual(mocProtan - 0.01)
  })

  it('mù lục (deutan): 10 màu không sát nhau hơn 6 màu gốc', () => {
    const { deltaE: d, cap } = capGanNhat(MAU, 'deutan')
    expect(
      d,
      `slot ${cap[0] + 1} và ${cap[1] + 1} quá sát nhau với người mù lục`,
    ).toBeGreaterThanOrEqual(mocDeutan - 0.01)
  })

  it('thị giác thường: mọi cặp cách nhau ít nhất ΔE 15', () => {
    const { deltaE: d, cap } = capGanNhatThuong(MAU)
    expect(d, `slot ${cap[0] + 1} và ${cap[1] + 1} quá sát nhau`).toBeGreaterThanOrEqual(15)
    expect(d).toBeLessThanOrEqual(mocThuong + 40) // chỉ để chắc phép đo còn tỉnh
  })

  it('bốn màu MỚI không cái nào sát màu cũ hơn mốc', () => {
    // Kiểm riêng phần thêm vào: nếu về sau ai đó đổi một trong bốn slot mới thì
    // test này chỉ đúng cái đó, khỏi phải mò trong 45 cặp.
    const moi = MAU.slice(6)
    for (let i = 0; i < moi.length; i++) {
      for (const kieu of ['protan', 'deutan'] as const) {
        const gan = Math.min(
          ...SAU_MAU_GOC.map((cu) => deltaE(moPhong(moi[i]!, kieu), moPhong(cu, kieu))),
        )
        expect(gan, `slot ${i + 7} (${moi[i]}) quá sát một màu cũ với ${kieu}`).toBeGreaterThan(8)
      }
    }
  })
})

describe('sáu màu gốc phải giữ nguyên từng ký tự', () => {
  it('nới trần lên 10 không được đụng vào màu đang chạy', () => {
    // Đổi giá trị của chúng là mọi biểu đồ của các chu kỳ CŨ đổi màu theo, mà bồ
    // thì nhớ "mục xanh lá là Sinh hoạt" chứ không nhớ mã hex.
    expect(MAU.slice(0, 6)).toEqual(SAU_MAU_GOC)
  })
})
