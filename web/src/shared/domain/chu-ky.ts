/**
 * CHU KỲ & NGÀY LƯƠNG — §7.2.
 * shared/domain/ ⇒ §14 quy ước 3: không import React, không gọi mạng.
 */

/**
 * Ngày theo lịch Việt Nam, dạng 'YYYY-MM-DD'. Khớp đúng kiểu `date` của Postgres.
 *
 * Cả tầng domain KHÔNG dùng đối tượng `Date` cho ngày lịch. `Date` là một mốc thời
 * gian tuyệt đối, đọc ra ngày nào còn tuỳ múi giờ máy — đó chính là "bug kinh điển"
 * §14 quy ước 2 cảnh báo. Chuỗi 'YYYY-MM-DD' không mang múi giờ nên không thể sai,
 * lại so sánh và sắp xếp được bằng phép so chuỗi thường.
 *
 * Việc quy đổi mốc thời gian → ngày Việt Nam chỉ xảy ra MỘT lần, ở ranh giới hệ
 * thống, qua `ngayLocalTuThoiDiem()`.
 */
export type NgayLocal = string & { readonly __brand: 'ngay-local' }

const DANG_NGAY = /^\d{4}-\d{2}-\d{2}$/

/** Ép chuỗi thành `NgayLocal`. Từ chối sai định dạng và ngày không tồn tại (31/02). */
export function ngayLocal(s: string): NgayLocal {
  if (!DANG_NGAY.test(s)) {
    throw new Error(`Ngày phải theo dạng YYYY-MM-DD, nhận được: ${s}`)
  }
  // Kiểm tra khứ hồi: Date tự "sửa" 2026-02-31 thành 2026-03-03, nên nếu định dạng
  // lại mà ra chuỗi khác thì ngày ban đầu không tồn tại. Riêng tháng 13 làm Date
  // thành Invalid, lúc đó toISOString() ném lỗi hệ thống nên phải chặn trước.
  const d = moc(s)
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) {
    throw new Error(`Ngày không tồn tại: ${s}`)
  }
  return s as NgayLocal
}

/** Mốc UTC nửa đêm của một ngày lịch — chỉ dùng nội bộ để làm toán ngày. */
function moc(s: string): Date {
  return new Date(`${s}T00:00:00Z`)
}

function tuMoc(d: Date): NgayLocal {
  return d.toISOString().slice(0, 10) as NgayLocal
}

/** Việt Nam ở UTC+7 cố định, không có giờ mùa hè từ 1975 ⇒ cộng bù được, không cần Intl. */
const LECH_VN_MS = 7 * 60 * 60 * 1000

/**
 * Quy đổi một mốc thời gian tuyệt đối sang ngày lịch Việt Nam.
 *
 * Đây là hàm chặn "bug kinh điển": giao dịch lúc 00:30 ngày 29 giờ VN có mốc UTC
 * là 17:30 ngày 28. Đọc thẳng phần ngày của UTC sẽ gán nhầm nó về chu kỳ trước.
 */
export function ngayLocalTuThoiDiem(thoiDiem: Date | string): NgayLocal {
  const t = typeof thoiDiem === 'string' ? new Date(thoiDiem) : thoiDiem
  if (Number.isNaN(t.getTime()))
    throw new Error(`Mốc thời gian không hợp lệ: ${String(thoiDiem)}`)
  return tuMoc(new Date(t.getTime() + LECH_VN_MS))
}

/**
 * Hôm nay theo lịch Việt Nam — MỌI nơi cần "hôm nay" đều phải gọi hàm này.
 *
 * Không bao giờ dùng `new Date().getDate()` hay `toLocaleDateString()`: nhóm hàm
 * đó đọc theo múi giờ của thiết bị, nên bồ mang máy ra nước ngoài là con số
 * "hôm nay còn tiêu được" nhảy sang ngày khác. Ở đây mốc thời gian là tuyệt đối,
 * chỉ có phép quy đổi sang UTC+7 quyết định ngày ⇒ máy ở đâu cũng ra cùng kết quả.
 *
 * Tham số `bayGio` để test tiêm mốc cố định vào; chạy thật thì bỏ trống.
 */
export function homNay(bayGio: Date = new Date()): NgayLocal {
  return ngayLocalTuThoiDiem(bayGio)
}

const THU = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const

/**
 * Ngày để bồ ĐỌC: '20/08/2026' hoặc 'T5 20/08/2026'. Dạng lưu là 'YYYY-MM-DD'
 * cho máy, không phải cho người — hiện thẳng chuỗi đó ra màn hình là bắt bồ tự dịch.
 *
 * LUÔN kèm năm, kể cả khi trông thừa (§14 quy ước 2). Sổ tiết kiệm 36 tháng ở
 * §7.10 và biểu đồ so sánh giữa các chu kỳ đều vượt ra ngoài một năm, mà '15/09'
 * lúc đó là mơ hồ. Một format duy nhất thì không có chỗ nào phải nhớ ngoại lệ.
 *
 * Cắt chuỗi chứ không dùng toLocaleDateString: hàm đó đọc theo múi giờ thiết bị
 * và sẽ lệch ngày, đúng cái bẫy §14 quy ước 2 nói tới.
 */
