import { useState } from 'react'
import { sb } from '@/shared/api/supabase'

/** Tối thiểu 8 ký tự. Supabase mặc định cho 6 — ngắn hơn mức đáng gọi là mật khẩu. */
export const MAT_KHAU_TOI_THIEU = 8

/**
 * ĐĂNG NHẬP BẰNG EMAIL + MẬT KHẨU.
 *
 * §5 ban đầu chọn magic link với lý do "bồ không phải nhớ thêm một thứ nữa".
 * Lý do đó đúng, nhưng thực tế lật lại nó — Khôi báo 28/08/2026: "mỗi lần muốn
 * vào app là phải điền gmail", và mở app mất gần 5 giây.
 *
 * GỐC RỄ: trên iOS, app đã đưa ra màn hình chính chạy trong kho lưu trữ RIÊNG,
 * tách hẳn Safari.
 *
 *   bấm icon → app, chưa có phiên → hỏi email
 *   bấm link trong email → link mở bằng SAFARI
 *   phiên rơi vào kho của Safari
 *   quay lại icon → app vẫn trắng tay → hỏi email tiếp
 *
 * Một vòng lặp không lối ra. Nhìn từ phía bồ thì nó chỉ là "app bắt đăng nhập
 * mãi" — và đó là loại ma sát §1 nói thẳng là đủ để bỏ app.
 *
 * VÌ SAO MẬT KHẨU CHỨ KHÔNG PHẢI MÃ SỐ: hướng mã 6-8 số cũng sửa được vòng lặp,
 * nhưng email Supabase gửi ra CHỈ CÓ LINK, không có mã — và gói miễn phí không
 * cho sửa mẫu email nếu chưa cấu hình SMTP riêng. Đã kiểm tận nơi trên dashboard
 * lẫn trong hộp thư thật.
 *
 * Mật khẩu bỏ hẳn email khỏi đường đăng nhập hằng ngày, nên cũng gỡ luôn giới
 * hạn 2–4 email/giờ của gói miễn phí — thứ sẽ khoá bồ ngoài cửa gần một tiếng
 * nếu lỡ bấm gửi lại vài lần.
 *
 * Còn lo "bồ phải nhớ thêm một thứ" thì Keychain của iPhone giữ hộ: lần đầu iOS
 * hỏi có lưu không, từ đó về sau tự điền một chạm. Đó là lý do form này để cả ô
 * email và ô mật khẩu trong CÙNG một `<form>` kèm `autoComplete` đúng chuẩn —
 * thiếu một trong hai thì iOS không nhận ra đây là form đăng nhập và không mời
 * lưu.
 */
