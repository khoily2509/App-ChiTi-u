/**
 * HOA CÚC — nhịp ghi chép trong tuần (§9.2).
 *
 * Thay cho hàng chấm và chuỗi ngày liên tiếp. Hàng chấm đo *hiệu suất*; bông hoa
 * đo *sự chăm sóc* — và chăm sóc thì lỡ một ngày cũng không sao. Đó là lý do ở
 * đây KHÔNG có con số nào để mất: tuần hỏng chỉ là một bông nhuỵ xám nằm im.
 */

import { type NgayLocal, themNgay } from './chu-ky'

/** Đủ bao nhiêu cánh thì nhuỵ chuyển vàng (§9.2). */
export const DU_CANH = 5

export type NhipTuan = {
  /** 7 phần tử theo thứ tự T2 → CN. `true` = ngày đó có ghi. */
  canh: boolean[]
  daGhi: number
  /** Đã đủ `DU_CANH` — nhuỵ vàng rực. */
  duNo: boolean
  /** Số ngày còn lại trong tuần, TÍNH CẢ hôm nay. */
  conLai: number
  /**
   * §9.2: chỉ thúc đẩy khi SẮP ĐẠT. Tuần đã hỏng thì im lặng hoàn toàn —
   * nhắc lúc đó chỉ là chì chiết.
   */
  nenThucDay: boolean
}

/** 0 = Thứ Hai … 6 = Chủ Nhật. Tuần ISO, theo §14 quy ước 2. */
export function thuIso(d: NgayLocal): number {
  // getUTCDay(): 0 = Chủ Nhật. Xoay để Thứ Hai về 0.
  return (new Date(`${d}T00:00:00Z`).getUTCDay() + 6) % 7
}

/** Ngày Thứ Hai của tuần chứa `d`. */
export function dauTuan(d: NgayLocal): NgayLocal {
  return themNgay(d, -thuIso(d))
}

/**
 * Tính nhịp tuần từ danh sách ngày đã ghi.
 *
 * Nhận `ngayDaGhi` thô chứ không nhận số đếm: cùng một ngày ghi ba khoản vẫn chỉ
 * là MỘT cánh. Bông hoa đếm ngày có chăm sóc, không đếm số lần.
 */
export function nhipTuan(ngayDaGhi: readonly NgayLocal[], homNay: NgayLocal): NhipTuan {
  const dau = dauTuan(homNay)
  const trongTuan = new Set(
    ngayDaGhi.filter((n) => n >= dau && n <= themNgay(dau, 6)),
  )

  const canh = Array.from({ length: 7 }, (_, i) => trongTuan.has(themNgay(dau, i)))
  const daGhi = canh.filter(Boolean).length
  const conLai = 7 - thuIso(homNay)

  // "Tuần đã hỏng" = dù ghi hết những ngày còn lại cũng không đủ 5 cánh.
  const conCuuDuoc = daGhi + conLai >= DU_CANH

  return {
    canh,
    daGhi,
    duNo: daGhi >= DU_CANH,
    conLai,
    // Đúng mốc §9.2: đã 4 cánh và còn ít nhất 1 ngày. Đủ rồi thì thôi (không còn
    // gì để thúc), hỏng rồi thì im.
    nenThucDay: daGhi === DU_CANH - 1 && conLai >= 1 && conCuuDuoc,
  }
}

export type BongHoa = {
  dauTuan: NgayLocal
  canh: boolean[]
  daGhi: number
  duNo: boolean
  laTuanNay: boolean
}

/**
 * VƯỜN HOA 8 TUẦN (§9.2, §10).
 *
 * Tính nhịp của 8 tuần gần nhất kết thúc ở tuần hiện tại.
 * Mỗi tuần là một bông hoa cúc 7 cánh. Tuần đủ 5 cánh thì nhụy vàng rực,
 * tuần lỡ thì nhụy xám nằm im — không phán xét, không trừ điểm.
 */
export function vuonHoa(
  ngayDaGhi: readonly NgayLocal[],
  homNay: NgayLocal,
  soTuan = 8,
): BongHoa[] {
  const dauNay = dauTuan(homNay)
  const ketQua: BongHoa[] = []

  for (let t = soTuan - 1; t >= 0; t--) {
    const dau = themNgay(dauNay, -t * 7)
    const cuoi = themNgay(dau, 6)
    const nhomNgay = new Set(ngayDaGhi.filter((n) => n >= dau && n <= cuoi))
    const canh = Array.from({ length: 7 }, (_, i) => nhomNgay.has(themNgay(dau, i)))
    const daGhi = canh.filter(Boolean).length
    ketQua.push({
      dauTuan: dau,
      canh,
      daGhi,
      duNo: daGhi >= DU_CANH,
      laTuanNay: t === 0,
    })
  }

  return ketQua
}

/** Giờ nhắc mặc định (§9.2 — Khôi chốt 21:00 ngày 23/08/2026). */
export const GIO_NHAC_MAC_DINH = 21

/**
 * Đọc GIỜ từ giá trị `cau_hinh.gio_nhac`.
 *
 * Cột đó kiểu `jsonb` và seed ghi vào chuỗi `"21:00"`, nên đọc ra là một CHUỖI
 * chứ không phải số. Worker trước đây kiểm `typeof gia_tri === 'number'` — phép
 * so sánh đó luôn sai, nên nó luôn rơi về mặc định và việc bồ đổi giờ nhắc hoàn
 * toàn vô tác dụng. Hỏng im lặng: cron vẫn chạy, thông báo vẫn tới, chỉ là sai
 * giờ mãi mãi mà không ai biết vì sao.
 *
 * Nhận cả ba dạng vì cả ba đều có thể xuất hiện thật: `"21:00"` (seed hiện tại),
 * `21` (nếu sau này lưu dạng số), `"21"` (nếu ai đó sửa tay trong bảng).
 *
 * Giá trị lạ thì trả mặc định chứ không ném: cron chạy mỗi giờ cho mọi người, một
 * dòng cấu hình hỏng của một người không được làm chết cả vòng lặp.
 */
export function gioNhacTu(giaTri: unknown): number {
  const hopLe = (n: number) => Number.isInteger(n) && n >= 0 && n <= 23
  if (typeof giaTri === 'number') return hopLe(giaTri) ? giaTri : GIO_NHAC_MAC_DINH
  if (typeof giaTri === 'string') {
    // Lấy phần trước dấu hai chấm; không có dấu hai chấm thì lấy cả chuỗi.
    const truoc = giaTri.trim().split(':')[0]?.trim() ?? ''
    // Chặn chuỗi rỗng TRƯỚC khi đổi sang số: `Number('')` là 0, nên không chặn
    // thì một ô cấu hình rỗng biến thành 0 giờ và app nhắc bồ lúc nửa đêm. Chính
    // test này bắt được, lúc hàm vừa viết xong.
    if (truoc === '') return GIO_NHAC_MAC_DINH
    const gio = Number(truoc)
    return hopLe(gio) ? gio : GIO_NHAC_MAC_DINH
  }
  return GIO_NHAC_MAC_DINH
}
