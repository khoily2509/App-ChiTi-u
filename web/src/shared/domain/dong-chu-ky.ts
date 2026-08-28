/**
 * ĐÓNG CHU KỲ & QUYẾT TOÁN HŨ (ENVELOPE ROLLOVER) (§7.6, §7.7 · Pha 7).
 *
 * Nghi thức chuyển giao chu kỳ:
 * 1. Thống kê chu kỳ cũ: Tổng thực nhận, Tổng chi, Đã để dành, Tỷ lệ để dành.
 * 2. Tính số dư từng hũ: Hũ có số dư > 0 được phân loại quyết toán:
 *    - 'de_danh': Chuyển nạp vào Quỹ/Mục tiêu
 *    - 'gop_thang_moi': Mang số dư sang cộng dồn vào hạn mức tháng mới
 *    - 'giu_nguyen': Không đổi
 * 3. Tạo snapshot bất biến (snapshot_json) lưu trữ vĩnh viễn.
 * 4. Phân tích lịch sử 8 chu kỳ (Thu, Chi, Tỷ lệ để dành).
 */

import { type Dong as Tien, dong } from './tien'
import type { NgayLocal } from './chu-ky'

export type LuaChonQuyetToan = 'de_danh' | 'gop_thang_moi' | 'giu_nguyen'

export type QuyetToanHu = {
  danhMucId: string
  tenDanhMuc: string
  hanMuc: Tien
  daChi: Tien
  soDu: Tien
  luaChon: LuaChonQuyetToan
}

export type SnapshotChuKy = {
  chuKyId: string
  ngayBatDau: NgayLocal
  ngayKetThuc: NgayLocal
  tongThu: Tien
  tongChi: Tien
  tongDeDanh: Tien
  tyLeDeDanh: number
  quyetToanHu: QuyetToanHu[]
  dongLuc: string // ISO timestamp
}

export type Item8ChuKy = {
  chuKyId: string
  nhan: string // VD: "T7", "T8", "Tháng 8"
  batDau: NgayLocal
  ketThuc: NgayLocal
  thuNhap: Tien
  chiTieu: Tien
  deDanh: Tien
  tyLeDeDanh: number
}

export function tinhQuyetToanHu(
  dsHu: readonly { danhMucId: string; ten: string; hanMuc: Tien }[],
  chiTheoDanhMuc: ReadonlyMap<string, Tien>,
): QuyetToanHu[] {
  return dsHu.map((h) => {
    const daChi = chiTheoDanhMuc.get(h.danhMucId) ?? dong(0)
    const soDu = dong(Math.max(0, h.hanMuc - daChi))
    return {
      danhMucId: h.danhMucId,
      tenDanhMuc: h.ten,
      hanMuc: h.hanMuc,
      daChi,
      soDu,
      luaChon: 'gop_thang_moi', // Mặc định gộp sang tháng mới
    }
  })
}

export function taoSnapshotChuKy(p: {
  chuKyId: string
  ngayBatDau: NgayLocal
  ngayKetThuc: NgayLocal
  tongThu: Tien
  tongChi: Tien
  tongDeDanh: Tien
  quyetToanHu: QuyetToanHu[]
}): SnapshotChuKy {
  const { chuKyId, ngayBatDau, ngayKetThuc, tongThu, tongChi, tongDeDanh, quyetToanHu } = p
  const tyLe = tongThu > 0 ? Math.round((tongDeDanh / tongThu) * 100) : 0

  return {
    chuKyId,
    ngayBatDau,
    ngayKetThuc,
    tongThu,
    tongChi,
    tongDeDanh,
    tyLeDeDanh: tyLe,
    quyetToanHu,
    dongLuc: new Date().toISOString(),
  }
}

export function phanTich8ChuKy(dsSnapshot: readonly SnapshotChuKy[]): Item8ChuKy[] {
  // Lấy tối đa 8 chu kỳ gần nhất
  const ganNhat = dsSnapshot.slice(-8)

  return ganNhat.map((s, i) => {
    const thang = s.ngayBatDau.split('-')[1] ?? ''
    return {
      chuKyId: s.chuKyId,
      nhan: `T${Number(thang) || i + 1}`,
      batDau: s.ngayBatDau,
      ketThuc: s.ngayKetThuc,
      thuNhap: s.tongThu,
      chiTieu: s.tongChi,
      deDanh: s.tongDeDanh,
      tyLeDeDanh: s.tyLeDeDanh,
    }
  })
}
