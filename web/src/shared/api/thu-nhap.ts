/**
 * Thu nhập — §7.5. Tách khỏi `giao_dich` vì logic khác hẳn: thu nhập neo vào
 * chu kỳ và quyết định ngân sách, còn giao dịch chỉ là các khoản lẻ.
 */

import { sb, bocLoi } from './supabase'
import { type Dong as Tien, dong } from '@/shared/domain/tien'
import { homNay } from '@/shared/domain/chu-ky'

/**
 * Tổng thực nhận của một chu kỳ, hoặc null nếu chưa nhập.
 *
 * Null KHÔNG được thay bằng 0: chưa nhập lương khác hẳn với lương bằng 0, và
 * mọi con số phía sau đều dựa vào phân biệt đó (§7.8).
 */
export async function thucNhanCuaChuKy(chuKyId: string): Promise<Tien | null> {
  const ds = bocLoi(
    await sb
      .from('thu_nhap')
      .select('so_tien')
      .eq('chu_ky_id', chuKyId)
      .eq('trang_thai', 'thuc_nhan'),
    'Đọc thu nhập chu kỳ',
  )
  if (ds.length === 0) return null
  // Cộng dồn: §7.5 để sẵn đường cho nhiều nguồn thu nhập về sau.
  return dong(ds.reduce((t, x) => t + x.so_tien, 0))
}

/** Thu nhập của vài chu kỳ gần nhất — đầu vào của trần trả nợ 15% (§7.3). */
export async function thucNhanGanNhat(soChuKy = 3): Promise<Tien[]> {
  const ds = bocLoi(
    await sb
      .from('thu_nhap')
      .select('so_tien, chu_ky_id, ngay_local')
      .eq('trang_thai', 'thuc_nhan')
      .order('ngay_local', { ascending: false })
      .limit(soChuKy),
    'Đọc thu nhập gần nhất',
  )
  return ds.map((x) => dong(x.so_tien)).reverse()
}

/**
 * Ghi tổng thực nhận. Ghi đè bản ghi cũ của chính chu kỳ đó thay vì cộng thêm —
 * nhập lại là để SỬA con số, không phải để cộng dồn hai lần lương.
 */
export async function ghiThucNhan(
  userId: string,
  chuKyId: string,
  soTien: Tien,
): Promise<void> {
  const cu = bocLoi(
    await sb.from('thu_nhap').select('id').eq('chu_ky_id', chuKyId),
    'Tìm thu nhập cũ',
  )

  if (cu.length > 0) {
    bocLoi(
      await sb
        .from('thu_nhap')
        .update({ so_tien: soTien, trang_thai: 'thuc_nhan', ngay_local: homNay() })
        .eq('id', cu[0]!.id)
        .select()
        .single(),
      'Sửa tổng thực nhận',
    )
    // Bản ghi thừa nếu có (dữ liệu cũ) thì dọn để tổng không bị nhân đôi.
    for (const x of cu.slice(1)) {
      await sb.from('thu_nhap').delete().eq('id', x.id)
    }
  } else {
    bocLoi(
      await sb
        .from('thu_nhap')
        .insert({
          user_id: userId,
          chu_ky_id: chuKyId,
          so_tien: soTien,
          trang_thai: 'thuc_nhan',
          ngay_local: homNay(),
        })
        .select()
        .single(),
      'Ghi tổng thực nhận',
    )
  }

  await sb.from('su_kien').insert({
    user_id: userId,
    ma: 'INCOME_RECORDED',
    doi_tuong: chuKyId,
    du_lieu: { so_tien: soTien },
  })
}
