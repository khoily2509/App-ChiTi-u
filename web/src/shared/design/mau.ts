/**
 * MÀU — §11.1. Nguồn sự thật DUY NHẤT cho mọi giá trị màu (§14 quy ước 6).
 *
 * File này và `src/index.css` phải luôn khớp nhau. Không phải trông cậy vào trí nhớ:
 * `mau.test.ts` đọc index.css rồi so từng giá trị, lệch một ký tự là test đỏ.
 *
 * Vì sao tách hai lớp: nền càng dịu thì dữ liệu càng đọc được. Lớp 1 phủ ~92% màn
 * hình và KHÔNG BAO GIỜ mang dữ liệu; lớp 2 chỉ xuất hiện ở mảng nhỏ (vành donut,
 * ô icon) nên được phép đậm mà không làm màn hình gắt.
 */

/** Lớp 1 · giao diện — dịu, ấm, thiên nhiên. Không mang dữ liệu. */
export const GIAO_DIEN = {
  page: '#f2ede3', //     cát ấm — nền trang
  surface: '#faf7f2', //  kem — mặt thẻ
  surface2: '#f6f1e8',
  sageSoft: '#e6ede3', // thanh nền, track
  sage: '#7d9b7a', //     nét trang trí
  gold: '#c9a227', //     CHỈ nét 1px, không tô mảng
  ink: '#20241f', //      than ấm — chữ chính
  ink2: '#5b6157', //     chữ phụ
  muted: '#8d9186', //    chữ mờ, trục
  line: '#e5ded1',
  line2: '#efe8db',
} as const

/**
 * Lớp 2 · dữ liệu. **Thứ tự slot LÀ cơ chế an toàn mù màu — không được đổi.**
 * Đã kiểm định trên nền kem #faf7f2, gồm cả cặp nối vòng của donut:
 * mù màu ΔE 9,0 (ngưỡng ≥8) · thị giác thường ΔE 16,8 (ngưỡng ≥15).
 *
 * `chu` (--cN-ink) là nhóm token mà v1.0 thiếu hẳn: §10 nguyên tắc 6 cấm dùng
 * màu danh mục làm chữ vì tương phản thấp, nhưng mockup lại tự chế biến thể đậm
 * hơn và rải 23 mã hex ngoài bảng token. Ở đây chuẩn hoá lại: mỗi slot có đúng
 * một màu chữ/nét, đã kiểm định ≥5:1 trên nền `nen` tương ứng.
 *
 * slot 1 và 6 lấy nguyên từ mockup; slot 2–5 tính bằng cách làm tối giữ nguyên
 * sắc độ cho tới khi đạt ngưỡng (hệ số 0,79–0,87, cùng dải với slot 1).
 */
export const SLOT = [
  { slot: 1, ten: 'Sinh hoạt', mau: '#3b8841', nen: '#e4efe4', chu: '#2f6b39' },
  { slot: 2, ten: 'Phát triển bản thân', mau: '#835cbe', nen: '#ece5f6', chu: '#7250a5' },
  { slot: 3, ten: 'Giải trí', mau: '#c65d26', nen: '#f8e7dc', chu: '#9e4a1e' },
  { slot: 4, ten: 'Đầu tư', mau: '#008b9e', nen: '#dceff1', chu: '#006e7d' },
  { slot: 5, ten: 'Mĩ phẩm', mau: '#c75374', nen: '#f8e3e9', chu: '#9f425d' },
  { slot: 6, ten: 'Khác', mau: '#b59600', nen: '#f4eed4', chu: '#6b4d05' },
  // Bốn slot dưới thêm 27/08/2026 khi nới trần từ 6 lên 10 (Khôi chốt). Sáu slot
  // trên KHÔNG đụng tới một ký tự — chúng đã nằm trong mockup và trong dữ liệu
  // đang chạy, đổi giá trị là mọi biểu đồ cũ đổi màu theo.
  //
  // Cách chọn: KHÔNG tối đa hoá khoảng cách màu. Lần đầu tôi làm vậy và nó nhả
  // ra #35e9ce, #101093, #e9e935 — xanh neon, navy, vàng chói, đúng về số đo mà
  // đứng cạnh sáu màu cũ thì không còn là một bộ. Lần này đặt SÀN an toàn trước
  // (ΔE ≥ 9 với người mù đỏ-lục, ≥ 16 với thị giác thường, lệch hue ≥ 24°) rồi
  // trong số đạt sàn chọn màu DỊU NHẤT — bão hoà thấp nhất, độ sáng gần 56%.
  { slot: 7, ten: '(bồ tự đặt)', mau: '#a2b36b', nen: '#f2f4ea', chu: '#606a3f' },
  { slot: 8, ten: '(bồ tự đặt)', mau: '#6bb394', nen: '#eaf4f0', chu: '#416d5a' },
  { slot: 9, ten: '(bồ tự đặt)', mau: '#86a1c1', nen: '#eef2f6', chu: '#54657a' },
  { slot: 10, ten: '(bồ tự đặt)', mau: '#3539ac', nen: '#e3e3f3', chu: '#3539ac' },
] as const

/**
 * "Chưa biết xếp đâu" — danh mục hệ thống, không xoá được (§7.1).
 * Cố ý KHÔNG chiếm slot màu dữ liệu: nó không nên tranh chỗ trên donut với
 * danh mục thật, và nó là trạng thái tạm chứ không phải một loại chi tiêu.
 */
export const CHUA_BIET = { mau: '#8d9186', nen: '#eceae6', chu: '#4f534b' } as const

