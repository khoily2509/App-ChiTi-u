import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { sb, bocLoi, type Dong } from '@/shared/api/supabase'
import { baoDamCoChuKy, tuDb, type ChuKyDb } from '@/shared/api/chu-ky'
import { congChi, theoChuKy, ghiChi, type GiaoDichDb } from '@/shared/api/giao-dich'
import {
  docCauHinh,
  soCauHinh,
  chuoiCauHinh,
  datCauHinh,
  NGUONG_XAC_NHAN_DU_PHONG,
} from '@/shared/api/cau-hinh'
import {
  bauTroiHienTai,
  docChonBauTroi,
  gioVN,
  KHOA_BAU_TROI,
  type ChonBauTroi,
} from '@/shared/domain/bau-troi'
import { hanMucThoi, chuKyLienTruoc } from '@/shared/api/han-muc'
import { chiTheoDanhMuc } from '@/shared/api/giao-dich'
import { deXuatHanMuc } from '@/shared/domain/han-muc'
import { danhSachQuy, soTietKiemCua, tongPhaiTraKyNay, type QuyCoSoDu } from '@/shared/api/quy'
import { nhanThemDuoc } from '@/shared/domain/so-tiet-kiem'
import { thucNhanCuaChuKy } from '@/shared/api/thu-nhap'
import { chuaPhanBo, trangThaiHu, type Hu } from '@/shared/domain/han-muc'
import { choManChinh } from '@/shared/domain/danh-muc'
import {
  nganSach,
  homNayConTieuDuoc,
  phanTramDaDung,
  phanTramThoiGian,
} from '@/shared/domain/ngan-sach'
import { dong } from '@/shared/domain/tien'
import { homNay, ngayConLai, soNgay, ngayLocal } from '@/shared/domain/chu-ky'
import { nhipTuan, thuIso } from '@/shared/domain/hoa-cuc'
import { ManDangNhap } from '@/features/dang-nhap/ManDangNhap'
import { ManGhiNhanh } from '@/features/ghi-nhanh/ManGhiNhanh'
import { ManThuNhap } from '@/features/thu-nhap/ManThuNhap'
import { ManDeDanh } from '@/features/thu-nhap/ManDeDanh'
import { ManDanhSach } from '@/features/giao-dich/ManDanhSach'
import { ManDoiNgayLuong } from '@/features/chu-ky/ManDoiNgayLuong'
import { ManDongChuKy } from '@/features/chu-ky/ManDongChuKy'
import { ManQuy } from '@/features/quy/ManQuy'
import { ManThongKe } from '@/features/thong-ke/ManThongKe'
import { ManDatHu } from '@/features/hu/ManDatHu'
import { ManHomNay } from '@/features/hom-nay/ManHomNay'
import { ManKhac } from '@/features/khac/ManKhac'
import { ManTongKet } from '@/features/dong-tien/ManTongKet'
import { ManCaiApp } from '@/features/cai-dat/ManCaiApp'
import { ManDanhMuc } from '@/features/danh-muc/ManDanhMuc'
import { ManDoiMatKhau } from '@/features/cai-dat/ManDoiMatKhau'
import { ManCanNhacMua } from '@/features/quyet-dinh-mua/ManCanNhacMua'
import { ManQuetGiaoDich } from '@/features/quet-giao-dich/ManQuetGiaoDich'
import { trichXuatThamSoIntent } from '@/shared/domain/shortcut'
import { ThanhNav, type Tab } from '@/shared/ui/ThanhNav'
import { NenTroi } from '@/shared/ui/NenTroi'

type DanhMuc = Dong<'danh_muc'>

export function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [dangTai, setDangTai] = useState(true)

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setDangTai(false)
    })
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (dangTai) return <ManCho />
  if (!session) return <ManDangNhap />
  return <DaDangNhap userId={session.user.id} />
}

function ManCho() {
  return (
    <main className="bg-page grid min-h-dvh place-items-center">
      <div className="text-muted">Đang tải…</div>
    </main>
  )
}

