/**
 * WORKER — lời nhắc hoa cúc (§9.2, §12 `WEEK_FLOWER_NUDGE`).
 *
 * Chỉ có MỘT việc: mỗi giờ, xem có ai đang ở mốc "còn một ngày nữa là hoa nở đủ"
 * không, và nếu có thì đẩy đúng một thông báo.
 *
 * Ba luật của §9.2 mà file này phải giữ:
 *   · Chỉ thúc khi SẮP ĐẠT (4/7 cánh). Tuần đã hỏng thì im lặng hoàn toàn.
 *   · Mỗi tuần đúng MỘT lần — khoá chống trùng `NUDGE-WK-{user}-{yyyyww}`.
 *   · Không có streak, không có con số nào để mất.
 *
 * Dùng LẠI `nhipTuan()` của app chứ không chép logic sang đây. Hai bản cùng một
 * quy tắc là hai bản sẽ trôi khỏi nhau, và lúc đó không ai biết bản nào đúng.
 */

import { nhipTuan, gioNhacTu, dauTuan } from '../web/src/shared/domain/hoa-cuc'
import { ngayLocal, homNay, type NgayLocal } from '../web/src/shared/domain/chu-ky'
import { gioVN } from '../web/src/shared/domain/bau-troi'
// Ký VAPID nằm ở shared/domain vì ở đó nó chạy được dưới vitest. Mã mật sai một
// chi tiết là server đẩy trả 401 không nói lý do, cron im lặng mỗi giờ, không ai
// biết cho tới lúc nhận ra cả tháng không có lời nhắc — thứ hỏng âm thầm bắt
// buộc phải có test.
import { kyVapid } from '../web/src/shared/domain/vapid'

type Env = {
  ASSETS: { fetch: (req: Request) => Promise<Response> }
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  VAPID_CONG_KHAI: string
  VAPID_RIENG_TU: string
}

/** Giờ nhắc mặc định — H2 chốt 21:00 giờ VN (23/08/2026). */

/* ── Gửi một thông báo ─────────────────────────────────────────────────────── */

/**
 * Đẩy KHÔNG kèm nội dung.
 *
 * Web Push cho phép gửi gói rỗng — trình duyệt vẫn đánh thức service worker, và
 * service worker tự hiện câu chữ. Nhờ vậy bỏ được toàn bộ phần mã hoá aes128gcm,
 * thứ chiếm phần lớn độ phức tạp của Web Push.
 *
 * Làm được vì §9.2 chốt lời nhắc chỉ có ĐÚNG MỘT câu, và Worker đã quyết định
 * "khi nào" rồi — service worker chỉ cần biết "có" chứ không cần biết "gì".
 *
 * Trả `false` khi endpoint đã chết (404/410) để tầng gọi đánh dấu `dead`.
 */
async function day(endpoint: string, env: Env): Promise<'ok' | 'chet' | 'loi'> {
  const jwt = await kyVapid(endpoint, env.VAPID_CONG_KHAI, env.VAPID_RIENG_TU)
  const r = await fetch(endpoint, {
    method: 'POST',
    headers: {
      TTL: '86400',
      Authorization: `vapid t=${jwt}, k=${env.VAPID_CONG_KHAI}`,
      'Content-Length': '0',
    },
  })
  if (r.ok) return 'ok'
  // 404/410 = người dùng gỡ app hoặc subscription hết hạn. iOS làm chuyện này âm
  // thầm, nên phải dọn chứ không thử lại mãi.
  return r.status === 404 || r.status === 410 ? 'chet' : 'loi'
}

/* ── Đọc Supabase ──────────────────────────────────────────────────────────── */

