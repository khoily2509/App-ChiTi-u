import { describe, it, expect } from 'vitest'
import { dong } from './tien'
import {
  nganSach,
  conLai,
  homNayConTieuDuoc,
  phanTramDaDung,
  phanTramThoiGian,
  deDanhTuMoiNgay,
  moiNgayTuDeDanh,
} from './ngan-sach'

const d = dong

/** Thu nhập thật của bồ theo §2 — con số dùng xuyên suốt mọi ví dụ. */
const LUONG = d(9_000_000)

describe('nganSach() — §7.2', () => {
  it('chưa đặt để dành và chưa nợ thì bằng đúng lương', () => {
    expect(nganSach(LUONG, d(0), d(0))).toBe(9_000_000)
  })

  it('trừ sẵn để dành TRƯỚC khi tiêu', () => {
    expect(nganSach(LUONG, d(1_000_000), d(0))).toBe(8_000_000)
  })

  it('trừ cả khoản trả nợ quỹ kỳ này', () => {
    expect(nganSach(LUONG, d(1_000_000), d(1_350_000))).toBe(6_650_000)
  })

  it('không bao giờ âm, dù đặt để dành cao hơn lương', () => {
    expect(nganSach(LUONG, d(20_000_000), d(0))).toBe(0)
  })
})

describe('homNayConTieuDuoc() — con số ≥48px của màn ①', () => {
  it('chia đều phần còn lại cho số ngày còn lại', () => {
    // 9.000.000 − 0 đã chi, còn 30 ngày ⇒ 300.000/ngày
    expect(homNayConTieuDuoc(d(9_000_000), d(0), 30)).toBe(300_000)
  })

  it('làm tròn XUỐNG, thà báo thiếu vài đồng còn hơn cuối chu kỳ hụt', () => {
    // 1.000.000 / 3 = 333.333,33 → 333.333
    expect(homNayConTieuDuoc(d(1_000_000), d(0), 3)).toBe(333_333)
  })

  it('trừ phần đã chi', () => {
    expect(homNayConTieuDuoc(d(9_000_000), d(3_000_000), 20)).toBe(300_000)
  })

  // ── Ba trường hợp §7.8 bắt phải trả null, không được trả 0 ──────────────────
  it('chưa nhập lương thì trả null', () => {
    expect(homNayConTieuDuoc(null, d(500_000), 20)).toBeNull()
  })

  it('hết ngày trong chu kỳ thì trả null, không chia cho 0', () => {
    expect(homNayConTieuDuoc(d(9_000_000), d(0), 0)).toBeNull()
    expect(homNayConTieuDuoc(d(9_000_000), d(0), -3)).toBeNull()
  })

  it('đã tiêu quá ngân sách thì trả null, không trả số âm', () => {
    // Không ai "tiêu được −50.000đ hôm nay" — con số đó vô nghĩa
    expect(homNayConTieuDuoc(d(1_000_000), d(1_500_000), 10)).toBeNull()
    expect(homNayConTieuDuoc(d(1_000_000), d(1_000_000), 10)).toBeNull()
  })

  it('còn quá ít so với số ngày thì trả null chứ không trả 0đ/ngày', () => {
    // Chạm 0 khi phần còn lại NHỎ HƠN số ngày — với tiền Việt thật thì gần như
    // không xảy ra (phải dưới 31 đồng). Nhưng "0đ" đọc lên là "hết sạch tiền
    // rồi", đúng thứ §7.8 cấm, nên vẫn chặn: guard này không tốn gì.
    expect(homNayConTieuDuoc(d(20), d(0), 31)).toBeNull()
    expect(homNayConTieuDuoc(d(31), d(0), 31)).toBe(1)
    expect(homNayConTieuDuoc(d(1_000), d(0), 31)).toBe(32)
  })

  it('không bao giờ trả số âm hay 0 ở mọi tổ hợp đầu vào', () => {
    for (const ns of [0, 1_000, 1_000_000, 9_000_000]) {
      for (const chi of [0, 999, 1_000_000, 50_000_000]) {
        for (const ngay of [-1, 0, 1, 7, 31]) {
          const r = homNayConTieuDuoc(d(ns), d(chi), ngay)
          if (r !== null) expect(r).toBeGreaterThan(0)
        }
      }
    }
  })
})