/**
 * Bốn TAB có thanh nav; các màn còn lại chiếm trọn màn hình.
 *
 * Màn nhập liệu (ghi nhanh, nhập lương, đặt hũ…) cố ý KHÔNG có nav: chúng có bàn
 * phím số chiếm nửa dưới màn hình, để thêm thanh nav ở đó vừa chật vừa mời bồ bỏ
 * dở giữa chừng.
 */
type Man =
  | Tab
  | 'ghi_nhanh'
  | 'thong_ke'
  | 'thu_nhap'
  | 'de_danh'
  | 'dat_hu'
  | 'ngay_luong'
  | 'tong_ket'
  | 'cai_app'
  | 'danh_muc'
  | 'doi_mat_khau'
  | 'can_nhac_mua'
  | 'dong_chu_ky'
  | 'quet_giao_dich'

/**
 * Luồng bốn bước: lương → để dành → hũ → tổng kết (§7.2 + §7.6).
 *
 * Gom lại thành một chuỗi vì đó là NGHI THỨC ĐẦU CHU KỲ: tiền về rồi mới quyết
 * chia thế nào. Tách rời thành bốn mục riêng thì bồ làm bước một xong là thoát,
 * và hũ mãi mãi không được đặt.
 */
const TONG_BUOC = 4

const laTab = (m: Man): m is Tab =>
  m === 'hom_nay' || m === 'lich_su' || m === 'quy' || m === 'khac'

