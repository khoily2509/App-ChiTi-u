import { useState } from 'react'
import { dong, dinhDang } from '@/shared/domain/tien'
import {
  taoQuy,
  dienSoDuBanDau,
  laSoTietKiem,
  tongQuyThuong,
  type QuyCoSoDu,
} from '@/shared/api/quy'
import { BanPhimNghin } from '@/shared/ui/BanPhimNghin'
import { SoLon } from '@/shared/ui/SoLon'
import { KhoiSoTietKiem, FormSoTietKiem } from './SoTietKiem'
import { IconMucTieu } from '@/shared/ui/IconMucTieu'

/**
 * MÀN ⑤ — QUỸ & MỤC TIÊU (§7.3, §10).
 *
 * Quỹ dự phòng = quỹ KHÔNG có đích. "Mua xe" = quỹ CÓ đích. Cùng một object,
 * khác nhau ở chỗ có `so_tien_dich` hay không — nên màn này chỉ có một danh sách.
 *
 * Con số khổng lồ của màn: TỔNG đang để dành (§10).
 */

/**
 * Icon mục tiêu — bộ slug §11.5, đã kiểm tra tồn tại trong @phosphor-icons/core.
 * Lưu slug chứ không lưu SVG: nhét SVG vào DB thì đổi bộ icon sau phải sửa từng
 * dòng dữ liệu. Emoji ở đây chỉ là chỗ đứng tạm cho tới khi lắp Phosphor ở Pha 5.
 */
const ICON = [
  { slug: 'coins', nhan: 'Dự phòng', hinh: '🪙' },
  { slug: 'car', nhan: 'Mua xe', hinh: '🚗' },
  { slug: 'house', nhan: 'Mua nhà', hinh: '🏠' },
  { slug: 'airplane-tilt', nhan: 'Du lịch', hinh: '✈️' },
  { slug: 'laptop', nhan: 'Laptop', hinh: '💻' },
  { slug: 'graduation-cap', nhan: 'Học', hinh: '🎓' },
  { slug: 'heartbeat', nhan: 'Sức khoẻ', hinh: '💗' },
  { slug: 'plant', nhan: 'Khác', hinh: '🌱' },
] as const

const hinhCua = (slug: string) => ICON.find((i) => i.slug === slug)?.hinh ?? '🌱'

type Props = {
  userId: string
  chuKyId: string
  quy: QuyCoSoDu[]
  onDoi: () => void
}

