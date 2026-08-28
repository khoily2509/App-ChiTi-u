import { sinhSao, type BauTroi } from '@/shared/domain/bau-troi'

/**
 * NỀN BẦU TRỜI — mặt trời, mây, sao, trăng. Theo `mockup-v3-ba-bau-troi.html`.
 *
 * Vẽ bằng SVG TĨNH, không dùng `filter: blur()` như mockup. Blur là bộ lọc chạy
 * lại mỗi khung hình lúc cuộn; `radialGradient` cho ra rìa mềm y hệt mà chỉ tốn
 * một lần vẽ. Đó là điều kiện Khôi đặt ra khi chốt nền tĩnh (22/08/2026).
 *
 * Sao cũng không dùng <canvas> như mockup: canvas phải vẽ lại bằng script mỗi
 * lần component gắn vào cây, còn SVG thì trình duyệt giữ nguyên.
 *
 * Lớp này nằm sau toàn bộ nội dung (`fixed`, `-z-10`) và không nhận chạm.
 */
export function NenTroi({ canh }: { canh: BauTroi }) {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: 'var(--troi)' }}
      aria-hidden
    >
      <svg className="h-full w-full" viewBox="0 0 100 200" preserveAspectRatio="xMidYMin slice">
        {canh === 'binh_minh' && <BinhMinh />}
        {canh === 'hoang_hon' && <HoangHon />}
        {canh === 'ngan_ha' && <NganHa />}
      </svg>
    </div>
  )
}

/**
 * Mây: ba bầu tròn chồng nhau, mỗi bầu là một `radialGradient` mờ dần ra rìa.
 * Không có bộ lọc nào — rìa mềm đến từ chính gradient.
 */
function May({ x, y, co, mo }: { x: number; y: number; co: number; mo: number }) {
  return (
    <g opacity={mo}>
      <ellipse cx={x} cy={y} rx={co * 1.6} ry={co * 0.62} fill="url(#g-may)" />
      <ellipse cx={x + co * 0.9} cy={y - co * 0.28} rx={co} ry={co * 0.5} fill="url(#g-may)" />
      <ellipse cx={x - co} cy={y + co * 0.1} rx={co * 0.8} ry={co * 0.4} fill="url(#g-may)" />
    </g>
  )
}

/**
 * BÌNH MINH — mặt trời NGÓ LÊN KHÁ CAO và màu HƠI NHẠT (Khôi chốt 21/08/2026).
 * Quầng sáng rộng mà mỏng, đúng kiểu nắng sớm còn loãng.
 */
function BinhMinh() {
  return (
    <>
      <defs>
        <radialGradient id="g-may">
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="g-quang-bm">
          <stop offset="0%" stopColor="#fff6d8" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#ffeec9" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ffeec9" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="g-troi-bm">
          <stop offset="0%" stopColor="#fffdf4" />
          <stop offset="62%" stopColor="#ffeec9" />
          <stop offset="100%" stopColor="#fbdca6" />
        </radialGradient>
      </defs>

      {/* Mặt trời NGÓ LÊN CAO, quầng rộng mà mỏng — nắng sớm còn loãng.
          Đặt sát dải trời trên cùng: bản đầu tôi để giữa màn, nó đè lên thanh
          nhịp và dòng ngân sách. Nền phải nhường chỗ cho dữ liệu (§10). */}
      <circle cx="78" cy="15" r="26" fill="url(#g-quang-bm)" />
      <circle cx="78" cy="15" r="7" fill="url(#g-troi-bm)" />

      {/* Mây dồn lên dải trời phía trên, mờ dần xuống dưới — phía dưới là chỗ
          thẻ nằm, mây ở đó vừa bị che vừa làm chữ khó đọc. */}
      <May x={24} y={22} co={6.5} mo={0.62} />
      <May x={62} y={40} co={5} mo={0.4} />
      <May x={18} y={58} co={7.5} mo={0.24} />
    </>
  )
}

