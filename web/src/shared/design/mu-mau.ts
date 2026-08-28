/**
 * ĐO ĐỘ PHÂN BIỆT MÀU CHO NGƯỜI MÙ MÀU — công cụ cho test, không dùng lúc chạy.
 *
 * §11.1 đặt ra kiểm định mù màu như một ràng buộc, nhưng suốt từ Pha 0 nó chỉ
 * tồn tại dưới dạng CHỮ trong tài liệu: không có gì chặn nếu ai đó sửa một mã
 * hex rồi vô tình làm hai lát donut trùng nhau với 8% đàn ông. File này biến
 * ràng buộc đó thành thứ `vitest` kiểm được.
 *
 * Mô phỏng lưỡng sắc theo Viénot–Brettel–Mollon 1999; khoảng cách màu theo
 * CIEDE2000. Chỉ mô phỏng mù ĐỎ-LỤC (protan + deutan) — đó là phạm vi §11.1 nói
 * tới, và cũng là dạng chiếm gần như toàn bộ số ca thật.
 *
 * ⚠️ Con số ở đây KHÔNG khớp với "ΔE 9,0 / 16,8" ghi trong §11.1 — bộ 6 màu cũ
 * đo bằng công cụ này ra 5,0 / 24,7. Không có nghĩa bên nào sai: hai bên dùng
 * phương pháp mô phỏng và công thức ΔE khác nhau, mà tài liệu không ghi lại là
 * phương pháp nào. Thứ dùng được là một thước ĐO NHẤT QUÁN, nên từ nay lấy
 * chính thước này làm chuẩn, và mốc là "không được tệ hơn bộ 6 màu cũ".
 */

type Kieu = 'protan' | 'deutan'

const hexToRgb = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const srgbToLin = (c: number) => {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
const linToSrgb = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055) * 255

const RGB2LMS = [
  [0.31399022, 0.63951294, 0.04649755],
  [0.15537241, 0.75789446, 0.08670142],
  [0.01775239, 0.10944209, 0.87256922],
]
const LMS2RGB = [
  [5.47221206, -4.6419601, 0.16963708],
  [-1.1252419, 2.29317094, -0.1678952],
  [0.02980165, -0.19318073, 1.16364789],
]
/** Chiếu LMS lên mặt phẳng mà mắt lưỡng sắc còn phân biệt được. */
const CHIEU: Record<Kieu, number[][]> = {
  protan: [
    [0, 1.05118294, -0.05116099],
    [0, 1, 0],
    [0, 0, 1],
  ],
  deutan: [
    [1, 0, 0],
    [0.9513092, 0, 0.04264804],
    [0, 0, 1],
  ],
}
const nhan = (M: number[][], v: number[]) =>
  M.map((r) => r[0]! * v[0]! + r[1]! * v[1]! + r[2]! * v[2]!)

/** Màu đó hiện ra thế nào với mắt lưỡng sắc. */
export function moPhong(hex: string, kieu: Kieu): [number, number, number] {
  const lms = nhan(RGB2LMS, hexToRgb(hex).map(srgbToLin))
  return nhan(LMS2RGB, nhan(CHIEU[kieu], lms)).map(linToSrgb) as [number, number, number]
}

function toLab([r0, g0, b0]: [number, number, number]) {
  const [r, g, b] = [r0, g0, b0].map(srgbToLin) as [number, number, number]
  const X = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047
  const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b
  const Z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29)
  const [fx, fy, fz] = [f(X), f(Y), f(Z)]
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)] as [number, number, number]
}

/** CIEDE2000 — công thức khoảng cách màu khớp cảm nhận mắt người sát nhất. */
export function deltaE(a: [number, number, number], b: [number, number, number]): number {
  const [L1, a1, b1] = toLab(a)
  const [L2, a2, b2] = toLab(b)
  const rad = Math.PI / 180
  const deg = 180 / Math.PI
  const Cb = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
  const ap1 = (1 + G) * a1
  const ap2 = (1 + G) * a2
  const Cp1 = Math.hypot(ap1, b1)
  const Cp2 = Math.hypot(ap2, b2)
  const goc = (b: number, ap: number) => {
    if (b === 0 && ap === 0) return 0
    const h = Math.atan2(b, ap) * deg
    return h >= 0 ? h : h + 360
  }
  const hp1 = goc(b1, ap1)
  const hp2 = goc(b2, ap2)
  const dLp = L2 - L1
  const dCp = Cp2 - Cp1
  let dhp = 0
  if (Cp1 * Cp2 !== 0) {
    dhp = hp2 - hp1
    if (dhp > 180) dhp -= 360
    else if (dhp < -180) dhp += 360
  }
  const dHp = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin((dhp * rad) / 2)
  const Lbp = (L1 + L2) / 2
  const Cbp = (Cp1 + Cp2) / 2
  let hbp: number
  if (Cp1 * Cp2 === 0) hbp = hp1 + hp2
  else if (Math.abs(hp1 - hp2) <= 180) hbp = (hp1 + hp2) / 2
  else hbp = hp1 + hp2 < 360 ? (hp1 + hp2 + 360) / 2 : (hp1 + hp2 - 360) / 2
  const T =
    1 -
    0.17 * Math.cos((hbp - 30) * rad) +
    0.24 * Math.cos(2 * hbp * rad) +
    0.32 * Math.cos((3 * hbp + 6) * rad) -
    0.2 * Math.cos((4 * hbp - 63) * rad)
  const Rt =
    -Math.sin(2 * (30 * Math.exp(-(((hbp - 275) / 25) ** 2))) * rad) *
    (2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7)))
  const Sl = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2)
  const Sc = 1 + 0.045 * Cbp
  const Sh = 1 + 0.015 * Cbp * T
  return Math.sqrt(
    (dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh),
  )
}

/** Cặp gần nhau nhất trong danh sách, dưới mắt lưỡng sắc kiểu đã cho. */
export function capGanNhat(hex: string[], kieu: Kieu): { deltaE: number; cap: [number, number] } {
  let min = Infinity
  let cap: [number, number] = [0, 0]
  for (let i = 0; i < hex.length; i++) {
    for (let j = i + 1; j < hex.length; j++) {
      const d = deltaE(moPhong(hex[i]!, kieu), moPhong(hex[j]!, kieu))
      if (d < min) {
        min = d
        cap = [i, j]
      }
    }
  }
  return { deltaE: min, cap }
}

/** Cặp gần nhau nhất khi nhìn bình thường. */
export function capGanNhatThuong(hex: string[]): { deltaE: number; cap: [number, number] } {
  let min = Infinity
  let cap: [number, number] = [0, 0]
  for (let i = 0; i < hex.length; i++) {
    for (let j = i + 1; j < hex.length; j++) {
      const d = deltaE(hexToRgb(hex[i]!), hexToRgb(hex[j]!))
      if (d < min) {
        min = d
        cap = [i, j]
      }
    }
  }
  return { deltaE: min, cap }
}
