/**
 * QUỸ, LẤN QUỸ & KỲ HẠN TRẢ NỢ — §7.3.
 *
 * §7.3 tự gọi phần chọn kỳ hạn là "chỗ dễ làm app phản tác dụng nhất trong toàn
 * dự án": bắt trả hết ngay chu kỳ sau thì chu kỳ sau gần như chắc chắn lại vượt
 * → vòng xoáy nợ. Mọi quy tắc dưới đây phục vụ việc tránh cái vòng đó.
 *
 * shared/domain/ ⇒ §14 quy ước 3: không import React, không gọi mạng.
 */

import { type Dong, dong, dinhDang } from './tien'

/* ── Số dư ─────────────────────────────────────────────────────────────────── */

export type LoaiBienDong = 'so_du_ban_dau' | 'gop' | 'rut' | 'muon' | 'tra_no' | 'lai'

export type BienDong = {
  readonly loai: LoaiBienDong
  readonly soTien: Dong // dương = vào quỹ, âm = ra khỏi quỹ
}

/** Số dư quỹ = tổng bút toán. Không bao giờ lưu sẵn (§6.3 quy tắc vàng). */
export function soDu(bienDong: readonly BienDong[]): Dong {
  return dong(bienDong.reduce((t, b) => t + b.soTien, 0))
}

/**
 * Tổng đã để dành, dùng cho TỶ LỆ để dành — loại trừ `so_du_ban_dau` và `lai`.
 *
 * Ranh giới không phải "tiền ở đâu" mà là "bồ có để dành ra khoản đó không"
 * (§7.10). Số dư ban đầu là tiền đã có sẵn từ trước; tiền lãi là bank trả. Tính
 * cả hai vào thì chu kỳ đầu hiện "để dành được 340% thu nhập", tạo một đỉnh giả
 * làm méo mọi biểu đồ so sánh về sau (§7.3, AT-11).
 */
const KHONG_PHAI_DE_DANH = new Set<LoaiBienDong>(['so_du_ban_dau', 'lai'])

export function tongDeDanh(bienDong: readonly BienDong[]): Dong {
  return dong(
    bienDong.filter((b) => !KHONG_PHAI_DE_DANH.has(b.loai)).reduce((t, b) => t + b.soTien, 0),
  )
}

/* ── Lấn quỹ ───────────────────────────────────────────────────────────────── */

export type KetQuaLayQuy =
  { readonly duoc: true } | { readonly duoc: false; readonly lyDo: string }

/**
 * Có lấy được tiền từ quỹ để bù khoản vượt ngân sách không (§7.3).
 *
 * Quỹ khởi đầu 0đ vì onboarding không hỏi về quỹ, mà chu kỳ đầu lại là chu kỳ dễ
 * vượt nhất — nên đây là đường gần như chắc chắn đi qua ở tháng đầu (§7.8, AT-16).
 * Không đủ thì trả lý do để UI hiện MỜ kèm giải thích, không ẩn nút đi: bồ cần
 * hiểu vì sao mới tin được con số.
 */
export function coTheLayTuQuy(soDuQuy: Dong, soVuot: Dong): KetQuaLayQuy {
  if (soVuot <= 0) return { duoc: true }
  if (soDuQuy <= 0) {
    return { duoc: false, lyDo: 'Quỹ đang trống nên chưa lấy ra được. Ghi nợ để trả dần nhé.' }
  }
  if (soDuQuy < soVuot) {
    return {
      duoc: false,
      lyDo: `Quỹ còn ${dinhDang(soDuQuy)}, chưa đủ cho ${dinhDang(soVuot)}.`,
    }
  }
  return { duoc: true }
}

/* ── Trần trả nợ ───────────────────────────────────────────────────────────── */

/** Phần trăm thu nhập tối đa được trích trả nợ quỹ mỗi kỳ (§7.3). */
const PHAN_TRAM_TRAN = 15

/**
 * Trần trả nợ mỗi kỳ = 15% thu nhập THẤP NHẤT trong 3 chu kỳ gần nhất.
 *
 * Lấy thấp nhất chứ không lấy trung bình: nếu một chu kỳ thu nhập tụt thì trần
 * phải tụt theo, không thì kỳ đó trả không nổi. Chưa đủ 3 chu kỳ thì dùng số chu
 * kỳ đã có (§7.8) — chu kỳ đầu vẫn phải tính được, không được kẹt.
 *
 * Nhân trước chia sau để phép tính nằm trọn trong miền số nguyên (xem `tien.ts`).
 */
