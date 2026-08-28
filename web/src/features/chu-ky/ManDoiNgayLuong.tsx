import { useState } from 'react'
import { ngayLocal, dinhDangNgay, themNgay, type NgayLocal } from '@/shared/domain/chu-ky'
import { doiNgayBatDau, type ChuKyDb } from '@/shared/api/chu-ky'

/**
 * Đổi ngày bắt đầu chu kỳ khi lương về sớm hoặc trễ (§7.2).
 *
 * §7.2 cố ý KHÔNG làm bảng ngày lễ Việt Nam — lễ đổi mỗi năm, bảng sẽ mục và sai
 * âm thầm. Cho bồ sửa tay một chạm là đủ, và sai kiểu này thì bồ thấy ngay.
 *
 * Bắt buộc hiện "Đã chuyển N giao dịch" sau khi đổi: ranh giới dịch mà không báo
 * thì giao dịch đi lạc sang chu kỳ khác mà bồ không biết.
 */

/** Lệch tối đa cho phép, tính từ ngày dự kiến. Lương sớm/trễ quá 10 ngày là bất thường. */
const LECH_TOI_DA = 10

type Props = {
  chuKy: ChuKyDb
  onXong: (daChuyen: number) => void
  onHuy: () => void
}

export function ManDoiNgayLuong({ chuKy, onXong, onHuy }: Props) {
  const goc = ngayLocal(chuKy.ngay_bat_dau_du_kien)
  // Ngày chu kỳ ĐANG bắt đầu, khác với ngày DỰ KIẾN ở trên.
  //
  // Hai mốc này phải tách bạch. `goc` trả lời "lương về sớm hay trễ so với kế
  // hoạch" — dùng cho dòng chữ và cho trần ±10 ngày. `dangLa` trả lời "bồ có
  // vừa đổi gì không" — dùng cho nút Lưu. Lúc đầu tôi dùng chung `goc` cho cả
  // hai và nó hỏng đúng ca hoàn tác: chu kỳ đang chạy từ 01/08 (trễ 1 ngày), bồ
  // bấm "Về dự kiến" để lùi lại 31/07 thì độ lệch so với dự kiến về 0, nút đọc
  // thành "Chưa đổi gì" rồi tự khoá. Tức là đổi ngày lương xong thì KHÔNG BAO
  // GIỜ lùi lại được, và nút "Về dự kiến" chết hẳn.
  const dangLa = ngayLocal(chuKy.ngay_bat_dau_thuc_te)
  const [chon, setChon] = useState<NgayLocal>(dangLa)
  const [dangLuu, setDangLuu] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)

  const lech = Math.round(
    (new Date(`${chon}T00:00:00Z`).getTime() - new Date(`${goc}T00:00:00Z`).getTime()) /
      86_400_000,
  )

  async function luu() {
    if (dangLuu) return
    setDangLuu(true)
    setLoi(null)
    try {
      const { daChuyen } = await doiNgayBatDau(chuKy.id, chon)
      onXong(daChuyen)
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Chưa đổi được, thử lại nhé')
      setDangLuu(false)
    }
  }

  return (
    <main className="min-h-dvh bg-page text-ink mx-auto flex w-full max-w-md flex-col">
      <div className="flex-1 px-5 pt-10">
        <h1 className="font-serif text-2xl">Ngày lương</h1>
        <p className="mt-1 text-sm text-ink2">
          Lương về sớm hay trễ thì chỉnh ở đây, chu kỳ sẽ tự khớp lại 🌱
        </p>

        <div className="mt-8 rounded-2xl bg-surface p-5 text-center">
          <div className="text-sm text-ink2">Chu kỳ này bắt đầu từ</div>
          <div className="mt-1 text-4xl font-semibold tabular-nums">
            {dinhDangNgay(chon, true)}
          </div>
          {lech !== 0 && (
            <div className="mt-2 text-sm text-ink2">
              {lech < 0 ? `Sớm hơn ${-lech} ngày` : `Trễ hơn ${lech} ngày`} so với dự kiến{' '}
              {dinhDangNgay(goc)}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={() => setChon(themNgay(chon, -1))}
            disabled={lech <= -LECH_TOI_DA}
            className="flex-1 rounded-2xl border border-line bg-surface py-4 text-lg font-medium
                       disabled:text-muted"
          >
            − 1 ngày
          </button>
          <button
            onClick={() => setChon(goc)}
            className="rounded-2xl px-4 py-4 text-sm text-ink2 underline"
          >
            Về dự kiến
          </button>
          <button
            onClick={() => setChon(themNgay(chon, 1))}
            disabled={lech >= LECH_TOI_DA}
            className="flex-1 rounded-2xl border border-line bg-surface py-4 text-lg font-medium
                       disabled:text-muted"
          >
            + 1 ngày
          </button>
        </div>

        {/* §7.2 rule 3: đổi ranh giới thì giao dịch được gán lại. Nói trước để bồ
            không bất ngờ khi thấy số liệu chu kỳ thay đổi. */}
        <p className="mt-6 text-xs text-muted">
          Đổi ngày này thì chu kỳ trước co lại cho khít, và các khoản đã ghi trong những ngày
          chênh lệch sẽ được chuyển sang đúng chu kỳ. Mình sẽ báo đã chuyển bao nhiêu khoản.
        </p>

        {loi && <p className="mt-3 text-sm text-nguy-cap">{loi}</p>}
      </div>

      <div className="p-4">
        <button
          onClick={() => void luu()}
          disabled={dangLuu || chon === dangLa}
          className="w-full rounded-2xl bg-c1 py-4 text-lg font-semibold text-surface
                     disabled:bg-line disabled:text-muted"
        >
          {dangLuu ? 'Đang đổi…' : chon === dangLa ? 'Chưa đổi gì' : 'Lưu ngày lương'}
        </button>
        <button onClick={onHuy} className="mt-2 w-full py-3 text-sm text-ink2">
          Quay lại
        </button>
      </div>
    </main>
  )
}
