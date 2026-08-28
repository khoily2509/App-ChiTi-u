import { dinhDang, dong } from '@/shared/domain/tien'
import type { TrangThaiHu } from '@/shared/domain/han-muc'
import { mauSlot, TRANG_THAI } from '@/shared/design/mau'

/** Hũ kèm thứ cần để vẽ — tên và slot màu, tầng gọi ghép vào. */
export type HuVe = TrangThaiHu & { ten: string; slot: number | null }

/**
 * THANH HŨ — §7.6, hiện ở màn ②.
 *
 * Dùng màu trạng thái khi VƯỢT hũ là ngoại lệ duy nhất §11.1 cho phép: lúc đó
 * màu mang nghĩa trạng thái chứ không còn là màu series.
 *
 * Chọn hổ phách chứ không đỏ. Đỏ đọc lên là "bạn làm sai", mà §10 nguyên tắc 3
 * nói thẳng tiêu tiền không phải lỗi. Hổ phách nói "để ý chỗ này" — đúng nghĩa
 * cần truyền, và giữ được §9.3.
 */
export function ThanhHu({ hu }: { hu: HuVe[] }) {
  if (hu.length === 0) return null

  return (
    <ul className="space-y-4">
      {hu.map((h) => {
        const m = mauSlot(h.slot)
        const mau = h.daVuot ? TRANG_THAI.canhBao : m.mau
        // Kẹp ở 100 để thanh không tràn ra khỏi máng; con số vượt bao nhiêu đã
        // nói bằng chữ ngay bên dưới nên không mất thông tin.
        const rong = Math.min(100, h.phanTram)
        return (
          <li key={h.danhMucId}>
            <div className="flex items-baseline gap-2">
              <span className="flex-1 truncate text-sm">{h.ten}</span>
              <span className="text-sm font-medium tabular-nums">{dinhDang(h.daDung)}</span>
              <span className="text-xs text-muted tabular-nums">/ {dinhDang(h.hanMuc)}</span>
            </div>
            <div
              className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-sage-soft"
              role="img"
              aria-label={`${h.ten}: đã dùng ${h.phanTram}% của hũ`}
            >
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{ width: `${rong}%`, background: mau }}
              />
            </div>
            <div
              className="mt-1 text-xs"
              style={{ color: h.daVuot ? TRANG_THAI.canhBao : undefined }}
            >
              {h.daVuot ? (
                <span>Vượt {dinhDang(dong(Math.abs(h.conLai)))}</span>
              ) : (
                <span className="text-muted">Còn {dinhDang(h.conLai)}</span>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