export function ManDangNhap() {
  const [email, setEmail] = useState('')
  const [matKhau, setMatKhau] = useState('')
  const [cheDo, setCheDo] = useState<'dang_nhap' | 'dang_ky'>('dang_nhap')
  const [dangChay, setDangChay] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)
  const [thongBao, setThongBao] = useState<string | null>(null)
  const [daGuiKhoiPhuc, setDaGuiKhoiPhuc] = useState(false)

  async function xuLy(e: React.FormEvent) {
    e.preventDefault()
    if (dangChay) return
    setLoi(null)
    setThongBao(null)
    setDangChay(true)

    if (cheDo === 'dang_nhap') {
      const { error } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password: matKhau,
      })
      setDangChay(false)
      if (error) {
        setLoi(error.message || 'Email hoặc mật khẩu chưa đúng')
        return
      }
    } else {
      // Đăng ký tài khoản mới
      const { data, error } = await sb.auth.signUp({
        email: email.trim(),
        password: matKhau,
      })
      setDangChay(false)
      if (error) {
        setLoi(error.message || 'Chưa đăng ký được — vui lòng thử lại')
        return
      }
      if (data.session) {
        // Đã tự động đăng nhập
      } else {
        setThongBao('Đã gửi email xác nhận! Bạn mở hòm thư bấm xác nhận rồi quay lại đăng nhập nhé 🌱')
        setCheDo('dang_nhap')
      }
    }
  }

  async function quenMatKhau() {
    if (!email.trim()) {
      setLoi('Điền email vào trước đã nhé')
      return
    }
    setLoi(null)
    setThongBao(null)
    setDangChay(true)
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    })
    setDangChay(false)
    if (error) {
      setLoi('Chưa gửi được — thử lại sau một chút')
      return
    }
    setDaGuiKhoiPhuc(true)
  }

  if (daGuiKhoiPhuc) {
    return (
      <main className="bg-page text-ink mx-auto grid min-h-dvh w-full max-w-md place-items-center p-6">
        <div className="max-w-xs text-center">
          <div className="text-4xl">🌱</div>
          <h1 className="mt-3 font-serif text-2xl">Gửi rồi nhé</h1>
          <p className="text-ink2 mt-2 text-sm">
            Mở hộp thư <b className="break-all">{email}</b> rồi bấm link để đặt lại mật khẩu.
          </p>
          <p className="text-muted mt-3 text-xs">
            Link sẽ mở bằng Safari. Đặt mật khẩu mới xong thì quay lại app này và đăng nhập bằng
            mật khẩu vừa đặt.
          </p>
          <button
            onClick={() => setDaGuiKhoiPhuc(false)}
            className="text-ink2 mt-5 w-full py-3 text-sm underline"
          >
            Quay lại đăng nhập
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-page text-ink grid min-h-dvh place-items-center p-6">
      <form onSubmit={xuLy} className="w-full max-w-xs">
        <h1 className="font-serif text-3xl">Sổ của Bồ</h1>
        <p className="text-ink2 mt-1 text-sm">
          {cheDo === 'dang_nhap' ? 'Đăng nhập một lần rồi thôi 🌱' : 'Tạo tài khoản mới 🌱'}
        </p>

        {/* Tab chuyển đổi Đăng nhập / Đăng ký */}
        <div className="bg-surface2 mt-4 flex rounded-xl p-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setCheDo('dang_nhap')
              setLoi(null)
            }}
            className={`flex-1 rounded-lg py-2 font-medium transition-colors ${
              cheDo === 'dang_nhap' ? 'bg-surface text-ink font-semibold shadow-xs' : 'text-ink2'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setCheDo('dang_ky')
              setLoi(null)
            }}
            className={`flex-1 rounded-lg py-2 font-medium transition-colors ${
              cheDo === 'dang_ky' ? 'bg-surface text-ink font-semibold shadow-xs' : 'text-ink2'
            }`}
          >
            Tạo tài khoản mới
          </button>
        </div>

        <input
          type="email"
          name="email"
          required
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@cua.ban"
          aria-label="Email"
          className="border-line bg-surface focus:border-sage mt-4 w-full rounded-xl border px-4
                     py-3 text-base outline-none"
        />

        <input
          type="password"
          name="password"
          required
          minLength={MAT_KHAU_TOI_THIEU}
          autoComplete={cheDo === 'dang_nhap' ? 'current-password' : 'new-password'}
          value={matKhau}
          onChange={(e) => setMatKhau(e.target.value)}
          placeholder="Mật khẩu (tối thiểu 8 ký tự)"
          aria-label="Mật khẩu"
          className="border-line bg-surface focus:border-sage mt-2 w-full rounded-xl border px-4
                     py-3 text-base outline-none"
        />

        {loi && <p className="text-nguy-cap mt-2 text-sm">{loi}</p>}
        {thongBao && <p className="text-c1 mt-2 text-sm leading-relaxed">{thongBao}</p>}

        <button
          type="submit"
          disabled={dangChay}
          className="bg-c1 text-surface mt-4 w-full rounded-xl py-3 font-semibold disabled:opacity-60"
        >
          {dangChay
            ? 'Đang xử lý…'
            : cheDo === 'dang_nhap'
              ? 'Vào sổ'
              : 'Đăng ký tài khoản'}
        </button>

        {cheDo === 'dang_nhap' && (
          <button
            type="button"
            onClick={() => void quenMatKhau()}
            disabled={dangChay}
            className="text-ink2 mt-3 w-full py-2 text-sm underline"
          >
            Quên mật khẩu
          </button>
        )}
      </form>
    </main>
  )
}