export function dinhDangNgay(d: NgayLocal, kemThu = false): string {
  const ngay = `${d.slice(8)}/${d.slice(5, 7)}/${d.slice(0, 4)}`
  if (!kemThu) return ngay
  return `${THU[moc(d).getUTCDay()]} ${ngay}`
}

/** Cộng/trừ số ngày. */
export function themNgay(d: NgayLocal, n: number): NgayLocal {
  const t = moc(d)
  t.setUTCDate(t.getUTCDate() + n)
  return tuMoc(t)
}

/**
 * Cộng/trừ số THÁNG, kẹp về ngày cuối tháng khi tháng đích ngắn hơn.
 *
 * 31/01 + 1 tháng = 28/02, không phải 03/03. `Date.setUTCMonth()` tự tràn sang
 * tháng sau trong đúng ca đó — im lặng và sai. Ngày đáo hạn sổ tiết kiệm (§7.10)
 * dựa hết vào hàm này, mà lệch một ngày là lệch tiền lãi.
 */
export function themThang(d: NgayLocal, n: number): NgayLocal {
  const [nam, thang, ngay] = d.split('-').map(Number) as [number, number, number]
  const tong = nam * 12 + (thang - 1) + n
  const namMoi = Math.floor(tong / 12)
  const thangMoi = (tong % 12) + 1
  // Ngày 0 của tháng kế = ngày cuối tháng này, cùng mẹo với ngayLamViecCuoiThang().
  const ngayCuoi = new Date(Date.UTC(namMoi, thangMoi, 0)).getUTCDate()
  const hai = (x: number) => String(x).padStart(2, '0')
  return ngayLocal(`${namMoi}-${hai(thangMoi)}-${hai(Math.min(ngay, ngayCuoi))}`)
}

/** Số ngày từ `tu` đến `den`, TÍNH CẢ HAI ĐẦU. Cùng một ngày ⇒ 1. */
export function soNgayGiua(tu: NgayLocal, den: NgayLocal): number {
  return Math.round((moc(den).getTime() - moc(tu).getTime()) / 86_400_000) + 1
}

/**
 * Ngày lương = ngày làm việc cuối tháng (bồ làm T2–T6). `thang` đếm từ 1.
 *
 * Cố ý KHÔNG có bảng ngày lễ Việt Nam: lễ đổi mỗi năm, bảng sẽ mục và sai âm thầm —
 * kiểu sai tệ hơn hẳn so với để bồ sửa tay một chạm khi lương về sớm hay trễ (§7.2).
 */
export function ngayLamViecCuoiThang(nam: number, thang: number): NgayLocal {
  const cuoi = new Date(Date.UTC(nam, thang, 0)) // ngày 0 của tháng sau = ngày cuối tháng này
  const thu = cuoi.getUTCDay() // 0 = Chủ nhật, 6 = Thứ bảy
  const lui = thu === 0 ? 2 : thu === 6 ? 1 : 0
  cuoi.setUTCDate(cuoi.getUTCDate() - lui)
  return tuMoc(cuoi)
}

export type ChuKy = {
  readonly batDau: NgayLocal
  readonly ketThuc: NgayLocal
}

/**
 * Dựng dãy chu kỳ liên tiếp từ danh sách ngày lương đã sắp xếp tăng dần.
 *
 * Chu kỳ i chạy từ ngày lương i đến ngày lương i+1 trừ một ngày. Vì ranh giới được
 * DẪN XUẤT ra như vậy chứ không nhập rời từng cái, "không chồng lấn, không hở"
 * (§7.2 rule 1) là bất biến về mặt cấu trúc — không có cách nào dựng sai.
 * Ràng buộc `EXCLUDE USING gist` ở tầng DB là lưới an toàn thứ hai cho dữ liệu
 * ghi bằng đường khác, không phải nơi duy nhất kiểm.
 *
 * n ngày lương cho ra n−1 chu kỳ đóng; chu kỳ đang chạy chưa biết ngày kết thúc.
 */
export function dayChuKy(ngayLuong: readonly NgayLocal[]): ChuKy[] {
  const ck: ChuKy[] = []
  for (let i = 0; i < ngayLuong.length - 1; i++) {
    const batDau = ngayLuong[i]!
    const sau = ngayLuong[i + 1]!
    if (sau <= batDau) throw new Error(`Ngày lương phải tăng dần: ${batDau} rồi ${sau}`)
    ck.push({ batDau, ketThuc: themNgay(sau, -1) })
  }
  return ck
}

