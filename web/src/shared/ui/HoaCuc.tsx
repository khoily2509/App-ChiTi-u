import type { NhipTuan } from '@/shared/domain/hoa-cuc'
import { DU_CANH } from '@/shared/domain/hoa-cuc'

/**
 * HOA CÚC — nhịp ghi chép trong tuần (§9.2). Hình lấy từ mockup v2.
 *
 * Bảy cánh = bảy ngày. Ghi ngày nào thì cánh đó trắng có viền; chưa ghi thì cánh
 * màu kem nhạt, không viền. Đủ năm cánh thì nhuỵ chuyển vàng rực — đây là phần
 * thưởng DUY NHẤT, không có điểm số nào để mất.
 *
 * Tuần hỏng thì bông hoa vẫn ở đó, chỉ là nhuỵ xám nằm im: không thông báo,
 * không câu nào nhắc tới. §9.1 bỏ streak chính vì cảm giác tội lỗi nó tạo ra.
 */

const SO_CANH = 7
const GOC = 360 / SO_CANH

/** Màu lấy nguyên từ mockup v2 — cánh nở, cánh chưa nở, nhuỵ vàng, nhuỵ xám. */
const NO = { to: '#ffffff', vien: '#d9d2c4' }
const CHUA_NO = '#efeadf'
const NHUY_VANG = '#e8c34a'
const NHUY_XAM = '#ded7c6'
const VIEN_NHUY = '#c9a227'

export function HoaCuc({
  nhip,
  homNayThu,
  vuaGhi,
  co = 58,
}: {
  nhip: NhipTuan
  /** 0 = Thứ Hai … 6 = Chủ Nhật. Cánh của hôm nay là cánh được bung. */
  homNayThu: number
  /** Vừa ghi xong ⇒ bung cánh hôm nay. */
  vuaGhi: boolean
  co?: number
}) {
  return (
    <svg
      width={co}
      height={co}
      viewBox="0 0 60 60"
      role="img"
      aria-label={`Tuần này ${nhip.daGhi} trên ${SO_CANH} cánh`}
    >
      {nhip.canh.map((no, i) => (
        <g
          key={i}
          transform={`rotate(${GOC * i} 30 30)`}
          // Bung 400ms bằng CSS thuần, không thư viện — §11.5 tự chứng minh
          // CSS đủ, và §5 · G2 đã cắt Framer Motion khỏi MVP.
          style={
            vuaGhi && i === homNayThu
              ? { animation: 'bung-canh 400ms ease-out', transformOrigin: '30px 30px' }
              : undefined
          }
        >
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
        fill={nhip.duNo ? NHUY_VANG : NHUY_XAM}
        stroke={nhip.duNo ? VIEN_NHUY : 'none'}
        strokeWidth="1"
        className="transition-[fill] duration-700"
      />
    </svg>
  )
}

/**
 * Thẻ hoa cúc trên màn ① — bông hoa cộng một dòng chữ.
 *
 * Câu chữ theo đúng ba trạng thái §9.2 quy định, và chỉ có ĐÚNG MỘT câu mang
 * tính thúc đẩy: lúc còn 1 cánh nữa là đủ. Ngoài mốc đó thì không thúc.
 */
export function TheHoaCuc({
  nhip,
  homNayThu,
  vuaGhi,
}: {
  nhip: NhipTuan
  homNayThu: number
  vuaGhi: boolean
}) {
  return (
    <div className="bg-surface border-line2 flex items-center gap-3.5 rounded-2xl border p-4">
      <HoaCuc nhip={nhip} homNayThu={homNayThu} vuaGhi={vuaGhi} />
      <div>
        <div className="text-[13.5px] font-semibold">
          Tuần này {nhip.daGhi}/{SO_CANH} cánh
        </div>
        <div className="text-ink2 text-[12.5px]">
          {nhip.duNo
            ? 'Hoa nở đủ rồi, tuần đẹp lắm 🌼'
            : nhip.nenThucDay
              ? `Còn ${DU_CANH - nhip.daGhi} ngày nữa là hoa nở đủ 🌼`
              : // Tuần hỏng: KHÔNG nói gì về chuyện hỏng. Chỉ một câu trung tính,
                // đúng tinh thần §9.2 — lỡ một ngày cũng không sao.
                'Ghi ngày nào thì cánh ngày đó nở 🌱'}
        </div>
      </div>
    </div>
  )
}
