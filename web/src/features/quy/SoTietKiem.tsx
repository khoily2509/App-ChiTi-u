import { useState, type ReactNode } from 'react'
import { dong, dinhDang } from '@/shared/domain/tien'
import { homNay, ngayLocal, dinhDangNgay, type NgayLocal } from '@/shared/domain/chu-ky'
import {
  ngayDaoHan,
  laiTronKy,
  laiTinhToi,
  tienDo,
  conBaoNhieuNgay,
  diemCoBanTu,
  type LichTraLai,
  type SoTietKiem,
} from '@/shared/domain/so-tiet-kiem'
import { moSoTietKiem, soTietKiemCua, type QuyCoSoDu } from '@/shared/api/quy'
import { BanPhimNghin } from '@/shared/ui/BanPhimNghin'
import { SoLon } from '@/shared/ui/SoLon'

/** §7.10 — kỳ hạn phổ biến ở ngân hàng Việt Nam. */
const KY_HAN = [1, 2, 3, 6, 9, 12, 13, 15, 18, 24, 36] as const

const LICH: { ma: LichTraLai; nhan: string }[] = [
  { ma: 'dau_ky', nhan: 'Đầu kỳ' },
  { ma: 'cuoi_ky', nhan: 'Cuối kỳ' },
  { ma: 'hang_thang', nhan: 'Hàng tháng' },
  { ma: 'hang_quy', nhan: 'Hàng quý' },
  { ma: 'khong_ky_han', nhan: 'Không kỳ hạn' },
]

/**
 * KHỐI SỔ TIẾT KIỆM — §7.10, nằm riêng bên dưới quỹ thường ở màn ⑤.
 *
 * Tách khối là có chủ đích: tiền trong sổ có kỳ hạn KHÔNG rút được cho tới ngày
 * đáo hạn, nên trộn chung với quỹ dự phòng sẽ làm "tổng đang để dành" đọc lên
 * như thể bồ tiêu được ngần ấy.
 */
export function KhoiSoTietKiem({ quy, onThem }: { quy: QuyCoSoDu[]; onThem: () => void }) {
  const nay = homNay()
  const so = quy
    .map((q) => ({ q, s: soTietKiemCua(q, dong(q.soDu)) }))
    .filter((x): x is { q: QuyCoSoDu; s: SoTietKiem } => x.s !== null)

  return (
    <div className="mt-6 rounded-2xl bg-surface p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium">Sổ tiết kiệm</h2>
        <button onClick={onThem} className="text-sm text-c1-ink underline">
          Thêm sổ
        </button>
      </div>

      {so.length === 0 ? (
        <p className="mt-2 text-sm text-ink2">
          Có sổ tiết kiệm ở ngân hàng thì thêm vào đây để theo dõi lãi 🌱
        </p>
      ) : (
        <ul className="mt-4 space-y-5">
          {so.map(({ q, s }) => (
            <TheSo key={q.id} ten={q.ten} s={s} nay={nay} />
          ))}
        </ul>
      )}
    </div>
  )
}

function TheSo({ ten, s, nay }: { ten: string; s: SoTietKiem; nay: NgayLocal }) {
  const dh = ngayDaoHan(s)
  const tron = laiTronKy(s)
  const denNay = laiTinhToi(s, nay)
  const pt = tienDo(s, nay)
  const conNgay = conBaoNhieuNgay(s, nay)

  return (
    <li>
      <div className="flex items-baseline gap-2">
        <span className="flex-1 truncate text-sm">{ten}</span>
        <span className="text-sm font-medium tabular-nums">{dinhDang(s.goc)}</span>
      </div>

      {pt !== null && (
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-sage-soft">
          <div
            className="h-full rounded-full bg-c4 transition-[width] duration-700"
            style={{ width: `${pt}%` }}
          />
        </div>
      )}

      {/* §7.10 bắt buộc ghi nhãn "ước tính": app không phải bank và không ra được
          con số khớp tuyệt đối. Hiện số trần trụi rồi lệch với giấy bank là bồ
          mất tin vào MỌI con số khác trong app (§9.3). */}
      <div className="mt-1 text-xs text-muted">
        Lãi ước tính tới nay{' '}
        <span className="text-ink2 font-medium tabular-nums">{dinhDang(denNay)}</span>
        {tron !== null && <> · trọn kỳ {dinhDang(tron)}</>}
      </div>

      <div className="mt-0.5 text-xs text-muted">
        {dh === null ? (
          'Không kỳ hạn — rút lúc nào cũng được'
        ) : conNgay !== null && conNgay >= 0 ? (
          <>
            Chưa rút được tới <span className="text-ink2">{dinhDangNgay(dh)}</span> · còn{' '}
            {conNgay} ngày
          </>
        ) : (
          <span className="text-ink2">Đã đáo hạn {dinhDangNgay(dh)}</span>
        )}
      </div>
    </li>
  )
}

