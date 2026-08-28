import { sb, bocLoi, type Dong } from './supabase'
import {
  type SnapshotChuKy,
  type QuyetToanHu,
  taoSnapshotChuKy,
} from '@/shared/domain/dong-chu-ky'
import { type NgayLocal, themNgay, ngayLamViecCuoiThang } from '@/shared/domain/chu-ky'
import type { Dong as Tien } from '@/shared/domain/tien'

export type DongChuKyDb = Dong<'chu_ky'>

export async function dongVaMoChuKyMoi({
  userId,
  chuKyCuId,
  ngayLuongMoi,
  tongThu,
  tongChi,
  tongDeDanh,
  quyetToanHu,
  quyIdDeDanh,
}: {
  userId: string
  chuKyCuId: string
  ngayLuongMoi: NgayLocal
  tongThu: Tien
  tongChi: Tien
  tongDeDanh: Tien
  quyetToanHu: QuyetToanHu[]
  quyIdDeDanh?: string | null
}): Promise<{ chuKyMoiId: string; daDongId: string }> {
  // 1. Tạo snapshot cho chu kỳ cũ
  const snapshot = taoSnapshotChuKy({
    chuKyId: chuKyCuId,
    ngayBatDau: themNgay(ngayLuongMoi, -30), // Ranh giới cũ
    ngayKetThuc: themNgay(ngayLuongMoi, -1),
    tongThu,
    tongChi,
    tongDeDanh,
    quyetToanHu,
  })

  // Đóng chu kỳ cũ và lưu snapshot bất biến
  bocLoi(
    await sb
      .from('chu_ky')
      .update({
        trang_thai: 'da_dong',
        ngay_ket_thuc: themNgay(ngayLuongMoi, -1),
        snapshot_json: JSON.parse(JSON.stringify(snapshot)),
      })
      .eq('id', chuKyCuId)
      .select()
      .single(),
    'Đóng chu kỳ cũ',
  )

  await sb.from('su_kien').insert({
    user_id: userId,
    ma: 'CYCLE_CLOSE',
    doi_tuong: chuKyCuId,
    du_lieu: { snapshot },
  })

  // 2. Xử lý các khoản dư chuyển vào để dành (Quỹ)
  for (const h of quyetToanHu) {
    if (h.luaChon === 'de_danh' && h.soDu > 0 && quyIdDeDanh) {
      await sb.from('bien_dong_quy').insert({
        user_id: userId,
        quy_id: quyIdDeDanh,
        chu_ky_id: chuKyCuId,
        loai: 'gop',
        ngay_local: ngayLuongMoi,
        so_tien: h.soDu,
        ghi_chu: `Quyết toán dư từ hũ ${h.tenDanhMuc}`,
      })
    }
  }

  // 3. Mở chu kỳ mới
  const [nam, thang] = ngayLuongMoi.split('-').map(Number) as [number, number]
  const thangToi = thang === 12 ? 1 : thang + 1
  const namToi = thang === 12 ? nam + 1 : nam
  const ngayKetThucDuKien = themNgay(ngayLamViecCuoiThang(namToi, thangToi), -1)

  const ckMoi = bocLoi(
    await sb
      .from('chu_ky')
      .insert({
        user_id: userId,
        ngay_bat_dau_du_kien: ngayLuongMoi,
        ngay_bat_dau_thuc_te: ngayLuongMoi,
        ngay_ket_thuc: ngayKetThucDuKien,
        trang_thai: 'dang_chay',
        so_tien_de_danh_dinh_muc: tongDeDanh,
      })
      .select()
      .single(),
    'Mở chu kỳ mới',
  )

  await sb.from('su_kien').insert({
    user_id: userId,
    ma: 'CYCLE_OPEN',
    doi_tuong: ckMoi.id,
    du_lieu: { ngay_bat_dau: ngayLuongMoi },
  })

  // 4. Sao chép và gộp hạn mức hũ sang chu kỳ mới
  for (const h of quyetToanHu) {
    const hanMucMoi = h.luaChon === 'gop_thang_moi' ? h.hanMuc + h.soDu : h.hanMuc
    if (hanMucMoi > 0) {
      await sb.from('han_muc').insert({
        user_id: userId,
        chu_ky_id: ckMoi.id,
        danh_muc_id: h.danhMucId,
        so_tien: hanMucMoi,
      })
    }
  }

  return { chuKyMoiId: ckMoi.id, daDongId: chuKyCuId }
}

export async function danhSachLichSuChuKy(userId: string): Promise<SnapshotChuKy[]> {
  const ds = bocLoi(
    await sb
      .from('chu_ky')
      .select('*')
      .eq('user_id', userId)
      .eq('trang_thai', 'da_dong')
      .order('ngay_bat_dau_thuc_te', { ascending: true }),
    'Đọc lịch sử chu kỳ',
  )

  const ketQua: SnapshotChuKy[] = []
  for (const d of ds) {
    if (d.snapshot_json && typeof d.snapshot_json === 'object') {
      ketQua.push(d.snapshot_json as unknown as SnapshotChuKy)
    }
  }

  return ketQua
}
