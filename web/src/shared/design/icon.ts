import type { TenIcon } from '@/shared/ui/Icon'

/**
 * CHỌN ICON CHO MỘT DANH MỤC — §7.1 ràng buộc "đổi icon không sửa dòng code nào".
 *
 * Trước đây icon chọn cứng theo SLOT và cột `danh_muc.icon` bị bỏ qua hoàn toàn.
 * Nghĩa là phép thử nghiệm thu của §7.1 không thể đạt được: bồ đổi icon trong DB
 * thì màn hình vẫn y nguyên. Ở đây cột đó mới thật sự có tác dụng.
 *
 * Tên trong DB khác tên trong bộ icon — seed ghi `bowl-steam`, `book-open`,
 * `martini`, `plant` theo tên Phosphor, còn component dùng tên ngắn. Bảng dưới
 * dịch giữa hai bên thay vì đi sửa seed: seed đã chạy trên máy thật rồi, và đổi
 * dữ liệu đã có luôn đắt hơn thêm một phép dịch.
 */
const TU_DB: Record<string, TenIcon> = {
  'bowl-steam': 'bowl',
  'book-open': 'book',
  martini: 'glass',
  plant: 'sprout',
  lipstick: 'lipstick',
  question: 'plus',
  heartbeat: 'plus',
}

/** Icon mặc định theo slot, dùng khi danh mục chưa chọn gì. */
const THEO_SLOT: Record<number, TenIcon> = {
  1: 'bowl',
  2: 'book',
  3: 'glass',
  4: 'sprout',
  5: 'lipstick',
  6: 'plus',
}

/** Bộ icon bồ chọn được khi tự đặt danh mục (§11.5). */
export const ICON_CHON_DUOC: TenIcon[] = [
  // Xếp theo NHÓM VIỆC chứ không theo bảng chữ cái: bồ đi tìm "cái xe" chứ không
  // đi tìm chữ x. Nhóm nào cũng đặt cạnh nhau để mắt quét một lượt là thấy.
  'bowl', 'caphe', 'giohang', 'glass',            //  ăn uống, mua sắm
  'home', 'dien', 'nuoc', 'wifi', 'dienthoai',      //  nhà cửa, hoá đơn
  'xe', 'xebuyt', 'xang', 'maybay',               //  đi lại
  'tim', 'thuoc', 'ta',                          //  sức khoẻ
  'lipstick', 'keo', 'ao',                       //  làm đẹp, quần áo
  'book', 'sprout', 'leafpot',                   //  học, đầu tư
  'qua', 'meo', 'embe', 'cole', 'nganhang',        //  quà, thú cưng, con, sửa chữa, phí
  'jar', 'clock', 'plus',                        //  chung chung
]

/**
 * Cột `icon` thắng, không có thì rơi về mặc định của slot, không có nữa thì dấu
 * cộng. Ba tầng chứ không hai: danh mục hệ thống có slot `null` nên tầng giữa
 * không đỡ được nó.
 */
export function iconDanhMuc(icon: string | null | undefined, slot: number | null): TenIcon {
  if (icon) {
    if (icon in TU_DB) return TU_DB[icon]!
    // Đã là tên của bộ icon rồi thì dùng thẳng — đây là đường mà màn quản lý
    // danh mục ghi vào, không qua bảng dịch.
    if (ICON_CHON_DUOC.includes(icon as TenIcon)) return icon as TenIcon
  }
  return (slot !== null && THEO_SLOT[slot]) || 'plus'
}
