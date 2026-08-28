/**
 * TIỀN — §14 quy ước 1: số nguyên, đơn vị ĐỒNG. Không bao giờ float.
 * "Sai lầm này không sửa được về sau."
 *
 * Vì sao branded type thay vì `number` thường:
 * §13 của v1.0 định kiểm chứng bằng "grep toàn repo: không có parseFloat/Number
 * trên trường tiền". Nhưng `Number` là hàm quá phổ biến — grep trả về hàng trăm
 * kết quả không liên quan, nên rule sẽ bị bỏ qua, nên nó không bảo vệ được gì.
 * Branded type đổi cách kiểm chứng thành `tsc --noEmit`: trình biên dịch kiểm hộ
 * mỗi lần commit, không ai phải tự đọc.
 *
 * File này thuộc shared/domain/ ⇒ §14 quy ước 3: KHÔNG import React, KHÔNG gọi mạng.
 */

/**
 * Số tiền, đơn vị đồng, luôn là số nguyên.
 *
 * `__brand` chỉ tồn tại lúc biên dịch — sau khi build nó biến mất hoàn toàn,
 * `Dong` chạy y hệt `number`, chi phí runtime bằng 0.
 * Cách duy nhất tạo ra một `Dong` là đi qua hàm `dong()` bên dưới.
 */
export type Dong = number & { readonly __brand: 'dong' }

/** Ép một số thành `Dong`. Ném lỗi nếu không phải số nguyên (chặn cả NaN và Infinity). */
export function dong(n: number): Dong {
  if (!Number.isInteger(n)) {
    throw new Error(`Tiền phải là số nguyên đơn vị đồng, nhận được: ${n}`)
  }
  return n as Dong
}

/** Dấu trừ toán học U+2212, khớp mockup. Không dùng gạch nối ASCII. */
export const DAU_TRU = '−'

/**
 * Dạng đầy đủ — dùng khi bồ CHẠM vào một con số (§10 nguyên tắc 5).
 * `dinhDang(dong(6_990_000))` → `'6.990.000đ'`
 *
 * Không bao giờ hiện "6.990.000,00 VNĐ" — §10 cấm rõ.
 */
export function dinhDang(x: Dong): string {
  // Intl trả gạch nối ASCII cho số âm; đổi sang U+2212 để khớp rutGon(),
  // nếu không thì cùng một số tiền hiện hai kiểu dấu âm khác nhau.
  return `${new Intl.NumberFormat('vi-VN').format(x).replace('-', DAU_TRU)}đ`
}

/**
 * Lấy 2 chữ số thập phân của `soNguyen / donVi`, CẮT BỎ phần dư (không làm tròn),
 * rồi bỏ số 0 thừa ở cuối và đổi dấu chấm thành dấu phẩy kiểu Việt Nam.
 *
 * ⚠️ Phép chia làm trên SỐ NGUYÊN trước rồi mới chia 100. Nếu viết
 * `Math.floor(n / donVi * 100)` thì 6_120_000 cho ra 611.9999999999999 → cắt
 * thành 6,11tr — sai một xu ở đúng con số to nhất màn hình. Đây là lý do §14
 * quy ước 1 bắt tiền phải là số nguyên: mọi phép tính đều làm trên số nguyên trước.
 */
function catHaiSo(soNguyen: number, donVi: number): string {
  const phanTram = Math.floor(soNguyen / (donVi / 100))
  return String(phanTram / 100).replace('.', ',')
}

/**
 * Rút gọn số tiền để hiển thị ở CỠ LỚN (§10 nguyên tắc 5: "rút gọn khi hiển thị
 * lớn, đầy đủ khi chạm vào"). Cũng là cách chống tràn chữ trong lỗ donut.
 *
 *   6.990.000 → '6,99tr'      6.900.000 → '6,9tr'      6.000.000 → '6tr'
 *     520.000 → '520k'           35.500 → '35,5k'             500 → '500đ'
 *    −200.000 → '−200k'
 *
 * Quy tắc (Khôi chốt 18/08/2026): 2 chữ số thập phân, số 0 ở cuối thì bỏ đi.
 */
export function rutGon(x: Dong): string {
  const am = x < 0
  const n = Math.abs(x)

  const than =
    n >= 1_000_000
      ? `${catHaiSo(n, 1_000_000)}tr`
      : n >= 1_000
        ? `${catHaiSo(n, 1_000)}k`
        : `${n}đ`

  return am ? `${DAU_TRU}${than}` : than
}
