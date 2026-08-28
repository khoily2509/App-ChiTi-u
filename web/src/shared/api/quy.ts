/**
 * Quỹ & sổ bút toán — §7.3. Cầu nối giữa logic thuần (shared/domain/quy.ts) và DB.
 *
 * Số dư KHÔNG BAO GIỜ lưu sẵn (§6.3 quy tắc vàng) — luôn tính bằng tổng bút toán.
 * Ràng buộc ở DB chặn tổng âm; tầng này chỉ đọc/ghi.
 */

import { sb, bocLoi, type Dong } from './supabase'
import type { SoTietKiem } from '@/shared/domain/so-tiet-kiem'
import { ngayLocal, type NgayLocal } from '@/shared/domain/chu-ky'
import { type Dong as Tien, dong } from '@/shared/domain/tien'
import { type BienDong, soDu, tongDeDanh } from '@/shared/domain/quy'
import { homNay } from '@/shared/domain/chu-ky'

export type QuyDb = Dong<'quy'>
export type BienDongDb = Dong<'bien_dong_quy'>

/** Quỹ kèm số dư đã tính. Số dư là dẫn xuất, không phải cột. */
export type QuyCoSoDu = QuyDb & {
  soDu: Tien
  /** Tổng đã để dành, KHÔNG tính số dư ban đầu — dùng cho tỷ lệ để dành (AT-11). */
  daDeDanh: Tien
}

export async function danhSachQuy(): Promise<QuyCoSoDu[]> {
  const quy = bocLoi(
    await sb.from('quy').select('*').eq('trang_thai', 'dang_chay').order('thu_tu'),
    'Đọc danh sách quỹ',
  )
  if (quy.length === 0) return []

  const bd = bocLoi(
    await sb.from('bien_dong_quy').select('quy_id, so_tien, loai'),
    'Đọc bút toán quỹ',
  )

  // Gom theo quỹ rồi giao cho tầng domain tính — công thức chỉ nằm một chỗ (§14 quy ước 3).
  const theoQuy = new Map<string, BienDong[]>()
  for (const b of bd) {
    const ds = theoQuy.get(b.quy_id) ?? []
    ds.push({ loai: b.loai as BienDong['loai'], soTien: dong(b.so_tien) })
    theoQuy.set(b.quy_id, ds)
  }

  return quy.map((q) => {
    const ds = theoQuy.get(q.id) ?? []
    return { ...q, soDu: soDu(ds), daDeDanh: tongDeDanh(ds) }
  })
}

/**
 * Tạo quỹ. `soTienDich = null` ⇒ quỹ dự phòng (không có đích);
 * có đích ⇒ đó là MỤC TIÊU (§7.3 — cùng một object, khác ở chỗ có đích hay không).
 *
 * Mặc định `cho_phep_muon`: quỹ dự phòng để `tu_do`, mục tiêu để `khoa`. Nếu tiền
 * "mua nhà" bị mượn âm thầm mỗi lần lỡ tay thì mục tiêu mất hết ý nghĩa (§7.3).
 */
export async function taoQuy(
  userId: string,
  ten: string,
  soTienDich: Tien | null,
  icon: string,
): Promise<QuyDb> {
  const laMucTieu = soTienDich !== null
  return bocLoi(
    await sb
      .from('quy')
      .insert({
        user_id: userId,
        ten,
        so_tien_dich: soTienDich,
        icon,
        cho_phep_muon: laMucTieu ? 'khoa' : 'tu_do',
        trang_thai: 'dang_chay',
      })
      .select()
      .single(),
    'Tạo quỹ',
  )
}

/**
 * Ghi một bút toán vào quỹ.
 *
 * `so_du_ban_dau` là loại RIÊNG, không phải `gop`: nếu tính là góp thì tỷ lệ để
 * dành chu kỳ đầu vọt lên vô lý và tạo đỉnh giả làm méo mọi biểu đồ so sánh về
 * sau (§7.3, AT-11).
 */
export type GhiBienDong = {
  userId: string
  quyId: string
  chuKyId: string | null
  soTien: Tien
  loai: BienDong['loai']
  khoanMuonId?: string
}

/**
 * Tham số truyền theo TÊN, không theo thứ tự.
 *
 * `userId`, `quyId` và `chuKyId` đều là `string`, nên đổi chỗ hai cái là lỗi
 * `tsc` không nhìn thấy. Chuyện này đã xảy ra thật lúc viết `moSoTietKiem()` và
 * chỉ lộ ra khi chạy, dưới dạng vi phạm khoá ngoại — sau khi hàng quỹ đã được
 * tạo. Đổi sang đối tượng có tên thì kiểu lỗi đó biến mất hẳn.
 */
