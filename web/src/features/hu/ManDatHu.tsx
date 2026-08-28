import { useState } from 'react'
import type { Dong as DbRow } from '@/shared/api/supabase'
import { datHanMuc, type NguonDat } from '@/shared/api/han-muc'
import { chuaPhanBo, type Hu } from '@/shared/domain/han-muc'
import { dong, dinhDang, type Dong as Tien } from '@/shared/domain/tien'
import { mauSlot } from '@/shared/design/mau'
import { BanPhimNghin } from '@/shared/ui/BanPhimNghin'
import { TienDoBuoc } from '@/shared/ui/TienDoBuoc'
import { SoLon } from '@/shared/ui/SoLon'

type DanhMuc = DbRow<'danh_muc'>

/**
 * ĐẶT HŨ — §7.6.
 *
 * Không ép phân bổ hết tới đồng cuối. YNAB ép, và đó là lý do rất nhiều người bỏ
 * YNAB: đầu mỗi tháng phải ngồi một buổi nặng đầu. Phần dư ở đây có tên là
 * "tiêu chung" và hoàn toàn hợp lệ.
 */
export function ManDatHu({
  userId,
  chuKyId,
  danhMuc,
  hu,
  nganSach,
  deXuat,
  onXong,
  onQuayLai,
  tienDo,
}: {
  userId: string
  chuKyId: string
  danhMuc: DanhMuc[]
  hu: Hu[]
  nganSach: Tien | null
  /** Hạn mức gợi ý từ chu kỳ trước. Rỗng khi chưa có chu kỳ nào đã đóng. */
  deXuat: Hu[]
  onXong: () => void
  onQuayLai: () => void
  /**
   * Có mặt ⇒ màn này đang là một bước trong luồng lương → để dành → hũ → tổng
   * kết. Hiện thanh tiến độ để bồ biết còn mấy bước, khỏi bỏ dở vì tưởng luồng
   * dài vô tận.
   */
  tienDo?: { buoc: number; tong: number } | undefined
}) {
  // Chỉ giữ hạn mức trong state; "đã dùng" không đổi khi bồ kéo hũ nên đọc thẳng
  // từ props, không nhân bản vào state (một nguồn sự thật — §6.3).
  const [muc, setMuc] = useState<Map<string, number>>(
    () => new Map(hu.map((h) => [h.danhMucId, h.hanMuc])),
  )
  const [dangSua, setDangSua] = useState<string | null>(null)
  const [nghin, setNghin] = useState('')
  const [nguon, setNguon] = useState<Map<string, NguonDat>>(new Map())
  const [dangLuu, setDangLuu] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)

  // "Chưa biết xếp đâu" không có hũ (§7.6 ràng buộc 4) — tiền tiêu qua nó trừ
  // vào phần tiêu chung.
  const coHu = danhMuc.filter((d) => !d.la_he_thong)

  const tongHu = dong([...muc.values()].reduce((t, v) => t + Math.max(0, v), 0))
  const conTrong = chuaPhanBo(nganSach, tongHu)

  function moSua(id: string) {
    setDangSua(id)
    const v = muc.get(id) ?? 0
    setNghin(v > 0 ? String(Math.round(v / 1000)) : '')
  }

  function chotSua() {
    if (!dangSua) return
    const v = nghin ? Number(nghin) * 1000 : 0
    setMuc(new Map(muc).set(dangSua, v))
    setNguon(new Map(nguon).set(dangSua, 'tu_chinh'))
    setDangSua(null)
  }

  function layDeXuat() {
    const m = new Map(muc)
    const n = new Map(nguon)
    for (const h of deXuat) {
      m.set(h.danhMucId, h.hanMuc)
      n.set(h.danhMucId, 'de_xuat')
    }
    setMuc(m)
    setNguon(n)
  }

  async function luu() {
    if (dangLuu) return
    setDangLuu(true)
    setLoi(null)
    try {
      // Ghi từng hũ một chứ không gộp: §12.1 cần một sự kiện ENVELOPE_SET cho mỗi
      // danh mục, kèm số cũ và nguồn, để về sau truy được bồ gật theo đề xuất hay
      // tự gõ.
      for (const d of coHu) {
        const moi = muc.get(d.id) ?? 0
        const cu = hu.find((h) => h.danhMucId === d.id)?.hanMuc ?? 0
        if (moi === cu) continue
        await datHanMuc(userId, chuKyId, d.id, moi, nguon.get(d.id) ?? 'tu_chinh')
      }
      onXong()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Chưa lưu được, thử lại giúp mình nhé')
      setDangLuu(false)
    }
  }

  if (dangSua) {
    const d = coHu.find((x) => x.id === dangSua)!
    const soGo = nghin ? dong(Number(nghin) * 1000) : dong(0)
    return (
      <main className="min-h-dvh bg-page text-ink mx-auto flex w-full max-w-md flex-col">
        <div className="flex-1 px-5 pt-10">
          <h1 className="font-serif text-2xl">{d.ten}</h1>
          <p className="mt-1 text-sm text-ink2">Để riêng bao nhiêu cho mục này?</p>
          <div className="mt-6 rounded-2xl bg-surface p-5">
            <SoLon soTien={soGo} />
          </div>
          <p className="mt-3 text-xs text-muted">
            Để 0 là bỏ hũ này — tiền của mục đó tính vào phần tiêu chung.
          </p>
        </div>
        <div className="px-4 pb-4">
          <BanPhimNghin nghin={nghin} onDoi={setNghin} />
          <button
            onClick={chotSua}
            className="mt-3 w-full rounded-2xl bg-c1 py-4 text-lg font-semibold text-surface"
          >
            Xong
          </button>
          <button
            onClick={() => setDangSua(null)}
            className="mt-2 w-full py-3 text-sm text-ink2"
          >
            Huỷ
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-page text-ink mx-auto flex w-full max-w-md flex-col">
      <div className="flex-1 px-5 pt-10">
        {tienDo && <TienDoBuoc {...tienDo} />}
        <h1 className="font-serif text-2xl">Hũ từng mục</h1>
        <p className="mt-1 text-sm text-ink2">
          Để riêng tiền cho từng mục trước khi tiêu. Không bắt buộc — bỏ trống cũng được 🫙
        </p>

        {deXuat.length > 0 && (
          <button
            onClick={layDeXuat}
            className="mt-4 w-full rounded-2xl bg-c1-t px-4 py-3 text-left text-sm font-medium text-c1-ink"
          >
            Đặt theo mức đã tiêu chu kỳ trước →
          </button>
        )}

        <div className="mt-4 space-y-2">
          {coHu.map((d) => {
            const v = muc.get(d.id) ?? 0
            const m = mauSlot(d.slot)
            return (
              <button
                key={d.id}
                onClick={() => moSua(d.id)}
                className="flex w-full items-center gap-3 rounded-2xl bg-surface p-4 text-left"
              >
                <span className="size-3 shrink-0 rounded-full" style={{ background: m.mau }} />
                <span className="flex-1 truncate text-sm">{d.ten}</span>
                <span className="text-base font-medium tabular-nums">
                  {v > 0 ? (
                    dinhDang(dong(v))
                  ) : (
                    <span className="text-c1-ink underline">Đặt</span>
                  )}
                </span>
              </button>
            )
          })}
        </div>

        {conTrong !== null && (
          <div className="mt-4 rounded-2xl bg-surface p-4 text-sm">
            {conTrong >= 0 ? (
              <>
                <span className="text-ink2">Chưa xếp vào hũ nào — </span>
                <span className="font-medium tabular-nums">{dinhDang(conTrong)}</span>
                <span className="text-ink2"> để tiêu chung</span>
              </>
            ) : (
              /* Cảnh báo MỀM, không chặn (§7.6): đặt vượt rồi chỉnh lại là thao
                 tác hợp lệ, nên không có ràng buộc cứng nào ở DB lẫn ở đây. */
              <>
                <span className="text-ink2">Các hũ đang cộng lại nhiều hơn ngân sách </span>
                <span className="font-medium tabular-nums">{dinhDang(dong(-conTrong))}</span>
                <span className="text-ink2">. Vẫn lưu được, nhưng sẽ khó đủ 🌿</span>
              </>
            )}
          </div>
        )}

        {loi && <p className="mt-3 text-sm text-nguy-cap">{loi}</p>}
      </div>

      <div className="p-4">
        <button
          onClick={() => void luu()}
          disabled={dangLuu}
          className="w-full rounded-2xl bg-c1 py-4 text-lg font-semibold text-surface
                     disabled:bg-line disabled:text-muted"
        >
          {dangLuu ? 'Đang lưu…' : 'Lưu'}
        </button>
        <button onClick={onQuayLai} className="mt-2 w-full py-3 text-sm text-ink2">
          Quay lại
        </button>
      </div>
    </main>
  )
}
