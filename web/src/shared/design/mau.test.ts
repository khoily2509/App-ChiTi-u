import { readFileSync, readdirSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { GIAO_DIEN, SLOT, CHUA_BIET, TRANG_THAI, CHENH_LECH, LOP_SLOT, lopSlot } from './mau'

/* ── Tính tương phản theo công thức WCAG 2.1 ────────────────────────────────── */

function kenh(v: number): number {
  const s = v / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

function doSang(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => kenh(parseInt(hex.slice(i, i + 2), 16)))
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

/** Tỷ lệ tương phản giữa hai màu, từ 1:1 (giống hệt) tới 21:1 (đen trên trắng). */
function tuongPhan(a: string, b: string): number {
  const [cao, thap] = [doSang(a), doSang(b)].sort((x, y) => y - x)
  return (cao! + 0.05) / (thap! + 0.05)
}

/**
 * Ngưỡng 5:1 chứ không phải 4,5:1 của WCAG AA.
 * Nửa điểm dôi ra là biên an toàn: chỉnh màu nhẹ về sau không làm vỡ kiểm định ngay.
 */
const NGUONG = 5.0

/* ── Kiểm định ──────────────────────────────────────────────────────────────── */

describe('tuongPhan() — tự kiểm chứng công thức', () => {
  it('khớp hai mốc đã biết', () => {
    expect(tuongPhan('#000000', '#ffffff')).toBeCloseTo(21, 1)
    // §11.1 tự ghi: màu Nghệ trên nền kem là 2,68:1. Nếu công thức ở đây ra số
    // khác, tức là tôi đang đo bằng thước khác thước của người viết spec.
    expect(tuongPhan('#b59600', '#faf7f2')).toBeCloseTo(2.68, 1)
  })
})

describe('Lớp 2 — màu chữ/nét trên nền pha loãng (§11.1)', () => {
  for (const s of SLOT) {
    it(`slot ${s.slot} · ${s.ten}: ${s.chu} trên ${s.nen} đạt ≥${NGUONG}:1`, () => {
      expect(tuongPhan(s.chu, s.nen)).toBeGreaterThanOrEqual(NGUONG)
    })
  }

  it(`Chưa biết xếp đâu cũng đạt ≥${NGUONG}:1`, () => {
    expect(tuongPhan(CHUA_BIET.chu, CHUA_BIET.nen)).toBeGreaterThanOrEqual(NGUONG)
  })
})

describe('Thứ tự slot là cơ chế an toàn mù màu — không được đổi', () => {
  it('đúng 10 slot, đánh số 1→10 liên tục', () => {
    // Nới từ 6 lên 10 ngày 27/08/2026. Sáu slot đầu giữ NGUYÊN giá trị — chúng
    // nằm trong mockup và trong dữ liệu đang chạy, đổi là mọi biểu đồ cũ đổi màu.
    expect(SLOT.map((s) => s.slot)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('mười màu vành donut đôi một khác nhau', () => {
    expect(new Set(SLOT.map((s) => s.mau)).size).toBe(10)
  })
})

describe('Màu trạng thái không bao giờ được dùng làm màu series (§11.1)', () => {
  const trangThai = new Set<string>(Object.values(TRANG_THAI))

  it('không màu slot nào trùng màu trạng thái', () => {
    for (const s of SLOT) expect(trangThai.has(s.mau)).toBe(false)
  })

  it('biểu đồ chênh lệch dùng màu trung tính, không dùng đỏ/xanh trạng thái', () => {
    expect(trangThai.has(CHENH_LECH.thanh)).toBe(false)
  })

  it('biểu đồ chênh lệch chỉ có ĐÚNG MỘT màu', () => {
    // Hai màu thì phải chứng minh chúng phân biệt được cả với người mù màu — mà
    // cặp trung tính nào đủ dịu để không "chê" cũng đều quá gần nhau. Chiều thay
    // đổi để cho vị trí thanh mã hoá; thêm màu thứ hai là mở lại cái bẫy đó.
    expect(Object.keys(CHENH_LECH)).toHaveLength(1)
  })
})

describe('mau.ts và index.css không được lệch nhau (§14 quy ước 6)', () => {
  const css = readFileSync(new URL('../../index.css', import.meta.url), 'utf8')

  /**
   * Quét mọi biến --color-* trong khối @theme một lần vào Map.
   *
   * Dùng regex LITERAL chứ không dựng bằng `new RegExp` từ template literal:
   * trong template literal `\s` không phải escape hợp lệ nên JavaScript rút gọn
   * nó thành ký tự 's' thường, biến biểu thức thành `--color-page:s*(#...)` —
   * không bao giờ khớp, và trả null im lặng thay vì báo lỗi.
   */
  const BIEN = new Map<string, string>(
    [...css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1]!, m[2]!]),
  )

  const capDoi: Array<[string, string]> = [
    ['page', GIAO_DIEN.page],
    ['surface', GIAO_DIEN.surface],
    ['surface2', GIAO_DIEN.surface2],
    ['sage-soft', GIAO_DIEN.sageSoft],
    ['sage', GIAO_DIEN.sage],
    ['gold', GIAO_DIEN.gold],
    ['ink', GIAO_DIEN.ink],
    ['ink2', GIAO_DIEN.ink2],
    ['muted', GIAO_DIEN.muted],
    ['line', GIAO_DIEN.line],
    ['line2', GIAO_DIEN.line2],
    ['chua-biet', CHUA_BIET.mau],
    ['chua-biet-t', CHUA_BIET.nen],
    ['chua-biet-ink', CHUA_BIET.chu],
    ['tot', TRANG_THAI.tot],
    ['canh-bao', TRANG_THAI.canhBao],
    ['nghiem-trong', TRANG_THAI.nghiemTrong],
    ['nguy-cap', TRANG_THAI.nguyCap],
    ['chenh-lech', CHENH_LECH.thanh],
    ...SLOT.flatMap((s): Array<[string, string]> => [
      [`c${s.slot}`, s.mau],
      [`c${s.slot}-t`, s.nen],
      [`c${s.slot}-ink`, s.chu],
    ]),
  ]

  it('số biến trong CSS bằng đúng số token trong mau.ts', () => {
    // Bắt hai lỗi cùng lúc: regex hỏng nên quét ra rỗng (im lặng, không báo gì),
    // và thêm biến vào CSS mà quên khai báo bên mau.ts.
    expect(BIEN.size).toBe(capDoi.length)
  })

  for (const [ten, mongDoi] of capDoi) {
    it(`--color-${ten} khớp`, () => {
      expect(BIEN.get(ten)).toBe(mongDoi)
    })
  }
})

describe('Tên lớp Tailwind phải phủ đủ mọi slot (§14 quy ước 6)', () => {
  it('LOP_SLOT có đúng từng slot mà SLOT có, không thiếu không thừa', () => {
    // Lỗi đã xảy ra thật: nới trần lên 10 ngày 27/08/2026 thì `mau.ts` và
    // `index.css` có đủ 10 màu, còn bảng tên lớp chép tay trong hai màn hình chỉ
    // có 1–6 — danh mục thứ 7 hiện màu XÁM mà không ai báo lỗi gì.
    expect(
      Object.keys(LOP_SLOT)
        .map(Number)
        .sort((x, y) => x - y),
    ).toEqual(SLOT.map((s) => s.slot))
  })

  it('mỗi slot có đủ bốn vai trò lớp', () => {
    for (const s of SLOT) {
      const l = lopSlot(s.slot)
      expect(l.nen).toMatch(/^bg-c\d+-t$/)
      expect(l.chu).toMatch(/^text-c\d+-ink$/)
      expect(l.vien).toMatch(/^border-c\d+$/)
      expect(l.dam).toMatch(/^bg-c\d+$/)
    }
  })

  it('slot rỗng hoặc lạ rơi về màu xám của danh mục hệ thống', () => {
    for (const x of [null, 0, 11, 99, -1]) {
      expect(lopSlot(x).dam).toBe('bg-chua-biet')
    }
  })
})

describe('Không màn hình nào được tự chép lại bảng màu', () => {
  it('không file nào trong features/ khai bảng slot riêng', () => {
    // Hai màn từng chép tay bảng này rồi lệch khỏi bản gốc. Token rải ra nhiều
    // nơi thì sớm muộn chúng lệch nhau, và lệch âm thầm (§14 quy ước 6).
    const viPham: string[] = []
    const di = (thuMuc: URL) => {
      for (const t of readdirSync(thuMuc, { withFileTypes: true })) {
        const con = new URL(t.name + (t.isDirectory() ? '/' : ''), thuMuc)
        if (t.isDirectory()) di(con)
        else if (t.name.endsWith('.tsx')) {
          const noiDung = readFileSync(con, 'utf8')
          // Dấu hiệu của một bảng chép tay: nhắc c1 rồi nhắc c5 trong cùng một
          // đoạn ngắn. Dùng một màu lẻ thì không sao.
          if (/-c1\b[\s\S]{0,400}-c5\b/.test(noiDung)) viPham.push(t.name)
        }
      }
    }
    di(new URL('../../features/', import.meta.url))
    expect(viPham).toEqual([])
  })
})
