import { sb, bocLoi } from './supabase'
import { daCaiLenManHinh, laIos } from '@/shared/ui/daCai'

/**
 * ĐĂNG KÝ NHẬN THÔNG BÁO (§12 `WEEK_FLOWER_NUDGE`).
 *
 * Khoá công khai VAPID — cùng cặp với khoá riêng đặt làm secret của Worker. Công
 * khai được theo thiết kế: trình duyệt cần nó để đăng ký, và nó không ký được gì.
 */
const VAPID_CONG_KHAI =
  'BOCzI3mUgF3ek4bcTX_Tl9PgPdttk-dkaWnu3vlX_zkZxq5WVYbymfWzMlzKnh8kbKX8do6bqMeyijLM56QdFGk'

export type TrangThaiThongBao =
  | 'chua_cai_app' //  iOS: phải ra màn hình chính trước
  | 'khong_ho_tro' //  trình duyệt không có Push API
  | 'chua_hoi' //      chưa xin quyền lần nào
  | 'bi_tu_choi' //    bồ đã từ chối — KHÔNG hỏi lại được nữa
  | 'da_bat'

/**
 * base64url → ArrayBuffer, dạng `applicationServerKey` yêu cầu.
 *
 * Trả `ArrayBuffer` chứ không `Uint8Array`: kiểu của `applicationServerKey` đòi
 * bộ đệm gắn với bộ nhớ thường, mà `Uint8Array` thì có thể trỏ vào
 * `SharedArrayBuffer` nên `tsc` từ chối.
 */
function tuBase64Url(s: string): ArrayBuffer {
  const dem = '='.repeat((4 - (s.length % 4)) % 4)
  const chuan = (s + dem).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(chuan)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out.buffer as ArrayBuffer
}

/**
 * Trạng thái hiện tại, để UI biết nên hiện gì.
 *
 * `chua_cai_app` đứng TRƯỚC mọi thứ khác: trên iOS, `Notification` tồn tại cả khi
 * mở trong Safari, nhưng xin quyền lúc đó là hứa suông — push chỉ chạy khi app đã
 * ở màn hình chính. Hỏi rồi không gửi được gì là cách chắc nhất để mất niềm tin.
 */
export function trangThaiThongBao(): TrangThaiThongBao {
  if (laIos() && !daCaiLenManHinh()) return 'chua_cai_app'
  if (!('Notification' in window) || !('PushManager' in window)) return 'khong_ho_tro'
  if (Notification.permission === 'granted') return 'da_bat'
  if (Notification.permission === 'denied') return 'bi_tu_choi'
  return 'chua_hoi'
}

/**
 * Xin quyền rồi lưu subscription. Trả về trạng thái sau khi xong.
 *
 * PHẢI gọi từ một cú chạm của bồ — trình duyệt từ chối `requestPermission()` gọi
 * tự động, và iOS còn không hiện hộp thoại nào cả.
 */
export async function batThongBao(userId: string): Promise<TrangThaiThongBao> {
  const truoc = trangThaiThongBao()
  if (truoc === 'chua_cai_app' || truoc === 'khong_ho_tro') return truoc

  const quyen = await Notification.requestPermission()
  if (quyen !== 'granted') return quyen === 'denied' ? 'bi_tu_choi' : 'chua_hoi'

  const reg = await navigator.serviceWorker.ready
  // Dùng lại subscription cũ nếu có: đăng ký lại tạo endpoint mới, và endpoint cũ
  // nằm lại trong bảng như một dòng chết mà không ai dọn.
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      // Bắt buộc `true`: trình duyệt không cho đăng ký push im lặng.
      userVisibleOnly: true,
      applicationServerKey: tuBase64Url(VAPID_CONG_KHAI),
    }))

  const j = sub.toJSON()
  bocLoi(
    await sb
      .from('push_subscription')
      .upsert(
        {
          user_id: userId,
          endpoint: sub.endpoint,
          p256dh: j.keys?.p256dh ?? '',
          auth: j.keys?.auth ?? '',
          trang_thai: 'active',
        },
        // Cùng máy đăng ký lại thì cập nhật dòng cũ, và quan trọng hơn là ĐƯA nó
        // từ 'dead' về 'active' — iOS làm subscription hết hạn âm thầm, app tự
        // đăng ký lại mỗi lần mở là cách duy nhất phát hiện (§5).
        { onConflict: 'user_id,endpoint' },
      )
      .select(),
    'Lưu đăng ký thông báo',
  )

  await sb.from('su_kien').insert({
    user_id: userId,
    ma: 'PUSH_SUBSCRIBED',
    doi_tuong: sub.endpoint.slice(-24),
    du_lieu: { nen_tang: laIos() ? 'ios' : 'khac' },
  })

  return 'da_bat'
}