export async function ghiBienDong(g: GhiBienDong): Promise<BienDongDb> {
  return bocLoi(
    await sb
      .from('bien_dong_quy')
      .insert({
        user_id: g.userId,
        quy_id: g.quyId,
        chu_ky_id: g.chuKyId,
        so_tien: g.soTien,
        loai: g.loai,
        khoan_muon_id: g.khoanMuonId ?? null,
        ngay_local: homNay(),
      })
      .select()
      .single(),
    'Ghi bút toán quỹ',
  )
}

/**
 * Chuyển tiền vào quỹ — nút "Để dành" ở màn ghi nhanh (§6.2).
 *
 * Ghi HAI bản ghi: một `giao_dich` loại `chuyen_vao_quy` và một `bien_dong_quy`
 * loại `gop`. Giao dịch để nó xuất hiện trong dòng thời gian như mọi thao tác
 * khác; bút toán để số dư quỹ đúng. Giao dịch loại này KHÔNG vào tổng chi —
 * nếu vào thì để dành 3tr sẽ hiện thành "đã tiêu 3tr" (§6.2).
 */
export async function deDanh(
  userId: string,
  chuKyId: string,
  quyId: string,
  soTien: Tien,
): Promise<void> {
  bocLoi(
    await sb
      .from('giao_dich')
      .insert({
        user_id: userId,
        chu_ky_id: chuKyId,
        loai: 'chuyen_vao_quy',
        quy_id: quyId,
        so_tien: soTien,
        trang_thai: 'da_xac_nhan',
        nguon: 'thu_cong',
        ngay_local: homNay(),
      })
      .select()
      .single(),
    'Ghi giao dịch để dành',
  )

  await ghiBienDong({ userId, quyId, chuKyId, soTien, loai: 'gop' })

  await sb.from('su_kien').insert({
    user_id: userId,
    ma: 'FUND_CONTRIBUTED',
    doi_tuong: quyId,
    du_lieu: { so_tien: soTien },
  })
}

/** Điền số dư hiện có của quỹ — bút toán `so_du_ban_dau`, bị loại khỏi mọi tỷ lệ để dành. */
export async function dienSoDuBanDau(
  userId: string,
  quyId: string,
  soTien: Tien,
): Promise<void> {
  await ghiBienDong({ userId, quyId, chuKyId: null, soTien, loai: 'so_du_ban_dau' })
  await sb.from('su_kien').insert({
    user_id: userId,
    ma: 'FUND_OPENING_BALANCE',
    doi_tuong: quyId,
    du_lieu: { so_tien: soTien },
  })
}

/** Tổng phải trả nợ quỹ trong chu kỳ này — số bị trừ sẵn khỏi ngân sách (§7.2). */
export async function tongPhaiTraKyNay(): Promise<Tien> {
  const ds = bocLoi(
    await sb
      .from('khoan_muon_quy')
      .select('so_tien_moi_ky, con_lai')
      .in('trang_thai', ['dang_no', 'dang_tra']),
    'Đọc khoản đang nợ quỹ',
  )
  // Kỳ cuối chỉ trả phần còn lại, không trả tròn số (§7.3).
  return dong(ds.reduce((t, k) => t + Math.min(k.so_tien_moi_ky, k.con_lai), 0))
}

/* ── Sổ tiết kiệm (§7.10) ──────────────────────────────────────────────────── */

/**
 * Quỹ này có phải sổ tiết kiệm không.
 *
 * Phép tách nằm ĐÚNG MỘT CHỖ. Lúc đầu màn ① và màn ⑤ mỗi nơi tự cộng một kiểu:
 * màn ① báo "đang có trong quỹ 50.000.000đ" trong khi màn ⑤ báo "tổng đang để
 * dành 0đ" — cùng một khoản tiền, hai câu trả lời. Đúng loại lỗi §6.3 sinh ra
 * để chặn.
 */
export function laSoTietKiem(q: QuyDb): boolean {
  return q.lai_suat_nam !== null
}

/**
 * Tổng tiền quỹ RÚT ĐƯỢC — không tính sổ tiết kiệm có kỳ hạn.
 *
 * Tiền trong sổ khoá tới ngày đáo hạn (§7.10), nên cộng vào "đang có trong quỹ"
 * sẽ đọc lên như thể bồ dùng được ngần ấy khi cần gấp.
 */
export function tongQuyThuong(quy: QuyCoSoDu[]): Tien {
  return dong(quy.filter((q) => !laSoTietKiem(q)).reduce((t, q) => t + q.soDu, 0))
}

/**
 * Tổng tiền đang nằm trong các sổ tiết kiệm.
 */
