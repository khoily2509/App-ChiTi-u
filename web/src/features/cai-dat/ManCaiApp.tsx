import { laIos } from '@/shared/ui/daCai'

/**
 * HƯỚNG DẪN CÀI LÊN MÀN HÌNH CHÍNH (AT-06).
 *
 * iOS KHÔNG có nút cài tự động — không có `beforeinstallprompt`, không có hộp
 * thoại nào gọi ra được. Bồ phải tự bấm Chia sẻ → Thêm vào MH chính. Vì vậy màn
 * này không phải màn phụ mà là con đường DUY NHẤT.
 *
 * AT-06 chốt: hướng dẫn phải có HÌNH, và tuyệt đối không hiện lỗi kỹ thuật kiểu
 * "beforeinstallprompt is not supported". Bồ không cần biết chuyện đó tồn tại.
 *
 * Cài xong còn mở khoá Web Push: trên iOS thông báo chỉ chạy khi app đã ở màn
 * hình chính. Nói rõ lợi ích để việc này đáng làm chứ không như một thủ tục.
 */
export function ManCaiApp({ onQuayLai }: { onQuayLai: () => void }) {
  const ios = laIos()

  const buoc = ios
    ? [
        { icon: <IconChiaSe />, chu: 'Bấm nút Chia sẻ ở thanh dưới Safari' },
        { icon: <IconCong />, chu: 'Kéo xuống, chọn “Thêm vào MH chính”' },
        { icon: <IconHoa />, chu: 'Bấm “Thêm” — xong, hoa cúc nằm ngoài màn hình chính' },
      ]
    : [
        { icon: <IconBaCham />, chu: 'Mở menu ⋮ của trình duyệt' },
        { icon: <IconCong />, chu: 'Chọn “Cài đặt ứng dụng” hoặc “Thêm vào màn hình chính”' },
        { icon: <IconHoa />, chu: 'Xác nhận — xong' },
      ]

  return (
    <main className="bg-page text-ink mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <div className="flex-1 px-5 pt-10">
        <h1 className="font-serif text-2xl">Đưa sổ ra màn hình chính</h1>
        <p className="text-ink2 mt-1 text-sm">
          Mở một chạm là ghi được, không phải gõ địa chỉ nữa 🌱
        </p>

        <ol className="mt-6 space-y-3">
          {buoc.map((b, i) => (
            <li key={i} className="bg-surface flex items-center gap-3.5 rounded-2xl p-4">
              <span className="bg-c1-t text-c1-ink grid size-10 shrink-0 place-items-center rounded-[14px]">
                {b.icon}
              </span>
              <span className="flex-1 text-sm">
                <b className="text-muted mr-1.5">{i + 1}.</b>
                {b.chu}
              </span>
            </li>
          ))}
        </ol>

        <div className="bg-c4-t text-c4-ink mt-5 rounded-2xl p-4 text-sm">
          Cài xong thì app mới gửi được lời nhắc buổi tối.
          {ios && ' Trên iPhone, thông báo chỉ chạy khi sổ đã nằm ở màn hình chính.'}
        </div>
      </div>

      <div className="p-4">
        <button onClick={onQuayLai} className="text-ink2 w-full py-3 text-sm">
          Để sau cũng được
        </button>
      </div>
    </main>
  )
}

/* Vẽ tay theo lưới 24px, nét 1,7px — cùng khuôn với bộ icon ở `Icon.tsx`, để ba
   bước này đứng cạnh nhau không lệch nét. */
const chung = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/** Nút Chia sẻ của iOS: hình vuông có mũi tên chĩa lên. */
function IconChiaSe() {
  return (
    <svg {...chung}>
      <path d="M12 3.5v11" />
      <path d="M8.5 7 12 3.5 15.5 7" />
      <path d="M7 11H5.5v9h13v-9H17" />
    </svg>
  )
}

function IconCong() {
  return (
    <svg {...chung}>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  )
}

function IconBaCham() {
  return (
    <svg {...chung}>
      <circle cx="12" cy="5.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Bông cúc — cùng hình với icon app, để bồ nhận ra thứ sắp hiện ra. */
function IconHoa() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      {[0, 51.43, 102.86, 154.29, 205.71, 257.14, 308.57].map((g) => (
        <ellipse key={g} cx="12" cy="6" rx="2.6" ry="5" transform={`rotate(${g} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="3.2" fill="#e8c34a" />
    </svg>
  )
}
