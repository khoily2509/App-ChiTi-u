import type { BongHoa } from '@/shared/domain/hoa-cuc'
import { dinhDangNgay } from '@/shared/domain/chu-ky'

/**
 * VƯỜN HOA 8 TUẦN (§9.2, §10).
 *
 * Hiển thị nhịp chăm sóc của 8 tuần gần nhất.
 * Tuần đủ 5 cánh -> nhụy vàng rực. Tuần chưa đủ -> nhụy xám nằm im.
 * Không phạt điểm, không có con số nào để mất.
 */

const SO_CANH = 7
const GOC = 360 / SO_CANH
const NO = { to: '#ffffff', vien: '#d9d2c4' }
const CHUA_NO = '#efeadf'
const NHUY_VANG = '#e8c34a'
const NHUY_XAM = '#ded7c6'
const VIEN_NHUY = '#c9a227'

export function BongHoaMini({ hoa, co = 36 }: { hoa: BongHoa; co?: number }) {
  return (
    <svg
      width={co}
      height={co}
      viewBox="0 0 60 60"
      role="img"
      aria-label={`Tuần ${dinhDangNgay(hoa.dauTuan)}: ${hoa.daGhi}/${SO_CANH} cánh`}
    >
      {hoa.canh.map((no, i) => (
        <g key={i} transform={`rotate(${GOC * i} 30 30)`}>
          <ellipse
            cx="30"
            cy="14"
            rx="5.6"
            ry="11.5"
            fill={no ? NO.to : CHUA_NO}
            stroke={no ? NO.vien : 'none'}
            strokeWidth="1"
          />
        </g>
      ))}
      <circle
        cx="30"
        cy="30"
        r="7.5"
        fill={hoa.duNo ? NHUY_VANG : NHUY_XAM}
        stroke={hoa.duNo ? VIEN_NHUY : 'none'}
        strokeWidth="1"
      />
    </svg>
  )
}

export function VuonHoa({ danhSach }: { danhSach: BongHoa[] }) {
  const soTuanDu = danhSach.filter((h) => h.duNo).length

  return (
    <div className="rounded-2xl border border-line2 bg-surface p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Vườn hoa 8 tuần</div>
        <div className="text-xs text-muted font-medium">
          {soTuanDu}/8 tuần nở đủ 🌼
        </div>
      </div>
      <p className="mt-1 text-xs text-ink2">
        Mỗi bông là một tuần. Ghi chăm chỉ &ge; 5 ngày hoa sẽ nở nhụy vàng 🌱
      </p>

      <div className="mt-4 grid grid-cols-4 gap-3 text-center sm:grid-cols-8">
        {danhSach.map((hoa, i) => (
          <div
            key={hoa.dauTuan}
            className={`flex flex-col items-center rounded-xl p-2 transition-colors ${
              hoa.laTuanNay ? 'bg-sage-soft/60 ring-1 ring-sage' : 'bg-surface2/50'
            }`}
          >
            <BongHoaMini hoa={hoa} co={38} />
            <div className="mt-1.5 text-[11px] font-medium text-ink2">
              {hoa.laTuanNay ? 'Tuần này' : `T-${danhSach.length - 1 - i}`}
            </div>
            <div className="text-[10px] text-muted">{hoa.daGhi}/7</div>
          </div>
        ))}
      </div>
    </div>
  )
}
