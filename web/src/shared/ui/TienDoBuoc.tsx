/**
 * THANH TIẾN ĐỘ cho luồng nhiều bước (lương → để dành → hũ → tổng kết).
 *
 * Có nó thì bồ biết còn mấy bước nữa, nên không bỏ dở giữa chừng vì tưởng luồng
 * dài vô tận. Không có nó, mỗi màn trông như một việc riêng lẻ và bồ dễ thoát ra
 * ngay sau bước đầu.
 *
 * Cố ý KHÔNG bấm được để nhảy bước: đặt hũ cần biết ngân sách, mà ngân sách cần
 * lương và để dành trước đã (§7.2). Nhảy cóc chỉ dẫn tới màn thiếu dữ liệu.
 */
export function TienDoBuoc({ buoc, tong }: { buoc: number; tong: number }) {
  return (
    <div className="mb-5">
      <div className="flex gap-1.5" role="img" aria-label={`Bước ${buoc} trên ${tong}`}>
        {Array.from({ length: tong }, (_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i < buoc ? 'bg-c1' : 'bg-line'
            }`}
          />
        ))}
      </div>
      <div className="text-muted mt-1.5 text-xs">
        Bước {buoc}/{tong}
      </div>
    </div>
  )
}
