/**
 * LUẬT DANH MỤC — §7.1.
 *
 * Trần MƯỜI danh mục chi (nới từ 6 ngày 27/08/2026). Con số này bị chặn bởi MÀU,
 * không bởi kỹ thuật: mỗi danh mục cần một màu mà người mù màu đỏ-lục vẫn tách
 * được khỏi chín màu kia, và mỗi màu thêm vào lại ép chín màu cũ sát nhau hơn.
 * Mười là mức còn giữ được khoảng cách không tệ hơn bộ sáu màu gốc — đo bằng
 * `mu-mau.test.ts`, chạy mỗi lần test.
 *
 * Còn LƯỚI GHI NHANH ở màn ① thì vẫn chỉ chứa sáu ô, và đó là giới hạn khác
 * hẳn: giới hạn của màn hình, đo thật trên iPhone 13. Quá sáu thì lưới đẩy thanh
 * nhịp tuần xuống dưới nếp gấp, mà ghi nhanh là tính năng số 1 (§8). Nên từ danh
 * mục thứ bảy trở đi bồ chọn cái nào được lên màn chính.
 */

export const SLOT_TOI_DA = 10
/** Số ô tối đa của lưới ghi nhanh màn ①. Giới hạn màn hình, không phải giới hạn màu. */
export const O_MAN_CHINH = 6
export const TEN_TOI_DA = 24

/**
 * Slot còn trống nhỏ nhất, hoặc null khi đã đủ sáu.
 *
 * Truyền vào slot của danh mục ĐANG DÙNG, không kể danh mục đã ẩn — "trần cứng
 * 6" của §7.1 nghĩa là 6 cùng lúc, vì lý do của nó là bảng màu chỉ kiểm định 6
 * màu cho người khó phân biệt màu. Đó là ràng buộc về thứ đang hiện trên màn
 * hình, không phải về tổng số danh mục từng tồn tại.
 *
 * Migration 0012 sửa chỉ mục ở DB cho khớp cách hiểu này. Trước khi nó chạy, ẩn
 * một danh mục rồi thêm mới vào đúng slot đó sẽ bị DB trả 23505.
 */
export function slotConTrong(daDung: (number | null)[]): number | null {
  const co = new Set(daDung.filter((s): s is number => s !== null))
  for (let s = 1; s <= SLOT_TOI_DA; s++) if (!co.has(s)) return s
  return null
}

/**
 * Tên có dùng được không — trả về LÝ DO khi không, để UI hiện thẳng câu đó.
 *
 * Trả chuỗi thay vì boolean vì mỗi lý do cần một câu khác nhau; boolean thì tầng
 * UI phải tự đoán lại vì sao hỏng, và sớm muộn hai bên nói hai kiểu.
 */
export function loiCuaTen(ten: string, tenDaCo: string[]): string | null {
  const t = ten.trim()
  if (!t) return 'Đặt cho nó một cái tên nhé'
  if (t.length > TEN_TOI_DA) return `Tên dài quá ${TEN_TOI_DA} chữ thì nút sẽ bị cắt`
  // So sánh không phân biệt hoa thường: "Sức khoẻ" và "sức khoẻ" đứng cạnh nhau
  // trên lưới ghi nhanh là hai nút trông y hệt, bấm nhầm là chuyện chắc chắn.
  //
  // `toLowerCase` chứ không `toLocaleLowerCase`: bản locale đọc cấu hình máy, mà
  // test canh gác của `chu-ky.test.ts` cấm đúng thứ đó trong `shared/domain` —
  // và nó vừa bắt được tôi. Ở đây bản thường còn ĐÚNG HƠN: tiếng Việt dùng chữ
  // Latin có dấu, phép đổi hoa-thường Unicode mặc định đã xử lý đủ. Chỉ vài ngôn
  // ngữ như tiếng Thổ (i có chấm / không chấm) mới cần bản locale.
  const chuan = (x: string) => x.trim().toLowerCase()
  if (tenDaCo.some((x) => chuan(x) === chuan(t))) return 'Đã có danh mục tên này rồi'
  return null
}

/**
 * Đổi định nghĩa có phải cập nhật `hieu_luc_tu` không (§7.1 ràng buộc 2).
 *
 * Định nghĩa là thứ giữ cho việc phân loại nhất quán suốt 12 tháng. Đổi nó giữa
 * chừng thì số liệu CŨ mang nghĩa khác số liệu MỚI, và biểu đồ so sánh 12 tháng
 * sẽ nói dối mà không ai biết. Ghi lại mốc đổi là cách duy nhất để về sau còn
 * hiện được cảnh báo lúc so sánh vắt qua mốc đó.
 *
 * Đổi TÊN thì không tính — tên chỉ là nhãn, ý nghĩa nằm ở định nghĩa.
 */
export function doiMocHieuLuc(dinhNghiaCu: string, dinhNghiaMoi: string): boolean {
  return dinhNghiaCu.trim() !== dinhNghiaMoi.trim()
}

/**
 * Danh mục nào lên lưới ghi nhanh của màn ①.
 *
 * Cắt ở `O_MAN_CHINH` chứ không tin mỗi cờ `hienManChinh`: cờ nằm ở DB nên có
 * thể bật quá sáu cái bằng đường khác (script, SQL tay, hai máy sửa cùng lúc), và
 * lúc đó lưới vỡ bố cục thay vì chỉ hiện ít đi. Tầng UI phải tự bảo vệ mình.
 */
export function choManChinh<T extends { hienManChinh: boolean }>(ds: T[]): T[] {
  return ds.filter((d) => d.hienManChinh).slice(0, O_MAN_CHINH)
}

/**
 * Còn bật thêm được danh mục nào lên màn chính không.
 *
 * Trả về số chỗ trống thay vì boolean — màn hình cần hiện "còn 2 chỗ" chứ không
 * chỉ cần biết có hay không.
 */
export function choTrongManChinh(soDangHien: number): number {
  return Math.max(0, O_MAN_CHINH - soDangHien)
}