/** Mở sổ mới. Mọi ô đều chỉnh được — §7.10. */
export function FormSoTietKiem({
  userId,
  chuKyId,
  onXong,
  onHuy,
}: {
  userId: string
  chuKyId: string
  onXong: () => void
  onHuy: () => void
}) {
  const [ten, setTen] = useState('Sổ tiết kiệm')
  const [nghin, setNghin] = useState('')
  const [laiSuat, setLaiSuat] = useState('5,5')
  const [kyHan, setKyHan] = useState(6)
  const [lich, setLich] = useState<LichTraLai>('dau_ky')
  // Ngày gửi là NGÀY THẬT, không phải "mấy tháng trước" áng chừng (§7.10 — bồ
  // chốt 23/08/2026). Lãi tính theo số ngày, nên lệch một ngày là lệch tiền, mà
  // "3 tháng trước" thì không nói được sổ mở ngày 5 hay ngày 27.
  const [ngayGui, setNgayGui] = useState<NgayLocal>(() => homNay())
  const [dangLuu, setDangLuu] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)

  const goc = nghin ? dong(Number(nghin) * 1000) : dong(0)
  const diem = diemCoBanTu(laiSuat)
  // Ngày gửi không được ở tương lai. `max` trên ô ngày đã chặn bộ chọn của
  // iPhone, nhưng trên máy tính thì gõ thẳng vào ô là qua được — mà một sổ mở ở
  // tương lai làm mọi con số lãi về 0 và bồ không hiểu vì sao. Chặn ở đây là chỗ
  // duy nhất không phụ thuộc vào trình duyệt nào.
  const luuDuoc = goc > 0 && diem !== null && ngayGui <= homNay() && !dangLuu

  // Xem trước ngay khi gõ: con số mới là thứ bồ đối chiếu được với giấy bank,
  // chứ không phải mấy cái nhãn kỳ hạn.
  const xem: SoTietKiem | null =
    diem === null
      ? null
      : {
          goc,
          laiSuatNam: diem,
          ngayGui,
          kyHanThang: lich === 'khong_ky_han' ? null : kyHan,
          lichTraLai: lich,
        }

  async function luu() {
    if (!luuDuoc || diem === null) return
    setDangLuu(true)
    setLoi(null)
    try {
      await moSoTietKiem(userId, chuKyId, {
        ten: ten.trim() || 'Sổ tiết kiệm',
        goc,
        laiSuatNam: diem,
        ngayGui,
        kyHanThang: lich === 'khong_ky_han' ? null : kyHan,
        lichTraLai: lich,
        // Gửi từ trước hôm nay ⇒ sổ đã chạy trước khi bồ dùng app ⇒ gốc là
        // so_du_ban_dau, bị loại khỏi tỷ lệ để dành (§7.3, AT-11).
        laSoCu: ngayGui < homNay(),
      })
      onXong()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Chưa lưu được, thử lại giúp mình nhé')
      setDangLuu(false)
    }
  }

  return (
    <main className="bg-page text-ink mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <div className="flex-1 overflow-y-auto px-5 pt-10 pb-4">
        <h1 className="font-serif text-2xl">Thêm sổ tiết kiệm</h1>

        <input
          value={ten}
          onChange={(e) => setTen(e.target.value)}
          className="bg-surface mt-4 w-full rounded-2xl px-4 py-3 text-sm outline-none"
          placeholder="Tên sổ"
        />

        <O nhan="Số tiền gốc">
          <SoLon soTien={goc} />
        </O>

        <O nhan="Lãi suất mỗi năm — theo hợp đồng">
          <div className="flex items-baseline gap-1">
            <input
              value={laiSuat}
              onChange={(e) => setLaiSuat(e.target.value)}
              inputMode="decimal"
              className="w-24 bg-transparent text-2xl font-semibold tabular-nums outline-none"
            />
            <span className="text-lg">%</span>
          </div>
          {diem === null && (
            <p className="text-nguy-cap mt-1 text-xs">Gõ kiểu 5,5 hoặc 5.5 giúp mình nhé</p>
          )}
        </O>

        <O nhan="Ngày gửi — theo sổ">
          {/* <input type="date"> nhận đúng 'YYYY-MM-DD', trùng khít kiểu NgayLocal
              nên không phải chuyển đổi gì. Trên iPhone nó mở bánh xe chọn ngày quen
              thuộc. max = hôm nay: không ai gửi tiền vào ngày mai được. */}
          <input
            type="date"
            value={ngayGui}
            max={homNay()}
            onChange={(e) => e.target.value && setNgayGui(ngayLocal(e.target.value))}
            className="w-full bg-transparent text-lg font-medium tabular-nums outline-none"
          />
          {/* Ô ngày của hệ điều hành hiện theo định dạng máy, không ép được. Nhắc
              lại bằng dd/mm/yyyy để không bao giờ mơ hồ tháng với ngày (§14 quy ước 2). */}
          <p className="text-muted mt-1 text-xs">
            {dinhDangNgay(ngayGui)}
            {ngayGui < homNay() && ' — sổ đã chạy từ trước, gốc không tính vào tỷ lệ để dành'}
          </p>
        </O>

        <Chip
          nhan="Trả lãi"
          ds={LICH.map((l) => ({ ma: l.ma, nhan: l.nhan }))}
          chon={lich}
          onChon={setLich}
        />

        {lich !== 'khong_ky_han' && (
          <Chip
            nhan="Kỳ hạn"
            ds={KY_HAN.map((k) => ({ ma: k as number, nhan: `${k} tháng` }))}
            chon={kyHan}
            onChon={setKyHan}
          />
        )}

        {xem && goc > 0 && <XemTruoc s={xem} />}
        {loi && <p className="text-nguy-cap mt-3 text-sm">{loi}</p>}
      </div>

      <div className="px-4 pb-4">
        <BanPhimNghin nghin={nghin} onDoi={setNghin} />
        <button
          onClick={() => void luu()}
          disabled={!luuDuoc}
          className="bg-c1 text-surface disabled:bg-line disabled:text-muted mt-3 w-full
                     rounded-2xl py-4 text-lg font-semibold"
        >
          {dangLuu ? 'Đang lưu…' : 'Lưu sổ'}
        </button>
        <button onClick={onHuy} className="text-ink2 mt-2 w-full py-3 text-sm">
          Huỷ
        </button>
      </div>
    </main>
  )
}

