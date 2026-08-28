import { dinhDang, dong, type Dong as Tien } from '@/shared/domain/tien'
import { homNayConTieuDuoc } from '@/shared/domain/ngan-sach'
import { mauSlot } from '@/shared/design/mau'
import { TienDoBuoc } from '@/shared/ui/TienDoBuoc'
import { SoLon } from '@/shared/ui/SoLon'

/**
 * TỔNG KẾT DÒNG TIỀN — bước cuối của luồng lương → để dành → hũ.
 *
 * Đọc từ trên xuống như một phép trừ: lương về, trừ để dành, trừ nợ quỹ, ra số
 * chia được; rồi chia vào hũ, còn lại là tiêu chung. Kết thúc bằng đúng con số
 * mà màn ① sẽ hiện.
 *
 * Đây là chỗ trả lời câu "vì sao hôm nay chỉ tiêu được ngần này" — §10 nguyên tắc
 * 4: số nào cũng phải trả lời "so với cái gì". Trước đây bồ chỉ thấy kết quả mà
 * không thấy đường đi tới nó.
 */

type Hang = { nhan: string; soTien: Tien; slot?: number | null; tru?: boolean }

export function ManTongKet({
  thuNhap,
  deDanh,
  traNo,
  nganSach,
  hu,
  soNgayChuKy,
  onXong,
  onSuaHu,
}: {
  thuNhap: Tien
  deDanh: Tien
  traNo: Tien
  nganSach: Tien
  hu: { ten: string; soTien: Tien; slot: number | null }[]
  soNgayChuKy: number
  onXong: () => void
  onSuaHu: () => void
}) {
  const tongHu = hu.reduce((t, h) => t + h.soTien, 0)
  const tieuChung = dong(nganSach - tongHu)
  // Cả chu kỳ chưa tiêu gì, nên mức mỗi ngày ở đây là mức TRUNG BÌNH trọn kỳ.
  const moiNgay = homNayConTieuDuoc(nganSach, dong(0), soNgayChuKy)

  const truoc: Hang[] = [
    { nhan: 'Lương về', soTien: thuNhap },
    ...(deDanh > 0 ? [{ nhan: 'Để dành', soTien: deDanh, tru: true }] : []),
    ...(traNo > 0 ? [{ nhan: 'Trả quỹ kỳ này', soTien: traNo, tru: true }] : []),
  ]

  return (
    <main className="bg-page text-ink mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <div className="flex-1 px-5 pt-8">
        <TienDoBuoc buoc={4} tong={4} />

        <h1 className="font-serif text-2xl">Tiền đi đâu tháng này</h1>
        <p className="text-ink2 mt-1 text-sm">Xem lại một lượt rồi bắt đầu nhé 🌿</p>

        <div className="bg-surface mt-5 rounded-2xl p-5">
          {truoc.map((h) => (
            <Dong key={h.nhan} {...h} />
          ))}

          {/* Con số bản lề: mọi thứ phía trên cộng trừ ra nó, mọi thứ phía dưới
              chia ra từ nó. */}
          <div className="border-line mt-3 border-t-2 pt-3">
            <div className="text-ink2 text-sm">Chia được</div>
            <SoLon soTien={nganSach} />
          </div>

          {hu.length > 0 && (
            <div className="mt-4 space-y-0.5">
              {hu.map((h) => (
                <Dong key={h.ten} nhan={h.ten} soTien={h.soTien} slot={h.slot} thut />
              ))}
            </div>
          )}

          <div className="border-line2 mt-3 border-t pt-3">
            <Dong
              nhan={hu.length > 0 ? 'Còn lại để tiêu chung' : 'Chưa xếp vào hũ nào'}
              soTien={tieuChung}
            />
          </div>

          <button onClick={onSuaHu} className="text-c1-ink mt-3 text-sm underline">
            {hu.length > 0 ? 'Chỉnh lại hũ' : 'Xếp tiền vào hũ'}
          </button>
        </div>

        {/* Nối thẳng sang con số của màn ①, để bồ thấy nó đến từ đâu. */}
        {moiNgay !== null && (
          <div className="bg-c1-t text-c1-ink mt-3 rounded-2xl p-4 text-sm">
            Chia đều {soNgayChuKy} ngày ⇒ mỗi ngày{' '}
            <b className="tabular-nums">{dinhDang(moiNgay)}</b>
            <div className="mt-0.5 text-xs opacity-80">
              Tiêu ít hơn kế hoạch thì con số này nhích lên
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <button
          onClick={onXong}
          className="bg-c1 text-surface w-full rounded-2xl py-4 text-lg font-semibold"
        >
          Xong, bắt đầu thôi
        </button>
      </div>
    </main>
  )
}

function Dong({
  nhan,
  soTien,
  slot,
  tru,
  thut,
}: {
  nhan: string
  soTien: Tien
  slot?: number | null | undefined
  tru?: boolean | undefined
  thut?: boolean | undefined
}) {
  return (
    <div className={`flex items-baseline gap-2 py-1 ${thut ? 'pl-4' : ''}`}>
      {slot !== undefined && (
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ background: mauSlot(slot ?? null).mau }}
        />
      )}
      <span className={`flex-1 truncate text-sm ${thut ? 'text-ink2' : ''}`}>{nhan}</span>
      <span className="text-sm font-medium tabular-nums">
        {tru && '− '}
        {dinhDang(soTien)}
      </span>
    </div>
  )
}
