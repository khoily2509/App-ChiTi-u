import { dinhDang, rutGon, dong, DAU_TRU } from '@/shared/domain/tien'
import { CHENH_LECH } from '@/shared/design/mau'
import { mocLon, tongThayDoi, type ChenhLech } from '@/shared/domain/chenh-lech'

/**
 * Dấu trừ dùng U+2212, KHÔNG dùng gạch nối ASCII — giống hệt `dinhDang()`.
 * Gạch nối hẹp hơn dấu cộng nên cột số so le, mà hai loại số này nằm ngay cạnh
 * nhau trên cùng một dòng.
 */
function phanTramChu(n: number): string {
  if (n > 0) return `+${n}%`
  if (n < 0) return `${DAU_TRU}${Math.abs(n)}%`
  return '0%'
}

/** Chênh lệch kèm tên để vẽ. */
export type ChenhLechVe = ChenhLech & { ten: string }

/**
 * BIỂU ĐỒ CHÊNH LỆCH — §10 màn ②.
 *
 * MỘT màu trung tính cho mọi thanh. Chiều thay đổi đã mã hoá bằng VỊ TRÍ (thanh
 * nằm bên trái hay bên phải vạch 0), nên màu không cần mang thêm nghĩa đó.
 *
 * v1.0 tô đỏ mọi khoản tăng — kể cả tiêu thêm cho sách — vi phạm §10 nguyên tắc 3
 * ("tiêu tiền không phải lỗi") và §9.3. Nhưng thay bằng HAI màu trung tính cũng
 * sai: cặp đã đo chỉ cách nhau 11,7 đơn vị RGB sau mô phỏng mù màu đỏ-lục, gần
 * như cùng một màu. Một màu duy nhất tránh được cả hai lỗi.
 */
export function BieuDoChenhLech({ ds }: { ds: ChenhLechVe[] }) {
  if (ds.length === 0) return null

  const moc = mocLon(ds)
  const tong = tongThayDoi(ds)
  // Mọi thanh cùng một mẫu số. Mỗi bên tự co giãn theo cực đại của riêng nó thì
  // thanh "tăng 50k" có thể dài bằng thanh "giảm 2tr" — biểu đồ nói dối trong
  // khi mọi con số bên cạnh đều đúng.
  const rong = (x: number) => (moc === 0 ? 0 : (Math.abs(x) / moc) * 100)

  return (
    <div>
      <p className="text-ink2 text-sm">
        {tong === 0 ? (
          'Tiêu bằng đúng chu kỳ trước'
        ) : (
          <>
            Cả kỳ {tong > 0 ? 'tiêu thêm' : 'tiêu ít hơn'}{' '}
            <span className="text-ink font-medium tabular-nums">
              {dinhDang(dong(Math.abs(tong)))}
            </span>{' '}
            so với chu kỳ trước
          </>
        )}
      </p>

      <ul className="mt-4 space-y-3">
        {ds.map((c) => (
          <li key={c.danhMucId}>
            <div className="flex items-baseline gap-2">
              <span className="flex-1 truncate text-sm">{c.ten}</span>
              <span className="text-sm font-medium tabular-nums">
                {c.thayDoi > 0 ? '+' : c.thayDoi < 0 ? '−' : ''}
                {rutGon(dong(Math.abs(c.thayDoi)))}
              </span>
              {/* Kỳ trước 0đ ⇒ không chia được. Hiện "mới" thay vì một con số vô
                  nghĩa — §7.8 cấm ∞ và NaN. */}
              <span className="text-muted w-14 text-right text-xs tabular-nums">
                {c.phanTram === null ? 'mới' : phanTramChu(c.phanTram)}
              </span>
            </div>

            {/* Hai nửa quanh vạch 0: giảm mọc sang trái, tăng mọc sang phải. */}
            <div className="mt-1.5 flex h-2 items-stretch" aria-hidden>
              <div className="flex flex-1 justify-end">
                {c.thayDoi < 0 && (
                  <div
                    className="rounded-l-full transition-[width] duration-700"
                    style={{ width: `${rong(c.thayDoi)}%`, background: CHENH_LECH.thanh }}
                  />
                )}
              </div>
              <div className="bg-line w-px shrink-0" />
              <div className="flex flex-1">
                {c.thayDoi > 0 && (
                  <div
                    className="rounded-r-full transition-[width] duration-700"
                    style={{ width: `${rong(c.thayDoi)}%`, background: CHENH_LECH.thanh }}
                  />
                )}
              </div>
            </div>

            <div className="text-muted mt-1 text-xs tabular-nums">
              {dinhDang(c.kyTruoc)} → {dinhDang(c.kyNay)}
            </div>
          </li>
        ))}
      </ul>

      <p className="text-muted mt-4 text-xs">
        Thanh bên trái là tiêu ít hơn, bên phải là tiêu nhiều hơn.
      </p>
    </div>
  )
}

/**
 * §7.7 — chu kỳ đầu tiên chưa có gì để so.
 *
 * Câu chữ lấy đúng từ §7.7: để màn hình trống trơ trọi thì bồ mở ra sẽ nghĩ app
 * hỏng và không quay lại, mà ba chu kỳ đầu chính là lúc S1 được định đoạt.
 */
export function ChuaCoKyTruoc() {
  return (
    <div className="py-6 text-center">
      <div className="text-3xl">🌱</div>
      <p className="text-ink2 mx-auto mt-2 max-w-64 text-sm">
        Chu kỳ đầu tiên đang chạy. Sang chu kỳ sau sẽ có biểu đồ so sánh đầu tiên.
      </p>
    </div>
  )
}
