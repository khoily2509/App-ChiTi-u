/**
 * BỘ ICON — lấy NGUYÊN đường path từ `mockup-v2-thien-nhien.html`.
 *
 * Không vẽ lại: mockup là bản vẽ UI đã chốt (header CLAUDE.md), và vẽ lại theo
 * trí nhớ thì tỉ lệ sẽ lệch dần khỏi bản đã duyệt.
 *
 * Tất cả cùng lưới 24px, nét 1,7px, đầu nét tròn — đó là thứ giữ cho sáu icon
 * đứng cạnh nhau trông cùng một bộ. Riêng Mĩ phẩm là icon vẽ tay: Phosphor không
 * có cây son, và mockup đã chốt tự vẽ thay vì trộn hai thư viện (trộn bộ icon là
 * con đường nhanh nhất làm giao diện trông chắp vá).
 */

export type TenIcon =
  | 'bowl'
  | 'glass'
  | 'sprout'
  | 'lipstick'
  | 'book'
  | 'plus'
  | 'jar'
  | 'home'
  | 'clock'
  | 'leafpot'
  | 'dots'
  | 'tim'
  | 'thuoc'
  | 'xe'
  | 'xebuyt'
  | 'xang'
  | 'ao'
  | 'qua'
  | 'dienthoai'
  | 'wifi'
  | 'dien'
  | 'nuoc'
  | 'meo'
  | 'maybay'
  | 'giohang'
  | 'caphe'
  | 'keo'
  | 'ta'
  | 'embe'
  | 'cole'
  | 'nganhang'

