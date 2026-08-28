/**
 * NGÂN SÁCH & "HÔM NAY CÒN TIÊU ĐƯỢC" — §7.2, §10.
 *
 * Đây là con số ≥48px của màn ① — thứ bồ nhìn nhiều nhất trong app. Mọi quy tắc
 * ở đây phục vụ một điều: con số hiện ra phải LUÔN có nghĩa, hoặc không hiện gì
 * cả. §7.8 cấm hiện ∞ / NaN / 0 / số âm.
 *
 * shared/domain/ ⇒ §14 quy ước 3: không import React, không gọi mạng.
 */

import { type Dong, dong } from './tien'

/**
 * Ngân sách chi của một chu kỳ.
 *
 * Trừ sẵn để dành TRƯỚC khi tiêu (§7.2), giống cách §7.6 làm với hạn mức từng
 * danh mục. Nếu để dành là phần còn dư thì thực tế thường không dư, và app không
 * bao giờ có dịp chúc mừng.
 *
 * Cũng trừ khoản phải trả nợ quỹ kỳ này — trừ sẵn từ đầu để bồ không tiêu vào
 * tiền đã hứa trả (§7.3).
 *
 * Không bao giờ trả số âm: để dành định mức cao hơn lương là chuyện bồ tự đặt
 * nhầm, và một ngân sách âm sẽ kéo mọi con số phía sau thành vô nghĩa.
 */
export function nganSach(thuNhapThucNhan: Dong, deDanhDinhMuc: Dong, traNoKyNay: Dong): Dong {
  return dong(Math.max(0, thuNhapThucNhan - deDanhDinhMuc - traNoKyNay))
}

/** Số tiền còn tiêu được cho tới hết chu kỳ. Âm nghĩa là đã vượt. */
export function conLai(nganSachChuKy: Dong, daChi: Dong): Dong {
  return dong(nganSachChuKy - daChi)
}

/* ── Đặt để dành — nhập được từ CẢ HAI đầu (§7.2) ───────────────────────────── */

/**
 * Ba con số bị ràng buộc bởi MỘT phương trình:
 *
 *     thu_nhap  =  de_danh  +  (moi_ngay × so_ngay_chu_ky)  +  tra_no_ky_nay
 *
 * Biết hai là suy ra cái thứ ba, nên bồ gõ ở đầu nào cũng được. Hai hàm dưới là
 * cùng một phương trình giải theo hai ẩn khác nhau — không phải hai công thức.
 *
 * ⚠️ Dùng SỐ NGÀY CẢ CHU KỲ, không phải số ngày còn lại: đây là bước LẬP KẾ HOẠCH
 * cho trọn chu kỳ. Còn `homNayConTieuDuoc()` dùng số ngày còn lại vì nó trả lời
 * câu khác — "từ giờ tới cuối kỳ thì mỗi ngày còn bao nhiêu". Hai con số lệch
 * nhau ngay khi bồ bắt đầu tiêu, và đó là đúng chứ không phải lỗi.
 */

/** Muốn mỗi ngày tiêu chừng này ⇒ để dành được bao nhiêu. */
export function deDanhTuMoiNgay(
  thuNhap: Dong,
  traNoKyNay: Dong,
  moiNgay: Dong,
  soNgayChuKy: number,
): Dong {
  return dong(Math.max(0, thuNhap - traNoKyNay - moiNgay * soNgayChuKy))
}

/** Muốn để dành chừng này ⇒ mỗi ngày tiêu được bao nhiêu. */
export function moiNgayTuDeDanh(
  thuNhap: Dong,
  traNoKyNay: Dong,
  deDanh: Dong,
  soNgayChuKy: number,
): Dong {
  if (soNgayChuKy <= 0) return dong(0)
  // Làm tròn XUỐNG như mọi phép chia tiền khác: thà báo thiếu vài đồng còn hơn
  // báo thừa rồi cuối chu kỳ hụt.
  return dong(Math.max(0, Math.floor((thuNhap - traNoKyNay - deDanh) / soNgayChuKy)))
}

/**
 * "Hôm nay còn tiêu được bao nhiêu" — con số khổng lồ của màn ① (§10).
 *
 * Trả `null` khi KHÔNG tính được hoặc không nên hiện. Nơi gọi phải xử lý null
 * bằng một câu giải thích, tuyệt đối không thay bằng 0 — hiện 0đ trông như
 * "hết tiền rồi", vừa sai vừa gây hoảng (§7.8).
 *
 * Null xảy ra ở ba trường hợp:
 *   · chưa nhập lương        → chưa biết ngân sách
 *   · chu kỳ đã hết ngày     → không còn ngày nào để chia
 *   · đã tiêu quá ngân sách  → phép chia ra số âm, mà số âm ở đây vô nghĩa:
 *                              không ai "tiêu được −50.000đ hôm nay"
 */
export function homNayConTieuDuoc(
  nganSachChuKy: Dong | null,
  daChi: Dong,
  soNgayConLai: number,
): Dong | null {
  if (nganSachChuKy === null || soNgayConLai <= 0) return null
  const con = conLai(nganSachChuKy, daChi)
  if (con <= 0) return null

  // Chia trên số nguyên rồi làm tròn XUỐNG: thà báo thiếu vài đồng còn hơn báo
  // thừa rồi cuối chu kỳ hụt.
  const moiNgay = Math.floor(con / soNgayConLai)

  // Còn 1.000đ chia cho 31 ngày ra 0đ/ngày. Về số học thì đúng, nhưng "0đ" đọc
  // lên là "hết sạch tiền rồi" — đúng thứ §7.8 cấm. Ở tình huống đó câu trung
  // thực là "ngân sách đã cạn", nên trả null để nơi gọi nói bằng chữ.
  if (moiNgay <= 0) return null

  return dong(moiNgay)
}

/**
 * Phần trăm ngân sách đã dùng, làm tròn tới số nguyên. Trả null khi chưa có
 * ngân sách. Vượt 100% thì trả đúng số thật (ví dụ 118) chứ không cắt ở 100 —
 * bồ cần biết vượt bao nhiêu.
 */
export function phanTramDaDung(nganSachChuKy: Dong | null, daChi: Dong): number | null {
  if (nganSachChuKy === null || nganSachChuKy <= 0) return null
  return Math.round((daChi * 100) / nganSachChuKy)
}

/**
 * Phần trăm thời gian chu kỳ đã trôi qua — dùng cho vạch "hôm nay" trên thanh
 * nhịp (§10 màn ①). So hai con số này với nhau mới biết đang tiêu nhanh hay chậm
 * hơn nhịp; riêng "đã dùng 76%" thì chưa nói lên điều gì.
 */
export function phanTramThoiGian(soNgayChuKy: number, soNgayConLai: number): number | null {
  if (soNgayChuKy <= 0) return null
  const daQua = soNgayChuKy - soNgayConLai
  return Math.round((daQua * 100) / soNgayChuKy)
}
