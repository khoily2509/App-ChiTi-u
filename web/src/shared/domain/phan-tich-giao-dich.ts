import { dong, type Dong as Tien } from './tien'

/**
 * PHÂN TÍCH TIN NHẮN GIAO DỊCH / SMS / MOMO / VIETQR (§8.1, §8.2 · Pha 8).
 *
 * Nhận chuỗi văn bản tự do (SMS ngân hàng VCB/Techcom/MB/ACB, thông báo Momo,
 * ZaloPay, VietQR, hoá đơn…) và trích xuất:
 * 1. Số tiền (VND, đ, k, nghìn)
 * 2. Tên đối tác / Mô tả
 * 3. Gợi ý danh mục dựa trên từ khoá
 */

export type KetQuaPhanTich = {
  soTien: Tien
  moTa: string
  tuKhoaGoiY: string | null
  danhMucGoiY: 'an_uong' | 'di_lai' | 'mua_sam' | 'nha_cua' | 'y_te' | 'khac'
  doChinhXac: number // 0..100%
}

const TU_KHOA_DANH_MUC: Record<
  'an_uong' | 'di_lai' | 'mua_sam' | 'nha_cua' | 'y_te',
  string[]
> = {
  an_uong: [
    'cafe', 'cà phê', 'highlands', 'coffee', 'starbucks', 'phở', 'bún', 'cơm',
    'bánh mì', 'trà sữa', 'kfc', 'lotteria', 'mcdonalds', 'phúc long', 'gong cha',
    'shopeefood', 'grabfood', 'befood', 'gs25', 'circle k', '7-eleven', 'family mart',
    'winmart', 'coopmart', 'bách hoá xanh', 'quan an', 'quán ăn', 'nhà hàng', 'food',
  ],
  di_lai: [
    'grab', 'be', 'xanh sm', 'gojek', 'taxi', 'xăng', 'petrolimex', 'gửi xe',
    'vé xe', 'vé tàu', 'vé máy bay', 'vietnam airlines', 'vietjet', 'toll', 'epass',
    'vetc', 'mai linh',
  ],
  mua_sam: [
    'shopee', 'lazada', 'tiki', 'tiktok shop', 'zara', 'uniqlo', 'quần áo',
    'mĩ phẩm', 'mỹ phẩm', 'thời trang', 'watson', 'guardian', 'hasaki', 'dien may xanh',
    'the gioi di dong', 'fpt shop', 'cellphones',
  ],
  nha_cua: [
    'tiền điện', 'evn', 'tiền nước', 'cấp nước', 'internet', 'viettel', 'fpt telecom',
    'vnpt', 'netflix', 'spotify', 'youtube', 'icloud', 'chung cư', 'phí quản lý',
  ],
  y_te: [
    'nhà thuốc', 'long châu', 'an khang', 'pharmacity', 'bệnh viện', 'phòng khám',
    'thuốc', 'khám bệnh', 'nha khoa',
  ],
}

export function boDau(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

/** Trích xuất số tiền từ văn bản */
export function trichXuatSoTien(raw: string): Tien {
  const lower = raw.toLowerCase()

  // 1. Mẫu có chữ k: 45k, 120k, 35.5k
  const matchK = lower.match(/(\d+(?:[.,]\d+)?)\s*k(?!\w)/)
  if (matchK && matchK[1]) {
    const val = parseFloat(matchK[1].replace(',', '.')) * 1000
    if (val > 0) return dong(Math.round(val))
  }

  // 2. Mẫu có dấu trừ: -45,000VND | - 150.000 đ | -45000
  const matchMinus = lower.match(/-\s*(\d{1,3}(?:[.,]\d{3})+|\d{4,9})\s*(?:vnd|vnđ|d|đ|dong|đồng)?/)
  if (matchMinus && matchMinus[1]) {
    const cleanNum = matchMinus[1].replace(/[.,]/g, '')
    const val = parseInt(cleanNum, 10)
    if (val > 0) return dong(val)
  }

  // 3. Mẫu có từ khoá tiền tệ rõ ràng: 45.000 vnd | 35,000 đ | thanh toan 50.000
  const matchExplicit = lower.match(
    /(?:chi|tt|thanh toan|giao dich|so tien|gd)[\s:]+(\d{1,3}(?:[.,]\d{3})+|\d{4,9})\s*(?:vnd|vnđ|d|đ|dong|đồng)?/,
  )
  if (matchExplicit && matchExplicit[1]) {
    const cleanNum = matchExplicit[1].replace(/[.,]/g, '')
    const val = parseInt(cleanNum, 10)
    if (val > 0) return dong(val)
  }

  // 4. Mẫu có đơn vị tiền đứng sau: 45.000đ | 120,000 VND
  const matchCurrency = lower.match(/(\d{1,3}(?:[.,]\d{3})+|\d{4,9})\s*(?:vnd|vnđ|d|đ|dong|đồng)(?!\w)/)
  if (matchCurrency && matchCurrency[1]) {
    const cleanNum = matchCurrency[1].replace(/[.,]/g, '')
    const val = parseInt(cleanNum, 10)
    if (val > 0) return dong(val)
  }

  // 5. Fallback: số có định dạng hàng nghìn 45.000 hoặc 150,000
  const matchFormatted = lower.match(/(\d{1,3}(?:[.,]\d{3})+)/)
  if (matchFormatted && matchFormatted[1]) {
    const cleanNum = matchFormatted[1].replace(/[.,]/g, '')
    const val = parseInt(cleanNum, 10)
    if (val >= 1000) return dong(val)
  }

  return dong(0)
}

/** Gợi ý danh mục dựa trên từ khoá xuất hiện trong văn bản */
export function doanDanhMuc(raw: string): {
  danhMuc: 'an_uong' | 'di_lai' | 'mua_sam' | 'nha_cua' | 'y_te' | 'khac'
  tuKhoa: string | null
} {
  const lower = raw.toLowerCase()
  const unaccented = boDau(raw)

  for (const [dm, keywords] of Object.entries(TU_KHOA_DANH_MUC) as [
    'an_uong' | 'di_lai' | 'mua_sam' | 'nha_cua' | 'y_te',
    string[],
  ][]) {
    for (const kw of keywords) {
      const kwUnaccent = boDau(kw)
      if (lower.includes(kw) || unaccented.includes(kwUnaccent)) {
        return { danhMuc: dm, tuKhoa: kw }
      }
    }
  }

  return { danhMuc: 'khac', tuKhoa: null }
}

/** Phân tích toàn diện văn bản tin nhắn */
export function phanTichTinNhanGiaoDich(raw: string): KetQuaPhanTich {
  const text = raw.trim()
  if (!text) {
    return {
      soTien: dong(0),
      moTa: '',
      tuKhoaGoiY: null,
      danhMucGoiY: 'khac',
      doChinhXac: 0,
    }
  }

  const soTien = trichXuatSoTien(text)
  const { danhMuc, tuKhoa } = doanDanhMuc(text)

  // Trích xuất mô tả ngắn gọn (lấy tối đa 50 ký tự hoặc dòng đầu)
  const dongDau = text.split('\n')[0] ?? text
  const moTa = dongDau.slice(0, 60)

  let doChinhXac = 30
  if (soTien > 0) doChinhXac += 40
  if (tuKhoa) doChinhXac += 30

  return {
    soTien,
    moTa,
    tuKhoaGoiY: tuKhoa,
    danhMucGoiY: danhMuc,
    doChinhXac,
  }
}
