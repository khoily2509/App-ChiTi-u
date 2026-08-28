import { useState, useEffect } from 'react'
import { lopSlot } from '@/shared/design/mau'
import { dong, dinhDang } from '@/shared/domain/tien'
import { ngayLocal, dinhDangNgay } from '@/shared/domain/chu-ky'
import { huy, type GiaoDichDb } from '@/shared/api/giao-dich'
import { danhSachLichSuChuKy } from '@/shared/api/dong-chu-ky'
import { phanTich8ChuKy, type SnapshotChuKy, type Item8ChuKy } from '@/shared/domain/dong-chu-ky'
import { BieuDo8ChuKy } from '@/shared/ui/BieuDo8ChuKy'
import type { Dong } from '@/shared/api/supabase'

type DanhMuc = Dong<'danh_muc'>

/**
 * Danh sách giao dịch của chu kỳ.
 *
 * Ghi xong mà không xem lại được thì không tin được là đã ghi — và tiêu chí S3
 * "không mất dữ liệu" chỉ có nghĩa khi bồ tự kiểm chứng được.
 *
 * Huỷ chứ KHÔNG xoá (§13): đổi trạng thái sang `da_huy` kèm lý do, bản ghi vẫn
 * nằm nguyên trong DB. Ràng buộc CHECK ở tầng DB cũng từ chối huỷ mà thiếu lý do.
 */

// Bảng màu lấy từ `design/mau.ts`, KHÔNG chép lại ở đây — xem `LOP_SLOT`.

type Props = {
  userId: string
  giaoDich: GiaoDichDb[]
  danhMuc: DanhMuc[]
  onDoi: () => void
  onXemThongKe: () => void
}

