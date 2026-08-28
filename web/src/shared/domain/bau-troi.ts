/**
 * NỀN BẦU TRỜI THEO KHUNG GIỜ — mockup v3 (`mockup-v3-ba-bau-troi.html`).
 *
 * Hàm thuần, không đụng DOM. Giờ lấy theo Việt Nam bằng chính cơ chế `homNay()`
 * đã dùng cho ranh giới chu kỳ, nên không phát sinh khái niệm thời gian mới —
 * và cũng không dính lại cái bẫy §14 quy ước 2 (đọc giờ theo múi giờ máy).
 */

export type BauTroi = 'binh_minh' | 'hoang_hon' | 'ngan_ha'

/** `tu_dong` = đổi theo giờ; ba giá trị còn lại = bồ tự chốt một cảnh. */
export type ChonBauTroi = BauTroi | 'tu_dong'

export const KHOA_BAU_TROI = 'bau_troi'

/** Việt Nam ở UTC+7 cố định, không có giờ mùa hè từ 1975 ⇒ cộng bù được. */
const LECH_VN_MS = 7 * 60 * 60 * 1000

/** Giờ 0–23 theo giờ Việt Nam, bất kể máy đang đặt múi giờ nào. */
export function gioVN(bayGio: Date = new Date()): number {
  return new Date(bayGio.getTime() + LECH_VN_MS).getUTCHours()
}

/**
 * Mốc giờ lấy từ mockup v3.
 *
 * Ngân hà kéo qua nửa đêm (18:00 → 04:59) nên KHÔNG viết được bằng một phép so
 * sánh khoảng liên tục — chỗ này là bẫy dễ sai nhất của cả hàm.
 */
export function bauTroiTheoGio(gio: number): BauTroi {
  if (gio >= 5 && gio <= 10) return 'binh_minh'
  if (gio >= 11 && gio <= 17) return 'hoang_hon'
  return 'ngan_ha'
}

/** Cảnh cuối cùng: tôn trọng lựa chọn của bồ, không có thì mới theo giờ. */
export function bauTroiHienTai(chon: ChonBauTroi, gio: number): BauTroi {
  return chon === 'tu_dong' ? bauTroiTheoGio(gio) : chon
}

export const TEN_BAU_TROI: Record<ChonBauTroi, string> = {
  tu_dong: 'Theo giờ trong ngày',
  binh_minh: 'Bình minh',
  hoang_hon: 'Hoàng hôn',
  ngan_ha: 'Ngân hà',
}

/** Đọc lựa chọn từ `cau_hinh`. Giá trị lạ ⇒ về `tu_dong` chứ không đổ. */
export function docChonBauTroi(v: unknown): ChonBauTroi {
  return v === 'binh_minh' || v === 'hoang_hon' || v === 'ngan_ha' || v === 'tu_dong'
    ? v
    : 'tu_dong'
}

/* ── Sao trời (cảnh ngân hà) ────────────────────────────────────────────────── */

export type Sao = { x: number; y: number; r: number; mo: number; tim: boolean }

/**
 * Sinh trường sao TẤT ĐỊNH — cùng hạt giống luôn ra cùng bầu trời.
 *
 * Không dùng `Math.random()`: sao phải nằm y chỗ cũ mỗi lần bồ mở app. Bầu trời
 * nhảy vị trí sau mỗi lần vẽ lại trông như lỗi hiển thị chứ không như bầu trời.
 *
 * LCG 32-bit bằng `Math.imul`. Mockup viết `hat * 1103515245` bằng phép nhân
 * thường — với hạt giống 20260821 thì tích là 2,2×10¹⁶, VƯỢT `MAX_SAFE_INTEGER`
 * (9,0×10¹⁵) nên mất bit thấp và dãy không còn là LCG đúng nữa. `Math.imul` nhân
 * đúng trong 32 bit, nên kết quả tất định thật chứ không phải tất định nhờ may.
 */
export function sinhSao(soLuong = 130, hatGiong = 20260821): Sao[] {
  let hat = hatGiong >>> 0
  const ngau = () => {
    hat = (Math.imul(hat, 1103515245) + 12345) >>> 0
    return hat / 4294967296
  }

  return Array.from({ length: soLuong }, () => ({
    x: Math.round(ngau() * 1000) / 10, //  % bề ngang
    // Chỉ rải ở 68% phía trên: nửa dưới màn hình là chỗ nội dung nằm, sao ở đó
    // vừa bị thẻ che vừa làm chữ khó đọc.
    y: Math.round(ngau() * 680) / 10, // % bề dọc
    r: Math.round((ngau() * 1.1 + 0.25) * 100) / 100,
    mo: Math.round((0.22 + ngau() * 0.66) * 100) / 100,
    tim: ngau() > 0.82,
  }))
}
