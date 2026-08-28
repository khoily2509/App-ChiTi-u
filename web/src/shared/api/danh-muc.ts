import { sb, bocLoi, type Dong as DbRow } from './supabase'
import { doiMocHieuLuc } from '@/shared/domain/danh-muc'
import { homNay } from '@/shared/domain/chu-ky'

export type DanhMucDb = DbRow<'danh_muc'>

/**
 * SỬA / THÊM / ẨN DANH MỤC — §7.1.
 *
 * Trước đợt này không có màn nào làm được mấy việc đó: danh mục chỉ sinh ra một
 * lần bởi trigger lúc tạo tài khoản rồi đứng yên mãi. Phép thử nghiệm thu của
 * §7.1 ("đổi tên / định nghĩa / icon mà không sửa một dòng code nào") vì thế
 * chưa bao giờ đạt.
 */

/** Danh mục đang dùng, kể cả danh mục hệ thống. Đã loại cái bồ ẩn đi. */
export async function danhSachDanhMuc(): Promise<DanhMucDb[]> {
  return bocLoi(
    await sb.from('danh_muc').select('*').eq('trang_thai', 'active').order('thu_tu'),
    'Đọc danh mục',
  )
}

/**
 * Thêm danh mục vào slot còn trống.
 *
 * `slot` do tầng gọi tính bằng `slotConTrong()` chứ không tự tìm ở đây: màn hình
 * đã cầm danh sách rồi, đi hỏi lại DB chỉ thêm một lượt mạng và thêm một chỗ có
 * thể đọc ra kết quả khác thứ đang hiện.
 */
export async function themDanhMuc(p: {
  userId: string
  ten: string
  dinhNghia: string
  icon: string
  slot: number
  /** Có lên lưới ghi nhanh màn ① không. Hết chỗ (đã 6 cái) thì truyền false. */
  hienManChinh: boolean
}): Promise<DanhMucDb> {
  const row = bocLoi(
    await sb
      .from('danh_muc')
      .insert({
        user_id: p.userId,
        ten: p.ten.trim(),
        dinh_nghia: p.dinhNghia.trim(),
        icon: p.icon,
        slot: p.slot,
        hien_man_chinh: p.hienManChinh,
        // Xếp cuối hàng ghi nhanh. Dùng slot làm thứ tự cho khớp năm danh mục
        // seed sẵn, vốn cũng lấy slot làm thu_tu.
        thu_tu: p.slot,
      })
      .select()
      .single(),
    'Thêm danh mục',
  )

  await sb.from('su_kien').insert({
    user_id: p.userId,
    ma: 'CATEGORY_CREATED',
    doi_tuong: row.id,
    du_lieu: { ten: row.ten, slot: p.slot, dinh_nghia: row.dinh_nghia, hien_man_chinh: p.hienManChinh },
  })
  return row
}

/**
 * Sửa danh mục. Trả về mốc hiệu lực mới nếu định nghĩa có đổi.
 *
 * `hieu_luc_tu` chỉ dời khi ĐỊNH NGHĨA đổi, không dời khi đổi tên hay icon
 * (§7.1 ràng buộc 2) — xem `doiMocHieuLuc()` để biết vì sao phân biệt.
 */
export async function suaDanhMuc(
  userId: string,
  cu: DanhMucDb,
  moi: { ten: string; dinhNghia: string; icon: string },
): Promise<DanhMucDb> {
  const doiMoc = doiMocHieuLuc(cu.dinh_nghia, moi.dinhNghia)

  const row = bocLoi(
    await sb
      .from('danh_muc')
      .update({
        ten: moi.ten.trim(),
        dinh_nghia: moi.dinhNghia.trim(),
        icon: moi.icon,
        ...(doiMoc ? { hieu_luc_tu: homNay() } : {}),
      })
      .eq('id', cu.id)
      .select()
      .single(),
    'Sửa danh mục',
  )

  // Chỉ ghi sự kiện khi ĐỊNH NGHĨA đổi — đó là thứ §12.1 yêu cầu truy lại được,
  // vì nó làm số liệu cũ mang nghĩa khác số liệu mới. Đổi tên thì không.
  if (doiMoc) {
    await sb.from('su_kien').insert({
      user_id: userId,
      ma: 'CATEGORY_DEFINITION_CHANGED',
      doi_tuong: cu.id,
      du_lieu: { cu: cu.dinh_nghia, moi: row.dinh_nghia, hieu_luc_tu: row.hieu_luc_tu },
    })
  }
  return row
}

/**
 * Ẩn danh mục — KHÔNG xoá (§13 "không xoá cứng").
 *
 * Khoá ngoại từ `giao_dich` là `on delete restrict` nên xoá thật cũng không được
 * khi đã có khoản nào ghi vào đó, và đó là điều đúng: xoá danh mục sẽ làm mọi
 * biểu đồ của các chu kỳ CŨ mất một lát. Ẩn thì nó biến khỏi hàng ghi nhanh mà
 * số liệu cũ vẫn đọc được.
 *
 * Slot được nhả ra, nên bồ thêm danh mục mới sẽ lấp lại đúng chỗ đó.
 */
export async function anDanhMuc(userId: string, dm: DanhMucDb): Promise<void> {
  bocLoi(
    await sb.from('danh_muc').update({ trang_thai: 'archived' }).eq('id', dm.id).select().single(),
    'Ẩn danh mục',
  )
  await sb.from('su_kien').insert({
    user_id: userId,
    ma: 'CATEGORY_ARCHIVED',
    doi_tuong: dm.id,
    du_lieu: { ten: dm.ten, slot: dm.slot },
  })
}

/**
 * Bật / tắt việc danh mục đó có nằm trên lưới ghi nhanh màn ① không.
 *
 * Tách khỏi `suaDanhMuc()` vì đây KHÔNG phải sửa danh mục: nó không đổi ý nghĩa
 * của dữ liệu, chỉ đổi chỗ bồ bấm. Gộp chung thì mỗi lần gạt công tắc lại phải
 * gửi kèm cả tên và định nghĩa, và `hieu_luc_tu` có nguy cơ bị dời oan.
 */
export async function datHienManChinh(dmId: string, hien: boolean): Promise<void> {
  bocLoi(
    await sb.from('danh_muc').update({ hien_man_chinh: hien }).eq('id', dmId).select().single(),
    hien ? 'Đưa lên màn chính' : 'Bỏ khỏi màn chính',
  )
}
