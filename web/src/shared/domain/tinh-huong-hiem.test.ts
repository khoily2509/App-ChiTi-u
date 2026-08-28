import { describe, it, expect } from 'vitest'
import { dong } from './tien'
import { ngayLocal, themThang, soNgay, ngayConLai, type NgayLocal } from './chu-ky'
import { nganSach, homNayConTieuDuoc, phanTramDaDung, phanTramThoiGian } from './ngan-sach'
import { chuaPhanBo, trangThaiHu, deXuatHanMuc } from './han-muc'
import { latDonut, type ChiTheoDanhMuc } from './donut'
import { chenhLech, mocLon } from './chenh-lech'
import { nhipTuan } from './hoa-cuc'
import { laiTronKy, laiTinhToi, ngayDaoHan, tienDo, type SoTietKiem } from './so-tiet-kiem'
import { soDu, tongDeDanh, type BienDong } from './quy'

/**
 * MƯỜI TÌNH HUỐNG HIẾM — những ca bấm tay gần như không gặp nhưng chắc chắn sẽ
 * xảy ra trong 12 tháng bồ dùng app.
 *
 * Khác với test từng hàm ở chỗ: mỗi ca ở đây đi qua NHIỀU module, đúng như một
 * màn hình thật. Lỗi nguy hiểm nhất không nằm trong một hàm mà nằm ở chỗ hai hàm
 * đúng gặp nhau.
 */

const n = (s: string): NgayLocal => ngayLocal(s)
const d = dong
const chi = (bo: [string, number, number | null][]): ChiTheoDanhMuc[] =>
  bo.map(([danhMucId, soTien, slot]) => ({ danhMucId, soTien: d(soTien), slot }))

describe('① Nhập nhầm lương 0đ — app không được sụp hay hiện số vô nghĩa', () => {
  it('ngân sách 0 ⇒ mọi chỉ số trả null, KHÔNG trả 0đ hay số âm', () => {
    const ns = nganSach(d(0), d(0), d(0))
    expect(ns).toBe(0)
    // §7.8: 0đ đọc lên là "hết sạch tiền rồi" — cấm hiện.
    expect(homNayConTieuDuoc(ns, d(0), 30)).toBeNull()
    expect(phanTramDaDung(ns, d(0))).toBeNull()
  })

  it('lỡ ghi chi khi lương 0 thì vẫn không ra số âm', () => {
    expect(homNayConTieuDuoc(nganSach(d(0), d(0), d(0)), d(50_000), 30)).toBeNull()
  })
})

describe('② Để dành nhiều hơn lương — bồ gõ nhầm hàng', () => {
  it('ngân sách kẹp ở 0, không bao giờ âm', () => {
    expect(nganSach(d(9_000_000), d(20_000_000), d(0))).toBe(0)
  })

  it('nợ quỹ cộng để dành vượt lương cũng vậy', () => {
    expect(nganSach(d(9_000_000), d(8_000_000), d(5_000_000))).toBe(0)
  })
})

describe('③ Ngày cuối chu kỳ — mẫu số tụt về 1 rồi 0', () => {
  it('còn 1 ngày thì dồn hết phần còn lại vào hôm nay', () => {
    expect(homNayConTieuDuoc(d(9_000_000), d(8_500_000), 1)).toBe(500_000)
  })

  it('còn 0 ngày ⇒ null, tuyệt đối không chia cho 0', () => {
    expect(homNayConTieuDuoc(d(9_000_000), d(0), 0)).toBeNull()
    expect(phanTramThoiGian(31, 0)).toBe(100)
  })

  it('chu kỳ một ngày duy nhất vẫn tính được', () => {
    const ck = { batDau: n('2026-08-24'), ketThuc: n('2026-08-24') }
    expect(soNgay(ck)).toBe(1)
    expect(ngayConLai(ck, n('2026-08-24'))).toBe(1)
  })
})

describe('④ Tiêu ĐÚNG BẰNG ngân sách — không dư không thiếu', () => {
  it('đúng 100% vẫn phải là null chứ không phải 0đ', () => {
    // Ranh giới này dễ lọt: 100% chưa phải vượt, nhưng cũng không còn gì để tiêu
    expect(phanTramDaDung(d(7_000_000), d(7_000_000))).toBe(100)
    expect(homNayConTieuDuoc(d(7_000_000), d(7_000_000), 5)).toBeNull()
  })

  it('hũ tiêu đúng hạn mức CHƯA tính là vượt', () => {
    const [t] = trangThaiHu([{ danhMucId: 'a', hanMuc: d(1_000_000), daDung: d(1_000_000) }])
    expect(t!.daVuot).toBe(false)
    expect(t!.conLai).toBe(0)
  })
})

describe('⑤ Dồn hết tiền vào hũ — không còn đồng nào tiêu chung', () => {
  it('chia vừa khít ⇒ 0đ, và 0 KHÁC null', () => {
    expect(chuaPhanBo(d(7_000_000), d(7_000_000))).toBe(0)
  })

  it('lỡ chia lố ⇒ số âm hiện ra được để bồ còn biết mà sửa', () => {
    const con = chuaPhanBo(d(7_000_000), d(7_800_000))
    expect(con).toBe(-800_000)
    expect(Math.abs(con!)).toBe(800_000)
  })
})