const HINH: Record<TenIcon, React.ReactNode> = {
  bowl: (
    <>
      <path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0Z" />
      <path d="M9 7.5c0-1.2 1-1.6 1-2.8M13 7.8c0-1.5 1.2-1.9 1.2-3.3" />
    </>
  ),
  glass: (
    <>
      <path d="M4.5 4.5h15l-7.5 8-7.5-8Z" />
      <path d="M12 12.5V20M8.5 20h7" />
    </>
  ),
  sprout: (
    <>
      <path d="M12 20v-7" />
      <path d="M12 13c0-3 2.2-5.2 5.5-5.2 0 3.2-2.4 5.2-5.5 5.2Z" />
      <path d="M12 15.5c-2.6 0-4.6-1.8-4.6-4.5 2.9 0 4.6 1.7 4.6 4.5Z" />
    </>
  ),
  lipstick: (
    <>
      <path d="M9.2 12.4h5.6v7.4a1.4 1.4 0 0 1-1.4 1.4h-2.8a1.4 1.4 0 0 1-1.4-1.4v-7.4Z" />
      <path d="M8.5 12.4h7" />
      <path d="M10.2 12.4V7.7l3.2-2.5a.7.7 0 0 1 1.1.55v6.65" />
    </>
  ),
  book: (
    <>
      <path d="M12 6.8S10.2 5 6.5 5H4v13h2.8c3.4 0 5.2 1.6 5.2 1.6s1.8-1.6 5.2-1.6H20V5h-2.5C13.8 5 12 6.8 12 6.8Z" />
      <path d="M12 6.8v12.8" />
    </>
  ),
  plus: <path d="M12 6v12M6 12h12" />,
  jar: (
    <>
      <path d="M7.6 5.2h8.8v2.6H7.6z" />
      <path d="M8.3 7.8h7.4l1 10.4a1.6 1.6 0 0 1-1.6 1.8H8.9a1.6 1.6 0 0 1-1.6-1.8l1-10.4Z" />
      <path d="M12 12.4c-1.5-1.4-3 .5-1.4 1.8l1.4 1.3 1.4-1.3c1.6-1.3.1-3.2-1.4-1.8Z" />
    </>
  ),
  home: <path d="M4 10.5 12 4l8 6.5V20H4v-9.5Z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.3l2.8 1.7" />
    </>
  ),
  leafpot: (
    <>
      <path d="M6 13h12l-1.2 6.5H7.2L6 13Z" />
      <path d="M12 13V8" />
      <path d="M12 9.5c0-2.4 1.8-4 4.4-4 0 2.6-2 4-4.4 4Z" />
    </>
  ),
  dots: (
    <>
      <circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),

  // ── Thêm 27/08/2026 khi nới trần danh mục lên 10 ─────────────────────────
  // Vẽ theo đúng luật của mười một icon gốc: lưới 24, nét 1,7, đầu tròn, CHỈ NÉT
  // không tô. Đó mới là thứ giữ cho hai lứa icon đứng cạnh nhau trông cùng một
  // bộ — trộn icon tô đặc vào là giao diện lập tức thành chắp vá (§11.5).
  tim: (
    <>
      <path d="M12 20s-7-4.4-7-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7 2.8C19 15.6 12 20 12 20Z" />
    </>
  ),
  thuoc: (
    <>
      <rect x="3.2" y="9" width="17.6" height="6" rx="3" />
      <path d="M12 9v6M8.4 6.6l1.6 2.4M15.6 6.6 14 9" />
    </>
  ),
  xe: (
    <>
      <path d="M4 15.5h16M5.5 15.5v2M18.5 15.5v2" />
      <path d="M4.6 15.5 6 9.6A2 2 0 0 1 7.9 8h8.2a2 2 0 0 1 1.9 1.6l1.4 5.9" />
      <circle cx="7.6" cy="15.2" r="1.1" /><circle cx="16.4" cy="15.2" r="1.1" />
    </>
  ),
  xebuyt: (
    <>
      <rect x="4.5" y="4.5" width="15" height="12" rx="2.4" />
      <path d="M4.5 11h15M7.5 16.5v2M16.5 16.5v2" />
      <circle cx="8.2" cy="13.8" r="0.9" /><circle cx="15.8" cy="13.8" r="0.9" />
    </>
  ),
  xang: (
    <>
      <path d="M5 20V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14M4 20h10" />
      <path d="M13 9h3.4a1.6 1.6 0 0 1 1.6 1.6V16a1.5 1.5 0 0 0 3 0v-5l-2.2-2.6" />
    </>
  ),
  ao: (
    <>
      <path d="M9 4 5 6.2l1.4 3.4 1.8-.7V20h7.6V8.9l1.8.7L19 6.2 15 4a3 3 0 0 1-6 0Z" />
    </>
  ),
  qua: (
    <>
      <rect x="3.6" y="9.4" width="16.8" height="4" rx="1" />
      <path d="M5.2 13.4V20h13.6v-6.6M12 9.4V20" />
      <path d="M12 9.4S10.6 4.6 8.2 5.2 9.4 9.4 12 9.4Zm0 0s1.4-4.8 3.8-4.2S14.6 9.4 12 9.4Z" />
    </>
  ),
  dienthoai: (
    <>
      <rect x="6.6" y="2.8" width="10.8" height="18.4" rx="2.4" />
      <path d="M10.4 5.6h3.2" /><circle cx="12" cy="18" r="0.9" />
    </>
  ),
  wifi: (
    <>
      <path d="M3.6 9.2a13 13 0 0 1 16.8 0M6.6 12.6a8.4 8.4 0 0 1 10.8 0M9.6 16a4 4 0 0 1 4.8 0" />
      <circle cx="12" cy="19.2" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  dien: (
    <>
      <path d="M13.4 2.6 5.6 13.4h5.2L10.6 21.4l7.8-10.8h-5.2Z" />
    </>
  ),
  nuoc: (
    <>
      <path d="M12 3.4c3.2 3.6 5.6 6.6 5.6 9.4a5.6 5.6 0 0 1-11.2 0c0-2.8 2.4-5.8 5.6-9.4Z" />
    </>
  ),
  meo: (
    <>
      <path d="M5.6 10.4 4.6 5.6l3.8 2.2a8 8 0 0 1 7.2 0l3.8-2.2-1 4.8" />
      <path d="M4.6 13.6a7.4 7.4 0 0 0 14.8 0" />
      <circle cx="9.4" cy="12.6" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="14.6" cy="12.6" r="0.85" fill="currentColor" stroke="none" />
      <path d="M12 15v1.2" />
    </>
  ),
  maybay: (
    <>
      <path d="M11 2.6a1.4 1.4 0 0 1 2 0l.6 6.8 7 3.6v2l-7-1.8-.4 4.2 2.4 1.8v1.6L12 20l-3.6.8v-1.6l2.4-1.8-.4-4.2-7 1.8v-2l7-3.6Z" />
    </>
  ),
  giohang: (
    <>
      <path d="M2.8 4h2.6l2.4 10.4h9.4l2-7.2H6.6" />
      <circle cx="9.4" cy="18.4" r="1.4" /><circle cx="16.8" cy="18.4" r="1.4" />
    </>
  ),
  caphe: (
    <>
      <path d="M4.6 8.4h12v5.8a4.4 4.4 0 0 1-4.4 4.4H9a4.4 4.4 0 0 1-4.4-4.4Z" />
      <path d="M16.6 10h1.6a2.4 2.4 0 0 1 0 4.8h-1.6M4 21h13" />
      <path d="M8 5.6c0-1 .9-1.2.9-2.2M12.4 5.6c0-1 .9-1.2.9-2.2" />
    </>
  ),
  keo: (
    <>
      <circle cx="6.4" cy="18" r="2.2" /><circle cx="17.6" cy="18" r="2.2" />
      <path d="M8 16.4 18.4 4M16 16.4 5.6 4" />
    </>
  ),
  ta: (
    <>
      <path d="M3.2 9.4v5.2M6.2 7.4v9.2M17.8 7.4v9.2M20.8 9.4v5.2M6.2 12h11.6" />
    </>
  ),
  embe: (
    <>
      <circle cx="12" cy="8.2" r="4.2" />
      <path d="M10.4 7.6h.02M13.6 7.6h.02M10.6 9.8a2.4 2.4 0 0 0 2.8 0" />
      <path d="M6.4 20.4a5.6 5.6 0 0 1 11.2 0" />
    </>
  ),
  cole: (
    <>
      <path d="M15.6 3.4a5 5 0 0 0-4.4 7.4L3.4 18.6a2 2 0 0 0 2.8 2.8l7.8-7.8a5 5 0 0 0 6.2-6.4l-2.8 2.8-2.6-.7-.7-2.6Z" />
    </>
  ),
  nganhang: (
    <>
      <path d="M3.4 9.4 12 4.2l8.6 5.2M4.8 9.4v8.2M19.2 9.4v8.2M9 9.4v8.2M15 9.4v8.2M3 20.4h18" />
    </>
  ),
}

/**
 * `mau` để trống ⇒ lấy màu chữ đang có (`currentColor`), nhờ vậy icon trong nút
 * tự đổi màu theo trạng thái chọn mà không phải truyền màu vào từng chỗ.
 */
export function Icon({
  ten,
  co = 22,
  mau,
  net = 1.7,
}: {
  ten: TenIcon
  co?: number
  mau?: string
  net?: number
}) {
  return (
    <svg
      width={co}
      height={co}
      viewBox="0 0 24 24"
      fill="none"
      stroke={mau ?? 'currentColor'}
      strokeWidth={net}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {HINH[ten]}
    </svg>
  )
}
