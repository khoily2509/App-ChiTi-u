import { useState } from 'react'
import { sb } from '@/shared/api/supabase'
import { MAT_KHAU_TOI_THIEU } from '@/features/dang-nhap/ManDangNhap'

/**
 * ĐỔI MẬT KHẨU — làm ngay trong app, không qua email.
 *
 * Có màn này thì đường khôi phục qua email trở thành lối thoát hiếm khi dùng chứ
 * không phải đường chính. Quan trọng vì link đặt lại mật khẩu cũng dính đúng cái
 * bẫy iOS của magic link: nó mở bằng Safari, không mở trong app.
 *
 * Người dùng đã đăng nhập rồi nên `updateUser` không cần mật khẩu cũ — Supabase
 * đã xác thực bằng phiên hiện tại.
 */
export function ManDoiMatKhau({ onXong, onQuayLai }: { onXong: () => void; onQuayLai: () => void }) {
  const [moi, setMoi] = useState('')
  const [lai, setLai] = useState('')
  const [dangLuu, setDangLuu] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)

  const quaNgan = moi.length > 0 && moi.length < MAT_KHAU_TOI_THIEU
  const lechNhau = lai.length > 0 && moi !== lai
  const luuDuoc = moi.length >= MAT_KHAU_TOI_THIEU && moi === lai && !dangLuu

  async function luu(e: React.FormEvent) {
    e.preventDefault()
    if (!luuDuoc) return
    setLoi(null)
    setDangLuu(true)
    const { error } = await sb.auth.updateUser({ password: moi })
    setDangLuu(false)
    if (error) {
      setLoi(
        error.message.toLowerCase().includes('should be different')
          ? 'Mật khẩu mới trùng mật khẩu cũ'
          : 'Chưa đổi được, thử lại nhé',
      )
      return
    }
    onXong()
  }

  return (
    <main className="bg-page text-ink mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <form onSubmit={luu} className="flex-1 px-5 pt-10">
        <h1 className="font-serif text-2xl">Đổi mật khẩu</h1>
        <p className="text-ink2 mt-1 text-sm">
          Ít nhất {MAT_KHAU_TOI_THIEU} ký tự. iPhone sẽ hỏi có lưu hộ không 🌱
        </p>

        {/* Ô email ẩn: trình quản lý mật khẩu cần biết mật khẩu này thuộc tài khoản
            nào mới lưu đúng chỗ. Thiếu nó thì iOS lưu thành một mục không tên. */}
        <input type="email" name="email" autoComplete="username" hidden readOnly value="" />

        <input
          type="password"
          name="new-password"
          required
          minLength={MAT_KHAU_TOI_THIEU}
          autoComplete="new-password"
          value={moi}
          onChange={(e) => setMoi(e.target.value)}
          placeholder="Mật khẩu mới"
          aria-label="Mật khẩu mới"
          className="border-line bg-surface focus:border-sage mt-6 w-full rounded-xl border px-4
                     py-3 text-base outline-none"
        />
        {quaNgan && (
          <p className="text-nguy-cap mt-1 text-xs">Cần ít nhất {MAT_KHAU_TOI_THIEU} ký tự</p>
        )}

        <input
          type="password"
          name="confirm-password"
          required
          autoComplete="new-password"
          value={lai}
          onChange={(e) => setLai(e.target.value)}
          placeholder="Gõ lại mật khẩu mới"
          aria-label="Gõ lại mật khẩu mới"
          className="border-line bg-surface focus:border-sage mt-2 w-full rounded-xl border px-4
                     py-3 text-base outline-none"
        />
        {lechNhau && <p className="text-nguy-cap mt-1 text-xs">Hai ô chưa khớp nhau</p>}

        {loi && <p className="text-nguy-cap mt-3 text-sm">{loi}</p>}

        <button
          type="submit"
          disabled={!luuDuoc}
          className="bg-c1 text-surface disabled:bg-line disabled:text-muted mt-5 w-full rounded-2xl
                     py-4 text-lg font-semibold"
        >
          {dangLuu ? 'Đang đổi…' : 'Đổi mật khẩu'}
        </button>
      </form>

      <button onClick={onQuayLai} className="text-ink2 w-full py-4 text-sm">
        Quay lại
      </button>
    </main>
  )
}
