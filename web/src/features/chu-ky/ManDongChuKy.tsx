import { useState } from 'react'
import { dong, dinhDang, type Dong as Tien } from '@/shared/domain/tien'
import { homNay, dinhDangNgay, themNgay, type NgayLocal } from '@/shared/domain/chu-ky'
import { tinhQuyetToanHu, type QuyetToanHu, type LuaChonQuyetToan } from '@/shared/domain/dong-chu-ky'
import { dongVaMoChuKyMoi } from '@/shared/api/dong-chu-ky'
import type { QuyCoSoDu } from '@/shared/api/quy'
import type { Dong as DbRow } from '@/shared/api/supabase'

type DanhMuc = DbRow<'danh_muc'>

export function ManDongChuKy({
  userId,
  chuKyId,
  thuNhap,
  daChi,
  deDanh,
  danhMuc,
  dsHu,
  chiTheoDanhMuc,
  quy,
  onXong,
  onHuy,
}: {
  userId: string
  chuKyId: string
  thuNhap: Tien
  daChi: Tien
  deDanh: Tien
  danhMuc: DanhMuc[]
  dsHu: { danhMucId: string; ten: string; hanMuc: Tien }[]
  chiTheoDanhMuc: Map<string, Tien>
  quy: QuyCoSoDu[]
  onXong: () => void
  onHuy: () => void
}) {
  const [ngayLuong, setNgayLuong] = useState<NgayLocal>(homNay())
  const [quyetToan, setQuyetToan] = useState<QuyetToanHu[]>(() =>
    tinhQuyetToanHu(dsHu, chiTheoDanhMuc),
  )
  const [quyChon, setQuyChon] = useState<string | null>(quy[0]?.id ?? null)
  const [dangXuLy, setDangXuLy] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)

  const tongDuHu = quyetToan.reduce((t, h) => t + h.soDu, 0)
  const danhMucMap = new Map(danhMuc.map((d) => [d.id, d]))

  function doiLuaChon(danhMucId: string, luaChon: LuaChonQuyetToan) {
    setQuyetToan(
      quyetToan.map((h) => (h.danhMucId === danhMucId ? { ...h, luaChon } : h)),
    )
  }

  async function xacNhanChuyenGiao() {
    if (dangXuLy) return
    setDangXuLy(true)
    setLoi(null)
    try {
      await dongVaMoChuKyMoi({
        userId,
        chuKyCuId: chuKyId,
        ngayLuongMoi: ngayLuong,
        tongThu: thuNhap,
        tongChi: daChi,
        tongDeDanh: deDanh,
        quyetToanHu: quyetToan,
        quyIdDeDanh: quyChon,
      })
      onXong()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Chưa đóng chu kỳ được, thử lại nhé')
      setDangXuLy(false)
    }
  }

  return (
    <main className="bg-page text-ink mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <div className="flex-1 px-5 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl">Lương tháng mới về 🌾</h1>
          <button onClick={onHuy} className="text-ink2 text-sm">
            Để sau
          </button>
        </div>
        <p className="text-ink2 mt-1 text-sm">
          Nghi thức khép lại tháng cũ, quyết toán tiền dư và chào đón tháng mới ✨
        </p>

        {/* BƯỚC 1: CHỌN NGÀY LƯƠNG */}
        <div className="mt-5 rounded-2xl bg-surface p-4 text-center">
          <div className="text-muted text-xs">Ngày nhận lương tháng mới</div>
          <div className="mt-1 text-3xl font-semibold tabular-nums">
            {dinhDangNgay(ngayLuong, true)}
          </div>
          <div className="mt-3 flex justify-center gap-2">
            <button
              onClick={() => setNgayLuong(themNgay(ngayLuong, -1))}
              className="rounded-xl border border-line2 bg-surface2 px-3 py-1.5 text-xs font-medium"
            >
              − 1 ngày
            </button>
            <button
              onClick={() => setNgayLuong(homNay())}
              className="rounded-xl border border-line2 bg-surface2 px-3 py-1.5 text-xs text-ink2"
            >
              Hôm nay
            </button>
            <button
              onClick={() => setNgayLuong(themNgay(ngayLuong, 1))}
              className="rounded-xl border border-line2 bg-surface2 px-3 py-1.5 text-xs font-medium"
            >
              + 1 ngày
            </button>
          </div>
        </div>

        {/* BƯỚC 2: TỔNG KẾT THÁNG CŨ */}
        <div className="mt-4 rounded-2xl bg-surface p-4">
          <div className="text-sm font-semibold">Bức tranh tháng vừa rồi</div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-surface2 p-2.5">
              <div className="text-[11px] text-muted">Thực nhận</div>
              <div className="mt-1 text-sm font-semibold tabular-nums">{dinhDang(thuNhap)}</div>
            </div>
            <div className="rounded-xl bg-surface2 p-2.5">
              <div className="text-[11px] text-muted">Đã chi</div>
              <div className="mt-1 text-sm font-semibold tabular-nums text-c4-ink">{dinhDang(daChi)}</div>
            </div>
            <div className="rounded-xl bg-surface2 p-2.5">
              <div className="text-[11px] text-muted">Để dành</div>
              <div className="mt-1 text-sm font-semibold tabular-nums text-c1-ink">{dinhDang(deDanh)}</div>
            </div>
          </div>
        </div>

        {/* BƯỚC 3: QUYẾT TOÁN TIỀN DƯ TRONG HŨ */}
        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Quyết toán tiền dư trong hũ</h2>
            <span className="text-xs font-medium text-c1-ink">
              Tổng dư: {dinhDang(dong(tongDuHu))}
            </span>
          </div>
          <p className="text-muted mt-1 text-xs">
            Hũ tiêu không hết thì chọn cách xử lý tiền dư nhé 🌱
          </p>

          {quyetToan.length === 0 ? (
            <div className="bg-surface text-ink2 mt-3 rounded-2xl p-4 text-center text-xs">
              Tháng trước chưa đặt hũ nào.
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {quyetToan.map((h) => {
                const dm = danhMucMap.get(h.danhMucId)
                return (
                  <div
                    key={h.danhMucId}
                    className="bg-surface border-line2 rounded-2xl border p-4 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{dm?.ten ?? h.tenDanhMuc}</span>
                      <span className="font-semibold text-c1-ink tabular-nums">
                        {h.soDu > 0 ? `Dư ${dinhDang(h.soDu)}` : 'Đã tiêu hết'}
                      </span>
                    </div>

                    {h.soDu > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => doiLuaChon(h.danhMucId, 'gop_thang_moi')}
                          className={`rounded-xl p-2.5 text-xs font-medium transition-colors ${
                            h.luaChon === 'gop_thang_moi'
                              ? 'bg-c1 text-surface font-semibold'
                              : 'bg-surface2 text-ink2'
                          }`}
                        >
                          🔄 Gộp qua tháng mới
                        </button>
                        <button
                          onClick={() => doiLuaChon(h.danhMucId, 'de_danh')}
                          className={`rounded-xl p-2.5 text-xs font-medium transition-colors ${
                            h.luaChon === 'de_danh'
                              ? 'bg-c1 text-surface font-semibold'
                              : 'bg-surface2 text-ink2'
                          }`}
                        >
                          🪙 Nạp vào Để dành
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {quyetToan.some((h) => h.luaChon === 'de_danh' && h.soDu > 0) && quy.length > 0 && (
            <div className="border-line2 mt-4 rounded-2xl border bg-surface p-4">
              <label className="text-muted block text-xs">Chọn quỹ để nạp tiền dư</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {quy.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setQuyChon(q.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium ${
                      quyChon === q.id
                        ? 'bg-c1 font-semibold text-surface'
                        : 'border-line2 bg-surface2 border text-ink2'
                    }`}
                  >
                    {q.ten}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {loi && <p className="text-nguy-cap mt-4 text-sm">{loi}</p>}
      </div>

      <div className="p-4">
        <button
          onClick={() => void xacNhanChuyenGiao()}
          disabled={dangXuLy}
          className="bg-c1 text-surface w-full rounded-2xl py-4 text-lg font-semibold shadow-xs disabled:opacity-50"
        >
          {dangXuLy ? 'Đang chuyển giao…' : 'Bắt đầu tháng mới 🎉'}
        </button>
      </div>
    </main>
  )
}