export function ManQuy({ userId, chuKyId, quy, onDoi }: Props) {
  const [dangTao, setDangTao] = useState(false)
  const [dangThemSo, setDangThemSo] = useState(false)
  const [dangDienSoDu, setDangDienSoDu] = useState<QuyCoSoDu | null>(null)

  const quyThuong = quy.filter((q) => !laSoTietKiem(q))
  const tong = tongQuyThuong(quy)

  if (dangTao) {
    return (
      <FormTaoQuy
        userId={userId}
        onXong={() => {
          setDangTao(false)
          onDoi()
        }}
        onHuy={() => setDangTao(false)}
      />
    )
  }

  if (dangThemSo) {
    return (
      <FormSoTietKiem
        userId={userId}
        chuKyId={chuKyId}
        onXong={() => {
          setDangThemSo(false)
          onDoi()
        }}
        onHuy={() => setDangThemSo(false)}
      />
    )
  }

  if (dangDienSoDu) {
    return (
      <FormSoDuBanDau
        userId={userId}
        quy={dangDienSoDu}
        onXong={() => {
          setDangDienSoDu(null)
          onDoi()
        }}
        onHuy={() => setDangDienSoDu(null)}
      />
    )
  }

  return (
    <main className="min-h-dvh bg-page text-ink mx-auto flex w-full max-w-md flex-col">
      <div className="flex-1 px-5 pt-10">
        <h1 className="font-serif text-2xl">Quỹ & Mục tiêu</h1>

        {/* Con số khổng lồ của màn ⑤ (§10 nguyên tắc 1) */}
        <div className="mt-6 rounded-2xl bg-surface p-5">
          <div className="text-sm text-ink2">Tổng đang để dành</div>
          <div className="mt-1">
            <SoLon soTien={tong} />
          </div>
        </div>

        {quyThuong.length === 0 ? (
          // §7.7 màn hình trống tử tế — không để trơ trọi
          <div className="mt-6 rounded-2xl bg-surface p-6 text-center">
            <div className="text-4xl">🪴</div>
            <p className="mt-3 text-sm text-ink2">
              Chưa có quỹ nào. Tạo một quỹ dự phòng, hoặc đặt một mục tiêu để dành cho thứ bồ
              đang muốn 🌱
            </p>
          </div>
        ) : (
          <ul className="mt-5 space-y-2">
            {quyThuong.map((q) => {
              const laMucTieu = q.so_tien_dich !== null
              const phanTram = laMucTieu
                ? Math.min(100, Math.round((q.soDu * 100) / q.so_tien_dich!))
                : null
              return (
                <li key={q.id}>
                  <button
                    onClick={() => setDangDienSoDu(q)}
                    className="w-full rounded-2xl bg-surface p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <IconMucTieu
                        slug={q.icon}
                        phanTram={phanTram ?? 100}
                        co={34}
                      />
                      <span className="flex-1">
                        <span className="block text-sm font-medium">{q.ten}</span>
                        <span className="block text-xs text-muted">
                          {laMucTieu
                            ? `Mục tiêu ${dinhDang(dong(q.so_tien_dich!))}`
                            : q.cho_phep_muon === 'tu_do'
                              ? 'Quỹ dự phòng · mượn được'
                              : 'Quỹ dự phòng'}
                        </span>
                      </span>
                      <span className="text-lg font-semibold tabular-nums">
                        {dinhDang(q.soDu)}
                      </span>
                    </div>

                    {phanTram !== null && (
                      <>
                        {/* Thanh tiến độ — tô xanh dần theo % (§9.4 ẩn dụ mục tiêu) */}
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-sage-soft">
                          <div className="h-full bg-c1" style={{ width: `${phanTram}%` }} />
                        </div>
                        <div className="mt-1 text-xs text-ink2">
                          {phanTram}% · còn {dinhDang(dong(q.so_tien_dich! - q.soDu))}
                        </div>
                      </>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <KhoiSoTietKiem quy={quy} onThem={() => setDangThemSo(true)} />
      </div>

      <div className="space-y-2 p-4">
        <button
          onClick={() => setDangTao(true)}
          className="w-full rounded-2xl bg-c1 py-4 text-lg font-semibold text-surface"
        >
          Tạo quỹ mới
        </button>
      </div>
    </main>
  )
}

/* ── Tạo quỹ ────────────────────────────────────────────────────────────────── */

function FormTaoQuy({
  userId,
  onXong,
  onHuy,
}: {
  userId: string
  onXong: () => void
  onHuy: () => void
}) {
  const [ten, setTen] = useState('')
  const [icon, setIcon] = useState<string>('coins')
  const [coDich, setCoDich] = useState(false)
  const [nghin, setNghin] = useState('')
  const [dangLuu, setDangLuu] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)

  const dich = nghin ? dong(Number(nghin) * 1000) : dong(0)
  const luuDuoc = ten.trim().length > 0 && (!coDich || dich > 0) && !dangLuu

  async function luu() {
    if (!luuDuoc) return
    setDangLuu(true)
    setLoi(null)
    try {
      await taoQuy(userId, ten.trim(), coDich ? dich : null, icon)
      onXong()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Chưa tạo được, thử lại nhé')
      setDangLuu(false)
    }
  }

  return (
    <main className="min-h-dvh bg-page text-ink mx-auto flex w-full max-w-md flex-col">
      <div className="flex-1 overflow-y-auto px-5 pt-10">
        <h1 className="font-serif text-2xl">Quỹ mới</h1>

        <input
          value={ten}
          onChange={(e) => setTen(e.target.value)}
          placeholder="Tên quỹ — ví dụ: Mua xe"
          className="mt-5 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base
                     outline-none focus:border-sage"
        />

        <div className="mt-4 grid grid-cols-4 gap-2">
          {ICON.map((i) => (
            <button
              key={i.slug}
              onClick={() => setIcon(i.slug)}
              className={`rounded-2xl border-2 py-3 text-2xl ${
                icon === i.slug ? 'border-c1 bg-c1-t' : 'border-transparent bg-surface'
              }`}
              aria-label={i.nhan}
            >
              {i.hinh}
            </button>
          ))}
        </div>

        {/* §7.3: quỹ có đích = MỤC TIÊU, và mục tiêu mặc định bị khoá không cho mượn */}
        <button
          onClick={() => setCoDich(!coDich)}
          className="mt-5 flex w-full items-center gap-3 rounded-2xl bg-surface p-4 text-left"
        >
          <span
            className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 ${
              coDich ? 'border-c1 bg-c1 text-surface' : 'border-line'
            }`}
          >
            {coDich && '✓'}
          </span>
          <span className="flex-1 text-sm">
            <span className="block font-medium">Đây là mục tiêu có số tiền đích</span>
            <span className="block text-xs text-muted">
              Mục tiêu sẽ được khoá, không cho mượn — để nó không bị tiêu mất lúc lỡ tay
            </span>
          </span>
        </button>

        {coDich && (
          <div className="mt-4 rounded-2xl bg-surface p-4 text-center">
            <div className="text-xs text-muted">Cần bao nhiêu</div>
            <div className="mt-1 text-3xl font-semibold tabular-nums">{dinhDang(dich)}</div>
          </div>
        )}

        {loi && <p className="mt-3 text-sm text-nguy-cap">{loi}</p>}
      </div>

      <div className="px-4 pb-4">
        {coDich && <BanPhimNghin nghin={nghin} onDoi={setNghin} />}
        <button
          onClick={() => void luu()}
          disabled={!luuDuoc}
          className="mt-3 w-full rounded-2xl bg-c1 py-4 text-lg font-semibold text-surface
                     disabled:bg-line disabled:text-muted"
        >
          {dangLuu ? 'Đang tạo…' : 'Tạo quỹ'}
        </button>
        <button onClick={onHuy} className="mt-2 w-full py-3 text-sm text-ink2">
          Quay lại
        </button>
      </div>
    </main>
  )
}

/* ── Điền số dư ban đầu ─────────────────────────────────────────────────────── */

function FormSoDuBanDau({
  userId,
  quy,
  onXong,
  onHuy,
}: {
  userId: string
  quy: QuyCoSoDu
  onXong: () => void
  onHuy: () => void
}) {
  const [nghin, setNghin] = useState('')
  const [dangLuu, setDangLuu] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)
  const soTien = nghin ? dong(Number(nghin) * 1000) : dong(0)

  async function luu() {
    if (soTien <= 0 || dangLuu) return
    setDangLuu(true)
    setLoi(null)
    try {
      await dienSoDuBanDau(userId, quy.id, soTien)
      onXong()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Chưa lưu được, thử lại nhé')
      setDangLuu(false)
    }
  }

  return (
    <main className="min-h-dvh bg-page text-ink mx-auto flex w-full max-w-md flex-col">
      <div className="flex-1 px-5 pt-10 text-center">
        <div className="text-4xl">{hinhCua(quy.icon)}</div>
        <h1 className="mt-3 font-serif text-2xl">{quy.ten}</h1>
        <p className="mt-1 text-sm text-ink2">Đang có {dinhDang(quy.soDu)}</p>

        <div className="mt-8 rounded-2xl bg-surface p-5">
          <div className="text-sm text-ink2">Điền số dư hiện có</div>
          <div className="mt-1">
            <SoLon soTien={soTien} />
          </div>
          {/* §7.3: bút toán so_du_ban_dau bị loại khỏi mọi phép tính tỷ lệ để dành,
              nếu không thì chu kỳ đầu hiện "để dành được 340% thu nhập" (AT-11). */}
          <p className="mt-3 text-xs text-muted">
            Số tiền bồ đã có sẵn từ trước. Nó không tính là để dành của chu kỳ này, nên tỷ lệ để
            dành không bị nhảy vọt 🌱
          </p>
        </div>

        {loi && <p className="mt-3 text-sm text-nguy-cap">{loi}</p>}
      </div>

      <div className="px-4 pb-4">
        <BanPhimNghin nghin={nghin} onDoi={setNghin} />
        <button
          onClick={() => void luu()}
          disabled={soTien <= 0 || dangLuu}
          className="mt-3 w-full rounded-2xl bg-c1 py-4 text-lg font-semibold text-surface
                     disabled:bg-line disabled:text-muted"
        >
          {dangLuu ? 'Đang lưu…' : 'Lưu số dư'}
        </button>
        <button onClick={onHuy} className="mt-2 w-full py-3 text-sm text-ink2">
          Quay lại
        </button>
      </div>
    </main>
  )
}
