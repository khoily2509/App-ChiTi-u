import { useEffect } from 'react'
import { dong, dinhDang, rutGon, type Dong as Tien } from '@/shared/domain/tien'
import { dinhDangNgay, type ChuKy } from '@/shared/domain/chu-ky'
import type { QuyCoSoDu } from '@/shared/api/quy'
import { tongQuyThuong, tongSoTietKiem } from '@/shared/api/quy'
import { SoLon } from '@/shared/ui/SoLon'
import { ThanhNhip } from '@/shared/ui/ThanhNhip'
import { LuoiGhiNhanh, type MucGhiNhanh } from '@/shared/ui/LuoiGhiNhanh'
import { TheHoaCuc } from '@/shared/ui/HoaCuc'
import type { NhipTuan } from '@/shared/domain/hoa-cuc'

/**
 * MÀN ① HÔM NAY — dựng theo `mockup-v2-thien-nhien.html`.
 *
 * Bản trước là danh sách thẻ dọc tự nghĩ ra, bỏ qua bản vẽ đã chốt. Bồ phát hiện
 * ngày 23/08/2026. Bản này bám mockup: thanh nhịp có vạch hôm nay, ba thẻ số
 * liệu, lưới 6 nút ghi nhanh.
 *
 * KHÔNG còn thẻ "Lương chu kỳ này" — mockup không có nó, và §10 chốt bộ ba thẻ
 * là Đã chi · Còn lại · Quỹ. Lương chuyển sang luồng riêng cùng với hũ (§7.2).
 */

type Props = {
  chuKy: ChuKy
  conLaiNgay: number

  nganSach: Tien | null
  daChi: Tien
  moiNgay: Tien | null
  phanTramDaDung: number | null
  phanTramThoiGian: number | null
  daHetNganSach: boolean

  quy: QuyCoSoDu[]
  traNo: Tien
  chuaXep: Tien | null
  coHu: boolean

  /** Chỉ những mục ĐƯỢC CHỌN lên màn chính, đã cắt ở 6 ô. */
  danhMuc: MucGhiNhanh[]
  /** Số danh mục có thật nhưng không nằm trên lưới — 0 thì giấu "Xem thêm". */
  soDanhMucAn: number
  onXemThemDanhMuc: () => void
  nhip: NhipTuan
  homNayThu: number
  vuaGhi: boolean
  daChuyen: number | null

  onHetVuaGhi: () => void
  onHetDaChuyen: () => void
  onGhiNhanh: (danhMucId: string) => void
  onDeDanhNhanh: () => void
  onNhapLuong: () => void
  onXemThongKe: () => void
  onXemQuy: () => void
  onDatHu: () => void
  onDoiNgayLuong: () => void
  onCanNhacMua: () => void
  onQuetGiaoDich: () => void
}

