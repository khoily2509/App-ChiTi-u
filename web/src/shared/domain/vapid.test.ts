import { describe, it, expect } from 'vitest'
import { kyVapid, kiemVapid, jwkTuKhoa, b64u, tuB64u } from './vapid'

/** Đúng cặp khoá đang chạy thật, lấy từ .env — công khai được theo thiết kế. */
const CONG_KHAI =
  'BOCzI3mUgF3ek4bcTX_Tl9PgPdttk-dkaWnu3vlX_zkZxq5WVYbymfWzMlzKnh8kbKX8do6bqMeyijLM56QdFGk'

/** Sinh một cặp mới để test — không cần khoá riêng thật nằm trong repo. */
async function capKhoa(): Promise<{ congKhai: string; riengTu: string }> {
  const c = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
    'verify',
  ])
  const pub = (await crypto.subtle.exportKey('jwk', c.publicKey)) as {
    x: string
    y: string
  }
  const priv = (await crypto.subtle.exportKey('jwk', c.privateKey)) as { d: string }
  const raw = new Uint8Array(65)
  raw[0] = 4
  raw.set(tuB64u(pub.x), 1)
  raw.set(tuB64u(pub.y), 33)
  return { congKhai: b64u(raw), riengTu: priv.d }
}

const APPLE = 'https://web.push.apple.com/ABC123/xyz'

describe('jwkTuKhoa() — chặn khoá sai dạng trước khi crypto ném lỗi khó hiểu', () => {
  it('khoá công khai đúng 65 byte, bắt đầu 0x04', () => {
    const j = jwkTuKhoa(CONG_KHAI, 'x'.repeat(43))
    expect(j.crv).toBe('P-256')
    // x và y mỗi cái 32 byte ⇒ 43 ký tự base64url
    expect(j.x).toHaveLength(43)
    expect(j.y).toHaveLength(43)
  })

  it('từ chối khoá không phải điểm không nén', () => {
    expect(() => jwkTuKhoa(b64u(new Uint8Array(64)), 'd')).toThrow(/65 byte/)
    // Đúng độ dài nhưng sai byte đầu — đây là ca dễ lọt nhất
    const sai = new Uint8Array(65)
    sai[0] = 2
    expect(() => jwkTuKhoa(b64u(sai), 'd')).toThrow(/0x04/)
  })
})

describe('kyVapid() — chữ ký phải kiểm được bằng chính khoá công khai', () => {
  it('ký rồi kiểm lại thành công', async () => {
    const k = await capKhoa()
    const jwt = await kyVapid(APPLE, k.congKhai, k.riengTu)
    expect(await kiemVapid(jwt, k.congKhai)).toBe(true)
  })

  it('khoá công khai KHÁC thì kiểm phải trượt', async () => {
    const a = await capKhoa()
    const b = await capKhoa()
    const jwt = await kyVapid(APPLE, a.congKhai, a.riengTu)
    expect(await kiemVapid(jwt, b.congKhai)).toBe(false)
  })

  it('sửa một ký tự trong thân thì chữ ký hỏng', async () => {
    const k = await capKhoa()
    const jwt = await kyVapid(APPLE, k.congKhai, k.riengTu)
    const [d, t, c] = jwt.split('.') as [string, string, string]
    const hong = `${d}.${t.slice(0, -1)}${t.slice(-1) === 'A' ? 'B' : 'A'}.${c}`
    expect(await kiemVapid(hong, k.congKhai)).toBe(false)
  })
})

describe('nội dung JWT — mấy chỗ sai là server đẩy trả 401 không nói lý do', () => {
  // Dùng lại `tuB64u` của chính module: bản đầu tôi tự viết phép đệm base64 ở
  // đây và đệm sai, làm 4 test đỏ vì lỗi của TEST chứ không phải của code ký.
  const doc = (jwt: string) =>
    JSON.parse(new TextDecoder().decode(tuB64u(jwt.split('.')[1]!))) as Record<string, unknown>

  it('aud là GỐC của endpoint, KHÔNG phải cả đường dẫn', async () => {
    const k = await capKhoa()
    const jwt = await kyVapid(APPLE, k.congKhai, k.riengTu)
    expect(doc(jwt).aud).toBe('https://web.push.apple.com')
    expect(doc(jwt).aud).not.toContain('ABC123')
  })

  it('mỗi nhà cung cấp một aud riêng', async () => {
    const k = await capKhoa()
    const g = await kyVapid('https://fcm.googleapis.com/fcm/send/xyz', k.congKhai, k.riengTu)
    expect(doc(g).aud).toBe('https://fcm.googleapis.com')
  })

  it('sub phải là mailto: — RFC 8292 bắt buộc', async () => {
    const k = await capKhoa()
    const jwt = await kyVapid(APPLE, k.congKhai, k.riengTu)
    expect(String(doc(jwt).sub)).toMatch(/^mailto:/)
  })

  it('hạn 12 giờ, không quá 24 giờ như RFC giới hạn', async () => {
    const k = await capKhoa()
    const moc = 1_787_000_000_000
    const jwt = await kyVapid(APPLE, k.congKhai, k.riengTu, undefined, moc)
    const exp = Number(doc(jwt).exp)
    expect(exp - Math.floor(moc / 1000)).toBe(12 * 3600)
    expect(exp - Math.floor(moc / 1000)).toBeLessThan(24 * 3600)
  })

  it('phần đầu khai đúng ES256', async () => {
    const k = await capKhoa()
    const jwt = await kyVapid(APPLE, k.congKhai, k.riengTu)
    const dau = JSON.parse(new TextDecoder().decode(tuB64u(jwt.split('.')[0]!)))
    expect(dau).toEqual({ typ: 'JWT', alg: 'ES256' })
  })
})

describe('b64u() — base64url, không phải base64 thường', () => {
  it('không có +, / hay dấu = ở cuối', async () => {
    for (let i = 0; i < 40; i++) {
      const r = crypto.getRandomValues(new Uint8Array(i + 1))
      expect(b64u(r)).not.toMatch(/[+/=]/)
    }
  })

  it('khoá thật đi qua vẫn nguyên vẹn', () => {
    expect(CONG_KHAI).not.toMatch(/[+/=]/)
    expect(CONG_KHAI).toHaveLength(87)
  })
})