/** Độ dài chu kỳ, tính cả hai đầu. Thực tế 28–34 ngày tuỳ tháng (§7.2). */
export function soNgay(ck: ChuKy): number {
  return soNgayGiua(ck.batDau, ck.ketThuc)
}

/**
 * Chu kỳ chứa ngày này, hoặc `null` nếu không có.
 *
 * `null` nghĩa là "chu kỳ trôi nổi" (§7.2 rule 2) — người gọi PHẢI hiện cảnh báo,
 * không được im lặng bỏ qua. Đó là cách dữ liệu biến mất mà không ai biết.
 */
export function timChuKy(cks: readonly ChuKy[], ngay: NgayLocal): ChuKy | null {
  return cks.find((c) => ngay >= c.batDau && ngay <= c.ketThuc) ?? null
}

/** Vị trí chu kỳ chứa ngày này, −1 nếu trôi nổi. */
function chiSoChuKy(cks: readonly ChuKy[], ngay: NgayLocal): number {
  return cks.findIndex((c) => ngay >= c.batDau && ngay <= c.ketThuc)
}

/**
 * Số giao dịch phải gán lại khi ranh giới đổi (§7.2 rule 3) — con số hiện trong
 * câu "Đã chuyển N giao dịch".
 *
 * So sánh bằng THỨ TỰ chu kỳ chứ không bằng `batDau`: khi lương về sớm 3 ngày,
 * chu kỳ sau đổi ngày bắt đầu nhưng giao dịch giữa tháng vẫn ở nguyên chu kỳ đó —
 * so bằng `batDau` sẽ đếm nhầm chúng là đã chuyển. Đúng với mọi lần sửa ngày lương,
 * vì sửa ngày không làm thay đổi số lượng chu kỳ.
 *
 * Đếm cả chiều "có chu kỳ" ⇄ "trôi nổi": cả hai đều là thay đổi bồ cần biết.
 */
export function demChuyen(
  ngays: readonly NgayLocal[],
  cu: readonly ChuKy[],
  moi: readonly ChuKy[],
): number {
  return ngays.filter((n) => chiSoChuKy(cu, n) !== chiSoChuKy(moi, n)).length
}

/**
 * Số ngày còn lại của chu kỳ, TÍNH CẢ HÔM NAY — mẫu số của "hôm nay còn tiêu được".
 *
 * Tính cả hôm nay vì phần của hôm nay vẫn tiêu được hôm nay. Trả 0 khi hôm nay đã
 * qua ngày kết thúc, để nơi gọi biết mà không chia cho số âm (§7.8).
 */
export function ngayConLai(ck: ChuKy, homNay: NgayLocal): number {
  if (homNay > ck.ketThuc) return 0
  const tu = homNay < ck.batDau ? ck.batDau : homNay
  return soNgayGiua(tu, ck.ketThuc)
}

/**
 * Dời ranh giới giữa hai chu kỳ: phải sửa cái CO LẠI trước, cái NONG RA sau.
 *
 * Dời ngày bắt đầu của chu kỳ này thì chu kỳ trước phải đổi ngày kết thúc theo.
 * Không có cách nào sửa cả hai cùng lúc bằng hai lệnh riêng, nên ở giữa chúng
 * hai khoảng ngày hoặc CHẠM nhau hoặc HỞ ra:
 *
 *   lương TRỄ (dời sang phải)   → chu kỳ này co lại, chu kỳ trước nong ra
 *   lương SỚM (dời sang trái)   → chu kỳ trước co lại, chu kỳ này nong ra
 *
 * Nong cái nào ra trước thì nó lấn sang khoảng cái kia chưa kịp nhường ⇒ ràng
 * buộc `chu_ky_khong_chong_lan` từ chối, thao tác hỏng hẳn. Co trước thì chỉ hở
 * một khoảnh khắc rồi khít lại — hở thì DB không chặn, và bước gán lại giao dịch
 * ngay sau đó lấp kín.
 *
 * Hở vẫn là trạng thái không nên tồn tại (§7.2 rule 1), nên đường đi ĐÚNG là hàm
 * SQL `doi_ranh_gioi_chu_ky` ở migration 0010 — nó hoãn kiểm tra ràng buộc tới
 * lúc chốt giao dịch nên không có trạng thái nửa vời nào cả. Thứ tự này là đường
 * lui cho tới khi migration đó chạy.
 */
export function coLaiTruoc(batDauCu: NgayLocal, batDauMoi: NgayLocal): 'nay' | 'truoc' {
  return batDauMoi > batDauCu ? 'nay' : 'truoc'
}
