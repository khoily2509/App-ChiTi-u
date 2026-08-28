import { describe, it, expect } from 'vitest'
import {
  type NgayLocal,
  ngayLocal,
  ngayLocalTuThoiDiem,
  homNay,
  themNgay,
  soNgayGiua,
  dinhDangNgay,
  ngayLamViecCuoiThang,
  dayChuKy,
  soNgay,
  timChuKy,
  demChuyen,
  ngayConLai,
  coLaiTruoc,
} from './chu-ky'

const n = (s: string) => ngayLocal(s)

describe('ngayLocal() — cổng duy nhất tạo ngày lịch', () => {
  it('nhận đúng dạng YYYY-MM-DD', () => {
    expect(ngayLocal('2026-08-31')).toBe('2026-08-31')
  })

  it('từ chối sai định dạng', () => {
    expect(() => ngayLocal('31/08/2026')).toThrow(/YYYY-MM-DD/)
    expect(() => ngayLocal('2026-8-31')).toThrow(/YYYY-MM-DD/)
  })

  it('từ chối ngày không tồn tại thay vì âm thầm dịch sang tháng sau', () => {
    expect(() => ngayLocal('2026-02-31')).toThrow(/không tồn tại/)
    expect(() => ngayLocal('2026-13-01')).toThrow(/không tồn tại/)
  })

  it('gán string thường vào NgayLocal là LỖI BIÊN DỊCH', () => {
    // @ts-expect-error — nếu branded type hỏng, dòng này hết lỗi ⇒ tsc báo
    // "Unused '@ts-expect-error'" ⇒ typecheck fail.
    const sai: NgayLocal = '2026-08-31'
    expect(sai).toBe('2026-08-31')
  })
})

describe('ngayLocalTuThoiDiem() — "bug kinh điển" của §14 quy ước 2', () => {
  it('23:30 giờ VN vẫn thuộc chính ngày đó (AT-01)', () => {
    expect(ngayLocalTuThoiDiem('2026-08-28T23:30:00+07:00')).toBe('2026-08-28')
  })

  it('00:30 giờ VN KHÔNG bị kéo về ngày hôm trước', () => {
    // Đây mới là chiều thật sự sai: 00:30 ngày 29 giờ VN có mốc UTC là 17:30
    // ngày 28. Đọc thẳng phần ngày của UTC sẽ gán nhầm về chu kỳ trước.
    expect(new Date('2026-08-29T00:30:00+07:00').toISOString()).toBe('2026-08-28T17:30:00.000Z')
    expect(ngayLocalTuThoiDiem('2026-08-29T00:30:00+07:00')).toBe('2026-08-29')
  })

  it('nhận cả mốc ghi bằng UTC', () => {
    expect(ngayLocalTuThoiDiem('2026-08-28T17:30:00Z')).toBe('2026-08-29')
    expect(ngayLocalTuThoiDiem('2026-08-28T16:30:00Z')).toBe('2026-08-28')
  })

  it('từ chối mốc không hợp lệ', () => {
    expect(() => ngayLocalTuThoiDiem('hôm qua')).toThrow(/không hợp lệ/)
  })
})

describe('homNay() — luôn theo giờ Việt Nam, bất kể máy đang ở múi giờ nào', () => {
  it('cùng một mốc cho ra cùng một ngày dù mốc ghi bằng múi giờ nào', () => {
    const moc = '2026-08-28T17:30:00Z' // = 00:30 ngày 29 giờ VN
    expect(homNay(new Date(moc))).toBe('2026-08-29')
    expect(homNay(new Date('2026-08-29T00:30:00+07:00'))).toBe('2026-08-29')
    expect(homNay(new Date('2026-08-28T13:30:00-04:00'))).toBe('2026-08-29')
  })

  it('nửa đêm giờ VN là chỗ ngày chuyển, không phải nửa đêm UTC', () => {
    expect(homNay(new Date('2026-08-28T16:59:59Z'))).toBe('2026-08-28') // 23:59:59 VN
    expect(homNay(new Date('2026-08-28T17:00:00Z'))).toBe('2026-08-29') // 00:00:00 VN
  })

  it('không tham số thì trả ngày hợp lệ', () => {
    expect(() => ngayLocal(homNay())).not.toThrow()
  })
})

