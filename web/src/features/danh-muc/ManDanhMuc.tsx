import { useState } from 'react'
import { Icon } from '@/shared/ui/Icon'
import { ICON_CHON_DUOC, iconDanhMuc } from '@/shared/design/icon'
import { mauSlot } from '@/shared/design/mau'
import {
  slotConTrong,
  loiCuaTen,
  choTrongManChinh,
  TEN_TOI_DA,
  SLOT_TOI_DA,
  O_MAN_CHINH,
} from '@/shared/domain/danh-muc'
import {
  themDanhMuc,
  suaDanhMuc,
  anDanhMuc,
  datHienManChinh,
  type DanhMucDb,
} from '@/shared/api/danh-muc'

/**
 * QUẢN LÝ DANH MỤC — §7.1.
 *
 * Màn này làm cho phép thử nghiệm thu của §7.1 đạt được: "đổi tên / định nghĩa /
 * icon của danh mục mà không sửa một dòng code nào". Trước đó danh mục sinh ra
 * một lần bởi trigger lúc tạo tài khoản rồi đứng yên vĩnh viễn.
 *
 * HAI CON SỐ TRẦN, KHÁC NHAU — đây là chỗ dễ nhầm nhất:
 *
 *   SLOT_TOI_DA = 10  ← trần MÀU. Mỗi danh mục cần một màu mà người mù màu
 *                       đỏ-lục vẫn tách được khỏi chín màu kia.
 *   O_MAN_CHINH = 6   ← trần MÀN HÌNH. Lưới ghi nhanh quá sáu ô thì đẩy thanh
 *                       nhịp tuần xuống dưới nếp gấp, mà ghi nhanh là tính
 *                       năng số 1 (§8).
 *
 * Nên từ danh mục thứ bảy trở đi, bồ chọn cái nào lên màn chính. Cái không được
 * chọn vẫn ghi được bình thường, chỉ là qua nút "+" thay vì chạm thẳng.
 *
 * KHÔNG có nút xoá, chỉ "Ẩn đi" (§13 không xoá cứng).
 */
export function ManDanhMuc({
  userId,
  danhMuc,
  onXong,
  onQuayLai,
}: {
  userId: string
  danhMuc: DanhMucDb[]
  onXong: () => void
  onQuayLai: () => void
}) {
  const [sua, setSua] = useState<DanhMucDb | 'moi' | null>(null)
  const [dangGat, setDangGat] = useState<string | null>(null)
  const [loi, setLoi] = useState<string | null>(null)

  // Danh mục hệ thống ("Chưa biết xếp đâu") không sửa được, không ẩn được —
  // §7.1 ràng buộc 3. Nó là lối thoát cho lúc lưỡng lự, mất nó là mất luôn đường
  // ghi nhanh khi chưa chắc xếp vào đâu.
  const cuaBo = danhMuc.filter((d) => !d.la_he_thong)
  const heThong = danhMuc.find((d) => d.la_he_thong)
  const slotMoi = slotConTrong(cuaBo.map((d) => d.slot))
  const dangHien = cuaBo.filter((d) => d.hien_man_chinh)
  const conCho = choTrongManChinh(dangHien.length)

  async function gat(d: DanhMucDb) {
    if (dangGat) return
    setLoi(null)
    if (!d.hien_man_chinh && conCho === 0) {
      setLoi(`Màn chính chỉ vừa ${O_MAN_CHINH} ô. Bỏ bớt một mục ra trước nhé.`)
      return
    }
    setDangGat(d.id)
    try {
      await datHienManChinh(d.id, !d.hien_man_chinh)
      onXong()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Chưa đổi được, thử lại nhé')
    } finally {
      setDangGat(null)
    }
  }

  if (sua !== null) {
    const dangSua = sua === 'moi' ? null : sua
    return (
      <ManSuaDanhMuc
        userId={userId}
        dm={dangSua}
        slotMoi={slotMoi}
        conChoManChinh={conCho}
        tenDaCo={cuaBo.filter((d) => d.id !== dangSua?.id).map((d) => d.ten)}
        onXong={() => {
          setSua(null)
          onXong()
        }}
        onHuy={() => setSua(null)}
      />
    )
  }

  return (
    <main className="bg-page text-ink mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <div className="flex-1 px-5 pt-10">
        <h1 className="font-serif text-2xl">Danh mục</h1>
        <p className="text-ink2 mt-1 text-sm">
          Công tắc bên phải chọn mục nào hiện sẵn ở màn chính — vừa {O_MAN_CHINH} ô 🌿
        </p>

        <div className="mt-6 space-y-2">
          {cuaBo.map((d) => (
            <Hang
              key={d.id}
              dm={d}
              dangGat={dangGat === d.id}
              onSua={() => setSua(d)}
              onGat={() => void gat(d)}
            />
          ))}
        </div>

        {loi && <p className="text-nguy-cap mt-3 text-sm">{loi}</p>}

        <p className="text-muted mt-3 text-xs">
          {conCho > 0
            ? `Màn chính còn ${conCho} chỗ.`
            : `Màn chính đã đủ ${O_MAN_CHINH} mục. Mấy mục còn lại vẫn ghi được qua nút +.`}
        </p>

        {slotMoi !== null ? (
          <button
            onClick={() => {
              setLoi(null)
              setSua('moi')
            }}
            className="border-line2 text-ink2 mt-3 w-full rounded-2xl border border-dashed py-4 text-sm"
          >
            + Thêm danh mục
          </button>
        ) : (
          <p className="text-muted mt-3 text-center text-xs">
            Đủ {SLOT_TOI_DA} danh mục rồi. Mỗi màu thêm vào lại ép các màu cũ sát nhau hơn, và{' '}
            {SLOT_TOI_DA} là mức còn tách bạch được với người khó phân biệt màu.
          </p>
        )}

        {heThong && (
          <>
            <h2 className="text-ink2 mt-8 text-sm font-medium">Của hệ thống</h2>
            <div className="border-line2 bg-surface mt-2 flex items-center gap-3 rounded-2xl border p-4 opacity-70">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e8e9e5]">
                <Icon ten="plus" mau="#8d9186" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium">{heThong.ten}</div>
                <div className="text-ink2 text-xs">Lưu mà chưa chọn gì thì rơi vào đây</div>
              </div>
            </div>
          </>
        )}
      </div>

      <button onClick={onQuayLai} className="text-ink2 w-full py-4 text-sm">
        Quay lại
      </button>
    </main>
  )
}