export function tranTraNo(thuNhapGanNhat: readonly Dong[]): Dong {
  const co = thuNhapGanNhat.slice(-3).filter((t) => t > 0)
  if (co.length === 0) return dong(0)
  return dong(Math.floor((Math.min(...co) * PHAN_TRAM_TRAN) / 100))
}

/**
 * Trần còn lại cho khoản nợ MỚI khi đang trả một khoản cũ (§7.3, AT-17).
 *
 * Trần 15% áp cho TỔNG mọi khoản đang trả, không phải 15% mỗi khoản — nếu không,
 * hai khoản nợ sẽ ngốn 30% thu nhập và đẩy thẳng vào vòng xoáy nợ. Chu kỳ sau khi
 * vượt vốn đã bị trừ sẵn khoản trả nên càng dễ vượt tiếp; đây là chỗ phải chặt.
 */
export function tranConLai(tran: Dong, dangTraMoiKy: Dong): Dong {
  return dong(Math.max(0, tran - dangTraMoiKy))
}

/* ── Kỳ hạn ────────────────────────────────────────────────────────────────── */

export type KyHan = 1 | 3 | 6 | 'linh_hoat'

export type LuaChon = {
  readonly kyHan: KyHan
  readonly soKy: number
  readonly moiKy: Dong
  /** Kỳ cuối chỉ trả phần còn lại, không trả tròn số (§7.3). */
  readonly kyCuoi: Dong
  readonly hopLe: boolean
  /** Chỉ có khi không hợp lệ — UI hiện mờ kèm dòng này, không ẩn lựa chọn đi. */
  readonly lyDo?: string
}

/** Dưới mức này thì không bày lựa chọn, trả luôn một kỳ (§7.3). */
export const NGUONG_BAY_LUA_CHON = 300_000

const KY_HAN_CO_DINH = [1, 3, 6] as const

function chiaDeu(no: Dong, soKy: number): { moiKy: Dong; kyCuoi: Dong } {
  const moiKy = dong(Math.ceil(no / soKy))
  return { moiKy, kyCuoi: dong(no - moiKy * (soKy - 1)) }
}

/**
 * Các lựa chọn kỳ hạn cho một khoản nợ, kèm lý do cho những lựa chọn không hợp lệ.
 *
 * `linh_hoat` là lựa chọn BẮT BUỘC phải có: nếu nợ vượt 6 × trần thì cả 1, 3, 6
 * tháng đều không hợp lệ và app sẽ kẹt không cho bồ chọn được gì (§7.3).
 * Nó trả đúng trần mỗi kỳ, số kỳ tự tính, kỳ cuối trả phần dư.
 */
export function luaChonKyHan(no: Dong, tran: Dong): LuaChon[] {
  const ds: LuaChon[] = KY_HAN_CO_DINH.map((soKy) => {
    const { moiKy, kyCuoi } = chiaDeu(no, soKy)
    const hopLe = tran > 0 && moiKy <= tran
    return {
      kyHan: soKy,
      soKy,
      moiKy,
      kyCuoi,
      hopLe,
      ...(hopLe
        ? {}
        : {
            lyDo:
              tran > 0
                ? `${soKy} tháng = ${dinhDang(moiKy)}/kỳ, vượt trần ${dinhDang(tran)}`
                : 'Chưa có thu nhập nào được ghi nên chưa tính được trần',
          }),
    }
  })

  if (tran > 0) {
    const soKy = Math.ceil(no / tran)
    ds.push({
      kyHan: 'linh_hoat',
      soKy,
      moiKy: tran,
      kyCuoi: dong(no - tran * (soKy - 1)),
      hopLe: true,
    })
  }

  return ds
}

/**
 * Kỳ hạn chọn sẵn = kỳ hạn NGẮN NHẤT còn hợp lệ (§7.3) — trả xong sớm thì quỹ về
 * nguyên trạng sớm. Không có lựa chọn hợp lệ nào thì trả null để nơi gọi biết mà
 * xử lý, thay vì mặc định bừa vào một kỳ hạn bồ trả không nổi.
 */
export function kyHanMacDinh(luaChon: readonly LuaChon[]): KyHan | null {
  return luaChon.find((l) => l.hopLe)?.kyHan ?? null
}

/** Nợ nhỏ thì đừng bắt bồ quyết chuyện nhỏ — trả luôn một kỳ (§7.3). */
export function canBayLuaChon(no: Dong): boolean {
  return no >= NGUONG_BAY_LUA_CHON
}