describe('Không hàm domain nào được đọc giờ theo múi giờ máy', () => {
  it('không dùng getFullYear/getMonth/getDate/toLocale* trong shared/domain', async () => {
    const { readdirSync, readFileSync } = await import('node:fs')
    const thuMuc = new URL('.', import.meta.url)
    // Nhóm hàm này đọc theo múi giờ thiết bị. Bản UTC (getUTCDate...) thì an toàn,
    // nên mẫu dưới cố ý không khớp chúng.
    //
    // toLocale* bị cấm rộng hơn mức cần cho múi giờ, và đó là chủ đích: nó bắt
    // luôn việc tự định dạng tiền tại chỗ thay vì gọi dinhDang() của tien.ts —
    // hai nơi định dạng thì sớm muộn cũng ra hai kiểu khác nhau. tien.ts dùng
    // Intl.NumberFormat nên không vướng mẫu này.
    const cam = /\.(getFullYear|getMonth|getDate|getDay|getHours)\(|toLocale\w*\(/

    // Bỏ comment trước khi quét: chính dòng tài liệu "không được dùng .getDate()"
    // cũng chứa mẫu bị cấm, quét thô sẽ báo nhầm file đang làm đúng.
    const boComment = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

    const viPham: string[] = []
    for (const f of readdirSync(thuMuc)) {
      if (!f.endsWith('.ts') || f.endsWith('.test.ts')) continue
      const noiDung = boComment(readFileSync(new URL(f, thuMuc), 'utf8'))
      if (cam.test(noiDung)) viPham.push(f)
    }
    expect(viPham).toEqual([])
  })
})

describe('Toán ngày', () => {
  it('themNgay() vượt qua ranh giới tháng và năm', () => {
    expect(themNgay(n('2026-08-31'), 1)).toBe('2026-09-01')
    expect(themNgay(n('2026-09-01'), -1)).toBe('2026-08-31')
    expect(themNgay(n('2026-12-31'), 1)).toBe('2027-01-01')
  })

  it('themNgay() đúng với năm nhuận', () => {
    expect(themNgay(n('2028-02-28'), 1)).toBe('2028-02-29')
    expect(themNgay(n('2026-02-28'), 1)).toBe('2026-03-01')
  })

  it('soNgayGiua() tính cả hai đầu', () => {
    expect(soNgayGiua(n('2026-08-31'), n('2026-08-31'))).toBe(1)
    expect(soNgayGiua(n('2026-08-31'), n('2026-09-29'))).toBe(30)
  })
})

describe('dinhDangNgay() — ngày để bồ đọc, không phải cho máy', () => {
  it('đổi sang dạng ngày/tháng/năm', () => {
    expect(dinhDangNgay(n('2026-08-20'))).toBe('20/08/2026')
    expect(dinhDangNgay(n('2026-01-05'))).toBe('05/01/2026')
  })

  it('kèm thứ khi cần', () => {
    expect(dinhDangNgay(n('2026-08-20'), true)).toBe('T5 20/08/2026')
    expect(dinhDangNgay(n('2026-08-23'), true)).toBe('CN 23/08/2026')
  })

  // §14 quy ước 2: một format duy nhất, năm không bao giờ bị bỏ. Ngày đáo hạn
  // sổ tiết kiệm (§7.10) cách ngày gửi tới 36 tháng — thiếu năm là đọc sai.
  it('luôn có năm, kể cả khi hai ngày cách nhau nhiều năm', () => {
    expect(dinhDangNgay(n('2026-03-15'))).toBe('15/03/2026')
    expect(dinhDangNgay(n('2029-03-15'))).toBe('15/03/2029')
  })
})

describe('ngayLamViecCuoiThang() — §7.2', () => {
  it('cuối tháng là ngày thường thì giữ nguyên', () => {
    expect(ngayLamViecCuoiThang(2026, 8)).toBe('2026-08-31') // 31/08 là Thứ Hai
    expect(ngayLamViecCuoiThang(2026, 9)).toBe('2026-09-30') // 30/09 là Thứ Tư
  })

  it('cuối tháng rơi Thứ Bảy thì lùi 1 ngày', () => {
    expect(ngayLamViecCuoiThang(2026, 10)).toBe('2026-10-30') // 31/10 là Thứ Bảy
  })

  it('cuối tháng rơi Chủ Nhật thì lùi 2 ngày', () => {
    expect(ngayLamViecCuoiThang(2027, 1)).toBe('2027-01-29') // 31/01 là Chủ Nhật
    expect(ngayLamViecCuoiThang(2026, 5)).toBe('2026-05-29') // 31/05 là Chủ Nhật
  })

  it('đúng với tháng 2 và năm nhuận', () => {
    expect(ngayLamViecCuoiThang(2027, 2)).toBe('2027-02-26') // 28/02 là Chủ Nhật
    expect(ngayLamViecCuoiThang(2028, 2)).toBe('2028-02-29') // 29/02 là Thứ Ba
  })

  it('kết quả luôn rơi vào Thứ Hai đến Thứ Sáu', () => {
    for (let thang = 1; thang <= 12; thang++) {
      for (const nam of [2026, 2027, 2028]) {
        const thu = new Date(`${ngayLamViecCuoiThang(nam, thang)}T00:00:00Z`).getUTCDay()
        expect(thu).toBeGreaterThanOrEqual(1)
        expect(thu).toBeLessThanOrEqual(5)
      }
    }
  })
})

describe('dayChuKy() — ranh giới không chồng lấn, không hở (§7.2 rule 1)', () => {
  const luong = [n('2026-07-31'), n('2026-08-31'), n('2026-09-30'), n('2026-10-30')]
  const cks = dayChuKy(luong)

  it('n ngày lương cho ra n−1 chu kỳ đóng', () => {
    expect(cks).toHaveLength(3)
  })

  it('chu kỳ N+1 bắt đầu đúng một ngày sau khi chu kỳ N kết thúc', () => {
    for (let i = 0; i < cks.length - 1; i++) {
      expect(cks[i + 1]!.batDau).toBe(themNgay(cks[i]!.ketThuc, 1))
    }
  })

  it('độ dài nằm trong khoảng 28–34 ngày như §7.2 nói', () => {
    expect(cks.map(soNgay)).toEqual([31, 30, 30])
    for (const ck of cks) {
      expect(soNgay(ck)).toBeGreaterThanOrEqual(28)
      expect(soNgay(ck)).toBeLessThanOrEqual(34)
    }
  })

  it('từ chối ngày lương không tăng dần', () => {
    expect(() => dayChuKy([n('2026-08-31'), n('2026-07-31')])).toThrow(/tăng dần/)
    expect(() => dayChuKy([n('2026-08-31'), n('2026-08-31')])).toThrow(/tăng dần/)
  })
})

describe('timChuKy() — giao dịch trôi nổi phải lộ ra, không được im lặng', () => {
  const cks = dayChuKy([n('2026-07-31'), n('2026-08-31'), n('2026-09-30')])

  it('tìm đúng chu kỳ chứa ngày, kể cả hai ngày biên', () => {
    expect(timChuKy(cks, n('2026-07-31'))?.batDau).toBe('2026-07-31')
    expect(timChuKy(cks, n('2026-08-30'))?.batDau).toBe('2026-07-31')
    expect(timChuKy(cks, n('2026-08-31'))?.batDau).toBe('2026-08-31')
  })

  it('trả null cho ngày ngoài mọi chu kỳ (§7.2 rule 2)', () => {
    expect(timChuKy(cks, n('2026-07-30'))).toBeNull()
    expect(timChuKy(cks, n('2026-09-30'))).toBeNull()
  })
})

describe('demChuyen() — AT-05, đổi ranh giới thì gán lại giao dịch', () => {
  // Lương về sớm 3 ngày: 31/08 → 28/08. Chu kỳ trước co lại, giao dịch ngày
  // 28, 29, 30/08 chuyển sang chu kỳ mới.
  const cu = dayChuKy([n('2026-07-31'), n('2026-08-31'), n('2026-09-30')])
  const moi = dayChuKy([n('2026-07-31'), n('2026-08-28'), n('2026-09-30')])
  const giaoDich = [
    n('2026-08-05'),
    n('2026-08-27'),
    n('2026-08-28'),
    n('2026-08-29'),
    n('2026-08-30'),
    n('2026-09-10'),
  ]

  it('đếm đúng số giao dịch phải chuyển', () => {
    expect(demChuyen(giaoDich, cu, moi)).toBe(3)
  })

  it('sửa ngược lại thì chuyển ngược đúng bấy nhiêu (bước "chạy lại lần 2")', () => {
    expect(demChuyen(giaoDich, moi, cu)).toBe(3)
  })

  it('không đổi ranh giới thì không giao dịch nào chuyển', () => {
    expect(demChuyen(giaoDich, cu, cu)).toBe(0)
  })

  it('chu kỳ trước co lại đúng 3 ngày', () => {
    expect(soNgay(cu[0]!)).toBe(31)
    expect(soNgay(moi[0]!)).toBe(28)
  })
})

describe('ngayConLai() — mẫu số của "hôm nay còn tiêu được"', () => {
  const ck = dayChuKy([n('2026-07-31'), n('2026-08-31')])[0]!

  it('tính cả hôm nay', () => {
    expect(ngayConLai(ck, n('2026-08-30'))).toBe(1)
    expect(ngayConLai(ck, n('2026-08-19'))).toBe(12)
    expect(ngayConLai(ck, n('2026-07-31'))).toBe(31)
  })

  it('trả 0 khi chu kỳ đã qua, không trả số âm (§7.8)', () => {
    expect(ngayConLai(ck, n('2026-08-31'))).toBe(0)
    expect(ngayConLai(ck, n('2026-12-01'))).toBe(0)
  })

  it('hôm nay trước cả chu kỳ thì tính trọn chu kỳ', () => {
    expect(ngayConLai(ck, n('2026-07-01'))).toBe(31)
  })
})

describe('coLaiTruoc() — sửa cái CO LẠI trước, không thì ràng buộc chặn', () => {
  const n = (x: string) => ngayLocal(x)

  it('lương TRỄ ⇒ chu kỳ này co lại ⇒ sửa "này" trước', () => {
    // trước [30/06→30/07] này [31/07→30/08], dời sang 01/08
    // nong "trước" ra tới 31/07 khi "này" còn bắt đầu 31/07 ⇒ chạm nhau ⇒ hỏng
    expect(coLaiTruoc(n('2026-07-31'), n('2026-08-01'))).toBe('nay')
  })

  it('lương SỚM ⇒ chu kỳ trước co lại ⇒ sửa "trước" trước', () => {
    // nong "này" ra tới 30/07 khi "trước" còn kết thúc 30/07 ⇒ chạm nhau ⇒ hỏng
    expect(coLaiTruoc(n('2026-07-31'), n('2026-07-30'))).toBe('truoc')
  })

  it('dời xa nhiều ngày vẫn cùng một quy tắc', () => {
    expect(coLaiTruoc(n('2026-07-31'), n('2026-08-05'))).toBe('nay')
    expect(coLaiTruoc(n('2026-07-31'), n('2026-07-25'))).toBe('truoc')
  })

  it('không đổi gì thì chọn nhánh nào cũng an toàn — cứ trả "truoc" cho xác định', () => {
    // Ca này không xảy ra qua UI (nút chỉ hiện khi có thay đổi), nhưng hàm vẫn
    // phải trả một giá trị xác định thay vì tuỳ hứng.
    expect(coLaiTruoc(n('2026-07-31'), n('2026-07-31'))).toBe('truoc')
  })
})
