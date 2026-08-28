/**
 * SERVICE WORKER — chỉ để app MỞ ĐƯỢC khi mạng chập chờn.
 *
 * Cố ý viết tay, không dùng Workbox: §5 cắt mọi phụ thuộc không cần thiết, và
 * toàn bộ logic ở đây gói gọn trong ba chục dòng. Thêm một thư viện build-time
 * chỉ để sinh ra ngần này là đánh đổi sai cho người mới học.
 *
 * ⚠️ ĐIỀU QUAN TRỌNG NHẤT: KHÔNG BAO GIỜ cache lời gọi Supabase.
 * Số dư cũ hiện ra như số dư thật thì tệ hơn hẳn một thông báo lỗi — bồ sẽ tiêu
 * theo con số sai mà không biết. §13 "fail closed" áp cả ở đây: thà không có số
 * còn hơn có số sai.
 *
 * Hàng đợi ghi offline (AT-07) KHÔNG nằm ở đây, nó là việc của Pha 4 phần sau,
 * dùng IndexedDB. Service worker này chỉ lo phần VỎ.
 */

const KHO = 'sobo-vo-v1'

/**
 * Chỉ đặt sẵn trang gốc. Vite băm tên file JS/CSS mỗi lần build nên không liệt
 * kê cứng được — chúng được cache dần theo kiểu "mạng trước, hỏng thì lấy bản
 * đã lưu" ở dưới.
 */
const DAT_SAN = ['/', '/icon.svg', '/manifest.webmanifest']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(KHO)
      .then((k) => k.addAll(DAT_SAN))
      // Không chặn việc cài chỉ vì một file lẻ tải hỏng.
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ten) => Promise.all(ten.filter((t) => t !== KHO).map((t) => caches.delete(t))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // Supabase và mọi thứ khác miền: ĐỂ YÊN, không đụng vào. Đây là dữ liệu tiền.
  if (url.origin !== self.location.origin) return
  // API cùng miền (sau này có /api/ingest) cũng vậy.
  if (url.pathname.startsWith('/api/')) return

  // ── Tài sản BẤT BIẾN: bản lưu trước, khỏi chờ mạng ────────────────────────
  //
  // Đo ngày 27/08/2026: mở app từ icon mất gần 5 giây, phần lớn là chờ mạng cho
  // những file KHÔNG BAO GIỜ ĐỔI. Tên file trong `/assets/` chứa mã băm nội
  // dung, nên một tên chỉ ứng với đúng một nội dung — đổi nội dung thì Vite sinh
  // tên khác. Hỏi lại mạng về chúng là hỏi một câu đã biết trước đáp án.
  //
  // Font cũng vậy: `/fonts/` là bộ nướng sẵn từ Pha 0, thay font là thay tên.
  //
  // Vẫn nạp ngầm bản mới ở NỀN sau khi đã trả bản lưu, để lần mở sau tự có bản
  // mới mà lần này không phải chờ.
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/fonts/')) {
    e.respondWith(
      caches.match(req).then((luu) => {
        if (luu) {
          e.waitUntil(
            fetch(req)
              .then((res) => (res.ok ? caches.open(KHO).then((k) => k.put(req, res)) : undefined))
              .catch(() => {}),
          )
          return luu
        }
        return fetch(req).then((res) => {
          if (res.ok) {
            const ban = res.clone()
            caches.open(KHO).then((k) => k.put(req, ban))
          }
          return res
        })
      }),
    )
    return
  }

  // Vỏ app (HTML, manifest): mạng trước, hỏng thì lấy bản đã lưu. Mấy file này
  // TRỎ TỚI mọi thứ khác nên phải luôn mới — lấy bản lưu trước ở đây là cách
  // chắc nhất để bồ mắc kẹt ở bản cũ sau mỗi lần deploy.
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const ban = res.clone()
          caches.open(KHO).then((k) => k.put(req, ban))
        }
        return res
      })
      .catch(async () => {
        const luu = await caches.match(req)
        if (luu) return luu
        // Điều hướng mà không có bản lưu ⇒ trả trang gốc, để app tự dựng lại.
        if (req.mode === 'navigate') {
          const goc = await caches.match('/')
          if (goc) return goc
        }
        throw new Error('Không có mạng và chưa có bản lưu')
      }),
  )
})

/**
 * NHẬN THÔNG BÁO ĐẨY (§9.2 · §12 WEEK_FLOWER_NUDGE).
 *
 * Gói đẩy KHÔNG mang nội dung — Worker chỉ gửi một tín hiệu rỗng. Nhờ vậy phía
 * server bỏ được toàn bộ phần mã hoá aes128gcm, thứ chiếm phần lớn độ phức tạp
 * của Web Push.
 *
 * Làm được vì §9.2 chốt lời nhắc chỉ có ĐÚNG MỘT câu. Worker đã quyết định "khi
 * nào" (4/7 cánh, còn ít nhất một ngày, mỗi tuần một lần); ở đây chỉ cần biết
 * "có" chứ không cần biết "gì".
 */
self.addEventListener('push', (e) => {
  e.waitUntil(
    self.registration.showNotification('Còn một ngày nữa là hoa nở đủ 🌼', {
      body: 'Ghi một khoản hôm nay là tuần này đủ năm cánh.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      // Cùng tag ⇒ thông báo mới THAY THẾ cái cũ thay vì chồng lên. Bồ mở máy ra
      // thấy ba lời nhắc giống hệt nhau là cách nhanh nhất để bồ tắt thông báo.
      tag: 'hoa-cuc-tuan',
      lang: 'vi',
    }),
  )
})

/** Chạm vào thông báo ⇒ mở app, hoặc nhảy về cửa sổ đang mở nếu đã có. */
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ds) => {
      for (const c of ds) if ('focus' in c) return c.focus()
      return self.clients.openWindow('/')
    }),
  )
})
