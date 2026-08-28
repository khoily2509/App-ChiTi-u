import { useState } from 'react'
import { dong, dinhDang, type Dong as Tien } from '@/shared/domain/tien'
import { deDanhTuMoiNgay, moiNgayTuDeDanh } from '@/shared/domain/ngan-sach'
import { datDeDanhDinhMuc } from '@/shared/api/chu-ky'
import { BanPhimNghin } from '@/shared/ui/BanPhimNghin'
import { TienDoBuoc } from '@/shared/ui/TienDoBuoc'

/**
 * ĐẶT ĐỂ DÀNH — §7.2, nhập được từ CẢ HAI đầu.
 *
 * Ba con số ràng buộc bởi một phương trình:
 *     thu_nhap = de_danh + (moi_ngay × so_ngay) + tra_no_ky_nay
 * nên gõ ô nào thì ô kia tự tính. Không thêm logic, chỉ thêm một ô — mà hai
 * người nghĩ về tiền theo hai kiểu khác nhau, ép một kiểu là mất một nửa.
 *
 * Chỉ `de_danh` được LƯU (cột chu_ky.so_tien_de_danh_dinh_muc); `moi_ngay` luôn
 * là số dẫn xuất. Một nguồn sự thật, không có chỗ cho hai số lệch nhau (§6.3).
 */

type O = 'de_danh' | 'moi_ngay'

type Props = {
  chuKyId: string
  thuNhap: Tien
  traNo: Tien
  soNgayChuKy: number
  daCo: number
  onXong: () => void
  onHuy: () => void
  /**
   * Có mặt ⇒ màn này đang là một bước trong luồng lương → để dành → hũ → tổng
   * kết. Hiện thanh tiến độ để bồ biết còn mấy bước, khỏi bỏ dở vì tưởng luồng
   * dài vô tận.
   */
  tienDo?: { buoc: number; tong: number } | undefined
}

export function ManDeDanh({
  chuKyId,
  thuNhap,
  traNo,
  soNgayChuKy,
  daCo,
  onXong,
  onHuy,
  tienDo,
}: Props) {
  const [oDangGo, setODangGo] = useState<O>('de_danh')
  const [nghin, setNghin] = useState(daCo > 0 ? String(Math.round(daCo / 1000)) : '')
  const [dangLuu, setDangLuu] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)

  const soGo = nghin ? dong(Number(nghin) * 1000) : dong(0)

  // Ô đang gõ là số thật; ô kia suy ra. Đổi ô thì đổi luôn vai trò.
  const deDanh =
    oDangGo === 'de_danh' ? soGo : deDanhTuMoiNgay(thuNhap, traNo, soGo, soNgayChuKy)
  const moiNgay =
    oDangGo === 'moi_ngay' ? soGo : moiNgayTuDeDanh(thuNhap, traNo, deDanh, soNgayChuKy)

  /** Đổi ô đang gõ, mang theo giá trị hiện tại của ô đích để không mất ngữ cảnh. */
  function doiO(o: O) {
    if (o === oDangGo) return
    setNghin(String(Math.round((o === 'de_danh' ? deDanh : moiNgay) / 1000)))
    setODangGo(o)
  }

  async function luu() {
    if (dangLuu) return
    setDangLuu(true)
    setLoi(null)
    try {
      await datDeDanhDinhMuc(chuKyId, deDanh)
      onXong()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Chưa lưu được, thử lại giúp mình nhé')
      setDangLuu(false)
    }
  }

  return (
    <main className="min-h-dvh bg-page text-ink mx-auto flex w-full max-w-md flex-col">
      <div className="flex-1 px-5 pt-10">
        {tienDo && <TienDoBuoc {...tienDo} />}
        <h1 className="font-serif text-2xl">Để dành</h1>
        <p className="mt-1 text-sm text-ink2">
          Trừ sẵn trước khi tiêu, để dành không còn là phần thừa cuối tháng 🌱
        </p>

        <div className="mt-6 space-y-2">
          <O_Nhap
            nhan="Để dành chu kỳ này"
            soTien={deDanh}
            dangGo={oDangGo === 'de_danh'}
            onChon={() => doiO('de_danh')}
          />
          <O_Nhap
            nhan="Mỗi ngày tiêu"
            soTien={moiNgay}
            dangGo={oDangGo === 'moi_ngay'}
            onChon={() => doiO('moi_ngay')}
          />
        </div>

        <div className="mt-4 rounded-2xl bg-surface p-4 text-sm text-ink2">
          Lương {dinhDang(thuNhap)}
          {traNo > 0 && <> · trả quỹ {dinhDang(traNo)}</>} · chu kỳ {soNgayChuKy} ngày
        </div>

        {/* Con số ở đây là mức chi TRUNG BÌNH cả chu kỳ, còn màn ① hiện mức từ
            hôm nay tới cuối kỳ. Hai số lệch nhau ngay khi bồ bắt đầu tiêu — nói
            trước để không bị tưởng app tính sai (§7.2 hệ quả UI). */}
        <p className="mt-3 text-xs text-muted">
          Đây là mức trung bình cho cả chu kỳ. Con số ở màn chính tính từ hôm nay tới cuối kỳ
          nên có thể khác một chút — tiêu ít hơn kế hoạch thì nó nhích lên.
        </p>

        {loi && <p className="mt-3 text-sm text-nguy-cap">{loi}</p>}
      </div>

      <div className="px-4 pb-4">
        <BanPhimNghin nghin={nghin} onDoi={setNghin} />
        <button
          onClick={() => void luu()}
          disabled={dangLuu}
          className="mt-3 w-full rounded-2xl bg-c1 py-4 text-lg font-semibold text-surface
                     disabled:bg-line disabled:text-muted"
        >
          {dangLuu ? 'Đang lưu…' : 'Lưu'}
        </button>
        <button onClick={onHuy} className="mt-2 w-full py-3 text-sm text-ink2">
          Quay lại
        </button>
      </div>
    </main>
  )
}

function O_Nhap({
  nhan,
  soTien,
  dangGo,
  onChon,
}: {
  nhan: string
  soTien: Tien
  dangGo: boolean
  onChon: () => void
}) {
  return (
    <button
      onClick={onChon}
      className={`flex w-full items-center justify-between rounded-2xl border-2 p-4 text-left
        ${dangGo ? 'border-c1 bg-c1-t' : 'border-transparent bg-surface'}`}
    >
      <span className="text-sm text-ink2">{nhan}</span>
      <span className="text-2xl font-semibold tabular-nums">{dinhDang(soTien)}</span>
    </button>
  )
}
