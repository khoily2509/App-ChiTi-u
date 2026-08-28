import { describe, it, expect } from 'vitest'
import {
  slotConTrong,
  loiCuaTen,
  doiMocHieuLuc,
  choManChinh,
  choTrongManChinh,
  SLOT_TOI_DA,
  O_MAN_CHINH,
  TEN_TOI_DA,
} from './danh-muc'

describe('slotConTrong() — trần cứng sáu danh mục', () => {
  it('tài khoản mới seed 5 danh mục ⇒ còn slot 6', () => {
    expect(slotConTrong([1, 2, 3, 4, 5, null])).toBe(6)
  })

  it('sáu danh mục CHƯA phải là đủ — trần nới lên 10 ngày 27/08/2026', () => {
    expect(slotConTrong([1, 2, 3, 4, 5, 6])).toBe(7)
  })

  it('đủ mười ⇒ null, UI phải giấu nút thêm đi', () => {
    expect(slotConTrong([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toBeNull()
  })

  it('lấy slot trống NHỎ NHẤT, không phải slot kế tiếp', () => {
    // Bồ ẩn "Giải trí" (slot 3) rồi thêm mới ⇒ phải lấp lại chỗ 3
    expect(slotConTrong([1, 2, 4, 5, 6])).toBe(3)
  })

  it('danh mục hệ thống (slot null) không chiếm chỗ', () => {
    expect(slotConTrong([null, null, null])).toBe(1)
  })

  it('không bao giờ trả quá 6 — DB cũng chặn, nhưng UI không nên bày ra rồi mới hỏng', () => {
    expect(slotConTrong([])).toBeLessThanOrEqual(SLOT_TOI_DA)
  })
})

describe('loiCuaTen()', () => {
  it('tên trống, hoặc chỉ toàn khoảng trắng', () => {
    expect(loiCuaTen('', [])).toMatch(/tên/i)
    expect(loiCuaTen('   ', [])).toMatch(/tên/i)
  })

  it('tên vừa đủ dài thì qua, dài hơn một chữ thì không', () => {
    expect(loiCuaTen('x'.repeat(TEN_TOI_DA), [])).toBeNull()
    expect(loiCuaTen('x'.repeat(TEN_TOI_DA + 1), [])).toMatch(/dài/i)
  })

  it('trùng tên bị chặn, KỂ CẢ khi khác hoa thường', () => {
    expect(loiCuaTen('Sức khoẻ', ['Sức khoẻ'])).toMatch(/đã có/i)
    expect(loiCuaTen('sức khoẻ', ['Sức Khoẻ'])).toMatch(/đã có/i)
    expect(loiCuaTen('  Sức khoẻ  ', ['Sức khoẻ'])).toMatch(/đã có/i)
  })

  it('tên tiếng Việt có dấu vẫn đếm đúng số chữ', () => {
    // 10 ký tự, không phải 10 byte — nếu đếm byte thì tiếng Việt luôn bị coi là dài
    expect(loiCuaTen('Sức khoẻ ạ', [])).toBeNull()
  })

  it('tên khác thì qua', () => {
    expect(loiCuaTen('Sức khoẻ', ['Sinh hoạt', 'Giải trí'])).toBeNull()
  })
})

describe('doiMocHieuLuc() — §7.1 ràng buộc 2', () => {
  it('đổi định nghĩa ⇒ phải dời mốc hiệu lực', () => {
    expect(doiMocHieuLuc('Học, sách', 'Học, sách, khoá học')).toBe(true)
  })

  it('không đổi ⇒ giữ nguyên mốc, không được tự dời', () => {
    // Dời mốc khi không có gì đổi sẽ đẻ ra cảnh báo "định nghĩa đã đổi" giả,
    // và cảnh báo giả lặp lại vài lần là bồ ngừng đọc cảnh báo thật.
    expect(doiMocHieuLuc('Học, sách', 'Học, sách')).toBe(false)
    expect(doiMocHieuLuc('Học, sách', '  Học, sách  ')).toBe(false)
  })

  it('xoá trắng định nghĩa cũng là một lần đổi', () => {
    expect(doiMocHieuLuc('Học, sách', '')).toBe(true)
  })
})

describe('choManChinh() — lưới ghi nhanh chỉ có sáu ô', () => {
  const dm = (ten: string, hien: boolean) => ({ ten, hienManChinh: hien })

  it('chỉ lấy cái được bật', () => {
    const ds = [dm('a', true), dm('b', false), dm('c', true)]
    expect(choManChinh(ds).map((d) => d.ten)).toEqual(['a', 'c'])
  })

  it('giữ nguyên thứ tự truyền vào', () => {
    const ds = [dm('c', true), dm('a', true), dm('b', true)]
    expect(choManChinh(ds).map((d) => d.ten)).toEqual(['c', 'a', 'b'])
  })

  it('CẮT ở sáu kể cả khi DB bật nhiều hơn', () => {
    // Cờ nằm ở DB nên có thể bật quá sáu bằng đường khác — SQL tay, script, hai
    // máy sửa cùng lúc. Không cắt ở đây thì lưới vỡ bố cục thay vì hiện ít đi.
    const ds = Array.from({ length: 10 }, (_, i) => dm(String(i), true))
    expect(choManChinh(ds)).toHaveLength(O_MAN_CHINH)
    expect(choManChinh(ds).map((d) => d.ten)).toEqual(['0', '1', '2', '3', '4', '5'])
  })

  it('không bật cái nào ⇒ lưới rỗng, không nổ', () => {
    expect(choManChinh([dm('a', false)])).toEqual([])
    expect(choManChinh([])).toEqual([])
  })
})

describe('choTrongManChinh()', () => {
  it('chưa đầy thì báo còn mấy chỗ', () => {
    expect(choTrongManChinh(4)).toBe(2)
    expect(choTrongManChinh(0)).toBe(O_MAN_CHINH)
  })

  it('đầy rồi thì 0, và quá đầy cũng 0 chứ không âm', () => {
    expect(choTrongManChinh(6)).toBe(0)
    expect(choTrongManChinh(9)).toBe(0)
  })
})

describe('hai con số trần là HAI thứ khác nhau', () => {
  it('trần danh mục (màu) lớn hơn trần lưới (màn hình)', () => {
    // Nhầm hai cái này là nguồn lỗi: một cái bị chặn bởi bảng màu mù màu, cái kia
    // bị chặn bởi chiều cao màn iPhone 13.
    expect(SLOT_TOI_DA).toBe(10)
    expect(O_MAN_CHINH).toBe(6)
    expect(SLOT_TOI_DA).toBeGreaterThan(O_MAN_CHINH)
  })
})
