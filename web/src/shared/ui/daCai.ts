/**
 * App đang chạy từ MÀN HÌNH CHÍNH hay từ trong trình duyệt?
 *
 * Quan trọng hơn vẻ ngoài: trên iOS, Web Push CHỈ chạy khi app đã được thêm vào
 * màn hình chính. Mở trong Safari thì `Notification.requestPermission()` có tồn
 * tại nhưng không bao giờ gửi được gì — hỏi quyền lúc đó là hứa suông (AT-06).
 *
 * Hai cách kiểm vì hai nền tảng khác nhau: `display-mode: standalone` là chuẩn
 * chung, còn `navigator.standalone` là thứ riêng của Safari iOS — đúng nền tảng
 * bồ dùng (H1), nên không bỏ được cái nào.
 */
export function daCaiLenManHinh(): boolean {
  const chuan = window.matchMedia?.('(display-mode: standalone)').matches ?? false
  const ios = (navigator as { standalone?: boolean }).standalone === true
  return chuan || ios
}

/** Có phải Safari trên iPhone/iPad không — hướng dẫn cài khác hẳn Android. */
export function laIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}
