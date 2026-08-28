/**
 * SAO LƯU — dump toàn bộ DB ra JSON, lưu vào Supabase Storage và ra đĩa.
 *
 * §5 gọi đây là việc bắt buộc của Pha 0: Supabase free chỉ giữ backup 7 ngày,
 * và mất dữ liệu là 1 trong 2 cách dự án chết (§1).
 *
 * ⚠️ Giới hạn đã biết: Storage nằm CÙNG project với database. Nó chống được
 * trường hợp hay xảy ra nhất — migration hỏng, xoá nhầm, sửa sai — nhưng không
 * chống được mất cả project. Vì vậy script luôn ghi thêm một bản ra đĩa; mỗi
 * tháng chép bản đó đi nơi khác một lần là có bản off-site.
 *
 * Chạy:  node scripts/backup.ts
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { BANG, docMoiTruong, goiRest, docHetBang, tuanIso, type BanSaoLuu } from './chung.ts'

const THUNG = 'sao-luu'

async function taoThungNeuChua(mt: { url: string; key: string }): Promise<void> {
  const r = await fetch(`${mt.url}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      apikey: mt.key,
      Authorization: `Bearer ${mt.key}`,
      'Content-Type': 'application/json',
    },
    // public: false — đây là toàn bộ dữ liệu tài chính cá nhân, không bao giờ
    // để công khai (điểm D6 của review).
    body: JSON.stringify({ id: THUNG, name: THUNG, public: false }),
  })
  if (r.ok) {
    console.log(`  Đã tạo thùng chứa '${THUNG}'`)
    return
  }
  const loi = await r.text()
  // Thùng đã tồn tại là trạng thái bình thường, không phải lỗi.
  if (r.status === 409 || loi.includes('already exists')) return
  throw new Error(`Không tạo được thùng chứa: ${r.status} ${loi}`)
}

/**
 * Kích thước bản sao lưu gần nhất trên Storage, `null` nếu chưa có bản nào.
 *
 * Dùng để bắt kiểu hỏng nguy hiểm nhất: backup vẫn chạy, vẫn báo thành công, mà
 * bên trong rỗng hoặc thiếu bảng. Không so với bản trước thì tuần nào cũng "xanh"
 * cho tới đúng ngày cần phục hồi mới biết (điểm D6 của review).
 */
async function coLon(mt: { url: string; key: string }): Promise<number | null> {
  const r = await fetch(`${mt.url}/storage/v1/object/list/${THUNG}`, {
    method: 'POST',
    headers: {
      apikey: mt.key,
      Authorization: `Bearer ${mt.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ limit: 1, sortBy: { column: 'name', order: 'desc' } }),
  })
  // Chưa có thùng, hoặc lỗi mạng: coi như chưa có bản nào để so. Không chặn việc
  // sao lưu chỉ vì không đọc được bản cũ — có bản mới vẫn hơn không có gì.
  if (!r.ok) return null
  const ds = (await r.json()) as { metadata?: { size?: number } }[]
  return ds[0]?.metadata?.size ?? null
}

async function tai(
  mt: { url: string; key: string },
  ten: string,
  noiDung: string,
): Promise<void> {
  const r = await fetch(`${mt.url}/storage/v1/object/${THUNG}/${ten}`, {
    method: 'POST',
    headers: {
      apikey: mt.key,
      Authorization: `Bearer ${mt.key}`,
      'Content-Type': 'application/json',
      // Ghi đè bản cùng tuần: khoá chống trùng BAK-{yyyy-ww} của §12 nghĩa là
      // chạy lại trong cùng tuần không được đẻ ra bản thứ hai.
      'x-upsert': 'true',
    },
    body: noiDung,
  })
  if (!r.ok) throw new Error(`Không tải lên được: ${r.status} ${await r.text()}`)
}

async function main(): Promise<void> {
  const mt = docMoiTruong()
  const bayGio = new Date()

  // Dòng chẩn đoán — cron hỏng thì log là thứ DUY NHẤT còn lại để lần ra nguyên
  // nhân. In host và ĐỘ DÀI khoá, tuyệt đối không in khoá: log của GitHub
  // Actions ai có quyền đọc repo cũng xem được.
  console.log(`Nguồn: ${new URL(mt.url).host} · khoá ${mt.key.length} ký tự`)
  console.log('Đang đọc dữ liệu...')
  const bang: Record<string, unknown[]> = {}
  for (const b of BANG) {
    bang[b] = await docHetBang(mt, b)
    console.log(`  ${b.padEnd(20)} ${String(bang[b].length).padStart(5)} dòng`)
  }

  const banSao: BanSaoLuu = {
    phien_ban: 1,
    tao_luc: bayGio.toISOString(),
    du_an: mt.url,
    bang,
  }
  const json = JSON.stringify(banSao, null, 2)
  const ten = `sobo-${tuanIso(bayGio)}.json`

  // Ghi ra đĩa TRƯỚC khi tải lên: nếu mạng hỏng thì vẫn còn bản dùng được.
  mkdirSync(new URL('../backups/', import.meta.url), { recursive: true })
  const duongDanDia = new URL(`../backups/${ten}`, import.meta.url)
  writeFileSync(duongDanDia, json)
  console.log(`\nĐã ghi ra đĩa: backups/${ten}`)

  await taoThungNeuChua(mt)
  // Đọc kích thước bản cũ TRƯỚC khi tải bản mới lên — làm sau thì nó tự so với
  // chính mình và phép kiểm tra thành vô nghĩa.
  const truoc = await coLon(mt)
  await tai(mt, ten, json)

  const tongDong = Object.values(bang).reduce((t, d) => t + d.length, 0)
  const kb = Math.round(json.length / 1024)
  console.log(`Đã tải lên Storage: ${THUNG}/${ten}`)
  console.log(`\nTổng ${tongDong} dòng · ${kb} KB`)

  // ── Cảnh báo teo dữ liệu (điểm D6 của review) ──────────────────────────────
  //
  // Backup hỏng âm thầm là kiểu hỏng tệ nhất: nó vẫn chạy, vẫn báo thành công,
  // và chỉ lộ ra vào đúng ngày cần phục hồi. Dữ liệu của app chỉ TĂNG (không xoá
  // cứng bao giờ — §13), nên bản mới nhỏ hơn hẳn bản trước là dấu hiệu hỏng.
  if (tongDong === 0) {
    console.error('\n❌ Bản sao lưu KHÔNG có dòng nào. Kiểm tra lại khoá service_role.')
    process.exitCode = 1
    return
  }

  if (truoc !== null && json.length < truoc * 0.8) {
    const pt = Math.round((json.length / truoc) * 100)
    console.error(
      `\n❌ Bản này chỉ bằng ${pt}% bản trước (${Math.round(truoc / 1024)} KB).`,
    )
    console.error('   Dữ liệu chỉ tăng chứ không giảm — nhiều khả năng dump thiếu bảng.')
    process.exitCode = 1
    return
  }

  console.log('\n✅ Sao lưu xong, kích thước hợp lý.')
}

await main()