export function tongSoTietKiem(quy: QuyCoSoDu[]): Tien {
  return dong(quy.filter(laSoTietKiem).reduce((t, q) => t + q.soDu, 0))
}

/**
 * Đọc bốn cột sổ tiết kiệm ra kiểu domain. `null` ⇒ quỹ thường, không phải sổ.
 *
 * Ràng buộc `so_tiet_kiem_du_bo` ở migration 0009 bảo đảm bốn cột đi cùng nhau
 * hoặc cùng vắng, nên chỉ cần kiểm một cột là biết.
 */
export function soTietKiemCua(q: QuyDb, goc: Tien): SoTietKiem | null {
  if (q.lai_suat_nam === null || q.ngay_gui === null || q.lich_tra_lai === null) return null
  return {
    goc,
    laiSuatNam: q.lai_suat_nam,
    ngayGui: ngayLocal(q.ngay_gui),
    kyHanThang: q.ky_han_thang,
    lichTraLai: q.lich_tra_lai as SoTietKiem['lichTraLai'],
  }
}

/**
 * Mở một sổ tiết kiệm. Gốc vào ngay dưới dạng bút toán.
 *
 * `cho_phep_muon = 'khoa'`: rút trước hạn thì lãi bị tính lại về lãi suất không
 * kỳ hạn — gần như mất sạch. Khoá ở đây là mô tả sự thật ngoài đời, không phải
 * rào cản app tự dựng (§7.10).
 *
 * `laSoCu = true` ⇒ sổ đã chạy TRƯỚC khi bồ dùng app, nên gốc là `so_du_ban_dau`
 * chứ không phải `gop` — nếu không, tỷ lệ để dành chu kỳ này vọt lên vô lý
 * (§7.3, AT-11). Đây là trường hợp thật của bồ (H5).
 */
export async function moSoTietKiem(
  userId: string,
  chuKyId: string,
  p: {
    ten: string
    goc: Tien
    laiSuatNam: number
    ngayGui: NgayLocal
    kyHanThang: number | null
    lichTraLai: SoTietKiem['lichTraLai']
    laSoCu: boolean
  },
): Promise<QuyDb> {
  const q = bocLoi(
    await sb
      .from('quy')
      .insert({
        user_id: userId,
        ten: p.ten,
        icon: 'piggy-bank',
        cho_phep_muon: 'khoa',
        trang_thai: 'dang_chay',
        lai_suat_nam: p.laiSuatNam,
        ngay_gui: p.ngayGui,
        ky_han_thang: p.kyHanThang,
        lich_tra_lai: p.lichTraLai,
      })
      .select()
      .single(),
    'Mở sổ tiết kiệm',
  )

  try {
    await ghiBienDong({
      userId,
      quyId: q.id,
      chuKyId,
      soTien: p.goc,
      loai: p.laSoCu ? 'so_du_ban_dau' : 'gop',
    })
  } catch (e) {
    // PostgREST không có giao dịch trải qua nhiều lời gọi, nên hàng quỹ đã nằm
    // đó rồi. Bỏ mặc thì màn ⑤ hiện một sổ tiết kiệm 0đ mà bồ không xoá được.
    // Xoá bù rồi ném lại lỗi gốc — thà không tạo được còn hơn tạo nửa vời (§13).
    await sb.from('quy').delete().eq('id', q.id)
    throw e
  }

  await sb.from('su_kien').insert({
    user_id: userId,
    ma: 'SAVINGS_ACCOUNT_OPENED',
    doi_tuong: q.id,
    du_lieu: {
      goc: p.goc,
      lai_suat_nam: p.laiSuatNam,
      ky_han_thang: p.kyHanThang,
      lich_tra_lai: p.lichTraLai,
      la_so_cu: p.laSoCu,
    },
  })
  return q
}

/**
 * Ghi tiền lãi bank trả THẬT, thay cho con số app đang ước tính.
 *
 * §12.1 bắt lưu kèm ước tính app đang hiện lúc đó: nếu hai số lệch nhau nhiều và
 * lặp lại, đó là dấu hiệu công thức hoặc kiểu trả lãi đang bị hiểu sai — không có
 * cột này thì không ai phát hiện ra.
 */
export async function ghiLaiThat(
  userId: string,
  chuKyId: string,
  quyId: string,
  soTien: Tien,
  uocTinh: Tien,
): Promise<void> {
  await ghiBienDong({ userId, quyId, chuKyId, soTien, loai: 'lai' })
  await sb.from('su_kien').insert({
    user_id: userId,
    ma: 'SAVINGS_INTEREST_RECORDED',
    doi_tuong: quyId,
    du_lieu: { so_tien: soTien, uoc_tinh: uocTinh },
  })
}