function Hang({
  dm,
  dangGat,
  onSua,
  onGat,
}: {
  dm: DanhMucDb
  dangGat: boolean
  onSua: () => void
  onGat: () => void
}) {
  const m = mauSlot(dm.slot)
  return (
    <div className="border-line2 bg-surface flex items-center gap-3 rounded-2xl border p-4">
      {/* Thân hàng mở màn sửa; công tắc là nút RIÊNG. Lồng nút trong nút là HTML
          không hợp lệ và trên iOS chạm vào công tắc sẽ kích luôn cả hàng. */}
      <button onClick={onSua} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-xl"
          style={{ background: m.nen }}
        >
          <Icon ten={iconDanhMuc(dm.icon, dm.slot)} mau={m.mau} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{dm.ten}</span>
          {/* line-clamp-1 KHÔNG kèm `block`: hai thứ cùng đặt `display` và `block`
              thắng, làm cắt dòng mất tác dụng — đã vấp đúng lỗi đó ở lưới ghi nhanh. */}
          <span className="text-ink2 line-clamp-1 text-xs">
            {dm.dinh_nghia || 'Chưa có mô tả'}
          </span>
        </span>
      </button>

      <button
        onClick={onGat}
        disabled={dangGat}
        role="switch"
        aria-checked={dm.hien_man_chinh}
        aria-label={`${dm.ten} — hiện ở màn chính`}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          dm.hien_man_chinh ? 'bg-c1' : 'bg-line'
        } ${dangGat ? 'opacity-50' : ''}`}
      >
        <span
          className={`bg-surface absolute top-0.5 size-5 rounded-full transition-all ${
            dm.hien_man_chinh ? 'left-[1.375rem]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}

/** Sửa một danh mục, hoặc thêm mới khi `dm` là null. */
function ManSuaDanhMuc({
  userId,
  dm,
  slotMoi,
  conChoManChinh,
  tenDaCo,
  onXong,
  onHuy,
}: {
  userId: string
  dm: DanhMucDb | null
  slotMoi: number | null
  conChoManChinh: number
  tenDaCo: string[]
  onXong: () => void
  onHuy: () => void
}) {
  const slot = dm ? dm.slot : slotMoi
  const [ten, setTen] = useState(dm?.ten ?? '')
  const [dinhNghia, setDinhNghia] = useState(dm?.dinh_nghia ?? '')
  const [icon, setIcon] = useState(() => iconDanhMuc(dm?.icon, slot))
  const [dangLuu, setDangLuu] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)
  const [hoiAn, setHoiAn] = useState(false)

  const m = mauSlot(slot)
  const loiTen = loiCuaTen(ten, tenDaCo)
  const doiDinhNghia = dm ? dm.dinh_nghia.trim() !== dinhNghia.trim() : false

  async function luu() {
    if (dangLuu || loiTen) return
    setDangLuu(true)
    setLoi(null)
    try {
      if (dm) await suaDanhMuc(userId, dm, { ten, dinhNghia, icon })
      else if (slot !== null)
        await themDanhMuc({
          userId,
          ten,
          dinhNghia,
          icon,
          slot,
          // Hết chỗ trên màn chính thì mục mới nằm ngoài — im lặng đẩy một mục cũ
          // ra để nhường chỗ là kiểu tự tiện tệ nhất: bồ thêm một mục và mất một
          // mục khác mà không ai báo.
          hienManChinh: conChoManChinh > 0,
        })
      onXong()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Chưa lưu được, thử lại nhé')
      setDangLuu(false)
    }
  }

  async function an() {
    if (!dm || dangLuu) return
    setDangLuu(true)
    try {
      await anDanhMuc(userId, dm)
      onXong()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Chưa ẩn được, thử lại nhé')
      setDangLuu(false)
    }
  }

  if (hoiAn && dm) {
    return (
      <main className="bg-page text-ink mx-auto grid min-h-dvh w-full max-w-md place-items-center px-6">
        <div className="w-full text-center">
          <p className="font-serif text-xl">Ẩn “{dm.ten}” đi nhé?</p>
          <p className="text-ink2 mt-3 text-sm">
            Nó sẽ biến khỏi hàng ghi nhanh, nhưng những khoản đã ghi vẫn còn nguyên trong sổ và trên
            biểu đồ các chu kỳ cũ.
          </p>
          <button
            onClick={() => void an()}
            disabled={dangLuu}
            className="bg-c1 text-surface mt-6 w-full rounded-2xl py-4 font-semibold"
          >
            {dangLuu ? 'Đang ẩn…' : 'Ẩn đi'}
          </button>
          <button onClick={() => setHoiAn(false)} className="text-ink2 mt-2 w-full py-3 text-sm">
            Giữ lại
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-page text-ink mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <div className="flex-1 px-5 pt-10">
        <h1 className="font-serif text-2xl">{dm ? 'Sửa danh mục' : 'Danh mục mới'}</h1>

        <div className="bg-surface mt-6 rounded-2xl p-5">
          <label htmlFor="ten-dm" className="text-ink2 text-sm">
            Tên
          </label>
          <input
            id="ten-dm"
            value={ten}
            onChange={(e) => setTen(e.target.value)}
            maxLength={TEN_TOI_DA + 6}
            placeholder="Ví dụ: Sức khoẻ"
            className="border-line2 mt-1 w-full rounded-xl border bg-transparent px-3 py-2 text-lg"
          />
          {loiTen && ten.length > 0 && <p className="text-nguy-cap mt-1 text-xs">{loiTen}</p>}

          <label htmlFor="dn-dm" className="text-ink2 mt-4 block text-sm">
            Xếp gì vào đây
          </label>
          <textarea
            id="dn-dm"
            value={dinhNghia}
            onChange={(e) => setDinhNghia(e.target.value)}
            rows={2}
            placeholder="Thuốc, khám bệnh, tập gym"
            className="border-line2 mt-1 w-full resize-none rounded-xl border bg-transparent px-3 py-2 text-sm"
          />
          <p className="text-muted mt-1 text-xs">
            Dòng này hiện ngay dưới tên nút lúc ghi nhanh — nó giữ cho việc xếp mục nhất quán.
          </p>

          <span className="text-ink2 mt-4 block text-sm">Hình</span>
          <div className="mt-2 grid grid-cols-6 gap-2">
            {ICON_CHON_DUOC.map((t) => (
              <button
                key={t}
                onClick={() => setIcon(t)}
                aria-label={`Chọn hình ${t}`}
                aria-pressed={icon === t}
                className={`grid aspect-square place-items-center rounded-xl border-2 ${
                  icon === t ? 'border-c1' : 'border-transparent'
                }`}
                style={{ background: m.nen }}
              >
                <Icon ten={t} mau={m.mau} co={20} />
              </button>
            ))}
          </div>
        </div>

        {!dm && conChoManChinh === 0 && (
          <p className="bg-c6-t text-c6-ink mt-3 rounded-2xl p-4 text-sm">
            Màn chính đã đủ mục rồi, nên cái này sẽ nằm ngoài. Vẫn ghi được qua nút +, và bồ đổi lại
            bất cứ lúc nào bằng công tắc ở màn trước 🌿
          </p>
        )}

        {/* §7.1 ràng buộc 2: đổi định nghĩa làm số liệu cũ mang nghĩa khác số liệu
            mới. Nói trước cho bồ biết, thay vì âm thầm dời mốc rồi vài tháng sau
            biểu đồ so sánh nói dối mà không ai hiểu vì sao. */}
        {doiDinhNghia && (
          <p className="bg-c6-t text-c6-ink mt-3 rounded-2xl p-4 text-sm">
            Bồ đang đổi phần “xếp gì vào đây”. Mình sẽ ghi lại mốc hôm nay, để lúc so sánh với các
            chu kỳ trước còn biết là hai bên đang đếm hai thứ hơi khác nhau 🌿
          </p>
        )}

        {loi && <p className="text-nguy-cap mt-4 text-sm">{loi}</p>}
      </div>

      <div className="px-5 pb-4">
        <button
          onClick={() => void luu()}
          disabled={dangLuu || loiTen !== null}
          className="bg-c1 text-surface disabled:bg-line disabled:text-muted w-full rounded-2xl py-4 text-lg font-semibold"
        >
          {dangLuu ? 'Đang lưu…' : dm ? 'Lưu' : 'Thêm danh mục'}
        </button>
        {dm && (
          <button onClick={() => setHoiAn(true)} className="text-ink2 mt-2 w-full py-3 text-sm">
            Ẩn danh mục này
          </button>
        )}
        <button onClick={onHuy} className="text-ink2 mt-1 w-full py-3 text-sm">
          Quay lại
        </button>
      </div>
    </main>
  )
}
