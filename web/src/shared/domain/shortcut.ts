import { dong, type Dong as Tien } from './tien'

/**
 * SIRI SHORTCUT & WEB INTENT URL PARSER (§8.3 · Pha 8).
 *
 * Cho phép Siri Shortcuts / Widget / Share Sheet gọi vào PWA qua URL:
 * ?action=ghi&soTien=35000&danhMuc=an_uong&ghiChu=Pho+bo&tuDong=false
 */

export type ShortcutIntent = {
  action: 'ghi'
  soTien: Tien
  danhMucId?: string | null
  ghiChu?: string | null
  tuDong: boolean
}

export function trichXuatThamSoIntent(search: string): ShortcutIntent | null {
  if (!search) return null

  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const action = params.get('action')

  if (action !== 'ghi') return null

  const rawTien = params.get('soTien') || params.get('tien') || '0'
  const soTienNum = parseInt(rawTien.replace(/\D/g, ''), 10) || 0

  const danhMucId = params.get('danhMucId') || params.get('danhMuc') || params.get('dm')
  const ghiChu = params.get('ghiChu') || params.get('note')
  const tuDong = params.get('tuDong') === 'true' || params.get('auto') === 'true'

  return {
    action: 'ghi',
    soTien: dong(soTienNum),
    danhMucId: danhMucId || null,
    ghiChu: ghiChu || null,
    tuDong,
  }
}

export function taoUrlShortcut(
  baseUrl: string,
  p: { soTien?: number; danhMucId?: string; ghiChu?: string; tuDong?: boolean },
): string {
  const url = new URL(baseUrl)
  url.searchParams.set('action', 'ghi')
  if (p.soTien) url.searchParams.set('soTien', String(p.soTien))
  if (p.danhMucId) url.searchParams.set('danhMucId', p.danhMucId)
  if (p.ghiChu) url.searchParams.set('ghiChu', p.ghiChu)
  if (p.tuDong) url.searchParams.set('tuDong', 'true')

  return url.toString()
}
