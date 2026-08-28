/**
 * KÝ VAPID — chứng minh thông báo đẩy đến từ đúng "Sổ của Bồ" (RFC 8292).
 *
 * Để trong `shared/domain/` chứ không nằm trong `worker/` vì MỘT lý do: ở đây nó
 * chạy được dưới vitest. Đây là mã mật — sai một chi tiết thì server đẩy trả 401
 * mà không nói vì sao, cron im lặng mỗi giờ, và không ai biết cho tới lúc nhận ra
 * cả tháng không có lời nhắc nào. Thứ hỏng âm thầm thì bắt buộc phải có test.
 *
 * Chỉ dùng Web Crypto — cùng một API chạy được ở cả Node lẫn Cloudflare Workers,
 * nên bản chạy test đúng là bản chạy thật.
 */

const enc = new TextEncoder()

export function b64u(b: ArrayBuffer | Uint8Array): string {
  const u = b instanceof Uint8Array ? b : new Uint8Array(b)
  let s = ''
  for (const x of u) s += String.fromCharCode(x)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function tuB64u(s: string): Uint8Array<ArrayBuffer> {
  const chuan = (s + '='.repeat((4 - (s.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(chuan)
  // Khai rõ `Uint8Array<ArrayBuffer>`: Web Crypto đòi bộ đệm gắn với bộ nhớ
  // thường, mà `Uint8Array` trần thì có thể trỏ vào `SharedArrayBuffer`.
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

/**
 * Dựng JWK từ cặp khoá VAPID.
 *
 * `importKey` bắt buộc phải có cả phần công khai x/y kể cả khi chỉ để KÝ — nên
 * phải tách chúng ra từ chuỗi công khai 65 byte dạng điểm không nén
 * (0x04 || X || Y). Thiếu bước này là `importKey` ném lỗi, không phải ký sai.
 */
export function jwkTuKhoa(congKhai: string, riengTu: string): JsonWebKey {
  const ck = tuB64u(congKhai)
  if (ck.length !== 65 || ck[0] !== 4) {
    throw new Error(`Khoá công khai VAPID phải là 65 byte bắt đầu bằng 0x04, nhận ${ck.length}`)
  }
  return {
    kty: 'EC',
    crv: 'P-256',
    d: riengTu,
    x: b64u(ck.slice(1, 33)),
    y: b64u(ck.slice(33, 65)),
    ext: true,
  }
}

/**
 * JWT ES256 cho một endpoint đẩy.
 *
 * `aud` phải là GỐC của endpoint (`https://web.push.apple.com`), KHÔNG phải cả
 * đường dẫn — sai chỗ này thì server đẩy trả 401 và thông báo lỗi không hề gợi ý
 * nguyên nhân.
 */
export async function kyVapid(
  endpoint: string,
  congKhai: string,
  riengTu: string,
  lienHe = 'mailto:khoily2509@gmail.com',
  bayGio: number = Date.now(),
): Promise<string> {
  const than = {
    aud: new URL(endpoint).origin,
    // 12 giờ: đủ dài để một lượt cron dùng lại, đủ ngắn để lộ ra cũng vô hại sớm.
    exp: Math.floor(bayGio / 1000) + 12 * 3600,
    sub: lienHe,
  }
  const phan = `${b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))}.${b64u(
    enc.encode(JSON.stringify(than)),
  )}`

  const khoa = await crypto.subtle.importKey(
    'jwk',
    jwkTuKhoa(congKhai, riengTu),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )
  const chuKy = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    khoa,
    enc.encode(phan),
  )
  return `${phan}.${b64u(chuKy)}`
}

/** Dùng trong test — kiểm chữ ký bằng chính khoá công khai. */
export async function kiemVapid(jwt: string, congKhai: string): Promise<boolean> {
  const [d, t, c] = jwt.split('.')
  if (!d || !t || !c) return false
  const ck = tuB64u(congKhai)
  const khoa = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', x: b64u(ck.slice(1, 33)), y: b64u(ck.slice(33, 65)), ext: true },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify'],
  )
  return crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    khoa,
    tuB64u(c),
    enc.encode(`${d}.${t}`),
  )
}
