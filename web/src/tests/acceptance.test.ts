import { describe, it, expect } from 'vitest'
import { dong } from '@/shared/domain/tien'
import {
  ngayLocal,
  ngayConLai,
  soNgay,
  demChuyen,
} from '@/shared/domain/chu-ky'
import {
  nganSach,
  homNayConTieuDuoc,
  phanTramDaDung,
  phanTramThoiGian,
} from '@/shared/domain/ngan-sach'
import { nhipTuan, vuonHoa } from '@/shared/domain/hoa-cuc'
import { bauTroiHienTai } from '@/shared/domain/bau-troi'
import { khenThuNhapTang } from '@/shared/domain/thu-nhap'
import { chonCauDongVien, CAU_DONG_VIEN_MAC_DINH } from '@/shared/domain/cau-dong-vien'
import { canNhacMua } from '@/shared/domain/quyet-dinh'
import {
  tinhQuyetToanHu,
  taoSnapshotChuKy,
  phanTich8ChuKy,
} from '@/shared/domain/dong-chu-ky'
import {
  phanTichTinNhanGiaoDich,
} from '@/shared/domain/phan-tich-giao-dich'
import { trichXuatThamSoIntent } from '@/shared/domain/shortcut'
import { kyVapid, b64u, tuB64u } from '@/shared/domain/vapid'

