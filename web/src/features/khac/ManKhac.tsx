import { dinhDang, dong } from '@/shared/domain/tien'
import { TEN_BAU_TROI, bauTroiTheoGio, gioVN, type ChonBauTroi } from '@/shared/domain/bau-troi'
import { daCaiLenManHinh } from '@/shared/ui/daCai'
import { useState } from 'react'
import { batThongBao, trangThaiThongBao } from '@/shared/api/thong-bao'

/**
 * MÀN "KHÁC" — mục thứ tư trên thanh nav.
 *
 * Chứa những việc làm MỘT LẦN MỖI CHU KỲ: nhập lương, đặt để dành, đặt hũ, sửa
 * ngày lương. Trước đây chúng nằm rải rác thành các thẻ trên màn ①, khiến màn
 * chính dài ra và đẩy lưới ghi nhanh xuống dưới nếp gấp — trong khi ghi nhanh
 * mới là tính năng số 1 (§8).
 *
 * Đây KHÔNG phải chỗ chôn tính năng: §6.2 nói rõ "Giúp đỡ" (cân nhắc mua) phải
 * là nút nổi bật ở màn chính, không nằm trong menu này.
 */
export function ManKhac({
  chonTroi,
  onDoiTroi,
  thuNhap,
  deDanh,
  tongHu,
  onNhapLuong,
  onDatDeDanh,
  onDatHu,
  onDoiNgayLuong,
  onSuaDanhMuc,
  onDoiMatKhau,
  onCaiApp,
  onNhanLuongMoi,
  userId,
}: {
  chonTroi: ChonBauTroi
  onDoiTroi: (c: ChonBauTroi) => void
  thuNhap: number | null
  deDanh: number
  tongHu: number
  onNhapLuong: () => void
  onDatDeDanh: () => void
  onDatHu: () => void
  onDoiNgayLuong: () => void
  onSuaDanhMuc: () => void
  onDoiMatKhau: () => void
  onCaiApp: () => void
  onNhanLuongMoi: () => void
  userId: string
}) {
  const [tb, setTb] = useState(trangThaiThongBao)
  const [dangHoi, setDangHoi] = useState(false)

  return (
    <div className="px-5 pt-8 pb-4">
      <h1 className="font-serif text-2xl">Khác</h1>
      <p className="text-ink2 mt-1 text-sm">Mấy việc làm một lần mỗi chu kỳ</p>

      {/* Nút Nghi thức nhận lương tháng mới (§7.6, Pha 7) */}
      <button
        onClick={onNhanLuongMoi}
        className="bg-c1-t text-c1-ink mt-4 flex w-full items-center justify-between rounded-2xl p-4 text-left shadow-2xs"
      >
        <div>
          <div className="font-semibold">Lương tháng mới đã về 🌾</div>
          <div className="text-ink2 mt-0.5 text-xs">
            Khép lại tháng cũ, quyết toán tiền dư & mở tháng mới
          </div>
        </div>
        <span className="text-sm font-medium underline">Bắt đầu →</span>
      </button>

      <div className="mt-5 space-y-2">
        <Muc
          nhan="Lương chu kỳ này"
          gia={thuNhap === null ? null : dinhDang(dong(thuNhap))}
          moi="Nhập"
          onBam={onNhapLuong}
        />
        <Muc
          nhan="Kế hoạch để dành"
          gia={deDanh > 0 ? dinhDang(dong(deDanh)) : null}
          moi="Đặt mức"
          onBam={onDatDeDanh}
        />
        <Muc
          nhan="Hũ từng mục"
          gia={tongHu > 0 ? dinhDang(dong(tongHu)) : null}
          moi="Đặt hũ"
          onBam={onDatHu}
        />
        <Muc nhan="Ngày lương" gia="Sửa" moi="Sửa" onBam={onDoiNgayLuong} />
        <Muc nhan="Danh mục" gia="Sửa" moi="Sửa" onBam={onSuaDanhMuc} />
        <Muc nhan="Mật khẩu" gia="Đổi" moi="Đổi" onBam={onDoiMatKhau} />
      </div>

      {/* Chỉ hiện khi CHƯA cài. Cài rồi mà vẫn bày ra thì thành một mục chết nằm
          đó mãi — và mục chết dạy người dùng bỏ qua cả menu. */}
      {!daCaiLenManHinh() && (
        <button
          onClick={onCaiApp}
          className="bg-c1-t text-c1-ink mt-3 flex w-full items-center justify-between rounded-2xl p-4 text-left"
        >
          <span className="text-sm font-medium">Đưa sổ ra màn hình chính</span>
          <span className="text-sm underline">Xem cách →</span>
        </button>
      )}

      {/* §9.2: app chỉ nhắc khi SẮP ĐẠT — 4/7 cánh và còn ít nhất một ngày. Nói
          rõ điều đó ngay đây, để bật thông báo không bị hiểu là "sẽ bị làm phiền
          mỗi tối". */}
      <h2 className="mt-8 text-sm font-medium">Lời nhắc</h2>
      <p className="text-ink2 mt-1 text-sm">
        Chỉ nhắc khi còn đúng một ngày nữa là hoa nở đủ — mỗi tuần nhiều nhất một lần 🌼
      </p>
      <div className="mt-3">
        {tb === 'da_bat' ? (
          <div className="bg-c1-t text-c1-ink rounded-2xl p-4 text-sm">
            Đã bật · app sẽ nhắc lúc 21:00
          </div>
        ) : tb === 'chua_cai_app' ? (
          // Trên iOS push CHỈ chạy khi app đã ở màn hình chính. Xin quyền lúc còn
          // trong Safari là hứa suông, nên dẫn sang bước cài trước.
          <button
            onClick={onCaiApp}
            className="bg-surface border-line2 w-full rounded-2xl border p-4 text-left text-sm"
          >
            <span className="text-ink2">Đưa sổ ra màn hình chính trước đã — </span>
            <span className="text-c1-ink underline">xem cách →</span>
          </button>
        ) : tb === 'bi_tu_choi' ? (
          // Trình duyệt KHÔNG cho hỏi lại sau khi đã từ chối. Chỉ dẫn được chỗ mở
          // lại trong cài đặt máy, chứ nút bấm ở đây sẽ không làm gì cả.
          <div className="bg-surface text-ink2 rounded-2xl p-4 text-sm">
            Máy đang chặn thông báo của sổ. Mở lại trong Cài đặt của điện thoại nhé — app
            không xin lại được nữa 🌱
          </div>
        ) : tb === 'khong_ho_tro' ? (
          <div className="bg-surface text-ink2 rounded-2xl p-4 text-sm">
            Trình duyệt này chưa nhận được thông báo. Mọi thứ khác vẫn dùng bình thường.
          </div>
        ) : (
          <button
            onClick={async () => {
              setDangHoi(true)
              setTb(await batThongBao(userId))
              setDangHoi(false)
            }}
            disabled={dangHoi}
            className="bg-c1 text-surface disabled:bg-line disabled:text-muted w-full rounded-2xl py-3.5 text-sm font-semibold"
          >
            {dangHoi ? 'Đang bật…' : 'Bật lời nhắc'}
          </button>
        )}
      </div>

      <h2 className="mt-8 text-sm font-medium">Nền bầu trời</h2>
      {/* §14 quy ước 5: thứ bồ có thể muốn đổi thì nằm trong DB, không phải trong
          code. Lựa chọn lưu ở `cau_hinh`, đổi không cần deploy lại. */}
      <p className="text-ink2 mt-1 text-sm">
        Để app tự đổi theo giờ, hoặc chốt một cảnh bồ thích 🌤
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(['tu_dong', 'binh_minh', 'hoang_hon', 'ngan_ha'] as const).map((c) => (
          <button
            key={c}
            onClick={() => onDoiTroi(c)}
            aria-pressed={chonTroi === c}
            className={`rounded-2xl border-2 p-3 text-left text-sm font-medium ${
              chonTroi === c ? 'border-c1 bg-c1-t text-c1-ink' : 'border-transparent bg-surface'
            }`}
          >
            {TEN_BAU_TROI[c]}
            {c === 'tu_dong' && (
              <span className="text-muted mt-0.5 block text-[11px] font-normal">
                giờ này là {TEN_BAU_TROI[bauTroiTheoGio(gioVN())].toLowerCase()}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* §7.2: chu kỳ dài 28–34 ngày tuỳ tháng, nên tháng ngắn sẽ thấy con số nhỏ
          hơn dù không tiêu nhiều hơn. Không nói rõ thì bồ tưởng app tính sai. */}
      <p className="text-muted mt-5 text-xs">
        Chu kỳ dài ngắn khác nhau tuỳ tháng, nên tháng ngắn con số mỗi ngày sẽ nhỏ hơn một chút
        dù bồ không tiêu nhiều hơn.
      </p>
    </div>
  )
}

function Muc({
  nhan,
  gia,
  moi,
  onBam,
}: {
  nhan: string
  gia: string | null
  moi: string
  onBam: () => void
}) {
  return (
    <button
      onClick={onBam}
      className="bg-surface flex w-full items-center justify-between rounded-2xl p-4 text-left"
    >
      <span className="text-muted text-xs">{nhan}</span>
      <span className="text-sm font-medium tabular-nums">
        {gia ?? <span className="text-c1-ink underline">{moi}</span>}
      </span>
    </button>
  )
}
