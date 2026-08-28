#!/usr/bin/env bash
#
# GIẢI MÃ BẢN SAO LƯU TẢI VỀ TỪ GITHUB — cặp đôi của bước "Mã hoá bản dump"
# trong .github/workflows/sao-luu.yml.
#
# Vì sao có file này thay vì bảo nhau nhớ lệnh: lúc cần dùng tới nó là lúc DB
# vừa hỏng, và đó là lúc tệ nhất để đi tra cứu tham số openssl. Ba con số dưới
# đây (aes-256-cbc, pbkdf2, 600000) phải khớp CHÍNH XÁC với lúc mã hoá, sai một
# cái là "bad decrypt" mà không nói vì sao.
#
# Bản trên Supabase Storage KHÔNG mã hoá (thùng private), nên không cần script
# này — chỉ bản tải từ GitHub Actions Artifact mới cần.
#
# Cách dùng:
#   MAT_KHAU_SAO_LUU='...' ./scripts/giai-ma-sao-luu.sh sao-luu-12.json.enc
#
# Rồi đưa file .json ra cho:
#   node scripts/restore-from-backup.ts backups/<tên>.json

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Cách dùng: MAT_KHAU_SAO_LUU='...' $0 <file.json.enc>" >&2
  exit 1
fi

vao="$1"
ra="${vao%.enc}"

if [ ! -f "$vao" ]; then
  echo "Không thấy file: $vao" >&2
  exit 1
fi

if [ -z "${MAT_KHAU_SAO_LUU:-}" ]; then
  echo "Thiếu biến MAT_KHAU_SAO_LUU." >&2
  echo "Đây là mật khẩu đã đặt làm GitHub Secret cùng tên." >&2
  echo "Mất nó thì KHÔNG có đường nào lấy lại bản sao lưu này." >&2
  exit 1
fi

if [ -e "$ra" ]; then
  echo "Đã có sẵn $ra — dừng lại để khỏi ghi đè." >&2
  exit 1
fi

# Dọn file dở khi hỏng giữa chừng.
#
# Sai mật khẩu thì openssl ĐÃ kịp tạo file đích rồi mới báo "bad decrypt", và
# `set -e` thoát ngay tại đó nên không có cơ hội dọn. Hậu quả: một file rác nằm
# lại, rồi lần thử sau với mật khẩu ĐÚNG bị chốt chặn ghi đè từ chối — người
# đang phục hồi sẽ tưởng cả mật khẩu đúng cũng không dùng được. Đã vấp thật lúc
# thử script này, đúng vào ca sẽ xảy ra ngày cần dùng tới nó.
trap '[ -e "$ra" ] && [ ! -s "$ra" ] && rm -f "$ra"' EXIT

if ! MAT_KHAU="$MAT_KHAU_SAO_LUU" \
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 \
    -in "$vao" -out "$ra" -pass env:MAT_KHAU 2>/dev/null
then
  rm -f "$ra"
  echo "Giải mã thất bại — gần như chắc chắn là sai mật khẩu." >&2
  echo "Mật khẩu nằm ở GitHub Secret MAT_KHAU_SAO_LUU." >&2
  exit 1
fi

# Kiểm nội dung thật sự là bản sao lưu chứ không phải rác trùng hợp giải ra
# được. `bad decrypt` bắt được hầu hết ca sai mật khẩu, nhưng không phải tất cả.
if ! head -c 200 "$ra" | grep -q '"phien_ban"'; then
  echo "Giải mã xong nhưng nội dung không giống bản sao lưu — kiểm lại mật khẩu." >&2
  rm -f "$ra"
  exit 1
fi

trap - EXIT

echo "Đã giải mã: $ra  ($(wc -c < "$ra") byte)"
echo "Phục hồi bằng: node scripts/restore-from-backup.ts \"$ra\""
