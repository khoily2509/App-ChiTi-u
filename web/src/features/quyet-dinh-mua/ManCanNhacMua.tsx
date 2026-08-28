import { useState, useEffect } from 'react'
import { dong, dinhDang, type Dong as Tien } from '@/shared/domain/tien'
import { canNhacMua, type MucTieuUuTien, type KetQuaCanNhac } from '@/shared/domain/quyet-dinh'
import { BanPhimNghin } from '@/shared/ui/BanPhimNghin'
import type { Dong as DbRow } from '@/shared/api/supabase'
import type { QuyCoSoDu } from '@/shared/api/quy'

type DanhMuc = DbRow<'danh_muc'>

export type MonDeNguoi = {
  id: string
  tenMon: string
  danhMucId: string
  soTien: Tien
  taoLuc: number // timestamp ms
  hanDeNguoi: number // timestamp ms
}

const STORAGE_DE_NGUOI = 'sobo_mon_de_nguoi'
const STORAGE_TIEN_KHONG_TIEU = 'sobo_tien_khong_tieu'

export function ManCanNhacMua({
  userId: _userId,
  nganSachChuKy,
  daChi,
  thuNhapChuKy,
  soNgayTrongChuKy,
  soNgayConLai,
  danhMuc,
  quy,
  onQuayLai,
  onMuaNgay,
}: {
  userId: string
  nganSachChuKy: Tien
  daChi: Tien
  thuNhapChuKy: Tien
  soNgayTrongChuKy: number
  soNgayConLai: number
  danhMuc: DanhMuc[]
  quy: QuyCoSoDu[]
  onQuayLai: () => void
  onMuaNgay: (danhMucId: string, soTien: Tien, ghiChu: string) => void
}) {
  const [nghin, setNghin] = useState('')
  const soTien = dong(Number(nghin || '0') * 1000)
  const [chonDm, setChonDm] = useState<string>(danhMuc[0]?.id ?? '')
  const [tenMon, setTenMon] = useState('')
  const [ketQua, setKetQua] = useState<KetQuaCanNhac | null>(null)

  // Danh sách các món đang để nguội & tổng tiền đã không tiêu
  const [dsDeNguoi, setDsDeNguoi] = useState<MonDeNguoi[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_DE_NGUOI)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const [tienKhongTieu, setTienKhongTieu] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_TIEN_KHONG_TIEU)
      return raw ? Number(raw) : 0
    } catch {
      return 0
    }
  })

  const [thongBaoThanhCong, setThongBaoThanhCong] = useState<string | null>(null)

  // Mục tiêu ưu tiên gần nhất
  const mucTieuUuTien: MucTieuUuTien | null = (() => {
    const mt = quy.find((q) => q.so_tien_dich !== null && q.soDu < q.so_tien_dich)
    if (!mt || mt.so_tien_dich === null) return null
    return {
      ten: mt.ten,
      soTienDich: dong(mt.so_tien_dich),
      soDuHienTai: mt.soDu,
    }
  })()

  // Phân tích khi số tiền > 0
  useEffect(() => {
    if (soTien <= 0) {
      setKetQua(null)
      return
    }
    const kq = canNhacMua({
      soTienMua: soTien,
      nganSachChuKy,
      daChi,
      thuNhapChuKy,
      soNgayTrongChuKy,
      soNgayConLai,
      mucTieu: mucTieuUuTien,
    })
    setKetQua(kq)
  }, [soTien, nganSachChuKy, daChi, thuNhapChuKy, soNgayTrongChuKy, soNgayConLai])

  function luuDeNguoi() {
    if (soTien <= 0 || !ketQua) return
    const bayGio = Date.now()
    const monMoi: MonDeNguoi = {
      id: `mon-${bayGio}`,
      tenMon: tenMon.trim() || 'Món đồ cân nhắc',
      danhMucId: chonDm,
      soTien,
      taoLuc: bayGio,
      hanDeNguoi: bayGio + ketQua.gioDeNguoi * 3600 * 1000,
    }
    const moi = [monMoi, ...dsDeNguoi]
    setDsDeNguoi(moi)
    localStorage.setItem(STORAGE_DE_NGUOI, JSON.stringify(moi))
    setThongBaoThanhCong(`Đã đưa vào danh sách để nguội trong ${ketQua.nhanDeNguoi} 🧊`)
    setNghin('')
    setTenMon('')
  }

  function quyetDinhKhongMua(monId?: string, soTienKhongMua?: Tien) {
    const tienHuy = soTienKhongMua ?? soTien
    const tongMoi = tienKhongTieu + tienHuy
    setTienKhongTieu(tongMoi)
    localStorage.setItem(STORAGE_TIEN_KHONG_TIEU, String(tongMoi))

    if (monId) {
      const moi = dsDeNguoi.filter((m) => m.id !== monId)
      setDsDeNguoi(moi)
      localStorage.setItem(STORAGE_DE_NGUOI, JSON.stringify(moi))
    }

    setThongBaoThanhCong(`Tuyệt vời! Bồ vừa giữ lại được ${dinhDang(dong(tienHuy))} cho tương lai ✨`)
    setNghin('')
    setTenMon('')
  }

  function xacNhanMuaNgay(dmId?: string, tien?: Tien, ten?: string) {
    const targetDm = dmId ?? chonDm
    const targetTien = tien ?? soTien
    const targetTen = ten ?? tenMon
    onMuaNgay(targetDm, targetTien, targetTen ? `[Cân nhắc mua] ${targetTen}` : '[Cân nhắc mua]')
  }

  return (
    <main className="bg-page text-ink mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <div className="flex-1 px-5 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl">Cân nhắc mua 🌿</h1>
          <button onClick={onQuayLai} className="text-ink2 text-sm">
            Đóng
          </button>
        </div>
        <p className="text-ink2 mt-1 text-sm">
          Tính năng #9: Xem món đồ này ảnh hưởng thế nào trước khi quẹt thẻ ✨
        </p>

        {/* THÔNG BÁO TIỀN ĐÃ KHÔNG TIÊU */}
        {tienKhongTieu > 0 && (
          <div className="bg-c1-t text-c1-ink mt-4 flex items-center justify-between rounded-2xl p-4 text-sm">
            <div>
              <div className="font-medium">Tiền đã quyết định KHÔNG tiêu:</div>
              <div className="text-lg font-semibold tabular-nums">{dinhDang(dong(tienKhongTieu))}</div>
            </div>
            <span className="text-2xl">🪙</span>
          </div>
        )}

        {thongBaoThanhCong && (
          <div className="bg-surface border-line2 text-ink mt-3 rounded-2xl border p-3.5 text-sm">
            {thongBaoThanhCong}
          </div>
        )}

        {/* Ô NHẬP TÊN MÓN VÀ DANH MỤC */}
        <div className="mt-5 space-y-3">
          <div>
            <label className="text-muted text-xs">Tên món dự định mua (tùy chọn)</label>
            <input
              type="text"
              value={tenMon}
              onChange={(e) => setTenMon(e.target.value)}
              placeholder="VD: Son dưỡng, Áo khoác, Tai nghe..."
              className="bg-surface border-line2 mt-1 w-full rounded-2xl border p-3.5 text-sm outline-none"
            />
          </div>

          <div>
            <label className="text-muted text-xs">Thuộc danh mục</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {danhMuc.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setChonDm(d.id)}
                  className={`rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                    chonDm === d.id
                      ? 'bg-c1 text-surface font-semibold'
                      : 'bg-surface border border-line2 text-ink2'
                  }`}
                >
                  {d.ten}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BÀN PHÍM NHẬP SỐ TIỀN */}
        <div className="mt-4 rounded-2xl bg-surface p-4">
          <div className="text-muted text-xs">Số tiền món đồ</div>
          <div className="mt-1 text-3xl font-semibold tabular-nums">{dinhDang(soTien)}</div>
        </div>

        <div className="mt-3">
          <BanPhimNghin nghin={nghin} onDoi={setNghin} />
        </div>

        {/* KẾT QUẢ PHÂN TÍCH 4 CHỈ SỐ (§6.2) */}
        {ketQua && soTien > 0 && (
          <div className="mt-6 space-y-3">
            <h2 className="text-sm font-semibold text-ink">Bức tranh tài chính nếu mua</h2>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-surface border-line2 rounded-2xl border p-3.5">
                <div className="text-muted text-[11px]">% Ngân sách tháng</div>
                <div className="mt-1 text-xl font-semibold tabular-nums text-ink">
                  {ketQua.phanTramNganSach}%
                </div>
                <div className="text-ink2 text-[11px]">ngân sách cả chu kỳ</div>
              </div>

              <div className="bg-surface border-line2 rounded-2xl border p-3.5">
                <div className="text-muted text-[11px]">% Số tiền còn lại</div>
                <div
                  className={`mt-1 text-xl font-semibold tabular-nums ${
                    ketQua.biVuotNganSach ? 'text-nguy-cap font-bold' : 'text-ink'
                  }`}
                >
                  {ketQua.phanTramConLai}%
                </div>
                <div className="text-ink2 text-[11px]">
                  {ketQua.biVuotNganSach ? 'Vượt quá tiền còn lại!' : 'tiền chưa tiêu'}
                </div>
              </div>
            </div>

            {/* TRÌ HOÃN MỤC TIÊU */}
            {ketQua.cauMucTieu && (
              <div className="bg-c4-t text-c4-ink rounded-2xl p-4 text-sm font-medium">
                ⏳ <b>Trì hoãn:</b> {ketQua.cauMucTieu}
              </div>
            )}

            {/* LỐI THOÁT KHẮC PHỤC */}
            <div className="bg-c1-t text-c1-ink rounded-2xl p-4 text-xs font-medium">
              💡 <b>Lối thoát:</b> {ketQua.keHoachBu}
            </div>

            {/* 3 NÚT HÀNH ĐỘNG */}
            <div className="mt-4 space-y-2 pt-2">
              <button
                onClick={luuDeNguoi}
                className="bg-surface border-line2 text-c1-ink flex w-full items-center justify-center gap-2 rounded-2xl border py-3.5 text-sm font-semibold shadow-xs"
              >
                <span>🧊</span>
                <span>Để nguội ({ketQua.nhanDeNguoi})</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => quyetDinhKhongMua()}
                  className="bg-c1 text-surface rounded-2xl py-3.5 text-sm font-semibold"
                >
                  🪙 Thôi không mua
                </button>
                <button
                  onClick={() => xacNhanMuaNgay()}
                  className="bg-surface border-line2 text-ink2 rounded-2xl border py-3.5 text-sm font-medium"
                >
                  🛍️ Quyết mua luôn
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DANH SÁCH CÁC MÓN ĐANG ĐỂ NGUỘI */}
        {dsDeNguoi.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-ink">Món đang để nguội ({dsDeNguoi.length})</h2>
            <div className="mt-3 space-y-2.5">
              {dsDeNguoi.map((m) => {
                const conLaiMs = m.hanDeNguoi - Date.now()
                const hetHan = conLaiMs <= 0
                const dm = danhMuc.find((d) => d.id === m.danhMucId)
                const gioCon = Math.max(0, Math.ceil(conLaiMs / (3600 * 1000)))

                return (
                  <div
                    key={m.id}
                    className="bg-surface border-line2 rounded-2xl border p-4 text-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{m.tenMon}</div>
                        <div className="text-muted text-xs">
                          {dm?.ten ?? 'Danh mục'} · {dinhDang(m.soTien)}
                        </div>
                      </div>
                      <span className="rounded-full bg-sage-soft px-2.5 py-1 text-[11px] font-medium text-sage">
                        {hetHan ? 'Đã đủ giờ nguội 🌼' : `Còn ${gioCon}h`}
                      </span>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => quyetDinhKhongMua(m.id, m.soTien)}
                        className="bg-c1-t text-c1-ink flex-1 rounded-xl py-2 text-xs font-semibold"
                      >
                        🪙 Thôi không mua nữa
                      </button>
                      <button
                        onClick={() => {
                          xacNhanMuaNgay(m.danhMucId, m.soTien, m.tenMon)
                          setDsDeNguoi(dsDeNguoi.filter((x) => x.id !== m.id))
                          localStorage.setItem(
                            STORAGE_DE_NGUOI,
                            JSON.stringify(dsDeNguoi.filter((x) => x.id !== m.id)),
                          )
                        }}
                        className="bg-surface border-line2 text-ink2 flex-1 rounded-xl border py-2 text-xs font-medium"
                      >
                        🛍️ Vẫn mua
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