export function ManHomNay(p: Props) {
  // Lời khen sau khi ghi tự biến mất. §9.3 cho phép tông mừng, nhưng để nó nằm
  // mãi trên màn hình thì lần thứ mười đã hết vui và bắt đầu vướng mắt.
  useEffect(() => {
    if (!p.vuaGhi) return
    const h = setTimeout(p.onHetVuaGhi, 2600)
    return () => clearTimeout(h)
  }, [p.vuaGhi, p.onHetVuaGhi])

  const quyThuong = tongQuyThuong(p.quy)
  const soTietKiem = tongSoTietKiem(p.quy)
  const conLaiTien = p.nganSach === null ? null : dong(Math.max(0, p.nganSach - p.daChi))

  return (
    <div className="px-5 pt-5 pb-4">
      {/* Thanh trên — theo mockup: tên app bên trái, ranh giới chu kỳ bên phải */}
      <div className="text-muted mb-3 flex items-center justify-between text-[12.5px]">
        <span className="font-serif text-[17px] font-semibold" style={{ color: '#4a6b52' }}>
          sobo
        </span>
        <button onClick={p.onDoiNgayLuong} className="text-right">
          {dinhDangNgay(p.chuKy.batDau)} – {dinhDangNgay(p.chuKy.ketThuc)} · còn {p.conLaiNgay}{' '}
          ngày
        </button>
      </div>

      {p.daChuyen !== null && (
        <button
          onClick={p.onHetDaChuyen}
          className="bg-c4-t text-c4-ink mb-4 block w-full rounded-2xl px-4 py-3 text-left
                     text-sm font-medium"
        >
          {p.daChuyen === 0
            ? 'Đã đổi ngày lương. Không khoản nào phải chuyển.'
            : `Đã đổi ngày lương và chuyển ${p.daChuyen} khoản sang đúng chu kỳ.`}
        </button>
      )}

      {p.vuaGhi && (
        <div className="bg-c1-t text-c1-ink mb-4 rounded-2xl px-4 py-3 text-sm font-medium">
          Ghi xong rồi nhé 🌿
        </div>
      )}

      {/* ── Con số ≥48px (§10 nguyên tắc 1) ─────────────────────────────────── */}
      <div className="text-ink2 text-[13.5px]">Hôm nay còn tiêu được</div>

      {p.moiNgay !== null ? (
        <>
          <SoLon soTien={p.moiNgay} />
          {p.phanTramDaDung !== null && p.phanTramThoiGian !== null && p.nganSach !== null && (
            <div className="mt-3">
              <ThanhNhip
                phanTramDaDung={p.phanTramDaDung}
                phanTramThoiGian={p.phanTramThoiGian}
                nganSach={p.nganSach}
              />
            </div>
          )}
        </>
      ) : p.daHetNganSach ? (
        <p className="text-ink2 mt-2 text-sm">
          Ngân sách chu kỳ này đã dùng hết ({p.phanTramDaDung}%). Còn {p.conLaiNgay} ngày — cứ
          ghi tiếp bình thường, cuối chu kỳ mình tính lại nhé 🌿
        </p>
      ) : (
        // §7.8: chưa có lương thì KHÔNG hiện 0đ, phải là câu mời kèm nút.
        <button onClick={p.onNhapLuong} className="mt-2 block text-left">
          <p className="text-muted text-sm">
            Nhập lương tháng này là thấy ngay hôm nay tiêu được bao nhiêu 🌱 Chưa vội đâu — cứ
            ghi chi tiêu trước đã.
          </p>
          <span className="text-c1-ink mt-2 inline-block text-sm font-medium underline">
            Nhập lương ngay
          </span>
        </button>
      )}

      {/* ── Ba thẻ số liệu, đúng bộ của mockup ──────────────────────────────── */}
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <The
          nhan="Đã chi"
          gia={rutGon(p.daChi)}
          phu={p.phanTramDaDung !== null ? `${p.phanTramDaDung}%` : undefined}
          onBam={p.onXemThongKe}
        />
        <The
          nhan="Còn lại"
          gia={conLaiTien === null ? '—' : rutGon(conLaiTien)}
          phu={`${p.conLaiNgay} ngày`}
          onBam={p.onXemThongKe}
        />
        <The
          nhan="Quỹ"
          gia={rutGon(quyThuong)}
          phu={
            p.traNo > 0
              ? `đang trả ${rutGon(p.traNo)}`
              : soTietKiem > 0
                ? `+${rutGon(soTietKiem)} sổ`
                : undefined
          }
          onBam={p.onXemQuy}
        />
      </div>

      {/* §7.6 ràng buộc 3: nhắc THỤ ĐỘNG, không đẩy thông báo. Nó nằm đó, nhìn
          thấy mỗi lần mở app, nhưng không kêu. */}
      {p.chuaXep !== null && p.chuaXep > 0 && (
        <button
          onClick={p.onDatHu}
          className="bg-surface border-line2 mt-2.5 flex w-full items-center justify-between
                     rounded-2xl border p-3.5 text-left"
        >
          <span className="text-muted text-xs">
            Còn <span className="text-ink2 font-medium">{dinhDang(p.chuaXep)}</span> chưa xếp
            vào hũ nào
          </span>
          <span className="text-c1-ink text-sm underline">
            {p.coHu ? 'Chỉnh hũ' : 'Xếp giúp mình'}
          </span>
        </button>
      )}

      {/* ── Lưới ghi nhanh — tính năng số 1 (§8) ────────────────────────────── */}
      <div className="mt-5 mb-2 flex items-baseline justify-between">
        <span className="text-muted text-xs">Ghi nhanh</span>
        {/* Chỉ hiện khi THẬT SỰ có cái không lên được màn chính. Bày sẵn một lối
            đi tới màn rỗng là dạy người dùng bỏ qua nó. */}
        {p.soDanhMucAn > 0 && (
          <button onClick={p.onXemThemDanhMuc} className="text-c1-ink text-xs underline">
            Xem thêm {p.soDanhMucAn} mục
          </button>
        )}
      </div>
      <LuoiGhiNhanh
        danhMuc={p.danhMuc}
        coDeDanh={p.quy.length > 0}
        onChon={p.onGhiNhanh}
        onDeDanh={p.onDeDanhNhanh}
      />

      {/* Tính năng #9: Cân nhắc mua / Có nên mua không? (§6.2) */}
      <button
        onClick={p.onCanNhacMua}
        className="mt-3 flex w-full items-center justify-between rounded-2xl bg-surface p-3.5 text-left border border-line2 shadow-2xs"
      >
        <span className="flex items-center gap-2 text-xs font-medium text-ink">
          <span>🌿</span>
          <span>Có nên mua không?</span>
        </span>
        <span className="text-xs text-c1-ink underline">Cân nhắc trước khi chi →</span>
      </button>

      {/* Pha 8: Quét SMS & Momo tự động (§8.1, §8.2) */}
      <button
        onClick={p.onQuetGiaoDich}
        className="mt-2 flex w-full items-center justify-between rounded-2xl bg-surface p-3.5 text-left border border-line2 shadow-2xs"
      >
        <span className="flex items-center gap-2 text-xs font-medium text-ink">
          <span>📋</span>
          <span>Quét SMS & Momo</span>
        </span>
        <span className="text-xs text-c1-ink underline">Dán tin nhắn trừ tiền →</span>
      </button>

      {/* §9.2 — hoa cúc nằm CUỐI màn, sau lưới ghi nhanh. Nó là phần thưởng, không
          phải thông tin cần để ra quyết định, nên không được đẩy việc ghi xuống
          dưới nếp gấp (§11.5 đã cảnh báo đúng chỗ này). */}
      <div className="mt-3">
        <TheHoaCuc nhip={p.nhip} homNayThu={p.homNayThu} vuaGhi={p.vuaGhi} />
      </div>
    </div>
  )
}

function The({
  nhan,
  gia,
  phu,
  onBam,
}: {
  nhan: string
  gia: string
  phu?: string | undefined
  onBam: () => void
}) {
  return (
    <button
      onClick={onBam}
      className="bg-surface2 border-line2 rounded-[13px] border px-2.5 py-2.5 text-left"
    >
      <div className="text-muted text-[11px]">{nhan}</div>
      <div className="mt-0.5 text-[17px] font-semibold tabular-nums">{gia}</div>
      {phu && <div className="text-ink2 text-[11px]">{phu}</div>}
    </button>
  )
}
