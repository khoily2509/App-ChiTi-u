/**
 * PHỤC HỒI TỪ BẢN SAO LƯU — §5: "VIẾT VÀ CHẠY THỬ TRƯỚC KHI CẦN ĐẾN NÓ".
 *
 * Script phục hồi chưa từng chạy là script không tồn tại. AT-14 tồn tại để ép
 * điều đó: dump → DB rỗng → phục hồi → số dòng khớp 100%, và chạy lần hai
 * KHÔNG được nhân đôi dữ liệu.
 *
 * Chạy:
 *   node scripts/restore-from-backup.ts backups/sobo-2026-W34.json
 *   node scripts/restore-from-backup.ts --moi-nhat        (tải bản mới nhất từ Storage)
 *   node scripts/restore-from-backup.ts <file> --xoa-truoc (xoá sạch rồi phục hồi)
 */

import { readFileSync } from 'node:fs'
import { BANG, docMoiTruong, goiRest, docHetBang, type BanSaoLuu } from './chung.ts'

const THUNG = 'sao-luu'

async function taiBanMoiNhat(mt: { url: string; key: string }): Promise<BanSaoLuu> {
  const r = await fetch(`${mt.url}/storage/v1/object/list/${THUNG}`, {
    method: 'POST',
    headers: {
      apikey: mt.key,
      Authorization: `Bearer ${mt.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ limit: 100, sortBy: { column: 'name', order: 'desc' } }),
  })
  if (!r.ok) throw new Error(`Không liệt kê được Storage: ${r.status} ${await r.text()}`)

  const ds = (await r.json()) as Array<{ name: string }>
  const moiNhat = ds.find((f) => f.name.endsWith('.json'))
  if (!moiNhat) throw new Error(`Thùng '${THUNG}' chưa có bản sao lưu nào.`)

  console.log(`Đang tải ${moiNhat.name} từ Storage...`)
  const t = await fetch(`${mt.url}/storage/v1/object/${THUNG}/${moiNhat.name}`, {
    headers: { apikey: mt.key, Authorization: `Bearer ${mt.key}` },
  })
  if (!t.ok) throw new Error(`Không tải được: ${t.status}`)
  return (await t.json()) as BanSaoLuu
}

/**
 * Xoá theo thứ tự NGƯỢC với thứ tự phục hồi — bảng bị trỏ tới phải xoá sau cùng,
 * nếu không khoá ngoại sẽ chặn.
 *
 * Chỉ dùng cho AT-14 và cho tình huống phục hồi thật. service_role bỏ qua RLS
 * nên các policy chặn DELETE ở 0002/0004 không cản được — đó là lý do khoá này
 * chỉ nằm trong .env trên máy, không bao giờ ở web/.
 */
async function xoaSach(mt: { url: string; key: string }): Promise<void> {
  console.log('Đang xoá sạch dữ liệu hiện có...')
  for (const b of [...BANG].reverse()) {
    // Lọc theo user_id chứ không phải id: cau_hinh dùng khoá chính ghép
    // (user_id, khoa) nên KHÔNG có cột id. user_id thì có ở mọi bảng vì nó là
    // trục của RLS. PostgREST bắt buộc phải có bộ lọc mới cho DELETE.
    await goiRest(mt, `${b}?user_id=not.is.null`, { method: 'DELETE' })
  }
}

async function main(): Promise<void> {
  const doiSo = process.argv.slice(2)
  const xoaTruoc = doiSo.includes('--xoa-truoc')
  const duongDan = doiSo.find((a) => !a.startsWith('--'))
  const mt = docMoiTruong()

  const banSao: BanSaoLuu = doiSo.includes('--moi-nhat')
    ? await taiBanMoiNhat(mt)
    : (JSON.parse(readFileSync(duongDan ?? '', 'utf8')) as BanSaoLuu)

  if (banSao.phien_ban !== 1) {
    throw new Error(`Không đọc được bản sao lưu phiên bản ${banSao.phien_ban}`)
  }
  console.log(`Bản sao lưu tạo lúc ${banSao.tao_luc}\n`)

  if (xoaTruoc) await xoaSach(mt)

  console.log('Đang phục hồi...')
  let tong = 0
  for (const b of BANG) {
    const dong = banSao.bang[b] ?? []
    if (dong.length === 0) {
      console.log(`  ${b.padEnd(20)}     0 dòng (bỏ qua)`)
      continue
    }

    // merge-duplicates = upsert theo primary key. Đây là thứ làm cho việc chạy
    // lại lần hai không nhân đôi dữ liệu — yêu cầu của AT-14.
    // Chia lô 500 để không vượt giới hạn kích thước request.
    for (let i = 0; i < dong.length; i += 500) {
      await goiRest(mt, b, {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(dong.slice(i, i + 500)),
      })
    }
    tong += dong.length
    console.log(`  ${b.padEnd(20)} ${String(dong.length).padStart(5)} dòng`)
  }

  // Đối chiếu: đọc lại từ DB và so với bản sao lưu. Không có bước này thì
  // "phục hồi thành công" chỉ có nghĩa là "không ném lỗi".
  console.log('\nĐối chiếu số dòng:')
  let lech = 0
  for (const b of BANG) {
    const mongDoi = (banSao.bang[b] ?? []).length
    const thucTe = (await docHetBang(mt, b)).length
    const dau = thucTe === mongDoi ? 'OK  ' : 'LỆCH'
    if (thucTe !== mongDoi) lech++
    console.log(`  ${dau} ${b.padEnd(20)} sao lưu ${mongDoi} · DB ${thucTe}`)
  }

  if (lech > 0) {
    console.error(`\n❌ AT-14 KHÔNG ĐẠT — ${lech} bảng lệch số dòng.`)
    process.exitCode = 1
  } else {
    console.log(`\n✅ AT-14 ĐẠT — ${tong} dòng, mọi bảng khớp 100%.`)
  }
}

await main()