function XemTruoc({ s }: { s: SoTietKiem }) {
  const dh = ngayDaoHan(s)
  const tron = laiTronKy(s)
  return (
    <div className="bg-c4-t text-c4-ink mt-4 rounded-2xl p-4 text-sm">
      {tron !== null ? (
        <>
          Lãi <b className="tabular-nums">{dinhDang(tron)}</b>
          {s.lichTraLai === 'dau_ky' ? ' — nhận ngay hôm gửi' : ' trọn kỳ'}
          {dh && (
            <>
              <br />
              Đáo hạn {dinhDangNgay(dh)} · tổng{' '}
              <b className="tabular-nums">{dinhDang(dong(s.goc + tron))}</b>
            </>
          )}
        </>
      ) : (
        <>Không kỳ hạn — lãi cộng dồn theo ngày, rút lúc nào cũng được</>
      )}
      <div className="mt-1 text-xs opacity-75">Số ước tính, giấy của bank mới là chuẩn</div>
    </div>
  )
}

function O({ nhan, children }: { nhan: string; children: ReactNode }) {
  return (
    <div className="bg-surface mt-3 rounded-2xl p-4">
      <div className="text-muted text-xs">{nhan}</div>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function Chip<T extends string | number>({
  nhan,
  ds,
  chon,
  onChon,
}: {
  nhan: string
  ds: { ma: T; nhan: string }[]
  chon: T
  onChon: (m: T) => void
}) {
  return (
    <div className="mt-3">
      <div className="text-muted text-xs">{nhan}</div>
      <div className="mt-1.5 flex gap-2 overflow-x-auto pb-1">
        {ds.map((x) => (
          <button
            key={String(x.ma)}
            onClick={() => onChon(x.ma)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${
              chon === x.ma ? 'border-c1 bg-c1-t text-c1-ink' : 'border-line bg-surface'
            }`}
          >
            {x.nhan}
          </button>
        ))}
      </div>
    </div>
  )
}