/**
 * Trạng thái — cố định, không đổi theo theme.
 * **KHÔNG BAO GIỜ dùng làm màu series** (§11.1). Luôn đi kèm icon + nhãn.
 */
export const TRANG_THAI = {
  tot: '#0ca30c',
  canhBao: '#fab219',
  nghiemTrong: '#ec835a',
  nguyCap: '#d03b3b',
} as const

/**
 * Biểu đồ chênh lệch (§10) — MỘT màu trung tính cho mọi thanh.
 *
 * Chiều thay đổi đã được mã hoá bằng VỊ TRÍ (thanh nằm trái hay phải vạch 0),
 * nên màu không cần mang thêm nghĩa đó.
 *
 * v1.0 tô đỏ mọi khoản tăng — kể cả tiêu thêm cho sách — vi phạm §10 nguyên tắc 3
 * và §9.3. Nhưng thay bằng HAI màu trung tính cũng sai: cặp #8d9186/#7d9b7a chỉ
 * cách nhau 11,7 đơn vị RGB sau mô phỏng mù màu đỏ-lục (cặp đỏ/xanh cũ cách 134,6),
 * gần như cùng một màu. Một màu duy nhất tránh được cả hai lỗi.
 *
 * Đỏ/vàng chỉ dành cho danh mục THẬT SỰ vượt hạn mức (§7.6) — lúc đó màu mang
 * nghĩa trạng thái, đúng vai trò §10 nguyên tắc 3 quy định.
 */
export const CHENH_LECH = { thanh: '#8d9186' } as const

/**
 * Tra màu theo slot — cửa duy nhất để component lấy màu danh mục (§14 quy ước 6).
 *
 * Có hàm này thì chỗ dùng không phải tự nhớ "slot null nghĩa là Chưa biết xếp đâu",
 * và không nơi nào phải viết `SLOT[slot - 1]` — phép trừ 1 đó là chỗ dễ lệch chỉ số
 * nhất trong cả file.
 */
export function mauSlot(slot: number | null): { mau: string; nen: string; chu: string } {
  const s = SLOT.find((x) => x.slot === slot)
  return s ? { mau: s.mau, nen: s.nen, chu: s.chu } : CHUA_BIET
}

/**
 * TÊN LỚP TAILWIND theo slot — song sinh của `mauSlot()` cho những chỗ tô bằng
 * lớp thay vì bằng `style`.
 *
 * Vì sao phải viết NGUYÊN CHỮ từng lớp thay vì ghép `bg-c${slot}-t`: Tailwind quét
 * mã nguồn tìm chuỗi literal để biết cần sinh ra lớp nào. Chuỗi ghép lúc chạy thì
 * nó không thấy, và lớp đó đơn giản là không tồn tại trong CSS — nút hiện ra
 * không nền, không ai báo lỗi gì cả.
 *
 * Vì sao gom về ĐÂY: trước 28/08/2026 bảng này bị chép tay ở HAI màn hình
 * (`ManGhiNhanh`, `ManDanhSach`), mỗi bản chỉ có slot 1–6. Nới trần lên 10 hôm
 * 27/08 thì `mau.ts` và `index.css` có đủ 10, còn hai bản chép tay kia thì không
 * — danh mục thứ 7 trở đi hiện màu XÁM ở màn ghi đầy đủ và ở lịch sử, trong khi
 * màn chính hiện đúng màu. Đúng thứ §14 quy ước 6 cấm: token rải ra nhiều nơi thì
 * sớm muộn chúng lệch nhau, và lệch âm thầm.
 */
export const LOP_SLOT: Record<
  number,
  { nen: string; chu: string; vien: string; dam: string }
> = {
  1: { nen: 'bg-c1-t', chu: 'text-c1-ink', vien: 'border-c1', dam: 'bg-c1' },
  2: { nen: 'bg-c2-t', chu: 'text-c2-ink', vien: 'border-c2', dam: 'bg-c2' },
  3: { nen: 'bg-c3-t', chu: 'text-c3-ink', vien: 'border-c3', dam: 'bg-c3' },
  4: { nen: 'bg-c4-t', chu: 'text-c4-ink', vien: 'border-c4', dam: 'bg-c4' },
  5: { nen: 'bg-c5-t', chu: 'text-c5-ink', vien: 'border-c5', dam: 'bg-c5' },
  6: { nen: 'bg-c6-t', chu: 'text-c6-ink', vien: 'border-c6', dam: 'bg-c6' },
  7: { nen: 'bg-c7-t', chu: 'text-c7-ink', vien: 'border-c7', dam: 'bg-c7' },
  8: { nen: 'bg-c8-t', chu: 'text-c8-ink', vien: 'border-c8', dam: 'bg-c8' },
  9: { nen: 'bg-c9-t', chu: 'text-c9-ink', vien: 'border-c9', dam: 'bg-c9' },
  10: { nen: 'bg-c10-t', chu: 'text-c10-ink', vien: 'border-c10', dam: 'bg-c10' },
}

/** Danh mục hệ thống "Chưa biết xếp đâu" — không chiếm slot màu dữ liệu (§7.1). */
export const LOP_CHUA_BIET = {
  nen: 'bg-chua-biet-t',
  chu: 'text-chua-biet-ink',
  vien: 'border-chua-biet',
  dam: 'bg-chua-biet',
} as const

/** Tra tên lớp theo slot. Slot rỗng hoặc lạ ⇒ màu xám của danh mục hệ thống. */
export function lopSlot(slot: number | null): {
  nen: string
  chu: string
  vien: string
  dam: string
} {
  return (slot !== null && LOP_SLOT[slot]) || LOP_CHUA_BIET
}
