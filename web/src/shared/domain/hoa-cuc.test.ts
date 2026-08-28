import { describe, it, expect } from 'vitest'
import { ngayLocal, type NgayLocal } from './chu-ky'
import { thuIso, dauTuan, nhipTuan, DU_CANH, gioNhacTu, GIO_NHAC_MAC_DINH, vuonHoa } from './hoa-cuc'

const n = (s: string): NgayLocal => ngayLocal(s)

/** 24/08/2026 là Thứ Hai — mốc dùng chung cho cả file. */
const T2 = '2026-08-24'
const ngay = (i: number) => n(`2026-08-${String(24 + i).padStart(2, '0')}`)

describe('thuIso() — tuần bắt đầu THỨ HAI (§14 quy ước 2)', () => {
  it('Thứ Hai là 0, Chủ Nhật là 6', () => {
    expect(thuIso(n(T2))).toBe(0)
    expect(thuIso(n('2026-08-30'))).toBe(6)
  })

  it('phủ đủ bảy ngày liên tiếp, không trùng không hụt', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map((i) => thuIso(ngay(i)))).toEqual([0, 1, 2, 3, 4, 5, 6])
  })
})

describe('dauTuan()', () => {
  it('mọi ngày trong tuần đều quy về đúng Thứ Hai đó', () => {
    for (let i = 0; i < 7; i++) expect(dauTuan(ngay(i))).toBe(T2)
  })

  it('Chủ Nhật thuộc tuần TRƯỚC, không phải tuần sau', () => {
    // 23/08/2026 là Chủ Nhật ⇒ đầu tuần là 17/08, không phải 24/08
    expect(dauTuan(n('2026-08-23'))).toBe('2026-08-17')
  })
})

describe('nhipTuan() — §9.2', () => {
  it('mỗi ngày đúng MỘT cánh, ghi ba khoản cùng ngày vẫn một cánh', () => {
    // Bông hoa đếm ngày có chăm sóc, không đếm số lần
    const r = nhipTuan([ngay(0), ngay(0), ngay(0)], ngay(3))
    expect(r.daGhi).toBe(1)
    expect(r.canh).toEqual([true, false, false, false, false, false, false])
  })

  it('loại ngày ngoài tuần đang xét', () => {
    const r = nhipTuan([n('2026-08-23'), ngay(0), n('2026-08-31')], ngay(2))
    expect(r.daGhi).toBe(1)
  })

  it('đủ 5 cánh thì nhuỵ vàng', () => {
    const r = nhipTuan([0, 1, 2, 3, 4].map(ngay), ngay(4))
    expect(r.daGhi).toBe(DU_CANH)
    expect(r.duNo).toBe(true)
  })

  it('cánh nằm đúng thứ trong tuần', () => {
    const r = nhipTuan([ngay(0), ngay(2), ngay(6)], ngay(6))
    expect(r.canh).toEqual([true, false, true, false, false, false, true])
  })
})

describe('nenThucDay() — chỉ nhắc khi SẮP ĐẠT, tuần hỏng thì IM LẶNG', () => {
  it('4 cánh và còn ngày ⇒ nhắc', () => {
    // Thứ Sáu, đã ghi 4 ngày, còn 3 ngày
    expect(nhipTuan([0, 1, 2, 3].map(ngay), ngay(4)).nenThucDay).toBe(true)
  })

  it('đủ 5 cánh rồi thì THÔI, không còn gì để thúc', () => {
    expect(nhipTuan([0, 1, 2, 3, 4].map(ngay), ngay(4)).nenThucDay).toBe(false)
  })

  it('mới 2 cánh thì chưa nhắc — chưa gọi là sắp đạt', () => {
    expect(nhipTuan([0, 1].map(ngay), ngay(2)).nenThucDay).toBe(false)
  })

  it('TUẦN ĐÃ HỎNG thì im lặng hoàn toàn', () => {
    // Chủ Nhật, mới ghi 1 ngày: ghi nốt hôm nay cũng chỉ được 2 cánh.
    // §9.2 — nhắc lúc này chỉ là chì chiết.
    const r = nhipTuan([ngay(0)], ngay(6))
    expect(r.conLai).toBe(1)
    expect(r.nenThucDay).toBe(false)
  })

  it('ca sát ranh: Chủ Nhật với 4 cánh vẫn nhắc, vì hôm nay còn cứu được', () => {
    const r = nhipTuan([0, 1, 2, 3].map(ngay), ngay(6))
    expect(r.conLai).toBe(1)
    expect(r.nenThucDay).toBe(true)
  })

  it('không tuần nào nhắc khi đã hết đường đủ 5 cánh', () => {
    for (let hom = 0; hom < 7; hom++) {
      for (let daGhi = 0; daGhi <= hom + 1; daGhi++) {
        const r = nhipTuan(
          Array.from({ length: daGhi }, (_, i) => ngay(i)),
          ngay(hom),
        )
        if (r.nenThucDay) expect(r.daGhi + r.conLai).toBeGreaterThanOrEqual(DU_CANH)
      }
    }
  })
})

