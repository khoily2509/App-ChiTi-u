import { Icon } from './Icon'
import { iconDanhMuc } from '@/shared/design/icon'
import { mauSlot } from '@/shared/design/mau'

/**
 * LƯỚI GHI NHANH — 6 nút ngay trên màn ①, theo mockup.
 *
 * Đây là thứ làm "3 chạm" của §4.1 thành sự thật. Trước đây bồ phải: mở app →
 * bấm "Ghi một khoản" → chọn danh mục → chọn số → Lưu = 4 chạm. Chạm thẳng vào
 * danh mục ngay từ màn ① thì danh mục đã chọn sẵn ⇒ còn đúng **số tắt + Lưu**.
 *
 * Icon đi cùng chữ chứ không thay chữ: §10 nguyên tắc 6 cấm chữ mang màu dữ liệu,
 * nên ô icon màu mới là thứ mang danh tính, còn tên vẫn phải đọc được. Và màu
 * Nghệ (slot 6) tương phản chỉ 2,68:1 — §11.1 bắt nó luôn đi kèm nhãn chữ.
 */


export type MucGhiNhanh = {
  id: string
  ten: string
  /** Dòng phụ dưới tên — mockup có, và nó giữ cho việc phân loại nhất quán (§7.1). */
  phu?: string
  slot: number | null
  /** Cột `danh_muc.icon`. Không có thì rơi về mặc định của slot. */
  icon?: string | null
}

export function LuoiGhiNhanh({
  danhMuc,
  coDeDanh,
  onChon,
  onDeDanh,
}: {
  danhMuc: MucGhiNhanh[]
  /** Chưa có quỹ nào thì không hiện nút Để dành — tiền không biết đi đâu. */
  coDeDanh: boolean
  onChon: (danhMucId: string) => void
  onDeDanh: () => void
}) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {danhMuc.map((d) => {
        const m = mauSlot(d.slot)
        return (
          <button
            key={d.id}
            onClick={() => onChon(d.id)}
            className="border-line2 bg-surface rounded-2xl border px-1.5 pt-3 pb-2.5
                       text-center active:scale-[0.97]"
          >
            <span
              className="mx-auto mb-1.5 grid size-10 place-items-center rounded-[14px]"
              style={{ background: m.nen }}
            >
              {/* Đọc từ cột `icon` của danh mục chứ không tra cứng theo slot.
                  Trước đây tra theo slot, nên bồ đổi icon trong DB thì màn hình
                  vẫn y nguyên — phép thử nghiệm thu §7.1 không thể đạt. */}
              <Icon ten={iconDanhMuc(d.icon, d.slot)} mau={m.mau} />
            </span>
            <span className="block text-[12.5px] leading-tight font-semibold">{d.ten}</span>
            {/* Cắt 2 dòng: định nghĩa trong DB dài tới 4 dòng ở ô hẹp một phần ba
                màn hình, làm lưới cao gấp đôi mockup và đẩy nó xuống dưới nếp gấp
                — đúng thứ §11.5 cảnh báo. Bản đầy đủ vẫn hiện ở màn ghi nhanh,
                nơi có chỗ và cũng là lúc bồ thật sự cần đọc nó (§7.1). */}
            {d.phu && (
              <span className="text-muted mt-0.5 line-clamp-2 text-[10px] leading-tight">
                {d.phu}
              </span>
            )}
          </button>
        )
      })}

      {/* §6.2: nút "Để dành" nhìn GIỐNG HỆT 5 nút kia. Khác biệt nằm ở tầng dữ
          liệu (chuyen_vao_quy, không vào tổng chi), không ở tầng cảm nhận. */}
      {coDeDanh && (
        <button
          onClick={onDeDanh}
          className="the-kem rounded-2xl border px-1.5 pt-3 pb-2.5 text-center active:scale-[0.97]"
          style={{ borderColor: '#cfe7cf', background: '#f2f8f1' }}
        >
          <span
            className="mx-auto mb-1.5 grid size-10 place-items-center rounded-[14px]"
            style={{ background: '#e2efe1' }}
          >
            <Icon ten="jar" mau="#2f6b39" />
          </span>
          <span className="block text-[12.5px] leading-tight font-semibold">Để dành</span>
          <span className="text-muted mt-0.5 block text-[10px] leading-tight">
            không tính là chi
          </span>
        </button>
      )}
    </div>
  )
}
