import { dinhDang, rutGon, dong } from '@/shared/domain/tien'
import type { Item8ChuKy } from '@/shared/domain/dong-chu-ky'

/**
 * BIỂU ĐỒ 8 CHU KỲ GẦN NHẤT (§10, Pha 7).
 *
 * Cột đôi: Thu nhập vs Chi tiêu.
 * Đường / Điểm tỷ lệ để dành %.
 * Chạm vào cột để xem chi tiết snapshot chu kỳ đó.
 */

export function BieuDo8ChuKy({
  danhSach,
  onChonChuKy,
}: {
  danhSach: Item8ChuKy[]
  onChonChuKy?: (item: Item8ChuKy) => void
}) {
  if (danhSach.length === 0) {
    return (
      <div className="rounded-2xl border border-line2 bg-surface p-6 text-center text-sm text-ink2">
        Chưa có chu kỳ cũ nào được đóng. Khi kết thúc chu kỳ đầu tiên, báo cáo 8 tháng sẽ xuất hiện ở đây 🌱
      </div>
    )
  }

  // Tìm mức trần cao nhất để chia tỷ lệ chiều cao (tối thiểu 10tr)
  const maxTien = Math.max(
    10_000_000,
    ...danhSach.flatMap((d) => [d.thuNhap, d.chiTieu]),
  )

  return (
    <div className="rounded-2xl border border-line2 bg-surface p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Lịch sử {danhSach.length} chu kỳ</div>
        <div className="flex items-center gap-3 text-[11px] text-ink2">
          <span className="flex items-center gap-1">
            <span className="inline-block size-2.5 rounded-xs bg-[#c9d1c8]" /> Thu
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block size-2.5 rounded-xs bg-[#c97a2b]" /> Chi
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block size-2.5 rounded-xs bg-c1" /> Để dành %
          </span>
        </div>
      </div>

      <div className="mt-6 flex h-44 items-end justify-between gap-2 border-b border-line pb-2">
        {danhSach.map((item) => {
          const hThu = Math.max(8, Math.round((item.thuNhap / maxTien) * 120))
          const hChi = Math.max(8, Math.round((item.chiTieu / maxTien) * 120))

          return (
            <button
              key={item.chuKyId}
              onClick={() => onChonChuKy?.(item)}
              className="group flex flex-1 flex-col items-center focus:outline-none"
            >
              {/* Tỷ lệ để dành % */}
              <span className="mb-1 text-[10px] font-semibold text-c1 tabular-nums">
                {item.tyLeDeDanh}%
              </span>

              {/* 2 Cột Thu & Chi */}
              <div className="flex items-end gap-1">
                <div
                  className="w-3 rounded-t-sm bg-[#c9d1c8] transition-all group-hover:opacity-80"
                  style={{ height: `${hThu}px` }}
                  title={`Thu nhập: ${dinhDang(item.thuNhap)}`}
                />
                <div
                  className="w-3 rounded-t-sm bg-[#c97a2b] transition-all group-hover:opacity-80"
                  style={{ height: `${hChi}px` }}
                  title={`Chi tiêu: ${dinhDang(item.chiTieu)}`}
                />
              </div>

              {/* Nhãn tháng */}
              <span className="mt-2 text-[11px] font-medium text-ink2 group-hover:text-ink">
                {item.nhan}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex justify-between text-[11px] text-muted">
        <span>Chạm vào chu kỳ để xem chi tiết</span>
        <span>Cao nhất: {rutGon(dong(maxTien))}</span>
      </div>
    </div>
  )
}
