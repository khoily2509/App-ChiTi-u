import { dinhDang, type Dong as Tien } from '@/shared/domain/tien'
import { TRANG_THAI } from '@/shared/design/mau'

/**
 * THANH NHỊP — theo mockup: máng nền, phần đã dùng, và VẠCH "hôm nay".
 *
 * Vạch mới là thứ làm thanh này có nghĩa. Chỉ có phần đã dùng thì bồ biết
 * "đã tiêu 76%" — con số trần trụi. Có vạch thì thấy ngay 76% ngân sách nhưng
 * mới qua 61% thời gian, tức là **đang nhanh hơn nhịp**. Đúng §10 nguyên tắc 4:
 * số nào cũng phải trả lời "so với cái gì".
 *
 * Màu hổ phách chỉ bật khi thật sự nhanh hơn nhịp — đó là TRẠNG THÁI, đúng vai
 * trò §10 nguyên tắc 3 cho phép dùng màu. Đi đúng nhịp thì thanh màu lá bình
 * thường, không có gì phải báo.
 */
export function ThanhNhip({
  phanTramDaDung,
  phanTramThoiGian,
  nganSach,
}: {
  phanTramDaDung: number
  phanTramThoiGian: number
  nganSach: Tien
}) {
  // Ngưỡng 5 điểm phần trăm: tiêu nhỉnh hơn nhịp vài phần trăm là chuyện bình
  // thường của một ngày đi chợ, bật cảnh báo ngay là gây nhiễu (§9.3).
  const nhanhHon = phanTramDaDung > phanTramThoiGian + 5
  const rong = Math.min(100, phanTramDaDung)

  return (
    <div>
      {nhanhHon && (
        <div className="mb-2 flex items-center gap-2 text-[12.5px]">
          <span
            className="rounded-full border px-2.5 py-0.5 text-[11.5px] font-bold"
            style={{ background: '#fdf3dd', color: '#6b4d05', borderColor: '#f2e2b8' }}
          >
            ⚠ nhanh hơn nhịp
          </span>
          <span className="text-ink2">
            {phanTramDaDung}% ngân sách · mới qua {phanTramThoiGian}% chu kỳ
          </span>
        </div>
      )}

      <div className="relative">
        <div className="bg-sage-soft h-3 rounded-md">
          <div
            className="h-3 rounded-l-md transition-[width] duration-700"
            style={{
              width: `${rong}%`,
              background: nhanhHon ? TRANG_THAI.canhBao : 'var(--color-c1)',
              borderTopRightRadius: rong >= 100 ? '0.375rem' : '0.25rem',
              borderBottomRightRadius: rong >= 100 ? '0.375rem' : '0.25rem',
            }}
          />
        </div>
        {/* Vạch hôm nay: cao hơn máng để không lẫn vào phần đã dùng. */}
        <div
          className="bg-ink absolute -top-1.5 -bottom-1.5 w-0.5 rounded-sm"
          style={{ left: `${Math.min(100, Math.max(0, phanTramThoiGian))}%` }}
        />
        <span
          className="text-ink2 absolute top-4 -translate-x-1/2 text-[11px] whitespace-nowrap"
          style={{ left: `${Math.min(100, Math.max(0, phanTramThoiGian))}%` }}
        >
          hôm nay
        </span>
      </div>

      <div className="text-muted mt-7 flex justify-between text-[11.5px]">
        <span>0đ</span>
        <span>ngân sách {dinhDang(nganSach)}</span>
      </div>
    </div>
  )
}
