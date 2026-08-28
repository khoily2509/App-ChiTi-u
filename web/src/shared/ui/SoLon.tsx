import { dinhDang, type Dong as Tien } from '@/shared/domain/tien'

/**
 * CON SỐ LỚN — con số ≥48px của mỗi màn (§10 nguyên tắc 1).
 *
 * Cỡ chữ CO theo số ký tự. Bàn phím cho gõ tới 99 tỷ, mà "99.999.999.000đ" là
 * 15 ký tự — gấp đôi "999.999đ". Để cứng một cỡ thì hoặc số nhỏ trông lọt thỏm,
 * hoặc số lớn tràn ra ngoài khung (bồ báo lỗi này ngày 23/08/2026).
 *
 * Co chữ chứ KHÔNG rút gọn thành "99,9tỷ": §10 nguyên tắc 5 chốt rút gọn dành
 * cho biểu đồ, còn ô đang gõ thì bồ cần thấy đúng từng chữ số mình vừa bấm.
 *
 * Ngưỡng đo trên iPhone 13 (390pt, trừ padding còn ~310pt bề ngang thật).
 */
function coChu(soKyTu: number): string {
  if (soKyTu <= 10) return 'text-5xl' //  9.000.000đ
  if (soKyTu <= 13) return 'text-4xl' //  100.000.000đ
  return 'text-3xl' //                    99.999.999.000đ
}

export function SoLon({ soTien, mo = false }: { soTien: Tien; mo?: boolean }) {
  const chu = dinhDang(soTien)
  return (
    <div
      className={`${coChu(chu.length)} font-semibold tabular-nums ${mo ? 'text-muted' : ''}`}
    >
      {chu}
    </div>
  )
}