/**
 * HOÀNG HÔN — mặt trời XUỐNG MỘT NỬA sau dải chân trời, màu ĐẬM hơn bình minh
 * (Khôi chốt 21/08/2026). Quầng hẹp mà gắt, đúng kiểu nắng cuối ngày.
 */
function HoangHon() {
  return (
    <>
      <defs>
        <radialGradient id="g-may">
          <stop offset="45%" stopColor="#fff3ea" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fff3ea" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="g-quang-hh">
          <stop offset="0%" stopColor="#ffcf94" stopOpacity="0.7" />
          <stop offset="45%" stopColor="#f7a874" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#f7a874" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="g-troi-hh">
          <stop offset="0%" stopColor="#fff6e2" />
          <stop offset="58%" stopColor="#ffd79a" />
          <stop offset="100%" stopColor="#f7a874" />
        </radialGradient>
        {/* Cắt nửa dưới mặt trời để nó lặn sau chân trời — dùng mặt nạ thay vì
            vẽ đè một hình cùng màu nền, vì nền là gradient nên không có "một
            màu" nào để vẽ đè cho khớp. */}
        <clipPath id="cat-chan-troi">
          <rect x="0" y="0" width="100" height="26" />
        </clipPath>
      </defs>

      {/* Mặt trời XUỐNG MỘT NỬA: cắt nửa dưới bằng clipPath, chỉ còn vòm trên
          nhô khỏi chân trời. Quầng hẹp mà gắt — nắng cuối ngày. */}
      <g clipPath="url(#cat-chan-troi)">
        <circle cx="74" cy="26" r="22" fill="url(#g-quang-hh)" />
        <circle cx="74" cy="26" r="8.5" fill="url(#g-troi-hh)" />
      </g>

      {/* Vệt sáng mỏng ngay chỗ mặt trời chạm xuống, để nửa bị cắt trông như
          khuất sau đường chân trời chứ không như bị xén. */}
      <rect x="0" y="24" width="100" height="3.5" fill="url(#g-quang-hh)" opacity="0.55" />

      <May x={26} y={16} co={6} mo={0.5} />
      <May x={58} y={44} co={5.5} mo={0.3} />
      <May x={20} y={62} co={8} mo={0.2} />
    </>
  )
}

/** NGÂN HÀ — sao rải tất định + trăng khuyết. */
function NganHa() {
  const sao = sinhSao()
  return (
    <>
      <defs>
        <radialGradient id="g-quang-trang">
          <stop offset="0%" stopColor="#f6f0dc" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#f6f0dc" stopOpacity="0" />
        </radialGradient>
        {/* Trăng khuyết = hình tròn TRỪ một hình tròn lệch. Mặt nạ chứ không vẽ
            đè hình màu nền: nền là gradient nên vẽ đè sẽ lộ vệt màu sai. */}
        <mask id="m-trang">
          <circle cx="85" cy="15" r="5" fill="#fff" />
          <circle cx="86.9" cy="13.1" r="5" fill="#000" />
        </mask>
      </defs>

      {sao.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          // Sao sinh ra theo % chiều cao, viewBox cao 200 nên nhân đôi.
          cy={s.y * 2}
          r={s.r * 0.32}
          fill={s.tim ? '#d9c8f2' : '#f2eefc'}
          opacity={s.mo}
        />
      ))}

      {/* Trăng lùi hẳn về góc trên phải và nhỏ lại. Bản đầu tôi đặt to ở giữa
          trên: nó đè lên đúng con số ≥48px của màn ① và tranh chỗ với thanh nhịp.
          Nền là nền — nó phải ở phía sau, không được đòi được nhìn. */}
      <circle cx="85" cy="15" r="13" fill="url(#g-quang-trang)" />
      <circle cx="85" cy="15" r="5" fill="#f6f0dc" opacity="0.82" mask="url(#m-trang)" />
    </>
  )
}