async function hoi<T>(env: Env, duong: string): Promise<T> {
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/${duong}`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  })
  if (!r.ok) throw new Error(`Supabase ${duong}: ${r.status} ${await r.text()}`)
  return r.json() as Promise<T>
}

/** Tuần ISO dạng `yyyyww` — thành phần của khoá chống trùng (§12). */
function tuanIso(d: NgayLocal): string {
  const t = new Date(`${d}T00:00:00Z`)
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7))
  const dauNam = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  const tuan = Math.ceil(((t.getTime() - dauNam.getTime()) / 86400000 + 1) / 7)
  return `${t.getUTCFullYear()}${String(tuan).padStart(2, '0')}`
}

/* ── Lịch chạy ─────────────────────────────────────────────────────────────── */

export default {
  /**
   * Trả file tĩnh về cho binding ASSETS.
   *
   * Trước khi có cron, Worker này không có `main` nên Cloudflare tự phục vụ file.
   * Thêm `main` vào thì mọi request không khớp file tĩnh rơi thẳng vào đây — không
   * có hàm này là app trắng màn ngay sau lần deploy kế tiếp.
   */
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    if (url.pathname === '/api/ingest' && req.method === 'POST') {
      try {
        const body = (await req.json()) as {
          userId: string
          soTien: number
          danhMucId?: string
          ghiChu?: string
        }
        if (!body.userId || !body.soTien || body.soTien <= 0) {
          return new Response(JSON.stringify({ error: 'Thiếu userId hoặc soTien không hợp lệ' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        // Lấy chu kỳ đang chạy của user
        const ck = await hoi<{ id: string }[]>(
          env,
          `chu_ky?select=id&user_id=eq.${body.userId}&trang_thai=eq.dang_chay&limit=1`,
        )
        const chuKyId = ck[0]?.id
        if (!chuKyId) {
          return new Response(JSON.stringify({ error: 'Không tìm thấy chu kỳ đang chạy' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const nay = homNay()
        const r = await fetch(`${env.SUPABASE_URL}/rest/v1/giao_dich`, {
          method: 'POST',
          headers: {
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify({
            user_id: body.userId,
            chu_ky_id: chuKyId,
            danh_muc_id: body.danhMucId || null,
            so_tien: body.soTien,
            ngay_local: nay,
            loai: 'chi',
            ghi_chu: body.ghiChu || '[Worker Ingest API]',
            trang_thai: 'hoan_tat',
          }),
        })

        if (!r.ok) {
          return new Response(await r.text(), { status: r.status })
        }

        const data = await r.json()
        return new Response(JSON.stringify({ thanhCong: true, data }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (e) {
        return new Response(
          JSON.stringify({ error: e instanceof Error ? e.message : 'Lỗi xử lý ingest' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }
    }

    return env.ASSETS.fetch(req)
  },

  /**
   * Chạy MỖI GIỜ, không phải mỗi ngày một lần.
   *
   * §14 quy ước 2: cron khai báo bằng UTC, mà bồ đổi được giờ nhắc. Chạy mỗi giờ
   * rồi tự lọc theo giờ Việt Nam là cách duy nhất tôn trọng được cả hai — cắm
   * cứng một mốc UTC thì đổi giờ nhắc sẽ không có tác dụng.
   */
  async scheduled(_ctl: ScheduledController, env: Env): Promise<void> {
    const gio = gioVN()
    const nay = homNay()
    const tuan = tuanIso(nay)

    const subs = await hoi<{ id: string; user_id: string; endpoint: string }[]>(
      env,
      'push_subscription?select=id,user_id,endpoint&trang_thai=eq.active',
    )
    if (subs.length === 0) return

    const theoNguoi = new Map<string, typeof subs>()
    for (const s of subs) theoNguoi.set(s.user_id, [...(theoNguoi.get(s.user_id) ?? []), s])

    for (const [userId, cua] of theoNguoi) {
      // Giờ nhắc của riêng người này, mặc định 21:00 (H2).
      const ch = await hoi<{ gia_tri: unknown }[]>(
        env,
        `cau_hinh?select=gia_tri&user_id=eq.${userId}&khoa=eq.gio_nhac`,
      )
      // `gioNhacTu` chứ không kiểm `typeof === 'number'`: cột `gia_tri` là jsonb
      // và seed ghi vào CHUỖI "21:00", nên phép kiểm kiểu số luôn trượt và giờ
      // nhắc của bồ bị bỏ qua hoàn toàn. Hỏng im lặng suốt từ Pha 4 — cron vẫn
      // chạy, thông báo vẫn tới, chỉ là sai giờ mãi mà không ai biết vì sao.
      const gioNhac = gioNhacTu(ch[0]?.gia_tri)
      if (gio !== gioNhac) continue

      // Khoá chống trùng: mỗi tuần đúng một lần (§12).
      const ma = `NUDGE-WK-${userId}-${tuan}`
      const daGui = await hoi<unknown[]>(
        env,
        `su_kien?select=id&ma=eq.WEEK_FLOWER_NUDGE&doi_tuong=eq.${ma}&limit=1`,
      )
      if (daGui.length > 0) continue

      // Lọc từ ĐẦU TUẦN trở đi. Không lọc thì mỗi lượt cron kéo về toàn bộ lịch
      // sử giao dịch, và khi vượt trần 1000 dòng của PostgREST thì chính những
      // ngày MỚI NHẤT bị cắt mất — nhịp tuần tính ra thiếu cánh, app im lặng
      // không nhắc đúng lúc cần nhắc nhất. Hỏng dần theo thời gian, không hỏng
      // ngay, nên càng khó lần ra.
      const dau = dauTuan(nay)
      const gd = await hoi<{ ngay_local: string }[]>(
        env,
        `giao_dich?select=ngay_local&user_id=eq.${userId}&trang_thai=neq.da_huy` +
          `&ngay_local=gte.${dau}`,
      )
      const nhip = nhipTuan(
        gd.map((g) => ngayLocal(g.ngay_local)),
        nay,
      )
      // Đây là toàn bộ quyết định "có nhắc hay không" — và nó nằm trong hàm dùng
      // chung với app, nên màn hình và thông báo không bao giờ nói khác nhau.
      if (!nhip.nenThucDay) continue

      for (const s of cua) {
        const kq = await day(s.endpoint, env)
        if (kq === 'chet') {
          await fetch(`${env.SUPABASE_URL}/rest/v1/push_subscription?id=eq.${s.id}`, {
            method: 'PATCH',
            headers: {
              apikey: env.SUPABASE_SERVICE_ROLE_KEY,
              Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ trang_thai: 'dead' }),
          })
        }
      }

      // Ghi sự kiện SAU khi gửi, và ghi dù có endpoint nào hỏng: mục đích của nó
      // là chống gửi lại trong tuần, không phải ghi nhận thành công.
      await fetch(`${env.SUPABASE_URL}/rest/v1/su_kien`, {
        method: 'POST',
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          ma: 'WEEK_FLOWER_NUDGE',
          doi_tuong: ma,
          du_lieu: { da_ghi: nhip.daGhi, con_lai: nhip.conLai },
        }),
      })
    }
  },
}