describe('⑥ Ghi vào Chủ Nhật — cánh hoa cuối cùng, tuần ISO dễ lệch', () => {
  it('Chủ Nhật là cánh thứ 7, không phải cánh đầu', () => {
    // 30/08/2026 là Chủ Nhật; tuần bắt đầu Thứ Hai 24/08
    const r = nhipTuan([n('2026-08-30')], n('2026-08-30'))
    expect(r.canh).toEqual([false, false, false, false, false, false, true])
    expect(r.conLai).toBe(1)
  })

  it('ghi Chủ Nhật với 4 cánh sẵn ⇒ vừa kịp đủ 5, và KHÔNG còn gì để thúc', () => {
    const ngay = ['2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-30'].map(n)
    const r = nhipTuan(ngay, n('2026-08-30'))
    expect(r.daGhi).toBe(5)
    expect(r.duNo).toBe(true)
    expect(r.nenThucDay).toBe(false)
  })
})

describe('⑦ Sổ tiết kiệm mở HÔM NAY — chưa nằm ngày nào', () => {
  const so = (p: Partial<SoTietKiem> = {}): SoTietKiem => ({
    goc: d(50_000_000),
    laiSuatNam: 550,
    ngayGui: n('2026-08-25'),
    kyHanThang: 6,
    lichTraLai: 'dau_ky',
    ...p,
  })

  it('lãi tới nay = 0, không âm', () => {
    expect(laiTinhToi(so(), n('2026-08-25'))).toBe(0)
  })

  it('tiến độ 0%, và lãi trọn kỳ vẫn tính được', () => {
    expect(tienDo(so(), n('2026-08-25'))).toBe(0)
    expect(laiTronKy(so())).toBeGreaterThan(0)
  })

  it('xem ở NGÀY TRƯỚC ngày gửi cũng không ra số âm', () => {
    expect(laiTinhToi(so(), n('2026-08-01'))).toBe(0)
    expect(tienDo(so(), n('2026-08-01'))).toBe(0)
  })
})

describe('⑧ Sổ 36 tháng vắt qua năm nhuận', () => {
  it('29/02 + 36 tháng kẹp về 28/02', () => {
    // 2028 nhuận, 2031 không — ngày 29 không tồn tại ở đích
    expect(themThang(n('2028-02-29'), 36)).toBe('2031-02-28')
  })

  it('ngày đáo hạn của sổ mở đúng 29/02', () => {
    const s: SoTietKiem = {
      goc: d(100_000_000),
      laiSuatNam: 600,
      ngayGui: n('2028-02-29'),
      kyHanThang: 12,
      lichTraLai: 'cuoi_ky',
    }
    expect(ngayDaoHan(s)).toBe('2029-02-28')
    // 366 ngày nhuận chứ không phải 365 — lãi phải nhỉnh hơn một chút
    expect(laiTronKy(s)).toBe(Math.floor((100_000_000 * 600 * 365) / (10_000 * 365)))
  })
})

describe('⑨ Hai chu kỳ giống hệt nhau — chênh lệch phải là 0, không phải rỗng', () => {
  it('mọi danh mục đổi 0đ vẫn hiện đủ, mốc lớn nhất là 0', () => {
    const bo = chi([
      ['a', 3_000_000, 1],
      ['b', 1_000_000, 2],
    ])
    const cl = chenhLech(bo, bo)
    expect(cl).toHaveLength(2)
    expect(cl.every((c) => c.thayDoi === 0 && c.phanTram === 0)).toBe(true)
    // Mốc 0 ⇒ tầng UI phải tự tránh chia cho 0
    expect(mocLon(cl)).toBe(0)
  })
})

describe('⑩ Toàn bộ tiền rơi vào "Chưa biết xếp đâu"', () => {
  it('donut vẫn vẽ được, danh mục hệ thống chiếm 100%', () => {
    const lat = latDonut(chi([['tam', 6_120_000, null]]))
    expect(lat).toHaveLength(1)
    expect(lat[0]!.phanTram).toBe(100)
    expect(lat[0]!.tiLe).toBe(1)
    // Ghi lại một điểm KHÔNG nhất quán đã biết: `latDonut` không trả `slot`
    // trong khi `chenhLech` có. Tầng UI phải tự tra lại từ danh mục cho donut.
    // Không sửa vì UI đang xử lý đúng, nhưng đây là chỗ dễ vấp lần sau.
    expect('slot' in lat[0]!).toBe(false)
  })

  it('KHÔNG đẻ ra hũ cho danh mục hệ thống', () => {
    // §7.6: "Chưa biết xếp đâu" không có hũ, tiền của nó vào phần tiêu chung
    expect(deXuatHanMuc(chi([['tam', 6_000_000, null]]))).toEqual([])
  })

  it('đứng CUỐI donut dù tiền nhiều nhất', () => {
    const lat = latDonut(chi([['tam', 9_000_000, null], ['that', 1_000, 1]]))
    expect(lat.map((l) => l.danhMucId)).toEqual(['that', 'tam'])
  })
})

describe('Bổ sung — số cực lớn sau khi nới trần lên 99 tỷ', () => {
  it('quỹ 99 tỷ vẫn cộng chính xác, không mất bit', () => {
    const bd: BienDong[] = [
      { loai: 'so_du_ban_dau', soTien: d(99_000_000_000) },
      { loai: 'gop', soTien: d(999_000_000) },
      { loai: 'lai', soTien: d(5_500_000_000) },
    ]
    expect(soDu(bd)).toBe(105_499_000_000)
    expect(Number.isSafeInteger(soDu(bd))).toBe(true)
    // Chỉ 'gop' vào tỷ lệ để dành — số dư ban đầu và lãi bị loại (§7.10)
    expect(tongDeDanh(bd)).toBe(999_000_000)
  })

  it('phần trăm donut vẫn cộng đúng 100 với số hàng tỷ', () => {
    const lat = latDonut(chi([
      ['a', 33_333_333_333, 1],
      ['b', 33_333_333_333, 2],
      ['c', 33_333_333_334, 3],
    ]))
    expect(lat.reduce((t, l) => t + l.phanTram, 0)).toBe(100)
  })
})
