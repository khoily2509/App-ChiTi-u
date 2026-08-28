import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import '@/index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Không tìm thấy #root trong index.html')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/**
 * Đăng ký service worker — CHỈ ở bản build thật.
 *
 * Bật ở chế độ dev thì service worker sẽ cache mất bản cũ và HMR ngừng ăn: sửa
 * code mà màn hình không đổi, rồi mất nửa tiếng đi tìm nguyên nhân ở nhầm chỗ.
 *
 * Hỏng thì im lặng bỏ qua: service worker chỉ là lưới an toàn lúc mất sóng, app
 * không có nó vẫn chạy đủ. Đổ lỗi ra màn hình vì một tính năng phụ là sai tỉ lệ.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}
