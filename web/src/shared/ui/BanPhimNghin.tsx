/**
 * Bàn phím số nhập theo ĐƠN VỊ NGHÌN — gõ 35 ra 35.000đ.
 *
 * Tách ra thành component chung vì đã có HAI nơi dùng thật (ghi nhanh và nhập
 * lương), không phải vì đoán trước sẽ cần. Nhập theo nghìn là thứ giữ cho §4.1
 * "3 chạm" thành sự thật: gõ đủ 6 chữ số của "150.000" thì là 8 chạm.
 */

/**
 * 8 chữ số ⇒ tối đa 99.999.999 nghìn ≈ 99,9 tỷ đồng.
 *
 * Trước là 6 (≈1 tỷ) — đủ cho khoản chi hằng ngày nhưng CHẶN mất sổ tiết kiệm
 * và mục tiêu mua nhà, là hai thứ §7.10 và §7.3 dựng ra để đựng số lớn.
 * Bồ phát hiện 23/08/2026.
 *
 * Nới trần thì con số dài gấp đôi, nên phải đi kèm <SoLon> co cỡ chữ — nếu
 * không, số 15 ký tự sẽ tràn ra ngoài khung.
 */
const MAX_CHU_SO = 8

type Props = {
  nghin: string
  onDoi: (nghinMoi: string) => void
}

export function BanPhimNghin({ nghin, onDoi }: Props) {
  const go = (d: string) => onDoi((nghin + d).replace(/^0+/, '').slice(0, MAX_CHU_SO))
  const xoa = () => onDoi(nghin.slice(0, -1))

  return (
    <>
      <div className="mb-2 text-center text-xs text-muted">Gõ theo nghìn — 35 là 35.000đ</div>
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0'].map((d) => (
          <button
            key={d}
            onClick={() => go(d)}
            className="rounded-xl bg-surface py-4 text-xl font-medium tabular-nums
                       active:bg-surface2"
          >
            {d}
          </button>
        ))}
        <button
          onClick={xoa}
          aria-label="Xoá một chữ số"
          className="rounded-xl bg-surface py-4 text-xl active:bg-surface2"
        >
          ⌫
        </button>
      </div>
    </>
  )
}
