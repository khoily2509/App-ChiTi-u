import { dinhDang, rutGon, type Dong as Tien } from '@/shared/domain/tien'
import { mauSlot } from '@/shared/design/mau'
import type { LatDonut } from '@/shared/domain/donut'

/**
 * DONUT — vành tròn chia theo danh mục (§10 màn ②).
 *
 * SVG viết tay, không thư viện (§5 · G5). Vẽ bằng `stroke-dasharray` trên
 * <circle> chứ không dựng <path> cung tròn: cách sau cần tự tính toạ độ điểm đầu
 * cuối và cờ `large-arc-flag`, là hai chỗ sai âm thầm — lát >180° sẽ vẽ ngược
 * mà không báo lỗi. Với dasharray thì chỉ có phép nhân với chu vi.
 */

const R = 40
const DAY = 15
const CHU_VI = 2 * Math.PI * R

export type LatVe = LatDonut & { ten: string; slot: number | null }

export function Donut({ lat, tong }: { lat: LatVe[]; tong: Tien }) {
  if (lat.length === 0) return <DonutTrong />

  return (
    <div>
      <div className="relative mx-auto w-56">
        <svg viewBox="0 0 100 100" className="w-full" role="img" aria-label="Chi theo danh mục">
          {/* Vành nền: lúc mới chi vài khoản thì các lát chưa phủ kín, thiếu vành
              này donut trông như bị khuyết chứ không phải "mới đi được một phần". */}
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke="var(--color-sage-soft)"
            strokeWidth={DAY}
          />
          {lat.map((l) => (
            <circle
              key={l.danhMucId}
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={mauSlot(l.slot).mau}
              strokeWidth={DAY}
              strokeDasharray={`${l.tiLe * CHU_VI} ${CHU_VI}`}
              strokeDashoffset={-l.batDau * CHU_VI}
              // Mặc định <circle> bắt đầu ở 3 giờ; xoay để bắt đầu từ 12 giờ,
              // theo đúng chiều người ta đọc đồng hồ.
              transform="rotate(-90 50 50)"
            />
          ))}
        </svg>
        {/* Tổng nằm giữa vành — §10 nguyên tắc 4: con số nào cũng phải trả lời
            "so với cái gì", và đây là mẫu số của mọi phần trăm bên dưới. */}
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-xs text-muted">Đã chi</div>
            <div className="text-2xl font-semibold tabular-nums">{rutGon(tong)}</div>
          </div>
        </div>
      </div>

      <ul className="mt-5 space-y-2.5">
        {lat.map((l) => (
          <li key={l.danhMucId} className="flex items-center gap-3">
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ background: mauSlot(l.slot).mau }}
            />
            <span className="flex-1 truncate text-sm">{l.ten}</span>
            <span className="text-sm font-medium tabular-nums">{dinhDang(l.soTien)}</span>
            {/* Lát tí hon làm tròn về 0% vẫn là tiền đã tiêu thật. Hiện "0%" đọc
                lên là "không tốn gì", đúng thứ §7.8 cấm. */}
            <span className="w-10 text-right text-sm tabular-nums text-muted">
              {l.phanTram === 0 ? '<1%' : `${l.phanTram}%`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** §7.7 — ba chu kỳ đầu gần như trống. Để mặc thì bồ tưởng app hỏng. */
function DonutTrong() {
  return (
    <div className="py-8 text-center">
      <div className="text-4xl">🌱</div>
      <p className="mx-auto mt-3 max-w-56 text-sm text-ink2">
        Chưa có khoản nào trong chu kỳ này. Ghi vài khoản là thấy ngay tiền đang đi đâu.
      </p>
    </div>
  )
}
