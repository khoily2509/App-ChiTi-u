import { describe, it, expect } from 'vitest'
import { bocLoi, nemNeuLoi } from './supabase'

/**
 * Hai hàm này quyết định "hỏng thì có LỘ RA không" cho toàn bộ tầng dữ liệu, mà
 * suốt từ Pha 0 tới 28/08/2026 chúng không có một test nào. Cái giá đã trả: đổi
 * ngày lương báo đỏ suốt một ngày trên bản chạy thật, trong khi database làm
 * đúng — chỉ vì `bocLoi` coi `data: null` là hỏng, còn hàm SQL `returns void`
 * thì LUÔN trả null.
 */

describe('bocLoi() — ném khi hỏng, trả dữ liệu khi xong', () => {
  it('có dữ liệu thì trả thẳng ra', () => {
    expect(bocLoi({ data: { id: 'TXN-1' }, error: null }, 'Đọc')).toEqual({ id: 'TXN-1' })
  })

  it('mảng rỗng KHÔNG phải là hỏng — truy vấn không khớp dòng nào là chuyện thường', () => {
    expect(bocLoi({ data: [], error: null }, 'Đọc')).toEqual([])
  })

  it('số 0 và chuỗi rỗng cũng không phải hỏng', () => {
    // Chặn theo `=== null` chứ không theo giá trị falsy. Chặn falsy thì một hạn
    // mức 0đ hay một ghi chú rỗng sẽ bị coi là lỗi mạng.
    expect(bocLoi({ data: 0, error: null }, 'Đọc')).toBe(0)
    expect(bocLoi({ data: '', error: null }, 'Đọc')).toBe('')
  })

  it('có error thì ném, kèm cả việc đang làm lẫn lời của Postgres', () => {
    expect(() => bocLoi({ data: null, error: { message: 'duplicate key' } }, 'Thêm danh mục')).toThrow(
      /Thêm danh mục: duplicate key/,
    )
  })

  it('error không có message vẫn ném chứ không nuốt', () => {
    expect(() => bocLoi({ data: null, error: { code: '23505' } }, 'Ghi')).toThrow(/Ghi:/)
  })

  it('data null mà không có error ⇒ VẪN ném — đây là lưới an toàn của §13', () => {
    // Giữ nguyên hành vi này. Một lệnh ghi trả null lặng lẽ là cách nhanh nhất
    // để một khoản chi biến mất mà không ai biết (S3).
    expect(() => bocLoi({ data: null, error: null }, 'Ghi giao dịch')).toThrow(
      /không có dữ liệu trả về/,
    )
  })
})

describe('nemNeuLoi() — cho những chỗ null là kết quả ĐÚNG', () => {
  it('hàm SQL returns void trả null ⇒ KHÔNG được ném', () => {
    // Đúng ca đã làm hỏng đổi ngày lương: PostgREST trả 204 không thân,
    // supabase-js dịch thành { data: null, error: null }.
    expect(() => nemNeuLoi({ error: null }, 'Dời ranh giới chu kỳ')).not.toThrow()
  })

  it('nhánh không-làm-gì cũng không được ném', () => {
    // `doiTruoc()` khi chưa có chu kỳ trước — chu kỳ đầu tiên của bồ.
    expect(() => nemNeuLoi({ data: null, error: null }, 'Co chu kỳ trước')).not.toThrow()
  })

  it('nhưng có error thật thì vẫn phải ném', () => {
    expect(() =>
      nemNeuLoi({ error: { message: 'exclusion violation' } }, 'Dời ranh giới chu kỳ'),
    ).toThrow(/Dời ranh giới chu kỳ: exclusion violation/)
  })

  it('không nuốt lỗi kể cả khi error là chuỗi trần', () => {
    expect(() => nemNeuLoi({ error: 'hỏng' }, 'Ghi')).toThrow(/Ghi:/)
  })
})
