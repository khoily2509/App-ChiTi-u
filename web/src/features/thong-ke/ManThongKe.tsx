import { useEffect, useState } from 'react'
import type { Dong as DbRow } from '@/shared/api/supabase'
import { chiTheoDanhMuc } from '@/shared/api/giao-dich'
import type { NgayLocal } from '@/shared/domain/chu-ky'
import { danhSachHu, chuKyLienTruoc } from '@/shared/api/han-muc'
import { chenhLech } from '@/shared/domain/chenh-lech'
import { BieuDoChenhLech, ChuaCoKyTruoc, type ChenhLechVe } from '@/shared/ui/BieuDoChenhLech'
import { latDonut } from '@/shared/domain/donut'
import { trangThaiHu } from '@/shared/domain/han-muc'
import { dong } from '@/shared/domain/tien'
import { Donut, type LatVe } from '@/shared/ui/Donut'
import { ThanhHu, type HuVe } from '@/shared/ui/ThanhHu'
import { ngayDaGhiTamTuan } from '@/shared/api/giao-dich'
import { themNgay, homNay } from '@/shared/domain/chu-ky'
import { dauTuan, vuonHoa, type BongHoa } from '@/shared/domain/hoa-cuc'
import { VuonHoa } from '@/shared/ui/VuonHoa'

type DanhMuc = DbRow<'danh_muc'>

/**
 * MÀN ② — tiền đi đâu (§10).
 *
 * Tự nạp dữ liệu của mình thay vì nhận từ App: màn ① nằm trên đường đo S2
 * ("mở app → lưu xong ≤ 5 giây", §1), nên mỗi truy vấn thêm vào lúc khởi động
 * đều ăn vào tiêu chí đó. Truy vấn này chỉ chạy khi bồ thật sự mở màn ②.
 */
export function ManThongKe({
  chuKyId,
  ngayBatDau,
  danhMuc,
  onQuayLai,
  onXemDanhSach,
  onDatHu,
}: {
  chuKyId: string
  /** Ngày bắt đầu chu kỳ — để tìm chu kỳ liền trước mà khỏi hỏi lại DB. */
  ngayBatDau: NgayLocal
  danhMuc: DanhMuc[]
  onQuayLai: () => void
  onXemDanhSach: () => void
  onDatHu: () => void
}) {
  const [lat, setLat] = useState<LatVe[] | null>(null)
  const [hu, setHu] = useState<HuVe[]>([])
  // `null` = chưa nạp xong; `[]` = đã nạp và không có chu kỳ trước. Hai chuyện
  // khác nhau, gộp lại thì màn hình trống nhấp nháy trước khi biểu đồ hiện ra.
  const [cl, setCl] = useState<ChenhLechVe[] | null>(null)
  const [coKyTruoc, setCoKyTruoc] = useState(false)
  const [vuon, setVuon] = useState<BongHoa[] | null>(null)
  const [loi, setLoi] = useState<string | null>(null)

  useEffect(() => {
    let con = true
    const nay = homNay()
    const tamTuanTruoc = themNgay(dauTuan(nay), -7 * 7)

    Promise.all([
      chiTheoDanhMuc(chuKyId),
      danhSachHu(chuKyId),
      chuKyLienTruoc(ngayBatDau),
      ngayDaGhiTamTuan(tamTuanTruoc),
    ])
      .then(async ([chi, dsHu, truoc, ngayGhi]) => {
        if (!con) return
        const dm = new Map(danhMuc.map((d) => [d.id, d]))
        setVuon(vuonHoa(ngayGhi, nay, 8))
        setLat(
          latDonut(chi).map((l) => ({
            ...l,
            ten: dm.get(l.danhMucId)?.ten ?? 'Chưa biết xếp đâu',
            slot: dm.get(l.danhMucId)?.slot ?? null,
          })),
        )
        // Giữ THỨ TỰ SLOT cho thanh hũ y như donut: hai khối nằm trên cùng một
        // màn, đảo thứ tự giữa chúng là bắt mắt phải dò lại từ đầu.
        setHu(
          trangThaiHu(dsHu)
            .map((h) => ({
              ...h,
              ten: dm.get(h.danhMucId)?.ten ?? '',
              slot: dm.get(h.danhMucId)?.slot ?? null,
            }))
            .sort((a, b) => (a.slot ?? 99) - (b.slot ?? 99)),
        )

        // Chỉ đọc chi tiêu chu kỳ trước khi thật sự có chu kỳ trước — chu kỳ đầu
        // thì đây là một truy vấn không bao giờ trả về gì.
        setCoKyTruoc(truoc !== null)
        const chiTruoc = truoc ? await chiTheoDanhMuc(truoc.id) : []
        if (!con) return
        setCl(
          chenhLech(chi, chiTruoc).map((c) => ({
            ...c,
            ten: dm.get(c.danhMucId)?.ten ?? 'Chưa biết xếp đâu',
          })),
        )
      })
      .catch((e) => con && setLoi(e instanceof Error ? e.message : String(e)))
    return () => {
      con = false
    }
  }, [chuKyId, ngayBatDau, danhMuc])

  const tong = dong((lat ?? []).reduce((t, l) => t + l.soTien, 0))

  return (
    <main className="min-h-dvh bg-page text-ink mx-auto flex w-full max-w-md flex-col">
      <div className="flex-1 px-5 pt-10">
        <h1 className="font-serif text-2xl">Tiền đi đâu</h1>
        <p className="mt-1 text-sm text-ink2">Chu kỳ này</p>

        <div className="mt-6 rounded-2xl bg-surface p-5">
          {loi ? (
            <p className="text-sm text-nguy-cap">{loi}</p>
          ) : lat === null ? (
            <p className="py-8 text-center text-sm text-muted">Đang tính…</p>
          ) : (
            <Donut lat={lat} tong={tong} />
          )}
        </div>

        <div className="mt-4 rounded-2xl bg-surface p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-medium">Hũ từng mục</h2>
            <button onClick={onDatHu} className="text-sm text-c1-ink underline">
              {hu.length > 0 ? 'Chỉnh hũ' : 'Đặt hũ'}
            </button>
          </div>
          {hu.length > 0 ? (
            <div className="mt-4">
              <ThanhHu hu={hu} />
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink2">
              Chưa đặt hũ nào. Để riêng tiền cho từng mục trước khi tiêu thì dễ giữ hơn 🫙
            </p>
          )}
        </div>

        <div className="bg-surface mt-4 rounded-2xl p-5">
          <h2 className="text-sm font-medium">So với chu kỳ trước</h2>
          {cl === null ? (
            <p className="text-muted py-6 text-center text-sm">Đang tính…</p>
          ) : !coKyTruoc || cl.length === 0 ? (
            <ChuaCoKyTruoc />
          ) : (
            <div className="mt-3">
              <BieuDoChenhLech ds={cl} />
            </div>
          )}
        </div>

        {vuon && (
          <div className="mt-4">
            <VuonHoa danhSach={vuon} />
          </div>
        )}

        {lat !== null && lat.length > 0 && (
          <button
            onClick={onXemDanhSach}
            className="mt-3 w-full rounded-2xl bg-surface p-4 text-left text-sm text-c1-ink underline"
          >
            Xem từng khoản một
          </button>
        )}
      </div>

      <div className="p-4">
        <button onClick={onQuayLai} className="w-full py-3 text-sm text-ink2">
          Quay lại
        </button>
      </div>
    </main>
  )
}
