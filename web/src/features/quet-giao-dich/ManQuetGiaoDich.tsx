import { useState, useEffect } from 'react'
import { dong, dinhDang, type Dong as Tien } from '@/shared/domain/tien'
import { phanTichTinNhanGiaoDich, type KetQuaPhanTich } from '@/shared/domain/phan-tich-giao-dich'
import type { Dong as DbRow } from '@/shared/api/supabase'

type DanhMuc = DbRow<'danh_muc'>

export function ManQuetGiaoDich({
  danhMuc,
  onGhi,
  onQuayLai,
}: {
  danhMuc: DanhMuc[]
  onGhi: (danhMucId: string, soTien: Tien, ghiChu: string) => Promise<void>
  onQuayLai: () => void
}) {
  const [vanBan, setVanBan] = useState('')
  const [ketQua, setKetQua] = useState<KetQuaPhanTich | null>(null)
  const [chonDm, setChonDm] = useState<string>(danhMuc[0]?.id ?? '')
  const [ghiChu, setGhiChu] = useState('')
  const [soTienSua, setSoTienSua] = useState<Tien>(dong(0))
  const [dangLuu, setDangLuu] = useState(false)
  const [thanhCong, setThanhCong] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)

  // Tự động phân tích khi văn bản thay đổi
  useEffect(() => {
    if (!vanBan.trim()) {
      setKetQua(null)
      return
    }

    const kq = phanTichTinNhanGiaoDich(vanBan)
    setKetQua(kq)
    setSoTienSua(kq.soTien)
    setGhiChu(kq.moTa)

    // Tự động chọn danh mục khớp nhất
    const timDm = danhMuc.find((d) => {
      const ten = d.ten.toLowerCase()
      if (
        kq.danhMucGoiY === 'an_uong' &&
        (ten.includes('ăn') || ten.includes('uống') || ten.includes('cơm'))
      )
        return true
      if (
        kq.danhMucGoiY === 'di_lai' &&
        (ten.includes('đi') || ten.includes('xe') || ten.includes('xăng'))
      )
        return true
      if (kq.danhMucGoiY === 'mua_sam' && (ten.includes('mua') || ten.includes('sắm'))) return true
      if (
        kq.danhMucGoiY === 'y_te' &&
        (ten.includes('thuốc') || ten.includes('khám') || ten.includes('y tế'))
      )
        return true
      return false
    })

    if (timDm) {
      setChonDm(timDm.id)
    }
  }, [vanBan, danhMuc])

  async function danTuBoNhoTam() {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText()
        setVanBan(text)
      }
    } catch {
      setLoi('Chưa được cấp quyền đọc bộ nhớ tạm, bồ dán trực tiếp vào ô nhé!')
    }
  }

  async function xacNhanGhi() {
    if (soTienSua <= 0 || dangLuu) return
    setDangLuu(true)
    setLoi(null)
    try {
      await onGhi(chonDm, soTienSua, ghiChu.trim() || '[SMS/OCR]')
      setThanhCong(true)
      setTimeout(() => {
        onQuayLai()
      }, 800)
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Chưa ghi được khoản này')
      setDangLuu(false)
    }
  }

  return (
    <main className="bg-page text-ink mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <div className="flex-1 px-5 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl">Quét SMS & Momo 📋</h1>
          <button onClick={onQuayLai} className="text-ink2 text-sm">
            Đóng
          </button>
        </div>
        <p className="text-ink2 mt-1 text-sm">
          Dán tin nhắn trừ tiền từ ngân hàng hoặc Momo để bóc tách tự động ✨
        </p>

        {/* Ô DÁN TIN NHẮN */}
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <label className="text-muted text-xs">Nội dung tin nhắn / thông báo</label>
            <button
              onClick={() => void danTuBoNhoTam()}
              className="text-c1-ink text-xs font-semibold underline"
            >
              📋 Dán từ bộ nhớ tạm
            </button>
          </div>
          <textarea
            rows={4}
            value={vanBan}
            onChange={(e) => setVanBan(e.target.value)}
            placeholder="Ví dụ: TK 12345 -45,000VND tai HIGHLANDS COFFEE..."
            className="bg-surface border-line2 mt-1.5 w-full rounded-2xl border p-3.5 text-sm outline-none"
          />
        </div>

        {/* KẾT QUẢ BÓC TÁCH */}
        {ketQua && ketQua.soTien > 0 && (
          <div className="bg-surface border-line2 mt-4 rounded-2xl border p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-c1-ink">
                ✨ Đã bóc tách thành công ({ketQua.doChinhXac}% tin cậy)
              </span>
              <span className="text-xs text-muted">Có thể chỉnh sửa</span>
            </div>

            <div className="mt-3">
              <div className="text-muted text-xs">Số tiền nhận diện</div>
              <div className="text-2xl font-bold tabular-nums text-ink">
                {dinhDang(soTienSua)}
              </div>
            </div>

            <div className="mt-3">
              <div className="text-muted text-xs">Mô tả</div>
              <input
                type="text"
                value={ghiChu}
                onChange={(e) => setGhiChu(e.target.value)}
                className="border-line mt-1 w-full rounded-xl border bg-surface2 p-2.5 text-xs outline-none"
              />
            </div>

            <div className="mt-3">
              <div className="text-muted text-xs">Xếp vào danh mục</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {danhMuc.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setChonDm(d.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                      chonDm === d.id
                        ? 'bg-c1 font-semibold text-surface'
                        : 'border-line2 bg-surface2 border text-ink2'
                    }`}
                  >
                    {d.ten}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* HƯỚNG DẪN APPLE SIRI SHORTCUTS (§8.3) */}
        <div className="border-line2 bg-surface mt-6 rounded-2xl border p-4 text-xs">
          <div className="font-semibold text-ink">💡 Tự động hoá với Siri Shortcuts (iOS)</div>
          <p className="text-ink2 mt-1.5 leading-relaxed">
            Bạn có thể tạo Phím tắt iOS tự động bắt thông báo từ Momo / Ngân hàng và mở link:
          </p>
          <code className="mt-2 block rounded-xl bg-surface2 p-2 text-[11px] text-ink font-mono break-all">
            {typeof window !== 'undefined'
              ? `${window.location.origin}/?action=ghi&soTien=35000`
              : 'https://sobo.app/?action=ghi'}
          </code>
        </div>

        {loi && <p className="text-nguy-cap mt-4 text-sm">{loi}</p>}
      </div>

      <div className="p-4">
        <button
          onClick={() => void xacNhanGhi()}
          disabled={!ketQua || ketQua.soTien <= 0 || dangLuu}
          className="bg-c1 text-surface w-full rounded-2xl py-4 text-lg font-semibold shadow-xs disabled:opacity-40"
        >
          {thanhCong ? 'Đã ghi xong! ✨' : dangLuu ? 'Đang ghi…' : 'Ghi ngay 1 chạm ✨'}
        </button>
      </div>
    </main>
  )
}
