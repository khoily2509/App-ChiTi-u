/**
 * Chu kỳ — cầu nối giữa logic thuần (shared/domain/chu-ky.ts) và DB.
 *
 * Mọi phép tính ngày tháng nằm ở tầng domain; file này chỉ đọc/ghi và chuyển đổi
 * kiểu. Giữ ranh giới đó là lý do đổi hạ tầng sau này không phải viết lại công
 * thức (§14 quy ước 3).
 */

import { sb, bocLoi, nemNeuLoi, type Dong } from './supabase'
import {
  type NgayLocal,
  type ChuKy,
  ngayLocal,
  homNay,
  themNgay,
  ngayLamViecCuoiThang,
  demChuyen,
  coLaiTruoc,
} from '@/shared/domain/chu-ky'

export type ChuKyDb = Dong<'chu_ky'>

/** Đổi dòng DB sang kiểu ChuKy của tầng domain. */
export function tuDb(d: ChuKyDb): ChuKy {
  return {
    batDau: ngayLocal(d.ngay_bat_dau_thuc_te),
    ketThuc: ngayLocal(d.ngay_ket_thuc),
  }
}

/** Chu kỳ đang chạy, hoặc null nếu chưa có. */
export async function chuKyDangChay(): Promise<ChuKyDb | null> {
  const { data, error } = await sb
    .from('chu_ky')
    .select('*')
    .eq('trang_thai', 'dang_chay')
    .order('ngay_bat_dau_thuc_te', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(`Đọc chu kỳ đang chạy: ${error.message}`)
  return data
}

/**
 * Tạo chu kỳ đầu tiên nếu chưa có cái nào.
 *
 * Ranh giới: từ ngày lương tháng trước tới hôm trước ngày lương tháng này. Bồ
 * bắt đầu dùng app giữa chừng thì chu kỳ hiện tại vẫn là chu kỳ đã bắt đầu từ
 * kỳ lương gần nhất, không phải "từ hôm nay" — nếu không, chu kỳ đầu sẽ ngắn
 * bất thường và mọi con số trung bình đều sai.
 */
export async function baoDamCoChuKy(userId: string): Promise<ChuKyDb> {
  const dangCo = await chuKyDangChay()
  if (dangCo) return dangCo

  const nay = homNay()
  const [nam, thang] = nay.split('-').map(Number) as [number, number]

  const luongThangNay = ngayLamViecCuoiThang(nam, thang)
  // Nếu hôm nay đã qua ngày lương tháng này thì chu kỳ hiện tại bắt đầu từ đó;
  // nếu chưa thì nó bắt đầu từ ngày lương tháng trước.
  const batDau =
    nay >= luongThangNay
      ? luongThangNay
      : thang === 1
        ? ngayLamViecCuoiThang(nam - 1, 12)
        : ngayLamViecCuoiThang(nam, thang - 1)

  const ketThuc = themNgay(
    batDau === luongThangNay
      ? thang === 12
        ? ngayLamViecCuoiThang(nam + 1, 1)
        : ngayLamViecCuoiThang(nam, thang + 1)
      : luongThangNay,
    -1,
  )

  const { data, error } = await sb
    .from('chu_ky')
    .insert({
      user_id: userId,
      ngay_bat_dau_du_kien: batDau,
      ngay_bat_dau_thuc_te: batDau,
      ngay_ket_thuc: ketThuc,
      trang_thai: 'dang_chay',
    })
    .select()
    .single()

  if (error) {
    // Kiểm-rồi-chèn không nguyên tử: hai lời gọi song song đều thấy "chưa có chu
    // kỳ nào" rồi cùng chèn. Xảy ra thật ngay lần chạy đầu — React StrictMode
    // chạy effect hai lần ở dev, và ngoài đời là hai tab hoặc một lần render lại.
    //
    // Ràng buộc EXCLUDE ở migration 0003 chặn được cái thứ hai, nên tới đây chỉ
    // cần đọc lại cái vừa được tạo. Không có ràng buộc đó thì DB đã có hai chu kỳ
    // chồng lấn mà không ai báo.
    const daCo = await chuKyDangChay()
    if (daCo) return daCo
    throw new Error(`Tạo chu kỳ đầu tiên: ${error.message}`)
  }
  return data
}

/**
 * Đổi ngày bắt đầu chu kỳ (lương về sớm/trễ) rồi gán lại giao dịch (§7.2 rule 3).
 *
 * Trả về số giao dịch đã chuyển để UI hiện "Đã chuyển N giao dịch" — §7.2 bắt
 * buộc hiện con số này. Đổi ranh giới âm thầm là cách dữ liệu đi lạc mà bồ
 * không biết.
 */
export async function doiNgayBatDau(
  chuKyId: string,
  ngayMoi: NgayLocal,
): Promise<{ daChuyen: number }> {
  const ds = bocLoi(
    await sb.from('chu_ky').select('*').order('ngay_bat_dau_thuc_te'),
    'Đọc danh sách chu kỳ',
  )

  const cu = ds.map(tuDb)
  const moi = ds.map((d) => (d.id === chuKyId ? { ...tuDb(d), batDau: ngayMoi } : tuDb(d)))

  // Chu kỳ liền trước phải co lại cho khít — không được để hở một ngày nào
  // (§7.2 rule 1). Ràng buộc EXCLUDE ở tầng DB chỉ chặn chồng lấn, không chặn hở.
  const viTri = ds.findIndex((d) => d.id === chuKyId)
  const truoc = viTri > 0 ? ds[viTri - 1] : undefined
  if (truoc) moi[viTri - 1] = { ...tuDb(truoc), ketThuc: themNgay(ngayMoi, -1) }

  const ngayGiaoDich = bocLoi(
    await sb.from('giao_dich').select('ngay_local').neq('trang_thai', 'da_huy'),
    'Đọc ngày giao dịch',
  ).map((g) => ngayLocal(g.ngay_local))

  const daChuyen = demChuyen(ngayGiaoDich, cu, moi)

  // MỘT lệnh cho cả hai ranh giới, không phải hai lệnh nối đuôi.
  //
  // Trước đây đây là hai lần update: co chu kỳ trước, rồi dời chu kỳ này. Đi thử
  // luồng thì lộ ra nó không chạy được theo chiều "lương về trễ" — nong chu kỳ
  // trước ra trong khi chu kỳ này chưa dời đi thì hai khoảng chạm nhau, và ràng
  // buộc EXCLUDE chặn lại.
  //
  // Hàm SQL hoãn kiểm tra ràng buộc tới lúc chốt giao dịch, nên trạng thái nửa
  // vời không bao giờ tồn tại với bất kỳ ai nhìn vào. Chi tiết ở migration 0010.
  const r = await sb.rpc('doi_ranh_gioi_chu_ky', {
    p_truoc_id: truoc?.id ?? null,
    p_truoc_ket_thuc: truoc ? themNgay(ngayMoi, -1) : null,
    p_nay_id: chuKyId,
    p_nay_bat_dau: ngayMoi,
  })

  // Migration 0010 chưa chạy trên DB này ⇒ đi đường lui thay vì đứng hình.
  //
  // PGRST202 nghĩa là PostgREST không tìm thấy hàm. Chỉ bắt đúng mã đó — mọi lỗi
  // khác vẫn phải nổi lên, vì nuốt lỗi ở chỗ đang dời ranh giới tiền bạc là cách
  // chắc nhất để dữ liệu đi lạc mà không ai biết.
  if (r.error?.code === 'PGRST202') {
    const truocKetThuc = themNgay(ngayMoi, -1)
    const doiNay = () =>
      sb.from('chu_ky').update({ ngay_bat_dau_thuc_te: ngayMoi }).eq('id', chuKyId).select().single()
    const doiTruoc = () =>
      truoc
        ? sb.from('chu_ky').update({ ngay_ket_thuc: truocKetThuc }).eq('id', truoc.id).select().single()
        : Promise.resolve({ data: null, error: null })

    // Sửa cái CO LẠI trước — xem `coLaiTruoc()` để biết vì sao thứ tự là bắt buộc
    // chứ không phải tuỳ ý.
    const batDauCu = ngayLocal(ds[viTri]!.ngay_bat_dau_thuc_te)
    // `nemNeuLoi` chứ không `bocLoi` cho doiTruoc(): khi CHƯA CÓ chu kỳ trước —
    // tức chu kỳ đầu tiên của bồ — nhánh đó trả `{ data: null, error: null }` một
    // cách hợp lệ, mà `bocLoi` thì coi `data: null` là hỏng và ném lỗi. Đúng ca
    // §7.8 sinh ra để bảo vệ, và là đường tôi KHÔNG thử khi làm hàm này.
    if (coLaiTruoc(batDauCu, ngayMoi) === 'nay') {
      bocLoi(await doiNay(), 'Dời chu kỳ này')
      nemNeuLoi(await doiTruoc(), 'Co chu kỳ trước cho khít')
    } else {
      nemNeuLoi(await doiTruoc(), 'Co chu kỳ trước cho khít')
      bocLoi(await doiNay(), 'Dời chu kỳ này')
    }
  } else {
    // Hàm SQL khai `returns void` nên `data` LUÔN null kể cả khi chạy đúng.
    nemNeuLoi(r, 'Dời ranh giới chu kỳ')
  }

  // Gán lại giao dịch theo ranh giới mới. Làm sau khi đã đổi ranh giới để truy
  // vấn theo ngày trả về đúng tập.
  for (const d of ds) {
    const ck = d.id === chuKyId ? moi[viTri]! : tuDb(d)
    await sb
      .from('giao_dich')
      .update({ chu_ky_id: d.id })
      .gte('ngay_local', ck.batDau)
      .lte('ngay_local', ck.ketThuc)
  }

  await sb.from('su_kien').insert({
    user_id: ds[0]?.user_id ?? '',
    ma: 'CYCLE_BOUNDARY_CHANGED',
    doi_tuong: chuKyId,
    du_lieu: { ngay_moi: ngayMoi, da_chuyen: daChuyen },
  })

  return { daChuyen }
}

/**
 * Đặt số tiền để dành định mức của chu kỳ (§7.2).
 *
 * Chỉ lưu con số này; mức chi mỗi ngày luôn là số DẪN XUẤT, không lưu — nếu lưu
 * cả hai thì sớm muộn chúng lệch nhau và không ai biết tin bản nào (§6.3).
 */
export async function datDeDanhDinhMuc(chuKyId: string, soTien: number): Promise<void> {
  const ck = bocLoi(
    await sb
      .from('chu_ky')
      .update({ so_tien_de_danh_dinh_muc: soTien })
      .eq('id', chuKyId)
      .select()
      .single(),
    'Đặt để dành định mức',
  )
  await sb.from('su_kien').insert({
    user_id: ck.user_id,
    ma: 'SAVINGS_TARGET_SET',
    doi_tuong: chuKyId,
    du_lieu: { so_tien: soTien },
  })
}