describe('tuần trống', () => {
  it('chưa ghi ngày nào', () => {
    const r = nhipTuan([], ngay(0))
    expect(r.daGhi).toBe(0)
    expect(r.duNo).toBe(false)
    expect(r.canh.every((c) => !c)).toBe(true)
  })
})

describe('gioNhacTu() — đọc giờ nhắc từ cau_hinh', () => {
  it('đọc được dạng seed đang lưu thật: chuỗi "21:00"', () => {
    // Đây là ca đã hỏng suốt: worker kiểm typeof === 'number' nên luôn trượt.
    expect(gioNhacTu('"21:00"'.replace(/"/g, ''))).toBe(21)
    expect(gioNhacTu('21:00')).toBe(21)
    expect(gioNhacTu('08:00')).toBe(8)
  })

  it('đọc được dạng số, phòng khi sau này đổi cách lưu', () => {
    expect(gioNhacTu(20)).toBe(20)
    expect(gioNhacTu(0)).toBe(0)
    expect(gioNhacTu(23)).toBe(23)
  })

  it('đọc được chuỗi chỉ có giờ, phòng khi ai đó sửa tay trong bảng', () => {
    expect(gioNhacTu('7')).toBe(7)
    expect(gioNhacTu('  22  ')).toBe(22)
  })

  it('giá trị lạ ⇒ về mặc định, KHÔNG ném', () => {
    // Cron chạy mỗi giờ cho mọi người; một dòng cấu hình hỏng của một người không
    // được làm chết cả vòng lặp.
    for (const x of [null, undefined, {}, [], 'hai mươi mốt giờ', '', '25:00', -1, 24, 21.5, NaN]) {
      expect(gioNhacTu(x)).toBe(GIO_NHAC_MAC_DINH)
    }
  })

  it('không nhầm 0 giờ thành "giá trị rỗng"', () => {
    // 0 là falsy — viết `giaTri || MAC_DINH` là nửa đêm biến thành 21h.
    expect(gioNhacTu(0)).toBe(0)
    expect(gioNhacTu('00:00')).toBe(0)
  })
})

describe('vuonHoa() — Vườn hoa 8 tuần (§9.2, §10)', () => {
  it('trả về đúng 8 tuần liên tiếp kết thúc ở tuần hiện tại', () => {
    const v = vuonHoa([], n(T2), 8)
    expect(v).toHaveLength(8)
    expect(v[7]!.laTuanNay).toBe(true)
    expect(v[7]!.dauTuan).toBe(T2)
    expect(v[6]!.laTuanNay).toBe(false)
    expect(v[6]!.dauTuan).toBe('2026-08-17')
  })

  it('tuần đủ 5 cánh thì duNo=true, tuần thiếu thì duNo=false (nhụy xám)', () => {
    // Tuần trước (17/08 - 23/08) ghi đủ 5 ngày
    const ngayTuanTruoc = [
      n('2026-08-17'),
      n('2026-08-18'),
      n('2026-08-19'),
      n('2026-08-20'),
      n('2026-08-21'),
    ]
    // Tuần này (24/08) mới ghi 2 ngày
    const ngayTuanNay = [n('2026-08-24'), n('2026-08-25')]

    const v = vuonHoa([...ngayTuanTruoc, ...ngayTuanNay], n(T2), 8)
    expect(v[6]!.duNo).toBe(true) // Tuần trước
    expect(v[6]!.daGhi).toBe(5)
    expect(v[7]!.duNo).toBe(false) // Tuần này
    expect(v[7]!.daGhi).toBe(2)
  })
})