describe('phanTramDaDung()', () => {
  it('tính đúng phần trăm', () => {
    expect(phanTramDaDung(d(8_000_000), d(6_120_000))).toBe(77)
    expect(phanTramDaDung(d(9_000_000), d(0))).toBe(0)
  })

  it('vượt 100% thì trả số thật, không cắt ở 100 — bồ cần biết vượt bao nhiêu', () => {
    expect(phanTramDaDung(d(1_000_000), d(1_180_000))).toBe(118)
  })

  it('chưa có ngân sách thì trả null', () => {
    expect(phanTramDaDung(null, d(500_000))).toBeNull()
    expect(phanTramDaDung(d(0), d(500_000))).toBeNull()
  })
})

describe('phanTramThoiGian() — vạch "hôm nay" trên thanh nhịp', () => {
  it('đầu chu kỳ là 0%, cuối là gần 100%', () => {
    expect(phanTramThoiGian(30, 30)).toBe(0)
    expect(phanTramThoiGian(30, 1)).toBe(97)
    expect(phanTramThoiGian(30, 0)).toBe(100)
  })

  it('so được với phần trăm đã dùng để biết nhanh hay chậm hơn nhịp', () => {
    // Đã dùng 76% ngân sách mà mới qua 61% thời gian ⇒ đang nhanh hơn nhịp
    expect(phanTramDaDung(d(8_000_000), d(6_120_000))).toBeGreaterThan(
      phanTramThoiGian(31, 12)!,
    )
  })

  it('chu kỳ không có ngày nào thì trả null', () => {
    expect(phanTramThoiGian(0, 0)).toBeNull()
  })
})

describe('conLai()', () => {
  it('âm khi đã vượt — đây là chỗ DUY NHẤT được trả số âm', () => {
    // Banner "đang vượt ~800.000đ" ở §7.3 cần con số này
    expect(conLai(d(8_000_000), d(8_800_000))).toBe(-800_000)
  })
})

describe('Đặt để dành — nhập được từ cả hai đầu (§7.2)', () => {
  const SO_NGAY = 31

  it('để dành 2 triệu ⇒ mỗi ngày 225.806đ', () => {
    expect(moiNgayTuDeDanh(LUONG, d(0), d(2_000_000), SO_NGAY)).toBe(225_806)
  })

  it('mỗi ngày 200 nghìn ⇒ để dành 2.800.000đ', () => {
    expect(deDanhTuMoiNgay(LUONG, d(0), d(200_000), SO_NGAY)).toBe(2_800_000)
  })

  it('hai chiều khớp nhau — đây là cùng MỘT phương trình', () => {
    for (const deDanh of [0, 500_000, 2_000_000, 5_000_000]) {
      const moiNgay = moiNgayTuDeDanh(LUONG, d(0), d(deDanh), SO_NGAY)
      const nguoc = deDanhTuMoiNgay(LUONG, d(0), moiNgay, SO_NGAY)
      // Lệch tối đa bằng số ngày, do làm tròn xuống khi chia
      expect(Math.abs(nguoc - deDanh)).toBeLessThan(SO_NGAY)
    }
  })

  it('trừ cả khoản trả nợ quỹ kỳ này', () => {
    // 9tr − 1,35tr nợ − 2tr để dành = 5,65tr cho 31 ngày
    expect(moiNgayTuDeDanh(LUONG, d(1_350_000), d(2_000_000), SO_NGAY)).toBe(182_258)
  })

  it('không bao giờ âm, dù đặt để dành cao hơn lương', () => {
    expect(moiNgayTuDeDanh(LUONG, d(0), d(20_000_000), SO_NGAY)).toBe(0)
    expect(deDanhTuMoiNgay(LUONG, d(0), d(9_000_000), SO_NGAY)).toBe(0)
  })

  it('chu kỳ không có ngày nào thì trả 0, không chia cho 0', () => {
    expect(moiNgayTuDeDanh(LUONG, d(0), d(0), 0)).toBe(0)
  })
})
