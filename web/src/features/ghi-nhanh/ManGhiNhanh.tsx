import { useState } from 'react'
import { lopSlot } from '@/shared/design/mau'
import { dong, dinhDang } from '@/shared/domain/tien'
import { ghiChi } from '@/shared/api/giao-dich'
import { deDanh } from '@/shared/api/quy'
import type { Dong } from '@/shared/api/supabase'
import { BanPhimNghin } from '@/shared/ui/BanPhimNghin'
import { SoLon } from '@/shared/ui/SoLon'
import type { TrangThaiHu } from '@/shared/domain/han-muc'

type DanhMuc = Dong<'danh_muc'>

/**
 * MÀN GHI NHANH — tính năng số 1 (§8): "toàn bộ UX xoay quanh nó".
 *
 * Mục tiêu 3 chạm của §4.1 chỉ thành sự thật nhờ hai thứ:
 *   1. Nhập theo ĐƠN VỊ NGHÌN — gõ "35" ra 35.000đ. Không có nó thì "150.000"
 *      là 6 chạm, tổng cộng 8 chạm chứ không phải 3.
 *   2. Hàng nút SỐ TẮT theo thói quen thật — chạm một cái là xong phần số.
 *
 * Đường 3 chạm: chạm danh mục → chạm số tắt → chạm Lưu.
 */

/** Class Tailwind phải là chuỗi tĩnh để trình quét tìm thấy — không ghép động được. */
// Bảng màu lấy từ `design/mau.ts`, KHÔNG chép lại ở đây. Bản chép tay cũ chỉ có
// slot 1–6 nên danh mục thứ 7 trở đi hiện màu xám sau khi nới trần lên 10.

const mauCua = (dm: DanhMuc) => lopSlot(dm.slot)

/** Số tắt theo thói quen chi tiêu hằng ngày, đơn vị nghìn. */
const SO_TAT = [20, 35, 50, 100, 200]

/**
 * Nút "Để dành" — §6.2: trên UI bồ chỉ thấy MỘT hàng nút giống nhau, khác biệt
 * nằm ở tầng dữ liệu chứ không ở tầng cảm nhận. Chọn nó thì ghi giao dịch loại
 * `chuyen_vao_quy` vào quỹ thay vì khoản chi, và số tiền KHÔNG vào tổng chi.
 */
const DE_DANH = 'de-danh' as const

type Props = {
  userId: string
  chuKyId: string
  danhMuc: DanhMuc[]
  /** Quỹ nhận tiền để dành. Rỗng ⇒ chưa có quỹ nào, nút Để dành không hiện. */
  quy: { id: string; ten: string }[]
  /** Trên mức này thì hỏi lại trước khi lưu. Lấy từ cau_hinh (§14 quy ước 5). */
  nguongXacNhan: number
  /** Hũ của chu kỳ (§7.6). Rỗng ⇒ chưa đặt hũ nào, phần này không hiện. */
  hu: TrangThaiHu[]
  /**
   * Danh mục bồ đã chạm ở lưới màn ①, hoặc `de-danh`. Có nó thì màn này mở ra
   * là đã chọn sẵn — tiết kiệm đúng một chạm của đường "3 chạm" (§4.1).
   */
  chonSan: string | null
  onXong: () => void
  onHuy: () => void
}