export function ManDanhSach({ userId, giaoDich, danhMuc, onDoi, onXemThongKe }: Props) {
  const [dangHuy, setDangHuy] = useState<GiaoDichDb | null>(null)
  const [lichSu, setLichSu] = useState<Item8ChuKy[]>([])
  const [snapshotXem, setSnapshotXem] = useState<SnapshotChuKy | null>(null)
  const [loi, setLoi] = useState<string | null>(null)

  useEffect(() => {
    danhSachLichSuChuKy(userId)
      .then((snaps) => setLichSu(phanTich8ChuKy(snaps)))
      .catch(() => {})
  }, [userId])

  const tenDanhMuc = new Map(danhMuc.map((d) => [d.id, d]))

  async function xacNhanHuy(g: GiaoDichDb) {
    setLoi(null)
    try {
      await huy(g.id, userId, 'Bồ tự huỷ trên màn danh sách')
      setDangHuy(null)
      onDoi()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Chưa huỷ được, thử lại nhé')
    }
  }

  if (dangHuy) {
    const dm = dangHuy.danh_muc_id ? tenDanhMuc.get(dangHuy.danh_muc_id) : undefined
    return (
      <main className="min-h-dvh bg-page text-ink mx-auto grid w-full max-w-md place-items-center p-6">
        <div className="w-full text-center">
          <div className="text-sm text-ink2">Bỏ khoản này nhé?</div>
          <div className="mt-3 text-4xl font-semibold tabular-nums">
            {dinhDang(dong(dangHuy.so_tien))}
          </div>
          <div className="mt-2 text-sm text-ink2">{dm?.ten ?? 'Chưa rõ danh mục'}</div>
          {/* §13: bản ghi không biến mất, chỉ đổi trạng thái. Nói rõ để bồ yên tâm. */}
          <p className="mt-4 text-xs text-muted">
            Khoản này sẽ không tính vào tổng chi nữa, nhưng vẫn được giữ lại trong sổ.
          </p>

          {loi && <p className="mt-3 text-sm text-nguy-cap">{loi}</p>}

          <button
            onClick={() => void xacNhanHuy(dangHuy)}
            className="mt-6 w-full rounded-2xl bg-c1 py-4 text-lg font-semibold text-surface"
          >
            Bỏ khoản này
          </button>
          <button
            onClick={() => setDangHuy(null)}
            className="mt-2 w-full rounded-2xl border border-line bg-surface py-4 text-lg
                       font-medium"
          >
            Giữ lại
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-page text-ink mx-auto flex w-full max-w-md flex-col">
      <div className="flex-1 px-5 pt-10">
        <h1 className="font-serif text-2xl">Chu kỳ này</h1>
        <p className="mt-1 text-sm text-ink2">
          {giaoDich.length === 0 ? 'Chưa có khoản nào' : `${giaoDich.length} khoản đã ghi`}
        </p>

        {lichSu.length > 0 && (
          <div className="mt-4 mb-6">
            <BieuDo8ChuKy
              danhSach={lichSu}
              onChonChuKy={(item) => {
                // Đọc snapshot tương ứng
                danhSachLichSuChuKy(userId).then((snaps) => {
                  const tim = snaps.find((s) => s.chuKyId === item.chuKyId)
                  if (tim) setSnapshotXem(tim)
                })
              }}
            />
          </div>
        )}

        {/* Modal xem chi tiết Snapshot bất biến */}
        {snapshotXem && (
          <div className="bg-surface border-line2 my-4 rounded-2xl border p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Báo cáo bất biến {snapshotXem.ngayBatDau}</span>
              <button onClick={() => setSnapshotXem(null)} className="text-xs text-c1-ink underline">
                Đóng
              </button>
            </div>
            <div className="mt-2 text-xs text-muted">
              Được lưu trữ bất biến (không tính toán lại)
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-surface2 rounded-xl p-2">
                <div className="text-muted">Thu</div>
                <div className="font-semibold">{dinhDang(snapshotXem.tongThu)}</div>
              </div>
              <div className="bg-surface2 rounded-xl p-2">
                <div className="text-muted">Chi</div>
                <div className="font-semibold text-c4-ink">{dinhDang(snapshotXem.tongChi)}</div>
              </div>
              <div className="bg-surface2 rounded-xl p-2">
                <div className="text-muted">Để dành</div>
                <div className="font-semibold text-c1-ink">{snapshotXem.tyLeDeDanh}%</div>
              </div>
            </div>
          </div>
        )}

        {giaoDich.length === 0 ? (
          // Màn hình trống tử tế (§7.7) — không để trơ trọi một danh sách rỗng.
          <div className="mt-10 rounded-2xl bg-surface p-6 text-center">
            <div className="text-4xl">🌱</div>
            <p className="mt-3 text-sm text-ink2">
              Chưa có gì ở đây. Ghi khoản đầu tiên là danh sách bắt đầu có chuyện để kể.
            </p>
          </div>
        ) : (
          <ul className="mt-5 space-y-2">
            {giaoDich.map((g) => {
              const dm = g.danh_muc_id ? tenDanhMuc.get(g.danh_muc_id) : undefined
              const mau = lopSlot(dm?.slot ?? null).dam
              return (
                <li key={g.id}>
                  <button
                    onClick={() => setDangHuy(g)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-surface p-4 text-left"
                  >
                    {/* §10 nguyên tắc 6: ô màu nhỏ mang danh tính, chữ không mang màu dữ liệu */}
                    <span className={`h-8 w-1.5 shrink-0 rounded-full ${mau}`} />
                    <span className="flex-1">
                      <span className="block text-sm font-medium">
                        {dm?.ten ?? 'Chưa biết xếp đâu'}
                      </span>
                      <span className="block text-xs text-muted">
                        {dinhDangNgay(ngayLocal(g.ngay_local), true)}
                      </span>
                    </span>
                    <span className="text-lg font-semibold tabular-nums">
                      {dinhDang(dong(g.so_tien))}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Đây là TAB, thanh nav lo việc đi lại — "Quay lại" thành thừa. Thay bằng
          lối sang màn ②: thứ tự đọc tự nhiên là từng khoản → tổng quan. */}
      {giaoDich.length > 0 && (
        <div className="px-5 pb-4">
          <button
            onClick={onXemThongKe}
            className="bg-surface w-full rounded-2xl p-4 text-left text-sm text-c1-ink underline"
          >
            Xem tổng quan chu kỳ này
          </button>
        </div>
      )}
    </main>
  )
}
