import { Icon, type TenIcon } from './Icon'

/**
 * THANH NAV DƯỚI — theo mockup: 5 mục, nút ➕ 58px nổi lên trên.
 *
 * Trước đây app thay nguyên trang mỗi lần chuyển màn, nên bồ mất phương hướng:
 * không biết đang ở đâu, và về màn chính phải bấm "Quay lại". Mockup đã chốt
 * thanh nav từ vòng 3 nhưng §15 không giao việc dựng vỏ cho pha nào, nên nó rơi
 * qua khe giữa các pha (ghi nhận 23/08/2026).
 *
 * Nút ➕ to 58px và nổi lên 26px vì đó là TÍNH NĂNG SỐ 1 (§8) — ghi một khoản.
 * Mọi thứ khác trên thanh này chỉ là đường đi xem lại.
 */

export type Tab = 'hom_nay' | 'lich_su' | 'quy' | 'khac'

const MUC: { tab: Tab; nhan: string; icon: TenIcon }[] = [
  { tab: 'hom_nay', nhan: 'Hôm nay', icon: 'home' },
  { tab: 'lich_su', nhan: 'Lịch sử', icon: 'clock' },
  { tab: 'quy', nhan: 'Quỹ', icon: 'leafpot' },
  { tab: 'khac', nhan: 'Khác', icon: 'dots' },
]

export function ThanhNav({
  dang,
  onChon,
  onGhi,
}: {
  dang: Tab
  onChon: (t: Tab) => void
  onGhi: () => void
}) {
  const [trai, phai] = [MUC.slice(0, 2), MUC.slice(2)]

  return (
    // sticky + pb an toàn cho vùng gesture iPhone. Thanh nav che mất đáy nội
    // dung nếu không chừa chỗ — phần đó xử lý bằng padding ở khung ngoài.
    <nav
      className="border-line bg-page sticky bottom-0 z-10 grid grid-cols-5 items-end
                 border-t px-2 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      {trai.map((m) => (
        <Nut key={m.tab} {...m} on={dang === m.tab} onChon={onChon} />
      ))}

      <div className="grid place-items-center">
        <button
          onClick={onGhi}
          aria-label="Ghi một khoản"
          className="bg-c1 text-surface ring-page -mt-7 grid size-14 place-items-center
                     rounded-full shadow-lg ring-4 active:scale-95"
        >
          <Icon ten="plus" co={28} net={2} />
        </button>
      </div>

      {phai.map((m) => (
        <Nut key={m.tab} {...m} on={dang === m.tab} onChon={onChon} />
      ))}
    </nav>
  )
}

function Nut({
  tab,
  nhan,
  icon,
  on,
  onChon,
}: {
  tab: Tab
  nhan: string
  icon: TenIcon
  on: boolean
  onChon: (t: Tab) => void
}) {
  return (
    <button
      onClick={() => onChon(tab)}
      aria-current={on ? 'page' : undefined}
      className={`rounded-xl px-1 py-1.5 text-center text-xs ${
        on ? 'bg-c1-t text-c1-ink font-bold' : 'text-muted font-semibold'
      }`}
    >
      <span className="mx-auto mb-0.5 block w-fit">
        <Icon ten={icon} net={1.8} />
      </span>
      {nhan}
    </button>
  )
}