export function ManGhiNhanh({
  userId,
  chuKyId,
  danhMuc,
  quy,
  nguongXacNhan,
  hu,
  chonSan,
  onXong,
  onHuy,
}: Props) {
  // Mốc bắt đầu để đo S2 "mở app → lưu xong ≤ 5 giây" (§1).
  const [batDauLuc] = useState(() => performance.now())
  const [chon, setChon] = useState<DanhMuc | typeof DE_DANH | null>(() =>
    chonSan === DE_DANH ? DE_DANH : (danhMuc.find((d) => d.id === chonSan) ?? null),
  )
  const [quyChon, setQuyChon] = useState<string | null>(quy[0]?.id ?? null)
  const [nghin, setNghin] = useState('')
  const [dangLuu, setDangLuu] = useState(false)
  const [dangHoiLai, setDangHoiLai] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)

  const laDeDanh = chon === DE_DANH
  const soTien = nghin ? dong(Number(nghin) * 1000) : dong(0)
  const luuDuoc = chon !== null && soTien > 0 && !dangLuu && (!laDeDanh || quyChon !== null)
  const tenChon = chon === null ? null : laDeDanh ? 'Để dành' : chon.ten

  // §7.6: con số ≥48px của màn ① vẫn là TỔNG; số của hũ hiện ở đây, đúng lúc bồ
  // chạm danh mục. Vừa đúng chỗ vừa không phá nguyên tắc một-con-số của §10.
  const huChon =
    chon !== null && chon !== DE_DANH ? (hu.find((h) => h.danhMucId === chon.id) ?? null) : null

  /**
   * Nhập theo đơn vị nghìn nên thừa một chữ số là sai GẤP MƯỜI: gõ 100 ra 100k,
   * lỡ tay thành 1000 là 1 triệu. Trên ngưỡng thì hỏi lại một câu.
   *
   * Dưới ngưỡng thì KHÔNG hỏi — đường 3 chạm phải giữ nguyên. Chặn một lỗi hiếm
   * mà làm chậm việc xảy ra hằng ngày là đánh đổi sai.
   */
  function bamLuu() {
    if (!luuDuoc) return
    if (soTien > nguongXacNhan) setDangHoiLai(true)
    else void luu()
  }

  async function luu() {
    if (!chon) return
    setDangHoiLai(false)
    setDangLuu(true)
    setLoi(null)
    try {
      if (chon === DE_DANH) {
        if (!quyChon) throw new Error('Chưa chọn quỹ để chuyển vào')
        await deDanh(userId, chuKyId, quyChon, soTien)
      } else {
        await ghiChi({ userId, chuKyId, danhMucId: chon.id, soTien, batDauLuc })
      }
      onXong()
    } catch (e) {
      // Lỗi phải LỘ RA. Im lặng nuốt lỗi ở đây nghĩa là bồ tưởng đã ghi xong mà
      // khoản chi không tồn tại — đúng thứ tiêu chí S3 cấm.
      setLoi(e instanceof Error ? e.message : 'Chưa lưu được, thử lại giúp mình nhé')
      setDangLuu(false)
    }
  }

  if (dangHoiLai && chon) {
    return (
      <main className="min-h-dvh bg-page text-ink mx-auto grid w-full max-w-md place-items-center p-6">
        <div className="w-full text-center">
          <div className="text-sm text-ink2">Số này hơi lớn, mình hỏi lại cho chắc</div>
          <div className="mt-3">
            <SoLon soTien={soTien} />
          </div>
          <div className="mt-2 text-sm text-ink2">{tenChon}</div>

          <button
            onClick={() => void luu()}
            className="mt-8 w-full rounded-2xl bg-c1 py-4 text-lg font-semibold text-surface"
          >
            Đúng rồi, lưu nhé
          </button>
          <button
            onClick={() => setDangHoiLai(false)}
            className="mt-2 w-full rounded-2xl border border-line bg-surface py-4 text-lg
                       font-medium"
          >
            Để mình sửa lại
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-page text-ink mx-auto flex w-full max-w-md flex-col">
      {/* Số tiền — con số lớn nhất màn hình (§10 nguyên tắc 1) */}
      <div className="px-5 pt-8 pb-4 text-center">
        <div className="text-sm text-ink2">{tenChon ?? 'Chọn danh mục'}</div>
        <div className="mt-1">
          <SoLon soTien={soTien} mo={!nghin} />
        </div>
        {huChon ? (
          /* Nói số của hũ thay cho định nghĩa danh mục: lúc đã chạm đúng nút thì
             bồ không còn cần định nghĩa nữa, mà cần biết hũ còn bao nhiêu. */
          <div className="mt-1 text-xs text-muted">
            {huChon.daVuot
              ? `Hũ này đã vượt ${dinhDang(dong(Math.abs(huChon.conLai)))} — vẫn ghi bình thường nhé`
              : `Còn ${dinhDang(huChon.conLai)} trong hũ này`}
          </div>
        ) : (
          chon !== null &&
          chon !== DE_DANH &&
          chon.dinh_nghia && <div className="mt-1 text-xs text-muted">{chon.dinh_nghia}</div>
        )}
        {laDeDanh && (
          <div className="mt-1 text-xs text-muted">Không tính là chi — tiền vào quỹ</div>
        )}
      </div>

      {/* Danh mục — chạm thứ nhất */}
      <div className="grid grid-cols-3 gap-2 px-4">
        {danhMuc.map((dm) => {
          const m = mauCua(dm)
          const dangChon = chon !== null && chon !== DE_DANH && chon.id === dm.id
          return (
            <button
              key={dm.id}
              onClick={() => setChon(dm)}
              className={`rounded-2xl border-2 px-2 py-3 text-sm font-medium transition
                ${m.nen} ${m.chu} ${dangChon ? m.vien : 'border-transparent'}`}
            >
              {dm.ten}
            </button>
          )
        })}

        {/* §6.2: nút "Để dành" nằm CẠNH 5 nút danh mục, nhìn giống hệt. Khác biệt
            ở tầng dữ liệu, không ở tầng cảm nhận. Chỉ hiện khi đã có quỹ — không
            có quỹ thì tiền để dành không biết đi đâu. */}
        {quy.length > 0 && (
          <button
            onClick={() => setChon(DE_DANH)}
            className={`rounded-2xl border-2 bg-sage-soft px-2 py-3 text-sm font-medium
              text-c1-ink transition ${laDeDanh ? 'border-c1' : 'border-transparent'}`}
          >
            Để dành 🫙
          </button>
        )}
      </div>

      {/* Chọn quỹ nhận tiền — chỉ hiện khi đã chọn Để dành và có nhiều hơn một quỹ */}
      {laDeDanh && quy.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto px-4">
          {quy.map((q) => (
            <button
              key={q.id}
              onClick={() => setQuyChon(q.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${
                quyChon === q.id ? 'border-c1 bg-c1-t text-c1-ink' : 'border-line bg-surface'
              }`}
            >
              {q.ten}
            </button>
          ))}
        </div>
      )}

      {/* Số tắt — chạm thứ hai */}
      <div className="mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {SO_TAT.map((k) => (
          <button
            key={k}
            onClick={() => setNghin(String(k))}
            className="shrink-0 rounded-full border border-line bg-surface px-4 py-2 text-sm
                       font-medium tabular-nums"
          >
            {k}k
          </button>
        ))}
      </div>

      <div className="mt-auto px-4 pb-4">
        <BanPhimNghin nghin={nghin} onDoi={setNghin} />

        {loi && <p className="mt-2 text-center text-sm text-nguy-cap">{loi}</p>}

        {/* Lưu — chạm thứ ba */}
        <button
          onClick={onHuy}
          className="text-ink2 mt-2 w-full py-2 text-sm"
          style={{ order: 1 }}
        >
          Thôi, để sau
        </button>

        <button
          onClick={bamLuu}
          disabled={!luuDuoc}
          className="mt-3 w-full rounded-2xl bg-c1 py-4 text-lg font-semibold text-surface
                     transition disabled:bg-line disabled:text-muted"
        >
          {dangLuu ? 'Đang lưu…' : 'Lưu'}
        </button>
      </div>
    </main>
  )
}