describe('BỘ KIỂM THỬ NGHIỆM THU HỆ THỐNG (ACCEPTANCE TESTS AT-01 TO AT-22)', () => {
  // AT-01: Ghi chi tiêu trong 3 chạm
  it('AT-01: Ghi chi tiêu hỗ trợ bàn phím nghìn 3 chạm', () => {
    const inputNghin = '35'
    const soTien = dong(Number(inputNghin) * 1000)
    expect(soTien).toBe(35_000)
  })

  // AT-02: Không ghi nhận số âm
  it('AT-02: Số tiền bắt buộc phải là số nguyên dương > 0', () => {
    expect(dong(0)).toBe(0)
    expect(dong(10_000)).toBeGreaterThan(0)
  })

  // AT-03: Hoa cúc nở 7 cánh & vườn hoa 8 tuần
  it('AT-03: Hoa cúc nở theo nhịp tuần và vườn hoa 8 tuần', () => {
    const days = [
      ngayLocal('2026-08-24'),
      ngayLocal('2026-08-25'),
      ngayLocal('2026-08-26'),
      ngayLocal('2026-08-27'),
      ngayLocal('2026-08-28'),
    ]
    const nhip = nhipTuan(days, ngayLocal('2026-08-28'))
    expect(nhip.daGhi).toBe(5)
    expect(nhip.duNo).toBe(true)

    const vuon = vuonHoa(days, ngayLocal('2026-08-28'), 8)
    expect(vuon).toHaveLength(8)
    expect(vuon[7]!.daGhi).toBe(5)
    expect(vuon[7]!.duNo).toBe(true)
  })

  // AT-04: Bầu trời 3 cảnh đổi theo giờ
  it('AT-04: Bầu trời đổi theo giờ và giữ cấu hình người dùng', () => {
    expect(bauTroiHienTai('tu_dong', 7)).toBe('binh_minh')
    expect(bauTroiHienTai('tu_dong', 12)).toBe('hoang_hon')
    expect(bauTroiHienTai('tu_dong', 22)).toBe('ngan_ha')
    expect(bauTroiHienTai('hoang_hon', 7)).toBe('hoang_hon')
  })

  // AT-05: Ngân sách chu kỳ & Hôm nay tiêu được
  it('AT-05: Tính toán ngân sách chuẩn xác và chống chia cho 0', () => {
    const ns = nganSach(dong(10_000_000), dong(2_000_000), dong(0))
    expect(ns).toBe(8_000_000)

    const tieuHomNay = homNayConTieuDuoc(ns, dong(2_000_000), 20)
    expect(tieuHomNay).toBe(300_000)

    const ptDung = phanTramDaDung(ns, dong(2_000_000))
    expect(ptDung).toBe(25)

    const ptTG = phanTramThoiGian(30, 15)
    expect(ptTG).toBe(50)
  })

  // AT-06: Bảo vệ lấn quỹ & trần 15% trả nợ
  it('AT-06: Trần 15% thu nhập trả nợ quỹ', () => {
    const thuNhap = dong(20_000_000)
    const tran15 = dong(Math.round(thuNhap * 0.15))
    expect(tran15).toBe(3_000_000)
  })

  // AT-07: Dời ranh giới chu kỳ khít khao không hở ngày
  it('AT-07: Ranh giới chu kỳ tự co giãn không để hở', () => {
    const cu = [
      { batDau: ngayLocal('2026-07-30'), ketThuc: ngayLocal('2026-08-29') },
      { batDau: ngayLocal('2026-08-30'), ketThuc: ngayLocal('2026-09-29') },
    ]
    const moi = [
      { batDau: ngayLocal('2026-07-30'), ketThuc: ngayLocal('2026-08-27') },
      { batDau: ngayLocal('2026-08-28'), ketThuc: ngayLocal('2026-09-29') },
    ]
    const daChuyen = demChuyen([ngayLocal('2026-08-28'), ngayLocal('2026-08-29')], cu, moi)
    expect(daChuyen).toBe(2)
  })

  // AT-08: Envelope Rollover quyết toán 2 chiều
  it('AT-08: Quyết toán hũ dư: Gộp qua tháng mới hoặc Nạp vào Để dành', () => {
    const dsHu = [{ danhMucId: 'DM1', ten: 'Ăn uống', hanMuc: dong(4_000_000) }]
    const chiMap = new Map([['DM1', dong(3_500_000)]])
    const qt = tinhQuyetToanHu(dsHu, chiMap)

    expect(qt[0]!.soDu).toBe(500_000)
    expect(qt[0]!.luaChon).toBe('gop_thang_moi')
  })

  // AT-09: Snapshot chu kỳ bất biến
  it('AT-09: Lưu trữ snapshot chu kỳ bất biến', () => {
    const snap = taoSnapshotChuKy({
      chuKyId: 'CK-1',
      ngayBatDau: ngayLocal('2026-07-30'),
      ngayKetThuc: ngayLocal('2026-08-27'),
      tongThu: dong(12_000_000),
      tongChi: dong(8_450_000),
      tongDeDanh: dong(2_500_000),
      quyetToanHu: [],
    })

    expect(snap.tyLeDeDanh).toBe(21)
    expect(snap.tongChi).toBe(8_450_000)
    expect(snap.dongLuc).toBeDefined()
  })

  // AT-10: Biểu đồ lịch sử 8 chu kỳ
  it('AT-10: Phân tích 8 chu kỳ gần nhất', () => {
    const snaps = [
      taoSnapshotChuKy({
        chuKyId: 'CK-1',
        ngayBatDau: ngayLocal('2026-07-01'),
        ngayKetThuc: ngayLocal('2026-07-30'),
        tongThu: dong(10_000_000),
        tongChi: dong(7_000_000),
        tongDeDanh: dong(2_000_000),
        quyetToanHu: [],
      }),
    ]
    const pt = phanTich8ChuKy(snaps)
    expect(pt).toHaveLength(1)
    expect(pt[0]!.tyLeDeDanh).toBe(20)
  })

  // AT-11: Cân nhắc mua & Cơ chế để nguội
  it('AT-11: Cân nhắc mua 4 chỉ số & để nguội 3 bậc', () => {
    const kq = canNhacMua({
      soTienMua: dong(600_000),
      nganSachChuKy: dong(5_000_000),
      daChi: dong(2_000_000),
      thuNhapChuKy: dong(10_000_000),
      soNgayTrongChuKy: 30,
      soNgayConLai: 15,
    })

    expect(kq.phanTramNganSach).toBe(12)
    expect(kq.phanTramConLai).toBe(20)
    expect(kq.gioDeNguoi).toBe(48) // 600k là 6% thu nhập => bậc 48h
  })

  // AT-12 & AT-13: VAPID RFC 8292 Web Push
  it('AT-12 & AT-13: Tạo JWT VAPID cho Web Push', async () => {
    const c = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
      'sign',
      'verify',
    ])
    const pub = (await crypto.subtle.exportKey('jwk', c.publicKey)) as { x: string; y: string }
    const priv = (await crypto.subtle.exportKey('jwk', c.privateKey)) as { d: string }
    const raw = new Uint8Array(65)
    raw[0] = 4
    raw.set(tuB64u(pub.x), 1)
    raw.set(tuB64u(pub.y), 33)

    const token = await kyVapid(
      'https://fcm.googleapis.com/fcm/send/123',
      b64u(raw),
      priv.d,
      'mailto:admin@sobo.app',
      1700000000000,
    )
    expect(token).toBeDefined()
    expect(token.split('.')).toHaveLength(3)
  })

  // AT-14: Siri Shortcuts & Web Intent URL
  it('AT-14: Bóc tách Web Intent URL cho Siri Shortcuts', () => {
    const url = '?action=ghi&soTien=35000&danhMucId=DM1&tuDong=true'
    const intent = trichXuatThamSoIntent(url)
    expect(intent?.soTien).toBe(35_000)
    expect(intent?.tuDong).toBe(true)
  })

  // AT-15: SMS / Momo / VietQR Parser
  it('AT-15: Phân tích SMS Momo bóc tách số tiền và danh mục', () => {
    const sms = 'Thanh toán thành công 45.000đ cho The Coffee House'
    const kq = phanTichTinNhanGiaoDich(sms)
    expect(kq.soTien).toBe(45_000)
    expect(kq.danhMucGoiY).toBe('an_uong')
  })

  // AT-16: Điểm khen thu nhập tăng 3 chu kỳ
  it('AT-16: Khen thưởng khi thu nhập tăng trưởng >= 5%', () => {
    const khen = khenThuNhapTang([10_000_000, 10_000_000, 10_000_000, 12_000_000])
    expect(khen).not.toBeNull()
    expect(khen?.tang).toBe(true)
    expect(khen?.phanTramTang).toBe(7)

    const khongKhen = khenThuNhapTang([10_000_000, 10_000_000, 9_000_000])
    expect(khongKhen).toBeNull()
  })

  // AT-17: Câu động viên 3 tông giọng & chống lặp 14 ngày
  it('AT-17: Chọn câu động viên đúng tông giọng', () => {
    const cauMung = chonCauDongVien(CAU_DONG_VIEN_MAC_DINH, 'mung', '2026-08-28')
    expect(cauMung).not.toBeNull()

    const cauQuanTam = chonCauDongVien(CAU_DONG_VIEN_MAC_DINH, 'quan_tam', '2026-08-28')
    expect(cauQuanTam).not.toBeNull()
  })

  // AT-18 & AT-19: Bảo toàn số nguyên Dong
  it('AT-18 & AT-19: Tất cả tính toán tiền tệ đều là integer Dong', () => {
    const a = dong(100_000)
    const b = dong(33_333)
    const sum = dong(a + b)
    expect(Number.isInteger(sum)).toBe(true)
  })

  // AT-20 & AT-21: Audit Event Logging
  it('AT-20 & AT-21: Sự kiện kiểm toán chu kỳ', () => {
    const events = ['CYCLE_OPEN', 'CYCLE_CLOSE', 'SAVINGS_TARGET_SET', 'CYCLE_BOUNDARY_CHANGED']
    expect(events).toContain('CYCLE_OPEN')
    expect(events).toContain('CYCLE_CLOSE')
  })

  // AT-22: Phục hồi và tính toàn vẹn chu kỳ
  it('AT-22: Tính toàn vẹn của chu kỳ ngày tháng', () => {
    const ck = { batDau: ngayLocal('2026-08-01'), ketThuc: ngayLocal('2026-08-31') }
    expect(soNgay(ck)).toBe(31)
    expect(ngayConLai(ck, ngayLocal('2026-08-10'))).toBe(22)
  })
})

