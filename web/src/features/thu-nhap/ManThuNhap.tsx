import { useState } from 'react'
import { dong, dinhDang } from '@/shared/domain/tien'
import { ghiThucNhan } from '@/shared/api/thu-nhap'
import { BanPhimNghin } from '@/shared/ui/BanPhimNghin'
import { TienDoBuoc } from '@/shared/ui/TienDoBuoc'
import { SoLon } from '@/shared/ui/SoLon'

/**
 * Nhập tổng thực nhận của chu kỳ (§7.5).
 *
 * Đây là con số mở khoá "hôm nay còn tiêu được" — thứ quan trọng nhất màn ①.
 * Chưa có nó thì màn chính không có con số nào để hiện.
 */

/** Gợi ý sẵn theo thu nhập thật của bồ (§2: 9–10 triệu, một nguồn). */
const GOI_Y_NGHIN = [9_000, 9_500, 10_000]

/** Mặc định 9.000.000đ — con số §2 ghi là mức thu nhập hiện tại. */
const MAC_DINH_NGHIN = '9000'

type Props = {
  userId: string
  chuKyId: string
  /** Số đã nhập trước đó, để lần sửa sau không phải gõ lại từ đầu. */
  daCo: number | null
  onXong: () => void
  onHuy: () => void
  /**
   * Có mặt ⇒ màn này đang là một bước trong luồng lương → để dành → hũ → tổng
   * kết. Hiện thanh tiến độ để bồ biết còn mấy bước, khỏi bỏ dở vì tưởng luồng
   * dài vô tận.
   */
  tienDo?: { buoc: number; tong: number } | undefined
}

export function ManThuNhap({ userId, chuKyId, daCo, onXong, onHuy, tienDo }: Props) {
  const [nghin, setNghin] = useState(daCo ? String(Math.round(daCo / 1000)) : MAC_DINH_NGHIN)
  const [dangLuu, setDangLuu] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)

  const soTien = nghin ? dong(Number(nghin) * 1000) : dong(0)

  async function luu() {
    if (soTien <= 0 || dangLuu) return
    setDangLuu(true)
    setLoi(null)
    try {
      await ghiThucNhan(userId, chuKyId, soTien)
      onXong()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Chưa lưu được, thử lại giúp mình nhé')
      setDangLuu(false)
    }
  }

  return (
    <main className="min-h-dvh bg-page text-ink mx-auto flex w-full max-w-md flex-col">
      <div className="px-5 pt-8 pb-4 text-center">
        <div className="text-left">{tienDo && <TienDoBuoc {...tienDo} />}</div>
        <div className="text-sm text-ink2">Lương chu kỳ này</div>
        <div className="mt-1">
          <SoLon soTien={soTien} />
        </div>
        <p className="mt-2 text-xs text-muted">
          Nhập tổng thực nhận — số tiền thật sự về tài khoản 🌱
        </p>
      </div>

      <div className="flex justify-center gap-2 px-4">
        {GOI_Y_NGHIN.map((k) => (
          <button
            key={k}
            onClick={() => setNghin(String(k))}
            className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium
                       tabular-nums"
          >
            {dinhDang(dong(k * 1000))}
          </button>
        ))}
      </div>

      <div className="mt-auto px-4 pb-4">
        <BanPhimNghin nghin={nghin} onDoi={setNghin} />

        {loi && <p className="mt-2 text-center text-sm text-nguy-cap">{loi}</p>}

        <button
          onClick={() => void luu()}
          disabled={soTien <= 0 || dangLuu}
          className="mt-3 w-full rounded-2xl bg-c1 py-4 text-lg font-semibold text-surface
                     disabled:bg-line disabled:text-muted"
        >
          {dangLuu ? 'Đang lưu…' : 'Lưu lương'}
        </button>
        <button onClick={onHuy} className="mt-2 w-full py-3 text-sm text-ink2">
          Để sau
        </button>
      </div>
    </main>
  )
}