function DaDangNhap({ userId }: { userId: string }) {
  const [chuKy, setChuKy] = useState<ChuKyDb | null>(null)
  const [danhMuc, setDanhMuc] = useState<DanhMuc[]>([])
  const [daChi, setDaChi] = useState(dong(0))
  const [man, setMan] = useState<Man>('hom_nay')
  const [thuNhap, setThuNhap] = useState<number | null>(null)
  const [giaoDich, setGiaoDich] = useState<GiaoDichDb[]>([])
  const [quy, setQuy] = useState<QuyCoSoDu[]>([])
  const [traNo, setTraNo] = useState(dong(0))
  const [vuaGhi, setVuaGhi] = useState(false)
  const [daChuyen, setDaChuyen] = useState<number | null>(null)
  const [nguongXacNhan, setNguongXacNhan] = useState(NGUONG_XAC_NHAN_DU_PHONG)
  const [hu, setHu] = useState<Hu[]>([])
  const [deXuatHu, setDeXuatHu] = useState<Hu[]>([])
  // Danh mục bồ chạm từ lưới ghi nhanh — màn ghi nhanh mở ra là đã chọn sẵn,
  // tiết kiệm đúng một chạm của đường "3 chạm" (§4.1).
  const [chonSan, setChonSan] = useState<string | null>(null)
  const [chonTroi, setChonTroi] = useState<ChonBauTroi>('tu_dong')
  // 0 = đứng ngoài luồng, mỗi màn độc lập như trước.
  const [buoc, setBuoc] = useState(0)
  const [loi, setLoi] = useState<string | null>(null)

  /**
   * Nạp dữ liệu màn hình — BA ĐỢT, không phải mười ba bước nối đuôi.
   *
   * Bản đầu `await` từng lượt một. Đo trên production: 13 lượt mạng, lượt sau chờ
   * lượt trước, tổng 1,7 GIÂY trước khi bồ chạm được nút nào — trong khi S2 (§1)
   * chỉ cho cả hành trình "mở app → lưu xong" 5 giây.
   *
   * Chỉ chu kỳ là thật sự phải đi trước, vì mọi truy vấn khác lọc theo id của nó.
   * Số còn lại độc lập với nhau nên chạy song song được.
   */
  async function nap() {
    try {
      // ── Đợt 1: chu kỳ. Mọi thứ dưới đây cần id của nó ──────────────────────
      const ck = await baoDamCoChuKy(userId)

      // ── Đợt 2: tám lượt độc lập, cùng lúc ──────────────────────────────────
      const [dm, ch, tn, gd, q, tno, h, ckTruoc] = await Promise.all([
        bocLoi(
          await sb.from('danh_muc').select('*').eq('trang_thai', 'active').order('thu_tu'),
          'Đọc danh mục',
        ),
        docCauHinh(),
        thucNhanCuaChuKy(ck.id),
        theoChuKy(ck.id),
        danhSachQuy(),
        tongPhaiTraKyNay(),
        hanMucThoi(ck.id),
        chuKyLienTruoc(ngayLocal(ck.ngay_bat_dau_thuc_te)),
      ])

      // ── Đợt 3: chỉ khi có chu kỳ trước. Chu kỳ đầu thì bỏ qua hẳn ──────────
      const deXuat = ckTruoc ? deXuatHanMuc(await chiTheoDanhMuc(ckTruoc.id)) : []

      setChuKy(ck)
      setDanhMuc(dm)
      setNguongXacNhan(soCauHinh(ch, 'nguong_xac_nhan_so_lon', NGUONG_XAC_NHAN_DU_PHONG))
      setChonTroi(docChonBauTroi(chuoiCauHinh(ch, KHOA_BAU_TROI)))
      setThuNhap(tn)
      setGiaoDich(gd)
      // Tổng chi cộng từ `gd` vừa tải, không đi hỏi lại cùng một tập dữ liệu.
      setDaChi(congChi(gd))
      setQuy(q)
      setTraNo(tno)
      setHu(h)
      setDeXuatHu(deXuat)
    } catch (e) {
      setLoi(e instanceof Error ? e.message : String(e))
    }
  }

  useEffect(() => {
    void nap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Cảnh hiện tại: lựa chọn của bồ thắng, không có thì theo giờ Việt Nam.
  const canh = bauTroiHienTai(chonTroi, gioVN())

  // Đặt lên <html> chứ không lên component: gradient nền là một lớp fixed phía
  // sau TOÀN BỘ trang, gồm cả vùng bật lại khi cuộn quá đà trên iOS. Gắn vào một
  // component thì lớp đó chỉ phủ đúng phần cây con của nó.
  useEffect(() => {
    document.documentElement.dataset.troi = canh
  }, [canh])

  // Xử lý Siri Shortcut / Web Intent (?action=ghi) (§8.3)
  useEffect(() => {
    if (!chuKy || typeof window === 'undefined') return
    const search = window.location.search
    const intent = trichXuatThamSoIntent(search)
    if (!intent) return

    // Xoá search param trên URL để không chạy lại khi reload
    window.history.replaceState({}, '', window.location.pathname)

    if (intent.tuDong && intent.danhMucId && intent.soTien > 0) {
      void ghiChi({
        userId,
        chuKyId: chuKy.id,
        danhMucId: intent.danhMucId,
        soTien: intent.soTien,
        ghiChu: intent.ghiChu ?? '[Shortcut Auto]',
      }).then(() => {
        setVuaGhi(true)
        void nap()
      })
    } else {
      setMan('quet_giao_dich')
    }
  }, [chuKy, userId])

  if (loi) {
    return (
      <main className="bg-page grid min-h-dvh place-items-center p-6">
        <div className="max-w-xs text-center">
          <p className="text-nguy-cap text-sm">{loi}</p>
          <button
            onClick={() => {
              setLoi(null)
              void nap()
            }}
            className="mt-3 text-sm underline"
          >
            Thử lại
          </button>
        </div>
      </main>
    )
  }
  if (!chuKy) return <ManCho />

  const ck = tuDb(chuKy)
  const nay = homNay()
  const conLaiNgay = ngayConLai(ck, nay)
  const doDaiChuKy = soNgay(ck)

  // Ngân sách = thu nhập − để dành định mức − nợ quỹ (§7.2). Tính MỘT chỗ rồi
  // truyền xuống: hai nơi tự tính là hai nơi sớm muộn lệch nhau (§6.3).
  //
  // ⚠️ Phép chia dưới đây DỰA VÀO giả định G10: bồ bắt đầu dùng app vào đúng ngày
  // lương. Cài giữa chu kỳ thì app thấy "đã chi 0đ" và chia trọn ngân sách cho số
  // ngày còn lại — đo thật cho ra 818.181đ/ngày thay vì 290.322đ/ngày, sai gấp
  // 2,8 lần và sai về phía khuyến khích tiêu nhiều hơn.
  const ns =
    thuNhap === null
      ? null
      : nganSach(dong(thuNhap), dong(chuKy.so_tien_de_danh_dinh_muc), traNo)

  const moiNgay = homNayConTieuDuoc(ns, daChi, conLaiNgay)
  const pt = phanTramDaDung(ns, daChi)
  const ptTG = phanTramThoiGian(doDaiChuKy, conLaiNgay)
  const daHetNganSach = ns !== null && moiNgay === null && conLaiNgay > 0
  const tongHu = hu.reduce((t, h) => t + h.hanMuc, 0)
  const chuaXep = chuaPhanBo(ns, dong(tongHu))

  // Số đã tiêu từng hũ tính từ `giaoDich` đã nạp sẵn, KHÔNG thêm truy vấn nào:
  // màn ghi nhanh nằm giữa đường đo S2 ("mở app → lưu xong ≤ 5 giây", §1) nên
  // không được chờ mạng thêm một lần nữa ngay lúc bồ định gõ số.
  const huDayDu = trangThaiHu(
    hu.map((h) => ({
      ...h,
      daDung: dong(
        giaoDich
          .filter((g) => g.loai === 'chi' && g.danh_muc_id === h.danhMucId)
          .reduce((t, g) => t + g.so_tien, 0),
      ),
    })),
  )

  // Nhịp tuần tính từ `giaoDich` đã nạp sẵn — không thêm truy vấn nào. Lấy ngày
  // của MỌI loại giao dịch, không riêng khoản chi: để dành cũng là một ngày bồ có
  // chăm sóc sổ, mà §9.2 đo sự chăm sóc chứ không đo mức chi.
  const nhip = nhipTuan(
    giaoDich.map((g) => ngayLocal(g.ngay_local)),
    nay,
  )

  const veHomNay = () => {
    setMan('hom_nay')
    setChonSan(null)
    setBuoc(0)
    void nap()
  }

  /**
   * Sang bước kế, hoặc về màn ① nếu đang đứng ngoài luồng.
   *
   * Phải `nap()` giữa các bước: bước sau cần số của bước trước (đặt để dành cần
   * lương, đặt hũ cần ngân sách). Bỏ qua thì màn kế mở ra với dữ liệu cũ và mọi
   * con số trên đó đều sai.
   */
  const buocKe = async (dich: Man) => {
    if (buoc === 0) {
      veHomNay()
      return
    }
    await nap()
    setBuoc(buoc + 1)
    setMan(dich)
  }

  const tienDo = buoc > 0 ? { buoc, tong: TONG_BUOC } : undefined

  const batDauLuong = () => {
    setBuoc(1)
    setMan('thu_nhap')
  }

  /* ── Màn toàn trang, không có nav ────────────────────────────────────────── */

  // Nền đi kèm mọi màn, kể cả màn nhập liệu — nếu chỉ gắn ở nhánh có nav thì bấm
  // vào ghi nhanh là bầu trời biến mất, trông như app đổi sang giao diện khác.
  const nen = <NenTroi canh={canh} />

  if (man === 'ghi_nhanh') {
    return (
      <>
        {nen}
        <ManGhiNhanh
          userId={userId}
          chuKyId={chuKy.id}
          danhMuc={danhMuc.filter((d) => !d.la_he_thong)}
          // Sổ có kỳ hạn không nằm trong danh sách nhận tiền để dành — xem
          // `nhanThemDuoc` để biết vì sao đây là chuyện đúng/sai chứ không phải
          // chuyện tiện/bất tiện.
          quy={quy.filter((q) => nhanThemDuoc(soTietKiemCua(q, dong(q.soDu))))}
          nguongXacNhan={nguongXacNhan}
          hu={huDayDu}
          chonSan={chonSan}
          onXong={() => {
            setVuaGhi(true)
            veHomNay()
          }}
          onHuy={() => {
            setMan('hom_nay')
            setChonSan(null)
          }}
        />
      </>
    )
  }

  if (man === 'thong_ke') {
    return (
      <>
        {nen}
        <ManThongKe
          chuKyId={chuKy.id}
          ngayBatDau={ck.batDau}
          danhMuc={danhMuc}
          onXemDanhSach={() => setMan('lich_su')}
          onDatHu={() => setMan('dat_hu')}
          onQuayLai={() => setMan('hom_nay')}
        />
      </>
    )
  }

  if (man === 'doi_mat_khau') {
    return (
      <>
        {nen}
        <ManDoiMatKhau onXong={() => setMan('khac')} onQuayLai={() => setMan('khac')} />
      </>
    )
  }

  if (man === 'can_nhac_mua') {
    return (
      <>
        {nen}
        <ManCanNhacMua
          userId={userId}
          nganSachChuKy={ns ?? dong(0)}
          daChi={daChi}
          thuNhapChuKy={thuNhap ? dong(thuNhap) : dong(0)}
          soNgayTrongChuKy={doDaiChuKy}
          soNgayConLai={conLaiNgay}
          danhMuc={danhMuc}
          quy={quy}
          onQuayLai={() => setMan('hom_nay')}
          onMuaNgay={async (danhMucId, soTien, ghiChu) => {
            try {
              await ghiChi({
                userId,
                chuKyId: chuKy.id,
                danhMucId,
                soTien,
                ghiChu,
              })
              setVuaGhi(true)
              veHomNay()
            } catch (e) {
              setLoi(e instanceof Error ? e.message : 'Chưa ghi được khoản chi')
            }
          }}
        />
      </>
    )
  }

  if (man === 'dong_chu_ky' && chuKy) {
    const tenDm = new Map(danhMuc.map((d) => [d.id, d]))
    const chiTheoDmMap = new Map<string, Dong<any>>()
    for (const g of giaoDich) {
      if (g.danh_muc_id && g.loai === 'chi') {
        const cu = (chiTheoDmMap.get(g.danh_muc_id) as number) ?? 0
        chiTheoDmMap.set(g.danh_muc_id, dong(cu + g.so_tien))
      }
    }

    return (
      <>
        {nen}
        <ManDongChuKy
          userId={userId}
          chuKyId={chuKy.id}
          thuNhap={thuNhap ? dong(thuNhap) : dong(0)}
          daChi={daChi}
          deDanh={dong(chuKy.so_tien_de_danh_dinh_muc)}
          danhMuc={danhMuc}
          dsHu={hu.map((h) => ({
            danhMucId: h.danhMucId,
            ten: tenDm.get(h.danhMucId)?.ten ?? 'Danh mục',
            hanMuc: h.hanMuc,
          }))}
          chiTheoDanhMuc={chiTheoDmMap}
          quy={quy}
          onXong={() => {
            void nap().then(() => {
              setBuoc(1)
              setMan('thu_nhap')
            })
          }}
          onHuy={() => setMan('khac')}
        />
      </>
    )
  }

  if (man === 'quet_giao_dich' && chuKy) {
    return (
      <>
        {nen}
        <ManQuetGiaoDich
          danhMuc={danhMuc}
          onQuayLai={() => setMan('hom_nay')}
          onGhi={async (danhMucId, soTien, ghiChu) => {
            try {
              await ghiChi({
                userId,
                chuKyId: chuKy.id,
                danhMucId,
                soTien,
                ghiChu,
              })
              setVuaGhi(true)
              veHomNay()
            } catch (e) {
              setLoi(e instanceof Error ? e.message : 'Chưa ghi được khoản chi')
            }
          }}
        />
      </>
    )
  }

  if (man === 'danh_muc') {
    return (
      <>
        {nen}
        <ManDanhMuc
          userId={userId}
          danhMuc={danhMuc}
          // Nạp lại sau mỗi lần sửa: tên, định nghĩa và icon đều hiện trên lưới
          // ghi nhanh ở màn ①, nên để nguyên state cũ là bồ sửa xong quay ra thấy
          // y như chưa sửa.
          onXong={() => void nap()}
          onQuayLai={() => setMan('khac')}
        />
      </>
    )
  }

  if (man === 'dat_hu') {
    return (
      <>
        {nen}
        <ManDatHu
          userId={userId}
          chuKyId={chuKy.id}
          danhMuc={danhMuc}
          hu={hu}
          nganSach={ns}
          deXuat={deXuatHu}
          tienDo={tienDo}
          onXong={() => void buocKe('tong_ket')}
          onQuayLai={() => (buoc > 0 ? void buocKe('tong_ket') : setMan('hom_nay'))}
        />
      </>
    )
  }

  if (man === 'cai_app') {
    return (
      <>
        {nen}
        <ManCaiApp onQuayLai={() => setMan('khac')} />
      </>
    )
  }

  if (man === 'tong_ket' && thuNhap !== null && ns !== null) {
    const ten = new Map(danhMuc.map((d) => [d.id, d]))
    return (
      <>
        {nen}
        <ManTongKet
          thuNhap={dong(thuNhap)}
          deDanh={dong(chuKy.so_tien_de_danh_dinh_muc)}
          traNo={traNo}
          nganSach={ns}
          soNgayChuKy={doDaiChuKy}
          hu={hu
            .map((h) => ({
              ten: ten.get(h.danhMucId)?.ten ?? '',
              soTien: h.hanMuc,
              slot: ten.get(h.danhMucId)?.slot ?? null,
            }))
            .sort((a, b) => (a.slot ?? 99) - (b.slot ?? 99))}
          onSuaHu={() => setMan('dat_hu')}
          onXong={veHomNay}
        />
      </>
    )
  }

  if (man === 'de_danh' && thuNhap !== null) {
    return (
      <>
        {nen}
        <ManDeDanh
          chuKyId={chuKy.id}
          thuNhap={dong(thuNhap)}
          traNo={traNo}
          soNgayChuKy={doDaiChuKy}
          daCo={chuKy.so_tien_de_danh_dinh_muc}
          tienDo={tienDo}
          onXong={() => void buocKe('dat_hu')}
          onHuy={() => void buocKe('dat_hu')}
        />
      </>
    )
  }

  if (man === 'thu_nhap') {
    return (
      <>
        {nen}
        <ManThuNhap
          userId={userId}
          chuKyId={chuKy.id}
          daCo={thuNhap}
          tienDo={tienDo}
          onXong={() => void buocKe('de_danh')}
          onHuy={veHomNay}
        />
      </>
    )
  }

  if (man === 'ngay_luong') {
    return (
      <>
        {nen}
        <ManDoiNgayLuong
          chuKy={chuKy}
          onXong={(n) => {
            setDaChuyen(n)
            // Nạp lại: đổi ngày lương dời RANH GIỚI chu kỳ, nên gần như mọi con số
            // trên màn ① đổi theo — số ngày còn lại, mức tiêu mỗi ngày, và cả tập
            // giao dịch thuộc chu kỳ này. Thiếu dòng này thì thao tác chạy đúng ở
            // DB nhưng màn hình vẫn hiện ngày cũ, và bồ tưởng chưa ăn nên bấm lại.
            void nap()
            veHomNay()
          }}
          onHuy={() => setMan('khac')}
        />
      </>
    )
  }

  /* ── Bốn tab, có thanh nav ───────────────────────────────────────────────── */

  const tab: Tab = laTab(man) ? man : 'hom_nay'

  return (
    <>
      {nen}
      <main className="bg-page text-ink mx-auto flex min-h-dvh w-full max-w-md flex-col">
        {/* Chừa chỗ cho thanh nav: nav dán ở đáy màn hình (sticky) nên nội dung
          cuộn LUỒN XUỐNG DƯỚI nó. Không có khoảng đệm này thì thành phần cuối
          cùng của mọi tab đều bị che mất một nửa. */}
      <div className="flex-1 pb-24">
          {tab === 'hom_nay' && (
            <ManHomNay
              chuKy={ck}
              conLaiNgay={conLaiNgay}
              nganSach={ns}
              daChi={daChi}
              moiNgay={moiNgay}
              phanTramDaDung={pt}
              phanTramThoiGian={ptTG}
              daHetNganSach={daHetNganSach}
              quy={quy}
              traNo={traNo}
              chuaXep={chuaXep}
              coHu={hu.length > 0}
              danhMuc={choManChinh(
                danhMuc
                  .filter((d) => !d.la_he_thong)
                  .map((d) => ({
                    id: d.id,
                    ten: d.ten,
                    phu: d.dinh_nghia,
                    slot: d.slot,
                    icon: d.icon,
                    // '?? true' để app không trắng màn trong khoảng giữa lúc đẩy code
                    // và lúc migration 0013 chạy: cột chưa tồn tại thì PostgREST trả
                    // undefined, và undefined lọc ra thành lưới ghi nhanh RỖNG.
                    hienManChinh: d.hien_man_chinh ?? true,
                  })),
              )}
              soDanhMucAn={
                danhMuc.filter((d) => !d.la_he_thong).length -
                choManChinh(
                  danhMuc
                    .filter((d) => !d.la_he_thong)
                    .map((d) => ({ hienManChinh: d.hien_man_chinh ?? true })),
                ).length
              }
              onXemThemDanhMuc={() => setMan('danh_muc')}
              nhip={nhip}
              homNayThu={thuIso(nay)}
              vuaGhi={vuaGhi}
              daChuyen={daChuyen}
              onHetVuaGhi={() => setVuaGhi(false)}
              onHetDaChuyen={() => setDaChuyen(null)}
              onGhiNhanh={(id) => {
                setChonSan(id)
                setMan('ghi_nhanh')
              }}
              onDeDanhNhanh={() => {
                setChonSan('de-danh')
                setMan('ghi_nhanh')
              }}
              onNhapLuong={batDauLuong}
              onXemThongKe={() => setMan('thong_ke')}
              onXemQuy={() => setMan('quy')}
              onDatHu={() => setMan('dat_hu')}
              onDoiNgayLuong={() => setMan('ngay_luong')}
              onCanNhacMua={() => setMan('can_nhac_mua')}
              onQuetGiaoDich={() => setMan('quet_giao_dich')}
            />
          )}

          {tab === 'lich_su' && (
            <ManDanhSach
              userId={userId}
              giaoDich={giaoDich}
              danhMuc={danhMuc}
              onDoi={() => void nap()}
              onXemThongKe={() => setMan('thong_ke')}
            />
          )}

          {tab === 'quy' && (
            <ManQuy userId={userId} chuKyId={chuKy.id} quy={quy} onDoi={() => void nap()} />
          )}

          {tab === 'khac' && (
            <ManKhac
              chonTroi={chonTroi}
              onDoiTroi={(c) => {
                // Đổi màu ngay rồi mới ghi: đây là thay đổi hình thức, bắt bồ chờ
                // mạng mới thấy kết quả là cảm giác app chậm mà chẳng được gì.
                setChonTroi(c)
                void datCauHinh(userId, KHOA_BAU_TROI, c)
              }}
              thuNhap={thuNhap}
              deDanh={chuKy.so_tien_de_danh_dinh_muc}
              tongHu={tongHu}
              onNhapLuong={batDauLuong}
              onDatDeDanh={() => setMan('de_danh')}
              onDatHu={() => setMan('dat_hu')}
              onDoiNgayLuong={() => setMan('ngay_luong')}
              onSuaDanhMuc={() => setMan('danh_muc')}
              onDoiMatKhau={() => setMan('doi_mat_khau')}
              onCaiApp={() => setMan('cai_app')}
              onNhanLuongMoi={() => setMan('dong_chu_ky')}
              userId={userId}
            />
          )}
        </div>

        <ThanhNav
          dang={tab}
          onChon={setMan}
          onGhi={() => {
            setChonSan(null)
            setMan('ghi_nhanh')
          }}
        />
      </main>
    </>
  )
}
