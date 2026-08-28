# CLAUDE.md — Dự án `sobo` (Sổ của Bồ)

> **Bộ nhớ dài hạn của dự án.** Đọc hết file này trước khi viết dòng code đầu tiên.
> Khi một quyết định ở đây thay đổi: **sửa file này trước, sửa code sau**, ghi một dòng vào §16.

| | |
|---|---|
| **Phiên bản** | **2.0** — v1.0 đã qua review 18/08/2026, vá 43 lỗ hổng, rút từ 1041 → ~450 dòng |
| **Chủ dự án** | Khôi (người build, mới học lập trình) |
| **Người dùng** | Bồ của Khôi — **một người**, dùng **iPhone**, thu nhập **9–10tr/tháng**, 1 nguồn |
| **Trạng thái code** | **Pha 0, 1, 2 xong** (commit `32c0c5a`, 21/08/2026) — 7 migration, 158 test xanh, `tsc` sạch. Tiếp theo: **Pha 3** (§15) |
| **Bản vẽ UI** | `./mockup-v2-thien-nhien.html` (màu · font · icon · màn ①②⑤) + `./mockup-v3-ba-bau-troi.html` (**nền theo khung giờ**). Hai file BỔ SUNG nhau, v3 không thay v2. Màn ③, ④ **chưa vẽ** (§15) |
| **Địa chỉ app** | **https://app-chi-tieu.khoily2509.workers.dev** — Cloudflare Workers, tự build lại mỗi lần đẩy lên `main`. Cấu hình ở `wrangler.jsonc`; lệnh build khai trong Deploy command trên dashboard |
| **Repo** | https://github.com/khoily2509/App-ChiTi-u (private) |
| **Lịch sử** | Bản v1.0 và tài liệu review 43 lỗ hổng đã bị xoá khỏi cây thư mục ngày 25/08/2026 — cả hai đã được áp dụng hết, và git vẫn giữ nguyên nội dung. Cần tra thì: `git log --diff-filter=D -- REVIEW-CLAUDE-MD.md` |

**Nhãn:** `[YC]` yêu cầu chủ dự án · `[NC]` kết luận nghiên cứu · `[ĐX]` đề xuất đã duyệt ·
`[GĐ]` giả định chưa xác nhận · **`[Pha N]` đã chốt nhưng chưa tới pha đó** ← tìm nhãn này để biết
còn nợ gì. Nhãn `[ĐX?]` của vòng review 18/08 đã rà xong ngày 24/08/2026: cái nào code rồi thì gỡ,
cái nào chưa tới pha thì đổi thành `[Pha N]`.

**Ngôn ngữ:** tên bảng/cột **tiếng Việt không dấu, snake_case** (`giao_dich`, `so_tien`). UI tiếng
Việt có dấu. Giữ tiếng Anh cho event code (`TXN_CONFIRMED`), tiền tố ID (`TXN-`), tên hàm.

---

## 1. MỤC TIÊU

> Web-app cá nhân (PWA) trên iPhone, giúp **một người** ghi chi tiêu trong **dưới 5 giây**, thấy tiền
> đang đi đâu, và **cảm thấy vui khi tiết kiệm** — chứ không cảm thấy bị mắng.

| # | Tiêu chí thành công (đo sau 90 ngày) | Ngưỡng | Cách đo |
|---|---|---|---|
| **S1** | Vẫn còn dùng | ≥ 60/90 ngày có ít nhất 1 giao dịch | truy vấn `giao_dich` |
| **S2** | Ma sát nhập liệu | mở app → lưu xong ≤ 5 giây | `su_kien.duration_ms`, xem p50/p90 ở màn Khác |
| **S3** | Không mất dữ liệu | 0 sự cố mất / trùng bản ghi | audit log + acceptance test |

**Dự án không thất bại vì thiếu tính năng.** Nó thất bại vì (a) bồ bỏ dùng sau 2 tuần, hoặc (b) dữ
liệu mất/trùng nên không còn tin được. Mọi quyết định phục vụ S1–S3 trước. `[NC]`

**Ngoài phạm vi (chốt cứng):** đa người dùng · API ngân hàng/Momo (§4.2) · App Store (§4.3) · giữ
hoặc chuyển tiền · nhập lại chi tiêu quá khứ (§7.7) · bot email ngân hàng (ngân hàng của bồ không gửi).

---

## 2. RÀNG BUỘC

| Ràng buộc | Giá trị | Hệ quả |
|---|---|---|
| Ngân sách | **< 50 USD tổng** | Chỉ free tier + tối đa 1 tên miền |
| Thiết bị | **iPhone** | Không đọc được thông báo app khác (§4.2) |
| Người build | Mới học lập trình | Stack ít khái niệm, tài liệu phổ biến |
| Người dùng | 1 người, không rành kỹ thuật | Không được có bước "gia hạn chứng chỉ mỗi 7 ngày" |
| Thu nhập của bồ | 9–10tr/tháng | **Mọi ngưỡng tiền neo theo % thu nhập**, không neo số cứng |

**Nấc nghiêm ngặt (SA/BA).** Nấc cơ bản ✅. **+1 có dòng tiền ⚠️ áp dụng một phần** — app *ghi nhận*
chứ không *chuyển* tiền, nhưng vẫn bắt buộc: snapshot bất biến khi đóng chu kỳ · fail closed (nhập tự
động không bao giờ tự xác nhận) · audit trail (không xoá cứng) · người xác nhận khi trừ quỹ.
**+1 dữ liệu chịu quy định ❌** — nhưng vẫn: HTTPS bắt buộc, không log số tiền ra console production,
không đưa service key vào client.

---

## 3. QUY MÔ — VÌ SAO KHÔNG CẦN LO HIỆU NĂNG

~7 giao dịch/ngày ⇒ `giao_dich` ~2.500 dòng/năm · `su_kien` ~7.600 · các bảng khác < 500.
**~10.000 dòng/năm · < 30 MB sau 10 năm · ~150 năm mới chạm trần Supabase free.** `[NC]`

⇒ Tiêu chí chọn hạ tầng **không phải hiệu năng**, mà là: (1) không tự tắt, (2) sao lưu được,
(3) dễ cho người mới học. **Không có bảng nào vỡ trước.**

---

## 4. QUYẾT ĐỊNH NỀN TẢNG

### 4.1 Bốn đường nhập liệu — thứ tự ưu tiên

| # | Cách | Thao tác | Ghi chú |
|---|---|---|---|
| 1 | **Trong app** — **5 nút danh mục + 1 nút Để dành** → số → Lưu | **3 chạm** | Đường chính, ~80% giao dịch |
| 2 | **Siri** — 6 shortcut riêng: "Hey Siri, ghi sinh hoạt" → đọc số | **0 chạm** | Danh mục nằm trong câu nói. POST thẳng API, không mở app |
| 3 | **Widget / màn khoá / Action Button** | **2 chạm** + gõ | Shortcut mở PWA vào màn nhập với `?cat=sinh-hoat`. Đừng để Shortcuts tự hỏi nhập liệu — nó sẽ bật app Shortcuts lên |
| 4 | **Chụp màn hình Momo → OCR** | **4 chạm** | Share Sheet → *Extract Text from Image* (offline, free) → POST `/api/ingest` → bản ghi **chờ xác nhận** |

**"3 chạm" chỉ đúng nếu màn ghi nhanh có nút số tắt.** Gõ đầy đủ "150000" là 8 chạm, không
phải 3. Bắt buộc thiết kế: hàng nút tắt `20k · 35k · 50k · 100k · 200k` + bàn phím **đơn vị nghìn**
(gõ `150` → hiện `150.000đ`). Không có cái này thì S2 không đạt.

**Kỳ vọng thực tế:** ~80% giao dịch vẫn nhập tay. Mục tiêu là làm 80% đó nhanh tới mức không thấy phiền.

### 4.2 Vì sao KHÔNG tự động đọc thông báo Momo `[NC]`

| Đường | Kết quả |
|---|---|
| App đọc thông báo hệ thống | ❌ iOS không có API cho app đọc thông báo app khác. Ràng buộc cấp OS, không có cách lách hợp pháp |
| Shortcuts trigger "nhận thông báo từ app X" | ❌ **Không tồn tại.** Trigger tự động iOS 26: Time of Day, Alarm, Sleep, Workout, Sound Recognition, Travel, Communication, Transaction, Settings. Blog nào nói khác là **sai** |
| Shortcuts trigger `Transaction` | ⚠️ Chỉ bắn với thẻ trong Apple Wallet / Apple Pay. Momo không đi qua đó |
| Đọc SMS ngân hàng | ❌ iOS không cho app đọc SMS |
| **API MoMo** | ❌ **Ngõ cụt — không phải vì phí.** MoMo Developers là cổng thanh toán **cho người bán**, không có endpoint đọc lịch sử ví cá nhân. Hồ sơ M4B cần pháp lý doanh nghiệp. Merchant chỉ thấy giao dịch **đi qua chính mình** ⇒ mua ở Circle K/Grab/Shopee không bao giờ thấy |

> **Không dùng "API MoMo không chính thức" trên GitHub** — vi phạm điều khoản, phải lưu thông tin đăng
> nhập ví của bồ, nguy cơ bị khoá tài khoản. Rủi ro không tương xứng.

### 4.3 Vì sao PWA, không phải native `[NC]`

Native iOS tốn **$99/năm** (vượt ngân sách) và sideload miễn phí **hết hạn 7 ngày** — không thể bắt
người dùng thường xử lý. PWA cho đủ Web Push (iOS 16.4+), Badge API, offline, và **1 codebase
HTML/CSS/JS** cho người mới học. Đánh đổi: **mất background sync và widget** ⇒ nhắc nhở **phải do
server đẩy xuống**, widget dùng Shortcuts thay thế.

**Ba cạm bẫy PWA/iOS — xử lý ngay ở pha PWA (§15):**
1. **Web Push chỉ chạy khi đã "Thêm vào Màn hình chính"** và mở từ icon đó ⇒ cần onboarding có ảnh từng bước.
2. **Safari không hỗ trợ `beforeinstallprompt`** — phải hướng dẫn thủ công. Đây là chỗ rơi rụng nhiều
   nhất. *Giảm nhẹ: Khôi tự cài cho bồ (§16 G5).*
3. **Safari xoá dữ liệu web khi máy thiếu chỗ** (LRU) ⇒ **nguồn sự thật ở server**, IndexedDB chỉ là
   cache. Gọi `navigator.storage.persist()` nhưng không tin nó.

---

## 5. TECH STACK & CHI PHÍ

```
Lớp 3 · Automation   Cloudflare Workers (Cron Triggers, free)
                     nhắc nhập · nhắc lương · nhắc trả nợ quỹ · để nguội 24h/48h/7ngày
                     Web Push (VAPID) · backup JSON tuần → R2 · keepalive chống pause

Lớp 2 · Integration  Supabase REST + Row Level Security  ← dùng TRỰC TIẾP, không bọc lại
                     Worker riêng CHỈ cho /api/ingest (Siri & OCR)

Lớp 1 · Data         Supabase Postgres (free 500MB) — NGUỒN SỰ THẬT DUY NHẤT
                     IndexedDB trên máy — cache đọc + hàng đợi ghi offline

Frontend  React 19 + TypeScript + Vite + vite-plugin-pwa (Workbox)
Style     Tailwind CSS (token khai báo ở §11)
Biểu đồ   SVG viết tay (donut/bar) — KHÔNG dùng thư viện biểu đồ
Hoạt ảnh  CSS transition (không Framer Motion ở MVP) + lottie-react cho mốc mục tiêu
Icon      @phosphor-icons/react (Duotone) + 1 icon cây son vẽ riêng
Font      Be Vietnam Pro (tự host) + Fraunces (tên app)
Hosting   Cloudflare Pages (free, HTTPS + *.pages.dev)
Auth      Supabase Auth — email + mật khẩu, 2 tài khoản (Khôi thử, bồ dùng thật)
```

** Bốn thay đổi so với v1.0, cắt ~14–19h:**
- **Bỏ 4 endpoint tự viết** `/api/txn` `/api/quy` `/api/chu-ky` `/api/quyet-dinh` — Supabase đã cho
  REST + RLS sẵn. Giữ `/api/ingest` vì Shortcut cần endpoint đơn giản. Logic nghiệp vụ vẫn nằm trong
  `shared/domain/` thuần ⇒ đổi hạ tầng sau này vẫn không phải viết lại phần đắt.
- **Bỏ Framer Motion** — §11.5 tự chứng minh CSS transition là đủ cho mọi hoạt ảnh trong §9.
- **Bỏ bảng `nguoi_dung`** — Supabase Auth đã có `auth.users`. `user_id` vẫn có trên mọi bảng.
- **Bỏ bảng `nguon_thu_nhap`**, giữ **cột** `thu_nhap.nguon_thu_nhap_id` — thêm cột sau tốn hơn, nhưng
  cả một bảng có vòng đời cho 1 dòng dữ liệu thì chưa cần.

**Chi phí năm 1: $0 – $12.** Supabase (DB+Auth+Storage) · Cloudflare Pages · Workers · R2 · Web Push
tự host · OCR bằng iOS Shortcuts · font/icon MIT — tất cả **$0**. Tên miền `.com` tuỳ chọn ~$12.
Còn dư ~$38: `[ĐX]` nếu muốn tiêu, mua một bộ illustration/Lottie có bản quyền (~$15–25) cho màn hình
trống, mốc mục tiêu, chúc mừng — phần cảm xúc quan trọng hơn phần logic ở app này.

### Bốn cạm bẫy hạ tầng

| Cạm bẫy | Xử lý |
|---|---|
| **Supabase free tự tạm dừng sau 7 ngày không truy vấn** — pause là app chết | Cron hằng ngày đã tự nhiên chạm DB. Vẫn thêm cron `SELECT 1` lúc 03:00 UTC làm bảo hiểm |
| **Supabase free chỉ giữ backup 7 ngày** | Cron **dump JSON toàn bộ DB mỗi tuần → R2**. **Bắt buộc ở Pha 0.** Viết + chạy thử script phục hồi **trước khi cần đến nó** |
| **Push subscription iOS hết hạn** (404/410) — thông báo âm thầm ngừng | Worker bắt 404/410 → xoá subscription; app tự đăng ký lại mỗi lần mở |
| ⚠️ **Số Cron Trigger tối đa của Workers free — CHƯA XÁC MINH** | §12 có 10 event theo lịch. **Tra tài liệu Cloudflare trước pha PWA**, và thiết kế `cron.ts` chạy được với **tối đa 2 lịch**: một lịch hằng giờ + một lịch 03:00 UTC hằng ngày |

**Trần scale:** DB 500MB (~150 năm) · Workers 100k req/ngày (thực tế ~200) · 1 người dùng — schema đã
có `user_id` nên nếu Khôi cũng dùng thì **không phải sửa gì**.

---

## 6. MÔ HÌNH DỮ LIỆU

### 6.1 Object catalogue

Là **object** khi có đủ ba: vòng đời ≥ 2 trạng thái · cần ID riêng để nơi khác tham chiếu · có người
chịu trách nhiệm.

| Object | ID | Vòng đời | Ghi chú |
|---|---|---|---|
| `danh_muc` | `CAT-` | active / archived | **Config table.** Archive chứ không xoá. **Trần cứng 6 danh mục chi** (§7.1) |
| `chu_ky` | `CYC-` | `du_kien` → `dang_chay` → `da_dong` | `da_dong` = snapshot **bất biến**. Có cột `so_tien_de_danh_dinh_muc` (§7.2) |
| `giao_dich` | `TXN-` | `cho_xac_nhan` → `da_xac_nhan` → `da_huy` | **Không xoá cứng bao giờ.** Nhập tay vào **thẳng** `da_xac_nhan`; chỉ `/api/ingest` mới tạo `cho_xac_nhan` |
| `thu_nhap` | `INC-` | `du_kien` → `thuc_nhan` | Tách khỏi `giao_dich` vì logic khác hẳn. Có cột `nguon_thu_nhap_id` để sẵn |
| `quy` | `FND-` | `dang_chay` → `tam_dung` / `hoan_thanh` / `bo` | **Mục tiêu = quỹ có đích** (§7.3). `icon` lưu **slug** (`'car'`), không lưu SVG |
| `bien_dong_quy` | `FMV-` | `da_ghi` → `da_huy` | Bút toán vào/ra. **Số dư = SUM, không lưu.** Ràng buộc DB: **số dư không bao giờ âm** |
| `khoan_muon_quy` | `BRW-` | `dang_no` → `dang_tra` → `da_tra_het` / `xoa_no` | Khi chi vượt ngân sách chu kỳ |
| `han_muc` | — | không có vòng đời | **Không phải object** — bảng nối `(chu_ky, danh_muc) → so_tien` (§7.6). Khoá chính ghép, cùng khuôn `cau_hinh` |
| `quyet_dinh_mua` | `DEC-` | `dang_can_nhac` → `da_mua` / `da_bo_qua` / `het_han` | Tính năng #9 + để nguội |
| `cau_dong_vien` | `MSG-` | active / archived | **Config table** — không nhét câu chữ vào code |
| `su_kien` | `EVT-` | append-only | Audit log — không sửa, không xoá. Catalogue ở §12.1 |
| `push_subscription` | `SUB-` | active / dead | Xoá khi server trả 404/410 |

**Không phải object** (giá trị tính được — **không lưu**): **`ngan_sach`** · số dư quỹ ·
`phan_tram_muc_tieu` · `tong_chi_theo_danh_muc` · `so_du_con_lai` · `nhip_tuan` · `so_tien_da_khong_tieu`.

### 6.2 Bốn loại giao dịch — "Để dành" KHÔNG phải danh mục

Nếu "Để dành" là danh mục chi thì để dành 3 triệu sẽ hiện thành "đã tiêu 3 triệu", làm sai tỷ lệ để
dành, donut và hạn mức.

| `giao_dich.loai` | Ý nghĩa | `danh_muc_id` | `quy_id` | Vào "tổng chi"? |
|---|---|---|---|---|
| `chi` | Khoản chi | ✅ bắt buộc | — | ✅ |
| `thu` | Thu nhập ngoài lương | — | — | ❌ |
| `chuyen_vao_quy` | Để dành / góp mục tiêu | — | ✅ | ❌ |
| `rut_tu_quy` | Rút / mượn từ quỹ | — | ✅ | ❌ |

**Trên UI bồ chỉ thấy một hàng nút giống nhau** — nút "Để dành 🫙" nằm cạnh 5 nút danh mục. Khác biệt
ở tầng dữ liệu, không ở tầng cảm nhận.

Tương tự: **"Thông báo"** là một *màn hình* (chuông + badge, reset **hiển thị** mỗi tuần nhưng **không
xoá khỏi DB** — mất log là mất khoá chống trùng). **"Giúp đỡ"** chính là tính năng #9, phải là nút nổi
bật ở màn chính, không chôn trong menu.

### 6.3 Source of Truth map

Phép thử: *"nếu hai bản lệch nhau, ta tin bản nào?"* — bản đó là SoT, bản kia bị tước quyền ghi.

| Dữ kiện | Nguồn sự thật |
|---|---|
| Số tiền & thời điểm giao dịch | `giao_dich` (Postgres). IndexedDB · ảnh OCR · thông báo Momo chỉ ĐỌC |
| **`ngan_sach` của chu kỳ** | **không lưu** — `thu_nhap` − `chu_ky.so_tien_de_danh_dinh_muc` − nợ quỹ phải trả kỳ này (§7.2) |
| Tổng chi theo danh mục / chu kỳ | **không lưu — tính bằng SQL** |
| Số dư quỹ | **không lưu — `SUM(bien_dong_quy.so_tien)`** |
| **Đã tiêu trong hũ danh mục** | **không lưu** — `SUM(giao_dich)` lọc theo chu kỳ + danh mục (§7.6) |
| **Lãi sổ tiết kiệm** | **ước tính thì không lưu** — tính từ ngày của từng bút toán `gop`. Lãi bank trả THẬT thì lưu, dưới dạng bút toán `lai` (§7.10) |
| Tiến độ mục tiêu (%) | **không lưu** — số dư quỹ ÷ `so_tien_dich` |
| Nhịp tuần (hoa cúc) | **không lưu** — dẫn xuất từ `giao_dich.ngay_local` |
| Ranh giới chu kỳ | `chu_ky.ngay_bat_dau_thuc_te` / `ngay_ket_thuc` |
| Số liệu chu kỳ **đã đóng** | `chu_ky.snapshot_json` (**bất biến**) — không ai được tính lại |
| Danh mục · câu động viên · ngưỡng | `danh_muc`, `cau_dong_vien`, `cau_hinh` — không phải code |

> **Quy tắc vàng: không bao giờ lưu số đã tính được.** Ngoại lệ duy nhất là `snapshot_json` của chu kỳ
> đã đóng — snapshot có chủ đích, để lịch sử không đổi khi sửa danh mục hôm nay.

### 6.4 Ai được ghi cái gì

| Chủ thể | Được ghi | **Không** được ghi |
|---|---|---|
| Người dùng (UI) | tạo/sửa/huỷ `giao_dich`, `quy`, `bien_dong_quy`, `thu_nhap`, `chu_ky`, `quyet_dinh_mua` | `su_kien`, `snapshot_json` |
| `/api/ingest` (Siri, OCR) | **chỉ tạo** `giao_dich` trạng thái `cho_xac_nhan` | **không được xác nhận**, không sửa bản ghi đã có |
| Cron Worker | `snapshot_json` khi đóng chu kỳ, tạo chu kỳ mới, gửi push, xoá subscription chết | **số tiền — tuyệt đối không** |
| Hệ thống | `su_kien` (append-only), `*_at`, `id` | — |

---

## 7. NGHIỆP VỤ

### 7.1 Danh mục — 6 mục, trần cứng, phân loại theo Ý ĐỊNH

`[YC]` Ăn uống **cố ý** gộp vào Sinh hoạt. Triết lý: **giảm tối đa việc phải suy nghĩ khi phân loại.**
Ma sát lớn nhất khi ghi chi tiêu không phải gõ số mà là **chọn danh mục** `[NC]`.

| Slot | Danh mục | Màu | Định nghĩa hiện dưới nút | Icon |
|---|---|---|---|---|
| 1 | Sinh hoạt | `#3b8841` | Ăn ngoài một mình, mua đồ ăn cho bản thân, siêu thị, đồ thiết yếu | `BowlSteam` |
| 2 | Phát triển bản thân | `#835cbe` | Học, sách, khoá học | `BookOpen` |
| 3 | Giải trí | `#c65d26` | Đi ăn với bạn bè, đi chơi, mua vui | `Martini` |
| 4 | Đầu tư | `#008b9e` | Tiền bỏ ra để sinh lời | `Plant` |
| 5 | Mĩ phẩm | `#c75374` | Skincare, makeup | **cây son — vẽ riêng** (§11.3) |
| 6 | *(bồ tự đặt tên)* | `#b59600` | Bồ tự viết | bồ chọn từ bộ §11.5, mặc định `Plus` |
| — | **Chưa biết xếp đâu** | **xám `#8d9186`** | *(hệ thống, không xoá được)* | `Question` |

** Trần 10 danh mục chi** `[YC 27/08/2026]`, nới từ 6. Con số này bị chặn bởi MÀU chứ không bởi
kỹ thuật: mỗi danh mục cần một màu mà người mù màu đỏ-lục vẫn tách được khỏi chín màu kia, và mỗi màu
thêm vào lại ép chín màu cũ sát nhau hơn. Bốn màu mới (slot 7–10) chọn bằng cách đặt **sàn an toàn**
rồi lấy màu dịu nhất trong số đạt sàn — xem `mu-mau.test.ts`, kiểm định giờ chạy mỗi lần test chứ
không còn là một câu trong tài liệu. Sáu màu gốc **giữ nguyên từng ký tự**.

**Lưới ghi nhanh màn ① vẫn chỉ 6 ô** — giới hạn của MÀN HÌNH, khác hẳn trần màu. Từ danh mục thứ 7,
bồ chọn cái nào lên màn chính; phần còn lại ghi qua nút +. Phép thử nghiệm thu: *"đổi tên / định
nghĩa / icon của danh mục mà không sửa một dòng code nào"* — đã đạt từ 27/08/2026.

**"Chưa biết xếp đâu"** không chiếm slot màu dữ liệu (không tranh chỗ trên donut với danh mục
thật), **không hiện trên hàng nút ghi nhanh**. Đường vào: **lưu mà chưa chọn danh mục thì tự rơi vào
đây**, hiện dấu `?` trong danh sách, phân loại lại ở buổi tổng kết Chủ Nhật. Trên donut gộp vào lát
xám cho tới khi được phân loại. Không có lối thoát này thì lưỡng lự → không ghi → bỏ app.

**Hai ràng buộc còn lại:**
1. **`danh_muc.dinh_nghia` là dữ liệu, hiện trên UI** — dòng chữ nhỏ dưới tên nút, hiện đầy đủ khi nhấn
   giữ. Đây là thứ giữ cho việc phân loại nhất quán suốt 12 tháng.
2. **`danh_muc.hieu_luc_tu` — định nghĩa phải có phiên bản.** Đổi định nghĩa giữa chừng thì số liệu cũ
   mang nghĩa khác số liệu mới. Khi so sánh chu kỳ vắt qua mốc đổi thì hiện cảnh báo nhỏ.
   **Không có cái này, biểu đồ so sánh 12 tháng sẽ nói dối.**

⚠️ **Sinh hoạt sẽ chiếm ~50–55% donut** — đó là hệ quả biết trước của việc gộp. Bù bằng biểu đồ chênh
lệch và hạn mức từng danh mục, **không** bằng cách tách thêm danh mục.

### 7.2 Chu kỳ, ngày lương & công thức ngân sách

`[YC]` Ngày lương = **ngày làm việc cuối tháng** (làm T2–T6), lễ tết có thể trả sớm/trễ ⇒ **bồ sửa tay được**.

```
Tự tính:  lấy ngày cuối tháng · nếu CN → lùi 2 ngày · nếu T7 → lùi 1 ngày
KHÔNG làm bảng ngày lễ Việt Nam — lễ đổi mỗi năm, bảng sẽ mục và sai âm thầm.

chu_ky(ngay_bat_dau_du_kien, ngay_bat_dau_thuc_te, ngay_ket_thuc, so_ngay,
       so_tien_de_danh_dinh_muc  integer DEFAULT 0,   ← MỚI
       trang_thai, snapshot_json)

Ranh giới:  ngày bắt đầu chu kỳ N+1  =  ngày kết thúc chu kỳ N + 1

Khi bồ sửa ngày lương thực tế (VD lương về sớm 3 ngày):
  → chu kỳ TRƯỚC tự co lại cho khít (31 → 28 ngày)
  → giao dịch trong 3 ngày đó tự gán lại sang chu kỳ mới
  → hiện "Đã chuyển N giao dịch" + ghi su_kien CYCLE_BOUNDARY_CHANGED
```

#### Công thức ngân sách — trả lời H3

```
ngan_sach = thu_nhap_thuc_nhan
          − chu_ky.so_tien_de_danh_dinh_muc      ← mặc định 0 ở CHU KỲ 1
          − tong_phai_tra_no_quy_ky_nay          (§7.3)
```

**Chọn "trừ sẵn để dành"** vì §7.6 đã áp dụng đúng nguyên tắc đó cho hạn mức từng danh mục (phân bổ
*trước* khi tiêu) — để ngân sách tổng chạy ngược lại là mâu thuẫn; và nếu để dành là phần *còn dư* thì
thực tế thường không dư, app không bao giờ có dịp chúc mừng.

**Nhưng mặc định 0đ ở chu kỳ 1** vì bồ chưa biết để dành bao nhiêu là hợp lý — đặt cao quá thì vượt
ngân sách ngay tháng đầu → lấn quỹ → đúng vòng xoáy nợ mà §7.3 sợ nhất. Khi **đóng chu kỳ 1**, app đề
xuất bằng số thật: *"Chu kỳ vừa rồi bồ dư 1.240.000đ. Chu kỳ tới để dành sẵn 1.000.000đ nhé?"* → 1 chạm.

#### Nhập được từ CẢ HAI đầu — Pha 2

Ba con số bị ràng buộc bởi **một phương trình duy nhất**, nên biết hai là suy ra cái thứ ba:

```
thu_nhap  =  de_danh  +  (moi_ngay × so_ngay_chu_ky)  +  tra_no_ky_nay
```

Màn đặt để dành có **hai ô, gõ ô nào thì ô kia tự tính** — cùng một phương trình, không thêm logic,
chỉ thêm một ô. Lý do: hai người nghĩ về tiền theo hai kiểu khác nhau, và ép một kiểu là mất một nửa
người dùng tiềm năng.

| Bồ nghĩ | Nhập | App suy ra |
|---|---|---|
| "Tháng này để dành 2 triệu" | `de_danh = 2.000.000` | `moi_ngay = (9tr − 2tr) ÷ 31 = 225.806đ` |
| "Mỗi ngày tiêu 200 nghìn thôi" | `moi_ngay = 200.000` | `de_danh = 9tr − (200k × 31) = 2.800.000đ` |

Khi có **mục tiêu** (§7.3: mục tiêu = quỹ có đích) thì thêm một tầng nữa, và đây mới là chỗ app trở
nên có ích thật — mục tiêu tự quyết định luôn con số hằng ngày:

```
de_danh_moi_ky_can  =  (so_tien_dich − da_gop)  ÷  so_ky_con_lai
```

*Ví dụ: mua xe 30tr trong 12 tháng, đã góp 6tr ⇒ cần để dành 2tr/kỳ ⇒ còn tiêu được 225.806đ/ngày.*

**Xếp vào Pha 2 cùng với quỹ** (Khôi chốt 20/08/2026): làm riêng ở Pha 1 thì để dành chỉ là một con
số bị trừ ra, làm cùng quỹ thì tiền chạy thẳng vào quỹ và bồ nhìn thấy nó lớn dần.

#### Bốn rule bắt buộc (không có thì dữ liệu nát sau 3 tháng)

1. **Không chồng lấn, không hở.** Ràng buộc ở **tầng DB**: `EXCLUDE USING gist (user_id WITH =,
   daterange(ngay_bat_dau_thuc_te, ngay_ket_thuc, '[]') WITH &&)`.
2. **Giao dịch không thuộc chu kỳ nào ⇒ "chu kỳ trôi nổi"** + cảnh báo. Không im lặng bỏ qua — đó là
   cách dữ liệu biến mất mà không ai biết.
3. **Đổi ranh giới ⇒ tự gán lại giao dịch** theo `ngay_local`, hiện số lượng đã chuyển, ghi log.
4. **Chu kỳ `da_dong` là bất biến.** Muốn sửa phải `CYCLE_REOPENED` có ghi log; snapshot cũ được giữ.

#### Hệ quả bắt buộc xử lý ở UI

Chu kỳ dài **28–34 ngày** tuỳ tháng. "Hôm nay còn tiêu được" = `(ngan_sach − da_chi) ÷ số ngày còn lại
thật`, nên **tháng ngắn sẽ thấy con số nhỏ hơn dù không tiêu nhiều hơn**. Phải ghi rõ dưới tiêu đề:
*"Chu kỳ này 28 ngày — ngắn hơn 3 ngày vì lương về sớm"*. Không có dòng này bồ sẽ tưởng app tính sai.

### 7.3 Quỹ & mục tiêu — cùng một object

Quỹ dự phòng = quỹ **không có đích**. "Mua xe" = quỹ **có** `so_tien_dich` + icon xe.

```sql
quy(id, ten, so_tien_dich NULL, icon, cho_phep_muon, thu_tu, trang_thai)
    cho_phep_muon ∈ { 'tu_do' | 'hoi_truoc' | 'khoa' }

bien_dong_quy(id, quy_id, chu_ky_id, so_tien ±, loai, khoan_muon_id NULL, ghi_chu)
    loai ∈ { 'so_du_ban_dau' | 'gop' | 'rut' | 'muon' | 'tra_no' }
    CHECK: SUM(so_tien) theo quy_id không bao giờ < 0        ← MỚI

khoan_muon_quy(id, quy_id, chu_ky_muon_id, so_tien, ky_han, so_tien_moi_ky, con_lai, trang_thai)
    ky_han ∈ { 1 | 3 | 6 | 'linh_hoat' }
```

**Mặc định:** Quỹ dự phòng `cho_phep_muon='tu_do'`. **Mọi mục tiêu dài hạn `='khoa'`** — nếu tiền "mua
nhà" bị mượn âm thầm mỗi lần lỡ tay thì mục tiêu mất hết ý nghĩa.

**`so_du_ban_dau` là loại bút toán riêng.** Khoản đó phải là `loai='so_du_ban_dau'`, **không phải**
`'gop'` — nếu không, tỷ lệ để dành chu kỳ đầu vọt lên vô lý ("để dành được 340% thu nhập 🎉") và tạo
một **đỉnh giả** làm méo mọi biểu đồ so sánh về sau. `so_du_ban_dau` bị loại khỏi mọi phép tính tỷ lệ.

**Onboarding CÓ hỏi số dư đã để dành — nhưng bỏ qua được.** Khôi chốt 21/08/2026, **đảo** quyết định
v1.0 ("onboarding không hỏi về quỹ"). Lý do đảo: quỹ 0đ làm app trông rỗng đúng ngày đầu, mà ngày đầu
quyết định S1. Lý do cũ vẫn còn giá trị nên phải giữ lối thoát:

> ⚠️ Nút **"Để sau"** phải **to ngang** nút "Lưu", không được là chữ nhỏ dưới góc. Onboarding là lúc
> bồ kiên nhẫn ít nhất, mỗi câu hỏi thêm là một chỗ để bỏ ngang. Nút "Điền số dư hiện có" ở màn quỹ
> vẫn giữ nguyên, bấm lúc nào cũng được.

#### Luồng "tiêu quá ngân sách → lấn quỹ"

```
TRONG CHU KỲ (real-time — chỉ HIỂN THỊ, không ghi sổ)
  chi > ngan_sach → banner mềm ba mức. Nội dung KHÁC NHAU tuỳ có quỹ hay không → §7.9

KHI ĐÓNG CHU KỲ (GHI SỔ — bắt buộc bồ xác nhận, fail closed)
  ├─ [Lấy từ quỹ]        → bien_dong_quy loai='muon' −800.000 + khoan_muon_quy 800.000
  └─ [Ghi nợ, chưa lấy]  → chỉ tạo khoan_muon_quy (quỹ chưa bị trừ)

  ⚠️ Quỹ < số vượt → "[Lấy từ quỹ]" HIỆN MỜ kèm lý do, chỉ "[Ghi nợ]" chọn được  `[Pha 7]`
     (chu kỳ 1 quỹ = 0đ nên đây là trường hợp gần như chắc chắn xảy ra)

CHỌN KỲ HẠN  1 / 3 / 6 tháng  hoặc  linh hoạt
CHU KỲ SAU
  ngan_sach đã trừ sẵn khoản phải trả kỳ này (§7.2)
  màn chính hiện chip "đang trả quỹ · còn 400.000đ"
  trả xong → chúc mừng + quỹ về nguyên trạng
```

**Rule 1 — chỉ ghi sổ khi đóng chu kỳ, KHÔNG trừ real-time.** Trong chu kỳ số vượt còn dao động (hoàn
tiền, nhập nhầm rồi sửa). Trừ ngay sẽ đẻ hàng chục bút toán vụn và số dư quỹ nhảy loạn.

#### Kỳ hạn trả nợ — trần 15% thu nhập

Trần mỗi kỳ = **15% của thu nhập THẤP NHẤT trong 3 chu kỳ gần nhất** (an toàn hơn dùng trung bình).
Chưa đủ 3 chu kỳ thì dùng số chu kỳ đã có. Thu nhập 9–10tr ⇒ trần ~**1.350.000đ/kỳ**.

| Số nợ | 1 tháng | 3 tháng | 6 tháng | Mặc định |
|---|---|---|---|---|
| 800.000đ | 800.000 ✅ | 267.000 ✅ | 133.000 ✅ | **1 tháng** |
| 2.000.000đ | ❌ | 667.000 ✅ | 333.000 ✅ | **3 tháng** |
| 4.500.000đ | ❌ | 1.500.000 ❌ | 750.000 ✅ | **6 tháng** |
| 9.000.000đ | ❌ | ❌ | 1.500.000 ❌ | **Trả linh hoạt** |

- **Mặc định chọn kỳ hạn ngắn nhất còn hợp lệ.**
- **Bắt buộc có `linh_hoat`** — nếu nợ > 6 × trần (≈8,1tr) thì không lựa chọn nào hợp lệ và **app sẽ
  kẹt**. `linh_hoat` = trả đúng trần mỗi kỳ tới hết; **kỳ cuối chỉ trả phần còn lại**
  (nợ 9tr ⇒ 6 kỳ × 1.350.000 + kỳ 7 = **900.000**, **không phải** 7 × 1.350.000).
- **Lựa chọn không hợp lệ thì hiện mờ kèm lý do**, không ẩn đi — bồ cần hiểu vì sao.
- **Nợ < 300.000đ thì không bày lựa chọn**, trả luôn 1 kỳ. Đừng bắt quyết định chuyện nhỏ.
- **`[Pha 7]` Nợ chồng nợ:** trần 15% áp cho **TỔNG tất cả khoản đang trả**, không phải 15% mỗi khoản.
  Khoản mới được giãn kỳ hạn để tổng không vượt trần. Nếu `linh_hoat` cũng không đủ thì chuyển sang
  màn riêng — **tuyệt đối không dùng tông chê** (§9.3). Tình huống này rất dễ xảy ra vì chu kỳ sau khi
  vượt, ngân sách đã bị trừ sẵn tới 1.350.000đ nên càng dễ vượt tiếp.

> **Đây là chỗ dễ làm app phản tác dụng nhất trong toàn dự án.** Vượt 3 triệu mà bắt trả hết ngay chu
> kỳ sau thì chu kỳ sau gần như chắc chắn lại vượt → vòng xoáy nợ.

### 7.4 Tính năng #9 — "Có nên mua không?"

Đầu vào: số tiền `A`, danh mục, (tuỳ chọn) tên món.

| Chỉ số | Công thức | Ví dụ hiển thị |
|---|---|---|
| % ngân sách chu kỳ | `A / ngan_sach` | "= 20% ngân sách tháng này" |
| **% phần còn lại** | `A / (ngan_sach − da_chi)` | **"= 85% số tiền còn lại, mà còn 18 ngày"** |
| **Trì hoãn mục tiêu** | `A / toc_do_de_danh_moi_ngay` | **"chiếc xe xa thêm 17 ngày"** ← con số khổng lồ |
| % phần còn thiếu của mục tiêu | `A / (so_tien_dich − so_du)` | "= 3,6% chặng còn lại" |
| Quỹ sẽ còn | `so_du − A` | "6.100.000đ" |
| **Lối thoát** | bù sang chu kỳ sau | "Chu kỳ sau để dành thêm 82.000đ/ngày là về đúng lịch" |

**Con số khổng lồ ở màn này không phải số tiền, mà là "xe xa thêm bao nhiêu ngày"** — quy đổi tiền
sang thứ bồ thật sự muốn. ⚠️ Ba trong sáu chỉ số có mẫu số **có thể bằng 0** — xem §7.8.

#### Để nguội — neo theo % thu nhập, không theo số tiền cứng

| Mức | % thu nhập | Với 9tr | Để nguội |
|---|---|---|---|
| Nhỏ | < 5% | < 450.000đ | **24 giờ** |
| Vừa | 5–20% | 450.000 – 1.800.000đ | **48 giờ** |
| Lớn | > 20% | > 1.800.000đ | **7 ngày** |

Neo theo % để ngưỡng **tự giãn khi thu nhập tăng**. Bồ chỉnh tay được, và **luôn có nút "Tôi quyết
luôn"** để bỏ qua — **không được cưỡng chế.** Nếu cơ chế này thành rào cản thì bồ sẽ ngừng dùng và mất
luôn tính năng hay nhất của app.

Chọn "Thôi khỏi" → cộng vào bộ đếm **"Tiền đã quyết định KHÔNG tiêu"** — biến hành động *không làm gì*
thành điểm số nhìn thấy được, gần như không app nào làm việc này `[ĐX]`.
Chọn "Vẫn mua" → tạo giao dịch bình thường, **không một câu phán xét**.

### 7.5 Thu nhập

- 1 nguồn hiện tại, nhưng `thu_nhap.nguon_thu_nhap_id` **làm cột ngay từ migration đầu**.
- Nhắc nhập tổng thực nhận vào ngày bắt đầu chu kỳ.
- **Khen khi thu nhập tăng:** so **trung bình trượt 3 chu kỳ**, không so 2 tháng liền (thưởng Tết sẽ
  khiến tháng sau luôn bị coi là "giảm"). Chưa đủ 3 chu kỳ ⇒ **im lặng** `[Pha 5]`.
  **Tuyệt đối không có câu nào phản ứng với chiều giảm.**

### 7.6 Hạn mức từng danh mục — "hũ"

Học Goodbudget/MoneyOi: phân bổ **trước** khi tiêu thay vì theo dõi sau. Cảnh báo ở mốc 50 / 80 / 100%,
mỗi mốc **push đúng 1 lần / chu kỳ**. Khôi chốt toàn mục 21/08/2026.

```sql
han_muc(user_id, chu_ky_id, danh_muc_id, so_tien)
    PRIMARY KEY (chu_ky_id, danh_muc_id)      ← khoá ghép tự chặn 1 danh mục có 2 hạn mức
```

Grain là **(chu kỳ, danh mục)** vì hạn mức đổi theo từng chu kỳ, còn `danh_muc` là config dùng chung
mọi chu kỳ. Khoá chính ghép cùng khuôn `cau_hinh(user_id, khoa)` — không thêm khái niệm mới.
**Không lưu "đã tiêu bao nhiêu trong hũ"** — đó là `SUM(giao_dich)`, quy tắc vàng §6.3.

#### Chu kỳ 1 KHÔNG có hũ nào

Bắt bồ đoán "tháng này Sinh hoạt bao nhiêu" ngay ngày đầu là đúng thứ ma sát §7.1 sinh ra để tránh, và
chu kỳ 1 chưa có gì để dựa vào. **Đóng chu kỳ 1 xong app mới đề xuất, bằng số thật** — cùng khuôn
với đề xuất để dành ở §7.2:

> Chu kỳ vừa rồi bồ chi:
> Sinh hoạt 4.100.000đ · Giải trí 1.200.000đ · Mĩ phẩm 600.000đ
> **Đặt hũ theo mức này cho chu kỳ tới nhé?**   → `[Đồng ý]`  `[Tôi tự chỉnh]`  `[Để sau]`

Bồ không phải đoán, con số đến từ chính thói quen của bồ, và Sinh hoạt tự nhiên là hũ lớn nhất vì nó
vốn lớn nhất (§7.1 đã cảnh báo Sinh hoạt chiếm ~50–55%). **Bắt buộc có cả `[Tôi tự chỉnh]` lẫn
`[Để sau]`** — đề xuất không được là ngõ cụt. Chọn "Để sau" thì nhắc lại theo CTA bên dưới.

#### Con số ≥48px vẫn là con số TỔNG

§10 nguyên tắc 1 nói mỗi màn đúng **một** con số lớn; 6 hũ là 6 con số. Giải quyết bằng chỗ đặt, không
bằng cách thêm số:

| Ở đâu | Hiện gì |
|---|---|
| Màn ① con số ≥48px | **Tổng** — "hôm nay còn tiêu được", không đổi gì |
| Màn ghi nhanh, **ngay khi chạm danh mục** | *"Giải trí — còn 340.000đ trong hũ này"* |
| Màn ② | 6 thanh hũ, cạn dần theo % đã dùng |

Đúng chỗ, đúng lúc, không phá nguyên tắc một-con-số.

#### Bốn ràng buộc mềm

1. **Sửa danh mục sau luôn thoải mái, không hỏi lý do.** Có hũ thì chọn sai bắt đầu có hậu quả, và bồ
   sẽ ngập ngừng lâu hơn — đúng thứ §7.1 gọi là *ma sát lớn nhất*. Nút sửa phải **hiện rõ, CTA rõ**,
   không chôn trong menu; và phải nói thẳng với bồ là sửa được, thì bồ mới dám chạm nhanh.
2. **Vượt hũ KHÔNG bị chặn.** Chỉ hiện thanh đã tràn. Ràng buộc thật là ngân sách tổng, không phải hũ.
3. **Phần chưa phân bổ được để dư — gọi là "tiêu chung".** Không ép phân bổ hết tới đồng cuối (YNAB
   ép, và đó là lý do rất nhiều người bỏ YNAB). Nhưng phải nhắc, vì rất dễ quên — **nhắc thụ động, một
   dòng trên màn ①, không đẩy thông báo:**
   > Còn **2.000.000đ** chưa xếp vào hũ nào · *Xếp giúp mình →*

   Bấm vào mở màn phân bổ **đã điền sẵn** theo tỷ lệ chi tiêu chu kỳ trước ⇒ một chạm là xong. Tiện
   lợi phải đi kèm lựa chọn đã dọn sẵn, để bồ không phải nghĩ nhiều.
4. **"Chưa biết xếp đâu" không có hũ.** Danh mục hệ thống này cố ý không có slot màu (§7.1); tiền tiêu
   qua nó trừ vào "tiêu chung", tới buổi tổng kết Chủ Nhật phân loại lại thì mới chuyển sang đúng hũ.

#### Cuối chu kỳ — tiền dư trong hũ

Đây là **thế đối xứng với lấn quỹ** ở §7.3: đã có nhánh *tiêu quá → mượn quỹ*, giờ có nhánh *tiêu ít
hơn → chuyển đi đâu*. Đóng chu kỳ trở thành buổi **quyết toán hai chiều**, không còn chỉ là lúc bị hỏi
về khoản nợ. Nó cũng biến **tiền không tiêu** thành lựa chọn nhìn thấy được — cùng tinh thần bộ đếm
"tiền đã quyết định KHÔNG tiêu" ở §7.4.

> Hũ Giải trí còn dư **200.000đ**  →  `[Chuyển sang hũ khác]`  `[Để dành]`  `[Cứ để đó]`

**Không cần bảng mới.** Chuyển sang hũ khác = đổi `so_tien` của hũ đó ở chu kỳ tới; chuyển vào để
dành = một bút toán `bien_dong_quy` loại `gop` đã có sẵn. Chỉ thêm event `ENVELOPE_ROLLOVER` (§12.1)
để truy được về sau.

⚠️ **Xếp SAU bước xác nhận lấn quỹ, và chỉ hiện khi thật sự có dư.** §7.3 đã bắt bồ quyết định một
chuyện nặng ở đúng thời điểm này; chồng thêm quyết định thứ hai vào cùng màn thì bồ sẽ bấm bừa.

> **Ba mảnh của §7.6 phải đợi Pha 7** (đóng chu kỳ), vì chúng chỉ xảy ra ở đúng
> khoảnh khắc đó và không có gì để chạy trước:
> **①** đề xuất tự động lúc đóng chu kỳ 1 · **②** chuyển tiền dư · **③** `CYCLE_OPEN`
> chép hạn mức sang chu kỳ mới.
>
> Pha 3 đã làm phần còn lại và **có đường vào tay** cho ①: nút *"Đặt theo mức đã
> tiêu chu kỳ trước"* ở màn đặt hũ dùng chung hàm `deXuatHanMuc()`, nên tới Pha 7
> chỉ việc gọi nó từ luồng đóng chu kỳ. Không có nút đó thì bồ sẽ không đặt được
> hũ nào cho tới khi Pha 7 xong.

#### Nối vào chỗ đã có

- **`CYCLE_OPEN` chép hạn mức của chu kỳ trước sang chu kỳ mới.** Không chép thì mỗi tháng bồ phải
  đặt lại từ đầu, và sẽ bỏ sau hai tháng.
- **Không có ràng buộc DB "tổng hũ ≤ ngân sách".** Đã chốt cho để dư, mà ràng buộc cứng sẽ chặn luôn
  trường hợp bồ cố ý đặt vượt rồi chỉnh sau. Cảnh báo mềm ở UI là đủ — cùng lý do §7.3 chọn hiện mờ
  kèm lý do thay vì ẩn lựa chọn đi.

### 7.7 Không nhập lại dữ liệu quá khứ

`[YC]` Bắt đầu dùng từ đầu tháng ⇒ bỏ khỏi phạm vi, **−8…15h**.

⚠️ **Nhưng ba chu kỳ đầu màn Lịch sử sẽ gần như trống.** Để mặc thì bồ mở ra sẽ nghĩ app hỏng và không
quay lại. **Bắt buộc thiết kế màn hình trống tử tế** — minh hoạ cây non (unDraw/Storyset) + câu *"Chu
kỳ đầu tiên đang chạy. Sang tháng sau sẽ có biểu đồ so sánh đầu tiên 🌱"*. Đây là **hạng mục thật
trong lộ trình**, không phải chi tiết vặt.

### 7.8 Quy tắc chu kỳ đầu — MỚI

> Cả app được thiết kế cho trạng thái ổn định, nhưng **1–3 chu kỳ đầu là lúc S1 được định đoạt**.
> §7.7 đã xử lý phần *nhìn*; mục này xử lý phần *tính*.

**Nguyên tắc chung: ẩn chỉ số kèm một câu giải thích. Không bao giờ hiện `∞` / `NaN` / `0` / số âm.**

| Chỗ vỡ | Hành vi bắt buộc |
|---|---|
| `ngan_sach` = null (chưa nhập thực nhận) | Dùng `thu_nhap` trạng thái `du_kien`; nếu cũng chưa có → *"Nhập tổng thực nhận để biết hôm nay còn tiêu được bao nhiêu"* + nút nhập. **Không hiện `0đ`** |
| Trần 15% chưa đủ 3 chu kỳ | Dùng thu nhập thấp nhất trong số chu kỳ đã có, ghi chú *"tính trên 1 chu kỳ"* |
| `toc_do_de_danh_moi_ngay` = 0 | Ẩn "xe xa thêm N ngày" → *"Chưa đủ dữ liệu — cần ít nhất 1 chu kỳ có để dành"* |
| `ngan_sach − da_chi` ≤ 0 | Ẩn % → *"Đã dùng hết ngân sách chu kỳ này"* |
| `so_tien_dich − so_du` = 0 | Ẩn dòng → *"Mục tiêu đã đủ 🎉"* |
| Quỹ = 0đ mà chi vượt ngân sách | Banner dùng bản **"chưa có quỹ"**, không nhắc chữ "quỹ" (§7.9). Lúc đóng chu kỳ: "[Lấy từ quỹ]" hiện mờ kèm lý do, chỉ "[Ghi nợ]" chọn được (§7.3) |
| `INCOME_TREND_UP` chưa đủ 3 chu kỳ | **Im lặng hoàn toàn** — nhất quán với §9.2 |

### 7.9 Vượt mức — ngày khác chu kỳ

Khôi chốt toàn mục 21/08/2026. **Nguyên tắc trùm: không bao giờ chặn việc ghi** (S3 §1). Tiền đã tiêu
rồi; app từ chối ghi thì chỉ mất bản ghi chứ không giữ lại được đồng nào.

#### Vượt mức NGÀY — không có cảnh báo nào

"Hôm nay còn tiêu được" là **mức trung bình dẫn xuất**, không phải hạn mức. Vượt nó vài lần mỗi tuần
là chuyện bình thường: đi chợ, đổ xăng, mua đồ dùng. Cảnh báo mỗi lần thì sau hai tuần bồ bấm qua theo
phản xạ, và lúc thật sự cần báo (banner vượt ngân sách, phần dưới) thì cũng bị bấm qua — §9.3 có
luật "không lặp một câu trong 14 ngày" chính vì chuyện này.

Thay vì thêm thông báo mới, **gộp vào lời xác nhận đã có sẵn**:

> Ghi xong rồi nhé 🌿
> Từ mai mỗi ngày còn **168.000đ**

- Không thêm bước, không có gì phải bấm tắt, tự biến mất sau 2,6 giây như hiện tại
- Xuất hiện đúng lúc thông tin có ích nhất — ngay sau khi ghi
- **Dòng thứ hai chỉ hiện khi mức ngày tụt ≥10%.** Ly cà phê 25k gần như không làm nhúc nhích con số;
  hiện ra chỉ tổ thành tiếng ồn

#### Vượt ngân sách CHU KỲ — banner mềm, ba mức

Mức chia theo **hệ quả trả nợ**, không theo cảm xúc — neo thẳng vào bảng kỳ hạn §7.3 (trần 15%, với
thu nhập 9tr là ~1.350.000đ/kỳ):

| Mức | Số vượt | Hệ quả | Banner nói gì |
|---|---|---|---|
| **1** | ≤ 1 × trần | Chu kỳ sau trả 1 kỳ là xong | Số vượt + lối thoát. Một dòng, không nhấn |
| **2** | 1–6 × trần | Phải giãn 3 hoặc 6 kỳ | Số vượt + **kỳ hạn dự kiến** + lối thoát |
| **3** | > 6 × trần | Chỉ còn `linh_hoat` | Chuyển sang màn riêng (§7.3), **tuyệt đối không tông chê** |

#### Nội dung banner đổi theo CÓ QUỸ hay KHÔNG

⚠️ **Quỹ bắt đầu 0đ, nên lần vượt đầu tiên gần như chắc chắn rơi vào nhánh "chưa có quỹ".** Đây không
phải ca hiếm cần xử lý cho đủ — đây là **trải nghiệm mặc định**. Câu v1.0 *"cuối chu kỳ sẽ lấy từ quỹ
dự phòng"* lúc đó là lời hứa suông về thứ không tồn tại; cuối kỳ bồ không thấy quỹ nào thì app mất uy
tín ngay lần đầu.

**Có quỹ, và quỹ đủ:**
> **Đang vượt 320.000đ**
> Cuối chu kỳ mình lấy từ quỹ dự phòng nhé.
> Còn 9 ngày — tiêu dưới 150.000đ/ngày là về lại đúng mức 🌿

**Chưa có quỹ, hoặc quỹ không đủ** — nói đúng chuyện sẽ xảy ra thật, **không nhắc tới quỹ**:
> **Đang vượt 320.000đ**
> Cuối chu kỳ mình ghi thành khoản trả dần, chu kỳ sau trừ sẵn.
> Còn 9 ngày — tiêu dưới 150.000đ/ngày là về lại đúng mức 🌿

Cấu trúc cả hai giống nhau: **số thật · chuyện sẽ xảy ra · lối thoát cụ thể** — đúng khuôn §7.4 đã
dùng cho tính năng "có nên mua không", và §9.3 giữ nguyên vì không có chữ nào phán xét.

> **KHÔNG gợi ý tạo quỹ ở đây.** Đọc lên sẽ thành *"bạn làm sai rồi, giờ đi làm cái này"*. Thời điểm
> đúng để gợi ý tạo quỹ là **lúc đóng chu kỳ mà còn dư** — lúc đó nó là phần thưởng, không phải lời
> trách.

### 7.10 Sổ tiết kiệm ngân hàng = quỹ CÓ LÃI SUẤT

Khôi chốt 21–22/08/2026, xếp **Pha 3**. **H5 đã đóng:** bồ gửi **có kỳ hạn, trả lãi đầu kỳ**, và sổ
**đã chạy từ trước khi có app**. Thiết kế dưới đây gánh cả 5 hình thức trả lãi nên đổi sang loại khác
sau này không phải sửa gì.

**Đây không phải hệ thống mới — nó chính là `quy` đã có.** Quỹ vốn đã là *"số dư = SUM bút toán
vào/ra"*, đã có `trang_thai`, đã có màn hình. Sổ tiết kiệm khác quỹ thường đúng ba thứ: **có lãi
suất, có ngày gửi, có kỳ hạn.**

Và `cho_phep_muon = 'khoa'` (§7.3) khớp sẵn với thực tế: **rút trước hạn thì lãi bị tính lại về lãi
suất không kỳ hạn** — gần như mất sạch phần lãi. Đây là quy định chung của NHNN chứ không phải rào cản
app tự dựng, nên khoá ở đây là mô tả sự thật, không phải ý kiến.

#### Năm hình thức trả lãi — nhưng chỉ MỘT công thức

| `lich_tra_lai` | Tiền lãi tới tay khi nào |
|---|---|
| `dau_ky` | Ngay ngày gửi ← **sổ của bồ** |
| `cuoi_ky` | Ngày đáo hạn, cùng lúc với gốc — phổ biến nhất, lãi suất niêm yết cao nhất |
| `hang_thang` | Mỗi tháng một lần, gốc giữ tới đáo hạn |
| `hang_quy` | Mỗi 3 tháng |
| `khong_ky_han` | Cộng dồn theo ngày, rút lúc nào cũng được |

**Cả năm dùng chung đúng một công thức. Khác nhau chỉ ở LỊCH tiền tới tay bồ.**

```
tổng lãi = gốc × lai_suat_nam × số_ngày_thực_tế ÷ 365
```

Kiểm chứng — gốc 100.000.000đ, 5,5%/năm, 12 tháng ⇒ tổng lãi **luôn là 5.500.000đ**:

| Lịch | Bồ nhận gì, khi nào |
|---|---|
| `dau_ky` | 5.500.000đ ngay hôm gửi · 100.000.000đ khi đáo hạn |
| `cuoi_ky` | 105.500.000đ khi đáo hạn |
| `hang_thang` | 458.333đ × 12 · gốc khi đáo hạn |
| `hang_quy` | 1.375.000đ × 4 · gốc khi đáo hạn |

Năm nhánh `if` thu về **một trường dữ liệu**. Thêm hình thức thứ sáu về sau không phải sửa code, và
app trả lời được miễn phí câu *"tháng này bồ nhận bao nhiêu tiền lãi"* vì lịch đã có sẵn.

```sql
quy(... , lai_suat_nam NULL, ngay_gui NULL, ky_han_thang NULL, lich_tra_lai NULL)
    lich_tra_lai ∈ { 'dau_ky' | 'cuoi_ky' | 'hang_thang' | 'hang_quy' | 'khong_ky_han' }
    -- cả bốn NULL = quỹ thường, không phải sổ tiết kiệm

bien_dong_quy.loai  += 'lai'
```

#### Bồ chỉnh được mọi ô

| Ô | Kiểu | Ghi chú |
|---|---|---|
| Số tiền gốc | nhập | |
| Lãi suất %/năm | nhập | **Theo hợp đồng** — app không gợi ý, không niêm yết sẵn |
| Kỳ hạn | chọn | 1 · 2 · 3 · 6 · 9 · 12 · 13 · 15 · 18 · 24 · 36 tháng · *khác* |
| Ngày gửi | nhập | `dd/mm/yyyy` — xem quy tắc dưới |
| Lịch trả lãi | chọn | 5 giá trị ở bảng trên |

App tự tính: **ngày đáo hạn · tổng lãi · tổng khi đáo hạn · còn bao nhiêu ngày · đã đi được bao nhiêu %**.

⚠️ **Lãi suất lưu THEO TỪNG SỔ, không phải một con số chung.** Bank đổi lãi suất theo thời gian và mỗi
sổ khoá lãi suất lúc mở. Nếu để một % dùng chung rồi tính lại tất cả thì hôm nào bồ sửa % là **mọi con
số quá khứ đổi theo** — đúng loại lỗi `snapshot_json` ở §6.3 sinh ra để chặn.

#### "Đã gửi được mấy tháng" — nhập được, KHÔNG lưu

Bồ gõ *"đã gửi được 3 tháng"* cho tiện, app **quy ngay ra ngày gửi rồi chỉ lưu ngày đó**. Lưu thẳng
"3 tháng" thì ngày mai con số đã sai, một tháng nữa sai hẳn 1 tháng — quy tắc vàng §6.3, cùng lý do
`ngan_sach` không có trong DB. Tiện lúc nhập, đúng về sau. Cùng khuôn hai-đường-vào của §7.2.

#### Hai quy tắc ngày tháng

1. **Tính lãi theo NGÀY THẬT, không lấy `số_tháng ÷ 12`.** Sổ 6 tháng từ 15/03 đến 15/09 là **184
   ngày**, không phải 182,5. Lệch nhỏ, nhưng bồ đối chiếu với giấy bank thấy lệch là mất niềm tin vào
   mọi con số khác (§9.3).
2. **Hiển thị `dd/mm/yyyy`, có năm** `[YC 22/08/2026]`. `dinhDangNgay()` hiện trả `dd/mm` không
   năm — đủ cho giao dịch trong một chu kỳ, **sai cho sổ tiết kiệm**: ngày đáo hạn của sổ 36 tháng mà
   không có năm thì vô nghĩa. Xem quy ước 2 ở §14.

#### Ranh giới tỷ lệ để dành — đã đúng sẵn, không cần luật mới

Ranh giới không phải *"bank hay app"* mà là *"tiền đã có sẵn hay tiền để dành kỳ này"* — §7.3 đã chốt:

| Bút toán | Ví dụ | Vào tỷ lệ để dành? |
|---|---|---|
| `so_du_ban_dau` | Sổ đã chạy từ trước khi có app, cả phần lãi đã nhận | ❌ |
| `gop` | Tiền trích từ lương chu kỳ này đem đi gửi | ✅ |
| `lai` | Bank trả lãi | ❌ — không phải tiền bồ để dành ra |

#### Bốn ràng buộc

- **Không đụng gì tới ngân sách chu kỳ.** Tiền rời ngân sách từ lúc bút toán `gop` được ghi.
- **App KHÔNG tự tạo bút toán tiền.** Kể cả khi biết lịch trả lãi. §13 + §6.4 đã cấm cron ghi số tiền,
  AT-09 kiểm đúng chuyện này với quỹ. App **nhắc**, bồ xác nhận một chạm, lúc đó mới ghi.
- **Nhiều sổ thì gộp ở UI:** một dòng *"Sổ tiết kiệm · 5 sổ · 24.730.000đ"*, bấm mới xoè. Sổ có kỳ hạn
  không nạp thêm được nên gửi hàng tháng sẽ thành nhiều sổ — đó là ràng buộc của bank, model đúng rồi
  gộp ở UI, đừng vờ như một sổ nạp thêm được (tới ngày đáo hạn sẽ không biết trả lời "đáo hạn cái nào").
- **Đúng MỘT thông báo**, lúc gần đáo hạn. Không nhắc lãi hằng tháng — đây là số nhìn mỗi tháng một
  lần, không phải số hằng ngày.

---

## 8. TÍNH NĂNG — TRẠNG THÁI CHỐT

| # | Tính năng | Pha | Ghi chú |
|---|---|---|---|
| 1 | Nhập thủ công | 1 | **Tính năng số 1**, toàn bộ UX xoay quanh nó. §4.1 |
| 2 | Danh mục — 6 mục theo ý định | 1 | §7.1. Config table |
| 3 | Dashboard biểu đồ tròn | **3** | Số trong lỗ donut phải **rút gọn** ("6,12tr") để không tràn |
| 4 | Lịch sử & so sánh tuần/tháng/quý/năm | 7 | **2 trục riêng:** trục chu kỳ (N vs N−1) và trục lịch dương. Lẫn hai trục là nguồn sai số lớn nhất |
| 5 | Gamification — hoa cúc + cây | 5 | §9 |
| 6 | Icon mục tiêu sáng dần | 5 | §11.5. Xe thì hình xe, nhà thì hình nhà |
| 7 | Câu cổ vũ + hoạt ảnh | 5 | §9.3 — rủi ro cao nhất |
| 8 | Nhắc nhập chi tiêu, chỉnh giờ | **4** | Nhắc **có điều kiện** (chưa ghi hôm nay), không nhắc mù |
| 9 | "Có nên mua không?" | 6 | §7.4 — **tính năng khác biệt nhất** |
| 10 | Chu kỳ theo ngày lương | 1 | §7.2 |
| 11 | Chỉnh ngày bắt đầu/kết thúc | 1 | §7.2 — 4 rule bắt buộc |
| 12 | Nhắc nhập tổng thực nhận | **4** | |
| 13 | Khen khi thu nhập tăng | 5 | TB trượt 3 chu kỳ, không phản ứng chiều giảm |
| + | **Quỹ để dành + lấn quỹ** | 2 | §7.3 |
| + | **Hạn mức từng danh mục** | 3 | §7.6 |
| + | **Bộ đếm "tiền đã không tiêu"** | 6 | §7.4 |
| + | **Tổng kết 30 giây Chủ Nhật** | 7 | 3 con số + 1 câu + nút "đã xem" |
| — | Chế độ 2 người · Ảnh biên lai | 📋 backlog | Schema đã sẵn `user_id` |

---

## 9. GAMIFICATION

### 9.1 Vì sao KHÔNG dùng streak ngày `[NC]`

Streak đo việc *ghi chép*, không đo việc *quản lý tiền* — ghi đều mà tiêu hoang vẫn streak cao.
Duolingo có bạn bè để so, ở đây một người nên con số streak không có nghĩa gì ngoài chính nó. Và mất
chuỗi 47 ngày tạo cảm giác "thôi hỏng rồi" — **đúng lúc người ta gỡ app**.

### 9.2 Thay bằng hoa cúc trắng 🌼 `[YC]`

- **7 cánh = 7 ngày trong tuần** (ISO, tuần bắt đầu **Thứ Hai**). Ghi ngày nào thì cánh đó
  **trắng có viền**; chưa ghi thì cánh **màu kem nhạt, không viền**.
- **Đủ 5 cánh → nhuỵ chuyển vàng rực.** Đây là phần thưởng duy nhất — **không có con số nào để mất**.
- **Vườn 8 tuần** ở màn Lịch sử. Tuần hỏng chỉ là một bông nhuỵ xám nằm im — **không thông báo, không
  câu nào nhắc tới**.
- **Thúc đẩy chỉ khi sắp đạt:** đã 4/7 và còn ≥1 ngày → "còn 1 ngày nữa là hoa nở đủ 🌼".
  Tuần đã hỏng → **im lặng hoàn toàn** (nhắc lúc đó chỉ là chì chiết).
- **Hoạt ảnh:** ghi xong → cánh tương ứng bung ra 400ms bằng CSS (`scale .6 → 1` + xoay nhẹ).
- **"Chuỗi mềm" cho hành vi tài chính thật:** *số chu kỳ liên tiếp không phải lấn quỹ*.

> Hàng chấm đo *hiệu suất*. Bông hoa đo *sự chăm sóc* — và chăm sóc thì lỡ một ngày cũng không sao.

### 9.3 Quy tắc ngôn ngữ — RỦI RO CAO NHẤT CỦA DỰ ÁN

`[YC]` Chỉ tích cực, luôn thể hiện rõ số tiền và phần trăm. Ba tông cho phép: **mừng · trung tính
thông tin · quan tâm**. **Không có tông chê.**

| ❌ Không bao giờ | ✅ Thay bằng |
|---|---|
| "Bạn tiêu hoang quá rồi!" | "Chu kỳ này đã dùng 82% ngân sách, còn 9 ngày." |
| "Lại quên ghi chép à?" | "Hôm nay chưa có ghi chép nào — thêm nhanh nhé 👇" |
| "Mục tiêu mua xe chậm mất rồi" | "Mua xe: 34%. Thêm 500k nữa là qua mốc 40%." |
| So sánh với "người khác" | So sánh với **chính bồ ở chu kỳ trước** |

**Ba luật kỹ thuật:** (1) câu chữ nằm trong bảng `cau_dong_vien(loai, dieu_kien, noi_dung,
lan_dung_cuoi)`, **không nhét vào code** · (2) **không lặp một câu trong 14 ngày** · (3) mỗi câu cảnh
báo **bắt buộc kèm một hành động cụ thể**.

### 9.4 Ba ẩn dụ — không thêm cái thứ tư

🌼 **Hoa cúc nở** = nhịp ghi chép · 🎯 **Hình mục tiêu tô dần** = tiến độ (§11.5) · 🪴 **Luống đất** = quỹ.

**Đừng thêm ẩn dụ thứ tư** (thành phố, thú cưng, huy hiệu) — nhiều ẩn dụ chồng nhau làm app rối và mất
chất. Đây là bẫy mà Fortune City mắc phải: game dần lấn át mục tiêu tài chính. `[NC]`

---

## 10. DASHBOARD — NĂM MÀN HÌNH

**Nguyên tắc xuyên suốt: mỗi màn hình đúng MỘT con số ≥48px.** Nếu năm con số cùng to thì không con
số nào nổi.

| Màn | Con số khổng lồ | Thành phần |
|---|---|---|
| **① Hôm nay** | "Hôm nay còn tiêu được **156.667đ**" | Thanh nhịp có **vạch "hôm nay"** · 3 thẻ nhỏ (đã chi / còn lại / quỹ) · nút 🌿 Cân nhắc mua · **6 nút ghi nhanh** · hoa cúc tuần này |
| **② Chu kỳ này** | tổng chi trong lỗ donut (**"6,12tr"**, số đầy đủ dòng nhỏ dưới) | Donut theo **thứ tự slot cố định** · chú giải có icon + số tiền + % · biểu đồ chênh lệch · hạn mức từng danh mục |
| **③ Lịch sử** | — (2 chế độ) | **Danh sách**: cuộn vô tận, lọc tuần/tháng/quý/năm · **Phân tích**: cột thu&chi 8 chu kỳ · đường tỷ lệ để dành · vườn hoa. Chạm 1 chu kỳ cũ → mở màn ② **từ snapshot** |
| **④ Cân nhắc mua** | "chiếc xe xa thêm **17 ngày**" | 4 chỉ số + lối thoát + 2 nút (Để nguội / Vẫn mua) + bộ đếm "tiền đã không tiêu" |
| **⑤ Quỹ & Mục tiêu** | tổng đang để dành | Quỹ dự phòng (cho mượn) · mục tiêu = icon lớn dần (khoá) · chip nợ quỹ |

> ✅ **Con số hero của mockup v2 đã sửa** (24/08/2026): file từng ghi `235.000đ` nhưng `1.880.000 ÷ 12 ngày =
> 156.667đ` (235.000 chỉ đúng nếu còn 8 ngày). Cả bảng trên lẫn mockup nay đều dùng 156.667đ.
> Mọi con số trong mockup phải thuộc cùng **một** kịch bản nhất quán.

### Bảy nguyên tắc trình bày con số

1. **Mỗi màn hình đúng một con số ≥48px.**
2. **Mỗi danh mục một màu cố định vĩnh viễn** — màu đi theo *danh mục*, không theo *thứ hạng*. Lọc bỏ
   một danh mục **không được** làm các danh mục còn lại đổi màu.
3. **Màu chỉ để báo trạng thái, không để trang trí.** Vàng/đỏ dành riêng cho "sắp vượt / đã vượt / đang
   nợ quỹ". **Tiêu tiền là chuyện bình thường, không phải lỗi.**
4. **Số nào cũng phải trả lời "so với cái gì".** "Đã chi 6.120.000đ" là số trần trụi; thêm "76% ngân
   sách, còn 12 ngày" mới là thông tin.
5. **Rút gọn khi hiển thị lớn, đầy đủ khi chạm vào.** "6,12tr" trên biểu đồ, "6.120.000đ" khi chạm.
   Không bao giờ hiện "6.120.000,00 VNĐ". Đây cũng là cách chống tràn chữ trong lỗ donut.
6. **Chữ không bao giờ mang màu của dữ liệu.** Ô màu nhỏ đứng cạnh chữ mới mang danh tính.
7. **Không bao giờ hai trục dọc trên cùng một biểu đồ.** Thu nhập và chi tiêu cùng đơn vị đồng nên vẽ
   chung được; tỷ lệ để dành (%) phải là biểu đồ **riêng**.

**Biểu đồ chênh lệch KHÔNG dùng token trạng thái.** v1.0 quy định dùng `#d03b3b`/`#0ca30c`, nghĩa là
tiêu thêm 80.000đ cho **sách** bị tô cùng màu với "đang nợ quỹ" — vi phạm chính nguyên tắc 3 và §9.3.
Cũng tránh được việc xanh lá vừa nghĩa "Sinh hoạt" vừa nghĩa "ít hơn kỳ trước".

Bản v2.0 đề xuất thay bằng **cặp** màu trung tính, nhưng đo lại thì hỏng: hai sắc độ đã chọn chỉ cách
nhau **11,7 đơn vị RGB** sau mô phỏng mù màu đỏ-lục (cặp đỏ/xanh cũ cách 134,6) — gần như cùng một màu.
Chốt lại (23/08/2026): **MỘT màu trung tính duy nhất** `#8d9186` cho mọi thanh, **chiều thay đổi mã hoá
bằng VỊ TRÍ** — thanh nằm bên trái hay bên phải vạch 0. Màu không phải mang nghĩa mà vị trí đã mang rồi.
**Trạng thái nguy hiểm** (vượt hạn mức danh mục §7.6) mới dùng màu, và là hổ phách `#fab219` chứ không
đỏ: đỏ đọc lên là "bạn làm sai", trái nguyên tắc 3.

⚠️ **Mọi thanh phải dùng CHUNG một mẫu số** = trị tuyệt đối lớn nhất của cả hai chiều. Mỗi bên tự co
giãn theo cực đại của riêng nó thì thanh "tăng 50k" dài bằng thanh "giảm 2tr" — biểu đồ nói dối trong
khi mọi con số bên cạnh đều đúng.

---

## 11. HỆ THỐNG THỊ GIÁC

Hướng: **thiên nhiên · chill · một chút sang trọng.** `[YC]`

### 11.1 Màu — BẮT BUỘC tách làm hai lớp

Đã thử ba bảng pastel thiên nhiên nhạt. **Cả ba đều trượt kiểm định:** màu quá nhạt bị đọc thành xám,
và cặp *xanh rêu ↔ đất nung* chỉ lệch **ΔE 1,7** với người mù màu đỏ-lục. `[NC]`

**Lớp 1 · giao diện** (~92% màn hình) — dịu, ấm, **không mang dữ liệu**:

```css
--page:    #f2ede3;  /* cát ấm — nền trang */      --ink:   #20241f;  /* than ấm — chữ chính */
--surface: #faf7f2;  /* kem — mặt thẻ     */       --ink2:  #5b6157;  /* chữ phụ */
--surface2:#f6f1e8;                                --muted: #8d9186;  /* chữ mờ, trục */
--sage-soft:#e6ede3; /* thanh nền, track  */       --line:  #e5ded1;
--sage:    #7d9b7a;  /* nét trang trí     */       --line2: #efe8db;
--gold:    #c9a227;  /* CHỈ nét 1px, không tô mảng */
```

**Lớp 2 · dữ liệu** (ô nhỏ + vành donut) — đậm hơn, đã kiểm định. **Thứ tự slot là cơ chế an toàn mù
màu, không được đổi.** Cột `--cN-ink` là **mới** — mockup đã dùng 23 mã hex ngoài bảng token
v1.0, phần lớn là biến thể đậm để làm chữ/nét trên nền pha loãng; nhóm token này trước đây thiếu hẳn:

| Slot | Danh mục | `--cN` vành donut | `--cN-t` nền pha loãng | `--cN-ink` nét/chữ trên nền |
|---|---|---|---|---|
| 1 | Sinh hoạt | `#3b8841` lá | `#e4efe4` | `#2f6b39` |
| 2 | Phát triển bản thân | `#835cbe` oải hương | `#ece5f6` | *(kiểm định ở Pha 0)* |
| 3 | Giải trí | `#c65d26` đất nung | `#f8e7dc` | *(kiểm định ở Pha 0)* |
| 4 | Đầu tư | `#008b9e` hồ nước | `#dceff1` | *(kiểm định ở Pha 0)* |
| 5 | Mĩ phẩm | `#c75374` hoa đào | `#f8e3e9` | *(kiểm định ở Pha 0)* |
| 6 | *(bồ tự đặt)* | `#b59600` nghệ | `#f4eed4` | `#6b4d05` |

Kiểm định trên nền kem `#faf7f2`, gồm cả cặp nối vòng của donut: PASS dải sáng · PASS ngưỡng bão hoà ·
PASS mù màu **ΔE 9,0** (ngưỡng ≥8) · PASS thị giác thường **ΔE 16,8** (ngưỡng ≥15). Riêng màu Nghệ
tương phản 2,68:1 ⇒ **luôn phải đi kèm nhãn chữ hiện rõ**.
**Việc ở Pha 0:** hoàn thiện 4 giá trị `--cN-ink` còn thiếu, kiểm định tương phản **≥4,5:1** trên nền
pha loãng tương ứng.

**Trạng thái — cố định, KHÔNG BAO GIỜ dùng làm màu series:**
tốt `#0ca30c` · cảnh báo `#fab219` · nghiêm trọng `#ec835a` · nguy cấp `#d03b3b`.
Luôn đi kèm icon + nhãn, không bao giờ để màu tự mang nghĩa.

> **Nếu đổi bảng màu về sau: phải chạy lại kiểm định.** Đừng bao giờ đánh giá độ phân biệt màu bằng
> mắt — cặp xanh rêu ↔ đất nung trông rất khác nhau mà lệch có ΔE 1,7 với người mù màu.

### 11.2 Font

**Be Vietnam Pro** — toàn bộ giao diện và **mọi con số** (người Việt thiết kế cho tiếng Việt, dấu đặt
chuẩn). **Fraunces** — **chỉ** tên app và tiêu đề màn hình. Tỷ lệ ~95%/5%.

**Luật cứng:** con số lớn **không bao giờ** dùng serif. Không `tabular-nums` cho số cỡ lớn (làm
"235.000" trông rời rạc) — chỉ dùng ở cột số cần thẳng hàng.
**Tự host** trong `web/public/fonts/`, chỉ tải 3 độ đậm (400/500/600).

### 11.3 Icon

**Phosphor Icons** (MIT), kiểu **Duotone**. Icon trong ô bo tròn 40px, nền = `--cN-t`, nét = `--cN-ink`,
`stroke-width` 1,7px, đầu nét tròn.

`BowlSteam` Sinh hoạt · `BookOpen` Phát triển · `Martini` Giải trí (slug `martini`, **không phải**
`martini-glass`) · `Plant` Đầu tư · `Question` Chưa biết xếp đâu · `Plus` slot 6 mặc định.
Nav: `House` · `Clock` · `PottedPlant` · `DotsThree`.

- **Mĩ phẩm:** ⚠️ Phosphor **không có** cây son → **vẽ riêng** (thân tuýp + vòng cổ + đầu son vát chéo)
  trên đúng lưới 24px của Phosphor. SVG có sẵn trong mockup v2.
- **Để dành:** `Jar` — **phải khác hẳn `Plant` của Đầu tư.** Hai icon hình cây cạnh nhau trông giống
  hệt nhau, đó là lỗi UX thật.
- **Không dùng emoji làm icon danh mục** — emoji iOS không đổi màu được và trộn với icon line trông
  chắp vá. Emoji chỉ dùng trong câu động viên (💚 🌱 ✨ 🌼).
- **Đừng trộn hai bộ icon** — con đường nhanh nhất làm giao diện trông chắp vá.

Minh hoạ lớn (màn trống, onboarding, chúc mừng): **unDraw** hoặc **Storyset**. Hoạt ảnh mốc: **LottieFiles**.

### 11.4 Điều hướng

Nút ＋ **58px**, nổi trên thanh nav 26px, viền kem 5px + bóng xanh lá `rgba(59,136,65,.32)` ·
chữ nav **12,5px**/600 (đang chọn **700**) · icon nav **22px** · mục đang chọn nền pill `#e4efe4` +
chữ `#3b8841`. Thứ tự: **Hôm nay · Lịch sử · ＋ · Quỹ · Khác**.

⚠️ Thanh nav ăn mất ~26px chiều cao nội dung. Trên iPhone màn nhỏ (SE, 13 mini) 6 nút ghi nhanh có thể
bị đẩy xuống dưới nếp gấp. **Phải thử trên đúng máy của bồ ở Pha 1.** Nếu chật thì rút gọn thẻ số liệu,
**không rút gọn nút ghi nhanh** — đó là thứ quan trọng nhất màn hình.

### 11.5 Icon mục tiêu — bộ riêng, kiểu Fill

**`quy.icon` lưu slug** (`'car'`, `'house'`), không lưu SVG — nhét SVG vào DB thì đổi bộ icon sau này
phải sửa từng dòng dữ liệu. Bồ **tự chọn icon khi tạo mục tiêu**; mặc định `plant`. **Không tự đoán
icon theo tên mục tiêu** — đoán sai trông ngớ ngẩn hơn là dùng mặc định.

20 slug đã **kiểm tra tồn tại** trong `@phosphor-icons/core` weight `fill`:
`house` `car` `motorcycle` `camera` `laptop` `airplane-tilt` `graduation-cap` `diamond` `heartbeat`
`paw-print` `couch` `bed` `key` `storefront` `baby-carriage` `gift` `trophy` `coins`
`suitcase-rolling` `plant`.
⚠️ Hai slug **không tồn tại**, đừng dùng: `ring` (dùng `diamond` cho mục tiêu cưới) và `lipstick`.

**Bắt buộc weight `fill`, không dùng Line/Regular** — icon nét mảnh tô một nửa ra hình vô nghĩa.

```html
<!-- Phosphor vẽ trong khung y = 32..224 của viewBox 256 (cao 192) -->
<!-- y = 32 + 192 × (1 − p)      height = 192 × p -->
<svg viewBox="0 0 256 256">
  <defs><clipPath id="cp"><rect x="0" y="158.7" width="256" height="65.3"/></clipPath></defs>
  <use href="#g-car" fill="#d9d2c4"/>                              <!-- lớp xám: toàn bộ -->
  <g clip-path="url(#cp)"><use href="#g-car" fill="#3b8841"/></g>  <!-- lớp xanh: bị cắt -->
</svg>
```

Hoạt ảnh khi qua mốc: animate `y` và `height` của `<rect>` trong **700ms ease-out** bằng CSS. Rẻ, mượt,
không cần thư viện `[NC]` — đây cũng là lý do bỏ Framer Motion (§5).

---

## 12. AUTOMATION MAP

Mọi thứ **tạo bản ghi mới** hoặc **gọi ra ngoài** đều phải có khoá chống trùng.

| Event code | Trigger | Hành động | Khoá chống trùng | Fail closed |
|---|---|---|---|---|
| `CYCLE_OPEN` **MỚI** `[Pha 7]` | Ngay sau `CYCLE_CLOSE`, **cùng transaction** | Tạo chu kỳ `dang_chay`, `ngay_bat_dau = ngay_ket_thuc trước + 1` | `OPEN-{user}-{yyyymm}` UNIQUE | — |
| `CYCLE_CLOSE` | Cron, sau `ngay_ket_thuc` | Ghi `snapshot_json`, chuyển `da_dong` | `CLOSE-{cycle_id}` | ✅ cần bồ xác nhận nếu còn giao dịch chờ hoặc có lấn quỹ |
| `DAILY_LOG_REMINDER` | Cron hằng giờ, lọc theo `cau_hinh.gio_nhac` | Nếu hôm nay chưa có giao dịch → push | `REM-DAILY-{user}-{yyyymmdd}` | — |
| `WEEK_FLOWER_NUDGE` | Cron, khi tuần đạt 4/7 và còn ≥1 ngày | Push "còn 1 ngày nữa là hoa nở đủ" | `NUDGE-WK-{user}-{yyyyww}` | — |
| `PAYDAY_REMINDER` | Cron, ngày bắt đầu chu kỳ | Push "nhập tổng thực nhận" | `REM-PAYDAY-{cycle_id}` | — |
| `BUDGET_THRESHOLD` | Sau `TXN_CONFIRMED` | Vượt 50/80/100% → push 1 lần/mốc/chu kỳ | `THR-{cycle_id}-{muc}` | — |
| `CATEGORY_LIMIT` | Sau `TXN_CONFIRMED` | Vượt hạn mức danh mục → push 1 lần | `LIM-{cycle_id}-{cat_id}` | — |
| `INGEST_FROM_SIRI` | POST `/api/ingest` | Tạo giao dịch **`cho_xac_nhan`** | **`Idempotency-Key` do Shortcut sinh (UUID mỗi lần chạy)** `[Pha 8]` | ✅ |
| `INGEST_FROM_OCR` | POST `/api/ingest` | Tạo giao dịch **`cho_xac_nhan`** | `ING-OCR-{yyyymmdd}-{tien}-{sha1(raw)[:8]}` UNIQUE | ✅ |
| `FUND_BORROW_COMMIT` | Bồ xác nhận khi đóng chu kỳ | Ghi `bien_dong_quy` + `khoan_muon_quy` | `BRW-{cycle_id}` UNIQUE | ✅ **bắt buộc người xác nhận** |
| `FUND_REPAY_REMIND` | Cron, ngày bắt đầu chu kỳ | Trừ sẵn khoản trả vào `ngan_sach` + push | `RPY-{borrow_id}-{cycle_id}` | — |
| `FUND_REPAID` | Khi `con_lai = 0` | Chúc mừng + đóng `khoan_muon_quy` | `RPD-{borrow_id}` | — |
| `GOAL_MILESTONE` | Sau `bien_dong_quy` vào quỹ có đích | Qua mốc 25/50/75/100% → push + hoạt ảnh | `MIL-{quy_id}-{moc}` | — |
| `INCOME_TREND_UP` | Sau khi nhập thực nhận | TB trượt 3 chu kỳ tăng ≥5% → chúc mừng | `INC-UP-{cycle_id}` | — |
| `DECISION_COOLDOWN` | Sau 24h/48h/7 ngày tuỳ bậc (§7.4) | Push hỏi lại | `DEC-CD-{decision_id}` | — |
| `DECISION_EXPIRE` | 30 ngày sau khi tạo | Chuyển `het_han`, không tính vào bộ đếm | `DEC-EX-{decision_id}` | — |
| `WEEKLY_REVIEW` | Cron, Chủ Nhật | Push "tổng kết 30 giây" | `WRV-{yyyy-ww}` | — |
| `WEEKLY_BACKUP` | Cron, CN 03:00 **UTC** | Dump JSON → R2, so kích thước với bản trước | `BAK-{yyyy-ww}` | — |
| `DB_KEEPALIVE` | Cron 03:00 **UTC** hằng ngày | `SELECT 1` chống Supabase pause | — | — |

**`[Pha 4]` Ba ghi chú bắt buộc:**
- **Mọi lịch cron khai báo bằng UTC**; `wrangler.toml` ghi chú giờ VN tương ứng. "21:00 giờ VN" =
  `14:00 UTC` — code thẳng `0 21 * * *` thì thông báo bắn lúc 4 giờ sáng. Vì bồ đổi giờ nhắc được,
  cron phụ thuộc giờ người dùng phải **chạy hằng giờ rồi lọc**, không phải một lịch cố định.
- **Khoá Siri phải do phía gọi sinh**, không suy ra từ nội dung. Khoá cũ
  `ING-SIRI-{phút}-{tiền}-{danh mục}` **nuốt giao dịch thật** khi bồ mua 2 món giống nhau trong cùng
  một phút — vi phạm S3. UUID mỗi lần chạy thì gửi lại do lỗi mạng vẫn 1 bản ghi, lần chạy mới thì 2
  bản ghi. Khoá OCR giữ nguyên vì ở đó ta *thật sự* muốn chặn cùng một tấm ảnh.
- **`THR-` chặn push lần hai là CÓ CHỦ ĐÍCH.** Đã push "vượt 80%" → huỷ giao dịch → tụt về 75% → vượt
  lại 80% thì **không push nữa**. Chống spam, không phải lỗi.

> **Quy tắc công thức hay event:** dùng **công thức/derived** cho mọi thứ tính lại được bất cứ lúc nào
> (tổng chi, %, số dư quỹ, nhịp tuần) — rẻ, luôn đúng, không cần trạng thái. Dùng **event handler** chỉ
> khi tạo bản ghi mới, gọi ra ngoài, hoặc đổi trạng thái không hoàn tác được.
> **Không bao giờ dùng công thức để tạo bản ghi; không bao giờ dùng event để tính thứ vốn là hàm thuần
> của dữ liệu đã có.**

### 12.1 Audit event catalogue — MỚI

§12 là automation map (cron/push/gọi ra ngoài). Đây là thứ khác: **cái gì được ghi vào `su_kien`**,
gồm cả hành động bồ tự làm trên UI. Audit trail là ràng buộc bắt buộc theo §2.

| Event code | Ai gây ra | Payload tối thiểu |
|---|---|---|
| `TXN_CREATED` / `TXN_CONFIRMED` / `TXN_CANCELLED` | bồ hoặc `/api/ingest` | `txn_id`, `so_tien`, `nguon`, (huỷ: `ly_do`) |
| `CYCLE_OPENED` / `CYCLE_CLOSED` / `CYCLE_REOPENED` | cron hoặc bồ | `cycle_id`, `ranh_gioi` |
| `CYCLE_BOUNDARY_CHANGED` | bồ | `cycle_id`, ranh giới cũ/mới, **số giao dịch đã gán lại** |
| `FUND_BORROW_COMMITTED` | bồ | `borrow_id`, `so_tien`, `ky_han` |
| `CATEGORY_DEFINITION_CHANGED` | bồ | `cat_id`, định nghĩa cũ/mới, `hieu_luc_tu` |
| `CONFIG_CHANGED` | bồ | khoá, giá trị cũ/mới |
| `SAVINGS_TARGET_SET` | bồ | `cycle_id`, `so_tien` (§7.2) |
| `ENVELOPE_SET` | bồ | `cycle_id`, `cat_id`, số cũ/mới, `nguon` ∈ {`de_xuat`, `tu_chinh`} (§7.6) |
| `ENVELOPE_ROLLOVER` | bồ, lúc đóng chu kỳ | `tu_hu`, `den_dau` ∈ {hũ khác, quỹ, để đó}, `so_tien` (§7.6) |
| `SAVINGS_INTEREST_RECORDED` | bồ | `quy_id`, `so_tien` thật, ước tính app đang hiện lúc đó (§7.10) |

---

## 13. CONTROL RULES (không đánh đổi lấy tiến độ)

| Rule | Cách kiểm chứng |
|---|---|
| **Fail closed** — mọi bản ghi từ Siri/OCR vào `cho_xac_nhan`, không bao giờ tự xác nhận | AT-02 |
| **Không xoá cứng** — `da_huy` + lý do + ghi `su_kien` | Xoá 1 giao dịch rồi truy vấn DB: bản ghi vẫn còn |
| **Snapshot bất biến** — chu kỳ `da_dong` không tính lại | AT-03 |
| **Người xác nhận khi tiền rời quỹ** — cron không được tự trừ quỹ | AT-09 |
| **Idempotency trên mọi thứ tạo mới** | Chạy lại mọi cron 2 lần: không có bản ghi trùng |
| **Ràng buộc chu kỳ ở tầng DB**, không ở UI | Chèn 2 chu kỳ chồng lấn bằng SQL trực tiếp: phải bị từ chối |
| **Số dư quỹ không bao giờ âm** | Rút quá số dư bằng SQL trực tiếp: phải bị từ chối |
| **Tiền là số nguyên đơn vị đồng** | **`tsc --noEmit`** — branded type `Dong`, xem §14 quy ước 1 |
| **Mọi endpoint ghi đều phải xác thực** `[Pha 8]` | Gọi `/api/ingest` không kèm token → phải trả **401** |
| **Config không hardcode** | Thêm 1 câu động viên mới mà không sửa code |
| **Backup phục hồi được** | Chạy `restore-from-backup.ts` vào DB rỗng, so số dòng |

### Ranh giới con người — automation KHÔNG được tự làm

Automation được phép: tính, kiểm tra, gắn cờ, xếp hàng đợi, gửi nhắc.
**Bồ quyết định khi:** xác nhận giao dịch từ Siri/OCR · **lấy tiền từ quỹ** · chọn kỳ hạn trả nợ ·
mua hay không mua sau khi để nguội · mở lại chu kỳ đã đóng.

### Xác thực `/api/ingest` `[Pha 8]`

Shortcut chạy trên máy bồ ⇒ **là client** ⇒ không được nhận service key (§2). Cần: một **ingest token
riêng** lưu trong Shortcut, gửi qua `Authorization: Bearer …`; Worker verify rồi mới ghi với đúng
`user_id` gắn với token; **rate limit** ~60 req/giờ (dư sức cho ~7 giao dịch/ngày); token đổi được mà
không phải deploy lại (Workers Secret).

---

## 14. CẤU TRÚC THƯ MỤC & QUY ƯỚC CODE

```
sobo/                              ← tên tạm, chờ H4
├── CLAUDE.md · README.md · .env.example      (KHÔNG commit .env thật)
├── mockup-v2-thien-nhien.html     ← bản vẽ màn ①②⑤
├── docs/adr/                      ← mỗi file = 1 quyết định kiến trúc + lý do (chưa tạo)
│
├── db/
│   ├── migrations/                ← đánh số tăng dần, KHÔNG sửa file đã chạy
│   │   0001_init · 0002_rls_policies · 0003_cycle_exclusion · 0004_quy_ledger
│   ├── seed/  danh_muc · cau_dong_vien · cau_hinh
│   └── functions/  tinh_nhip_tuan · dong_chu_ky · gan_lai_giao_dich
│
├── web/                           ← PWA (Vite + React + TypeScript)
│   ├── public/  manifest.webmanifest · icons/ (180/192/512 — bắt buộc cho iOS) · fonts/ · lottie/
│   └── src/
│       ├── app/                   ← routing, layout, providers
│       ├── features/              ← CHIA THEO NGHIỆP VỤ, không theo loại file
│       │   ghi-nhanh/ giao-dich/ chu-ky/ hom-nay/ chu-ky-nay/
│       │   lich-su/ quyet-dinh-mua/ quy/ thu-nhap/ vuon-hoa/
│       ├── shared/
│       │   ├── design/            ← token màu/font/spacing — MỘT nơi duy nhất
│       │   ├── api/               ← client Supabase — MỘT nơi duy nhất
│       │   ├── db/                ← IndexedDB cache + hàng đợi ghi offline
│       │   ├── domain/            ← LOGIC THUẦN, không import React, không gọi mạng
│       │   │   tien.ts · chu-ky.ts · quy.ts · quyet-dinh.ts · nhip-tuan.ts
│       │   ├── ui/  └── push/     ← component chung · đăng ký Web Push
│       └── sw.ts                  ← service worker: cache + xử lý push
│
├── workers/  wrangler.toml (khai báo cron) · src/{cron,push,ingest,backup}.ts
├── shortcuts/  ghi-<danh-muc>.md (6 shortcut Siri) · ghi-tu-anh-ocr.md
└── scripts/  restore-from-backup.ts    ← VIẾT VÀ CHẠY THỬ TRƯỚC KHI CẦN
```

### Bảy quy ước code không được vi phạm

1. **Tiền = số nguyên, đơn vị ĐỒNG.** Không bao giờ `float`. **Sai lầm này không sửa được về sau.**
 Ép bằng branded type, không bằng grep (`Number` là hàm quá phổ biến, grep ra hàng trăm
   false positive nên rule sẽ bị bỏ qua):
   ```ts
   // shared/domain/tien.ts
   export type Dong = number & { readonly __brand: 'dong' }
   export function dong(n: number): Dong {
     if (!Number.isInteger(n)) throw new Error(`Tiền phải là số nguyên: ${n}`)
     return n as Dong
   }
   ```
   Mọi trường tiền khai kiểu `Dong` ⇒ gán `number` thường vào là **lỗi biên dịch** ⇒ `tsc` kiểm hộ.
2. **Thời gian lưu `timestamptz` UTC, hiển thị `Asia/Ho_Chi_Minh`, và lưu THÊM cột `ngay_local date`.**
   Giao dịch lúc 23:30 ngày 5 phải thuộc ngày 5 giờ VN, không phải ngày 6 UTC. **Bug kinh điển**, sẽ
   làm hỏng đúng tính năng #4, #11 và hoa cúc. Tuần dùng **ISO 8601, bắt đầu Thứ Hai**.
   **Hiển thị ngày: một format duy nhất `dd/mm/yyyy`, luôn có năm** `[YC 22/08/2026]`. Lưu vẫn là
   `YYYY-MM-DD` (kiểu `NgayLocal`) — đây là quy tắc HIỂN THỊ. Lý do có năm: sổ tiết kiệm 36 tháng
   (§7.10) và so sánh giữa các chu kỳ đều vượt ra ngoài một năm, mà `15/09` lúc đó là mơ hồ.
   **Mọi tham số là ngày phải khai `NgayLocal`, KHÔNG khai `string`** `[YC 25/08/2026]`. Cùng lý do
   với quy ước 1: hai tham số cùng kiểu `string` thì `tsc` không phân biệt nổi, và lỗi chỉ nổ lúc
   chạy. Đã cắn hai lần — `ghiBienDong` (23/08) và `chuKyLienTruoc` (25/08, làm màn ② đổ hẳn).
3. **`shared/domain/` không import React, không gọi mạng.** Hàm thuần ⇒ test được ⇒ là nơi duy nhất
   chứa công thức tiền bạc. **Đây là phần khiến việc đổi hạ tầng sau này không phải viết lại logic.**
4. **Không xoá cứng.** `da_huy` + lý do + `su_kien`.
   **Danh sách nào cũng phải sắp theo khoá DUY NHẤT** `[YC 25/08/2026]`. Sắp theo một cột có thể
   trùng (`xay_ra_luc`, `ngay_local`) thì Postgres trả thứ tự tuỳ ý khi bằng nhau, và danh sách tự
   xáo lại sau mỗi lần ghi — đọc như app vừa sửa thứ gì đó không ai đụng vào. Luôn thêm một khoá phụ.
5. **Mọi thứ người-không-phải-kỹ-sư có thể muốn đổi ⇒ vào DB**: định nghĩa danh mục, hạn mức, giờ nhắc,
   câu động viên, mốc mục tiêu, bậc để nguội, trần 15%, ngưỡng cảnh báo.
6. **Token thị giác khai báo một nơi** (`shared/design/`). Không rải hex trong component.
7. **Mỗi PR chỉ sửa một pha.** Không trộn migration của hai pha vào một lần.

---

## 15. LỘ TRÌNH — CHIA THEO RỦI RO GIẢM DẦN

Không chia theo "dễ làm trước". Chia theo **"cái gì sai thì phải làm lại từ đầu"**.

| Pha | Nội dung | "Xong" nghĩa là gì (đo được) | Giờ |
|---|---|---|---|
| **0** | Repo · Supabase · migration 0001–0003 · RLS · **backup cron + script phục hồi** · design token (**hoàn thiện `--cN-ink`**) · font tự host | Tạo/đọc 1 giao dịch qua REST; file backup có trong R2; **phục hồi thành công vào DB rỗng** | 4–8 |
| **1** | Chu kỳ + ngày lương · giao dịch · 6 danh mục · **màn ghi nhanh ≤3 chạm (phải vẽ mockup trước)** · con số "hôm nay còn tiêu được" | Bồ ghi được **1 tuần dữ liệu thật**, không lỗi. Đổi ngày lương → giao dịch gán lại đúng | 10–16 |
| **2** | **Quỹ & mục tiêu · sổ `bien_dong_quy` · lấn quỹ · kỳ hạn trả** (§7.3) | Vượt ngân sách → đóng chu kỳ → xác nhận → nợ ghi đúng, chu kỳ sau trừ sẵn đúng | 9–14 |
| **3** ✅ | **Màn ① + ② đầy đủ:** donut ✅ · hũ danh mục ✅ (§7.6, trừ 3 mảnh đợi Pha 7) · sổ tiết kiệm ✅ (§7.10) · chênh lệch ✅ · màn hình trống tử tế ✅ (§7.7) | Mở app thấy đúng số liệu tuần 1; chu kỳ đầu không hiện biểu đồ trống trơ trọi | 19–27 |
| **4** ⇄ | PWA: manifest ✅ · service worker ✅ · Add to Home Screen ✅ · **Web Push + cron nhắc có điều kiện** | Thông báo hiện trên màn khoá iPhone đúng giờ đã đặt | 8–14 |
| **5** | ~~Hoa cúc tuần này~~ ✅ (kéo lên 23/08) · **vườn 8 tuần** · icon mục tiêu lớn dần · câu động viên (config) · khen thu nhập tăng | Lỡ 1 ngày → cánh xám, **không có thông báo nào**. Đủ 5 cánh → nhuỵ vàng | 6–10 |
| **6** | **Tính năng #9** (vẽ mockup màn ④ trước) + để nguội theo bậc + bộ đếm | 4 chỉ số khớp với tính tay trên giấy; để nguội đúng bậc theo % thu nhập | 6–11 |
| **7** | Màn ③ (vẽ mockup trước) · **đóng chu kỳ + snapshot** · tổng kết Chủ Nhật | Đóng chu kỳ xong sửa danh mục → báo cáo cũ **không đổi** | 11–16 |
| **8** | 6 Shortcut Siri + Shortcut OCR + `/api/ingest` + màn duyệt | Chạy shortcut **2 lần trên cùng 1 ảnh** → chỉ **1** bản ghi | 8–12 |
| **9** | Kiểm thử toàn bộ AT · **PILOT 1 chu kỳ lương trọn vẹn** · đào tạo bồ | Hết 1 chu kỳ thật không có bug ranh giới ngày; bồ tự ghi được không cần hỏi | 6–10 |

**Tổng: ~87–138h** (v1.0 là 96–150h; cắt 14–19h nhờ §5, cộng lại 5–7h cho §7.6 + §7.10 chốt
21/08/2026). Khoảng tin cậy **±30%** — có thể vẫn lạc quan: riêng hàng đợi ghi offline + đồng bộ không
trùng (AT-07) là bài khó với cả dev có kinh nghiệm.

⚠️ **Pha 3 đang phình.** Nó đã gánh cả màn ① lẫn ②, giờ thêm hũ đầy đủ và sổ tiết kiệm — 19–27h, pha
nặng nhất lộ trình. Nếu vào làm thấy quá tải thì **cắt sổ tiết kiệm ra Pha 3b**: nó là thứ bồ nhìn mỗi
tháng một lần, không phải hằng ngày, nên hoãn được mà không đụng S1. Hũ thì **không** hoãn được, vì
§7.6 buộc phải đề xuất ngay lúc đóng chu kỳ 1.

**⇄ Pha 3 và 4 đã đảo so với v1.0.** Ở thứ tự cũ, sau Pha 1 bồ ghi 1 tuần dữ liệu thật mà
**không thấy gì** ngoài một con số — đúng lúc rủi ro S1 cao nhất. Cho thấy donut trước, thông báo sau.

**Mockup còn thiếu là hạng mục thật, không phải việc vặt**: màn **④** `[Pha 6]` và màn **③** `[Pha 7]`.
Màn **ghi nhanh** đã dựng thẳng theo mockup v2 ở Pha 3.5 nên không cần bản vẽ riêng nữa.

**Rollout 3 nấc:** DEMO (dữ liệu giả, Khôi tự thử) → **PILOT (bồ dùng thật trọn 1 chu kỳ lương, song
song cách ghi cũ)** → LIVE. **Không bỏ PILOT** — chu kỳ đầu tiên là lúc mọi bug về ranh giới ngày, múi
giờ và đóng chu kỳ lộ ra.

**Việc luôn bị quên — có dòng riêng ở Pha 9:** ngồi cùng bồ 30 phút, cài lên màn hình chính, bật thông
báo, ghi thử 5 giao dịch, cài 6 shortcut Siri. **Bỏ qua bước này thì dự án thất bại bất kể code tốt cỡ
nào**, vì nếu bồ thấy ghi vào Note nhanh hơn thì app sẽ bị bỏ.

### Acceptance test — mỗi test PHẢI có bước "chạy lại lần 2"

| ID | Tiền đề → Hành động | Kỳ vọng | Chạy lại lần 2 |
|---|---|---|---|
| **AT-01** | Chu kỳ 31/07–28/08 → ghi giao dịch 28/08 lúc 23:30 giờ VN | Thuộc chu kỳ 31/07–28/08 (không rơi sang chu kỳ sau do UTC) | Ghi y hệt → **2 bản ghi riêng** |
| **AT-02** | Ảnh biên lai Momo 250.000đ → chạy Shortcut OCR | 1 bản ghi `cho_xac_nhan` | **Cùng ảnh → vẫn 1 bản ghi** |
| **AT-03** | Chu kỳ đã đóng → hôm nay đổi tên/gộp danh mục | Báo cáo chu kỳ cũ **không đổi** | Tính lại → vẫn khớp `snapshot_json` |
| **AT-04** | Tuần đang 4/7 cánh, hôm nay không ghi | Cánh hôm nay màu kem, **không có thông báo nào** | Mở lại → không đổi |
| **AT-05** | Sửa ngày bắt đầu chu kỳ 31/07 → 28/07 | Chu kỳ trước co lại; giao dịch 28–30/07 gán lại; hiện "đã chuyển N giao dịch" | Sửa ngược → chuyển ngược đúng N |
| **AT-06** | Chưa Add to Home Screen → bấm "Bật nhắc nhở" | Hướng dẫn có ảnh, **không** báo lỗi kỹ thuật | — |
| **AT-07** | Mất mạng → ghi 3 giao dịch | Vào hàng đợi, hiện "chờ đồng bộ" | Có mạng → đồng bộ đúng **3**, không phải 6 |
| **AT-08** | Mục tiêu 34% → góp đủ để vượt 50% | Icon sáng thêm + push đúng 1 lần | Góp thêm cùng mốc → **không** push lần 2 |
| **AT-09** | Chi vượt ngân sách 800k → cron đóng chu kỳ | **Cron KHÔNG tự trừ quỹ**; hiện màn xác nhận | Cron chạy lại → không tạo `khoan_muon_quy` thứ hai |
| **AT-10** | Nợ 9.000.000đ, thu nhập 9tr | 1/3/6 tháng **hiện mờ kèm lý do**; chỉ "Trả linh hoạt" chọn được: **6 kỳ × 1.350.000 + kỳ 7 = 900.000** | — |
| **AT-11** | Quỹ 0đ → điền số dư ban đầu 3.200.000đ | Bút toán `so_du_ban_dau`; **tỷ lệ để dành KHÔNG đổi** | — |
| **AT-12** | Cân nhắc mua 2.400.000đ (26% của 9tr) | Bậc **7 ngày**, không phải 48h | Thu nhập lên 15tr → cùng số tiền thành bậc 48h (16%) |
| **AT-13** | Chu kỳ đầu tiên, chưa có chu kỳ trước | Màn ③ hiện **minh hoạ + câu giải thích**, không hiện biểu đồ trống | — |
| **AT-14** | Backup JSON trong R2 → chạy `restore-from-backup.ts` vào DB rỗng | Số dòng mọi bảng khớp 100% | Chạy lại → không nhân đôi dữ liệu |
| **AT-15** | Chu kỳ 1, **chưa nhập thực nhận** → mở màn ① | Câu mời nhập + nút. **Không hiện `0đ`, không ô trống** | Mở lại → không đổi |
| **AT-16** `[Pha 7]` | **Quỹ 0đ**, chi vượt ngân sách 800k → đóng chu kỳ | "[Lấy từ quỹ]" **mờ kèm lý do**; chỉ "[Ghi nợ]" chọn được; **số dư quỹ không âm** | Cron chạy lại → không tạo bút toán thứ hai |
| **AT-17** `[Pha 7]` | Đang trả nợ kỳ 2/3 → chu kỳ này **lại vượt** 600k | Tổng phải trả **không vượt trần 15%**; khoản mới tự giãn kỳ hạn | — |
| **AT-18** `[Pha 4]` | Đặt giờ nhắc 21:00 (giờ VN) | Push đến trong khung **21:00–21:59 giờ VN**, không phải 4h sáng | Đổi sang 08:00 → push đúng khung mới |
| **AT-19** | Ghi 1 giao dịch làm mức chi/ngày tụt **15%** | Lời xác nhận có dòng 2 *"Từ mai mỗi ngày còn X"*, X khớp tính tay | Ghi khoản làm tụt **3%** → **không có** dòng 2 |
| **AT-20** | **Quỹ 0đ**, vượt ngân sách 320.000đ → mở màn ① | Banner nói *"ghi thành khoản trả dần"*; **không có chữ "quỹ"** nào; có số ngày còn lại + mức chi/ngày để về đúng mức | Nạp quỹ 1tr → banner đổi sang bản *"lấy từ quỹ dự phòng"* |
| **AT-21** | Hũ Giải trí đặt 1.200.000đ, tiêu 1.000.000đ → đóng chu kỳ | Hỏi chuyển 200.000đ đi đâu, **sau** bước xác nhận lấn quỹ. Chọn "Để dành" → bút toán `gop`, tỷ lệ để dành đổi đúng | Cron chạy lại → **không** tạo bút toán thứ hai |
| **AT-22** | Sổ tiết kiệm 5,5%/năm, gửi 2.000.000đ đầu mỗi tháng, 12 lần | Lãi **ước tính** ~730.000đ, khớp tính tay; nhãn "ước tính" hiện rõ | Nhập lãi bank trả thật → thay ước tính; **tỷ lệ để dành KHÔNG đổi** (`lai` bị loại như `so_du_ban_dau`) |

---

## 16. GIẢ ĐỊNH, CÂU HỎI TREO & NHẬT KÝ

### Giả định đã chốt

Ăn uống gộp Sinh hoạt (G1) · 1 nguồn thu nhập nhưng để sẵn nhiều nguồn, có quỹ + lấn quỹ (G2) ·
không nhập dữ liệu quá khứ (G3) · **Khôi trực tiếp cài đặt & bật thông báo cho bồ (G5 — gỡ được rủi
ro lớn nhất của PWA)** · chỉ VND (G6) · ngân hàng không có email biến động số dư (G7) · online là
chính, offline vẫn ghi được (G8 — *OCR chạy offline trên máy; cái cần mạng là khâu gửi lên server*) ·
thu nhập 9–10tr (G9 — mọi ngưỡng neo theo % để tự giãn).

**G4 `[GĐ]` vẫn treo:** chỉ bồ dùng, Khôi không ghi chung. Nếu đổi → +~15h, schema đã sẵn.

> **G10 — bồ bắt đầu dùng app vào ĐÚNG NGÀY LƯƠNG, không phải giữa chu kỳ.**
> ✅ chốt 20/08/2026 (Khôi). Giả định này **gánh con số chính của app**.
>
> Vì §7.7 chốt không nhập dữ liệu quá khứ, nếu bồ cài app vào giữa chu kỳ thì app
> thấy "đã chi 0đ" và chia trọn ngân sách cho số ngày còn lại. Đo thật ngày
> 20/08: lương 9tr, còn 11 ngày ⇒ app báo **818.181đ/ngày** trong khi mức đúng là
> 290.322đ/ngày — **sai gấp 2,8 lần, và sai về phía khuyến khích tiêu nhiều hơn.**
> Chu kỳ đầu vượt ngân sách ⇒ lấn quỹ ⇒ đúng vòng xoáy nợ §7.3 sợ nhất, ngay lúc
> S1 đang được quyết định.
>
> Cố ý **không** xây phần chia theo tỷ lệ, vì rollout đã định là bàn giao app vào
> ngày nhận lương (§15 Pha 9: ngồi cùng bồ 30 phút). Nếu lịch bàn giao đổi thì
> phải làm phần đó trước, không được bỏ qua.

### Còn cần Khôi trả lời

| # | Câu hỏi | Ảnh hưởng | Trạng thái |
|---|---|---|---|
| **H1** | ~~Bồ dùng iPhone đời nào?~~ | — | ✅ **iPhone 13** (22/08/2026) — 390×844pt, ở chế độ PWA còn ~390×763pt. **Không phải rút gọn thẻ số liệu**, bố cục màn ① giữ nguyên |
| **H2** | ~~Giờ nhắc mặc định — 21:00 được không?~~ | — | ✅ **21:00** (23/08/2026). §9.2 chỉ nhắc khi SẮP ĐẠT chứ không nhắc mỗi tối, và 21:00 để lại ~3 tiếng đủ để bồ kịp ghi nốt trong ngày |
| **H3** | ~~Ngân sách = toàn bộ thu nhập hay trừ sẵn để dành?~~ | — | ✅ **Đã trả lời ở §7.2** |
| **H4** | ~~Tên app cuối cùng?~~ | — | ✅ kỹ thuật `sobo`, hiển thị **"Sổ của Bồ"** (20/08/2026). Đã vào `manifest.webmanifest` và thẻ `apple-mobile-web-app-title` ở Pha 4 |
| **H5** | ~~Bồ gửi sổ có kỳ hạn hay tài khoản tích luỹ?~~ | — | ✅ **có kỳ hạn, trả lãi đầu kỳ**, sổ đã chạy từ trước khi có app (22/08/2026). §7.10 gánh cả 5 hình thức nên đổi loại sau này không phải sửa |

### Nhật ký quyết định

| Ngày | Quyết định |
|---|---|
| 17/08/2026 v1.0 | Chốt PWA · bỏ đọc thông báo Momo · Supabase + Cloudflare · fail closed · 5 danh mục theo ý định · định nghĩa danh mục có phiên bản · gộp `muc_tieu` vào `quy` · lấn quỹ chỉ ghi sổ khi đóng chu kỳ · "Để dành" là loại giao dịch · bỏ streak → hoa cúc · bảng màu 2 lớp · Be Vietnam Pro + Fraunces · Phosphor Duotone · ngày lương sửa tay được · kỳ hạn 1/3/6 + linh hoạt trần 15% · để nguội neo theo % · `so_du_ban_dau` là bút toán riêng · icon mục tiêu = chính hình mục tiêu, weight Fill |
| **18/08/2026 v2.0** | **Review v1.0 phát hiện 43 lỗ hổng.** Vá: thêm `ngan_sach` vào mô hình (§7.2) · thêm `CYCLE_OPEN` (§12) · xác thực `/api/ingest` (§13) · **§7.8 quy tắc chu kỳ đầu** (7 chỗ chia cho 0) · **§12.1 audit catalogue** · idempotency Siri đổi sang UUID phía gọi · trần cứng 6 danh mục · "Chưa biết xếp đâu" có danh tính · thêm token `--cN-ink` · biểu đồ chênh lệch bỏ màu trạng thái · cron khai báo UTC · tuần ISO bắt đầu T2 · branded type `Dong` thay grep · sửa AT-10 và con số hero 235.000 → 156.667 · thêm AT-15…18. Cắt phạm vi 14–19h (§5) và đảo Pha 3⇄4 (§15). Chi tiết + dẫn chứng số dòng: xem `REVIEW-CLAUDE-MD.md` trong lịch sử git |
| **20/08/2026** | Pha 0–1 xong. Chốt **G10** (bồ bắt đầu dùng đúng ngày lương — gánh con số chính của app) · để dành **nhập được từ cả hai đầu**, xếp Pha 2 · bàn phím số tắt · ngưỡng hỏi lại khi > 1 triệu · tên app giữ `sobo` (H4) · lương test 9.000.000đ |
| **21/08/2026** | Pha 2 xong (`32c0c5a`). Chốt 6 việc sau khi Khôi review: **§7.9 vượt mức** — ngày thì im lặng, chỉ gộp *"từ mai mỗi ngày còn X"* vào lời xác nhận và chỉ khi tụt ≥10%; chu kỳ thì banner mềm 3 mức neo vào trần 15%, **nội dung đổi theo có quỹ hay không** (quỹ 0đ là trường hợp mặc định, không phải ca hiếm) · **§7.6 hũ danh mục viết lại đầy đủ** — bảng `han_muc` khoá ghép, chu kỳ 1 không có hũ rồi đề xuất bằng số thật, con số ≥48px vẫn là tổng còn số hũ hiện lúc chạm danh mục, phần chưa phân bổ để dư + CTA thụ động, **chuyển tiền dư cuối chu kỳ** (mới, đối xứng với lấn quỹ) · **§7.10 sổ tiết kiệm = quỹ có lãi suất** — không phải hệ thống mới, chỉ 2 cột + 1 loại bút toán; lãi là **ước tính**, bank trả thật thì bồ nhập đè · **§7.3 onboarding CÓ hỏi số dư đã để dành**, đảo quyết định v1.0, bắt buộc nút "Để sau" to ngang nút "Lưu" · ảnh nền 3 khung giờ giữ **tĩnh** (nướng sẵn WebP, không blur lúc cuộn) · thêm AT-19…22, Pha 3 lên 19–27h |
| **22/08/2026** | **§7.10 viết lại.** Đóng **H5** — bồ gửi có kỳ hạn, **trả lãi đầu kỳ**, sổ đã chạy trước khi có app ⇒ bỏ phần "lãi ước tính" làm trung tâm, vì trả trước thì tiền lãi là **số đã biết**, không có gì để ước tính. Phát hiện **5 hình thức trả lãi ở VN dùng chung MỘT công thức** `gốc × %/năm × ngày/365`, chỉ khác **lịch tiền tới tay** ⇒ 5 nhánh `if` thu về 1 trường `lich_tra_lai`. Chốt thêm: lãi suất lưu **theo từng sổ** (bank đổi lãi theo thời gian, sửa % không được làm đổi số quá khứ) · "đã gửi mấy tháng" **nhập được nhưng không lưu**, quy ra ngày gửi · tính lãi theo **ngày thật** không lấy `tháng÷12` (sổ 6 tháng = 184 ngày, không phải 182,5) · nhiều sổ thì **gộp ở UI** chứ không vờ như một sổ nạp thêm được · **`dd/mm/yyyy` là format ngày duy nhất, luôn có năm** (§14 quy ước 2) — `dinhDangNgay()` hiện thiếu năm, phải sửa ở Pha 3 |
| **22/08/2026 (2)** | Pha 3 đi được nửa: **donut màn ②** và **hũ danh mục**. Đóng **H1** (iPhone 13 — đo thật, màn ① vừa khít không phải cuộn). Ghi nhận ba mảnh §7.6 phải đợi Pha 7 vì chỉ xảy ra lúc đóng chu kỳ; bù lại thêm nút *"Đặt theo mức đã tiêu chu kỳ trước"* để bồ đặt hũ được ngay, dùng chung `deXuatHanMuc()` với luồng tự động sau này |
| **23/08/2026** | **Sổ tiết kiệm xong** (§7.10). Hai lỗi chỉ chạy mới lộ: ① `ghiBienDong()` nhận 3 tham số `string` liền nhau nên truyền ngược `quyId`/`chuKyId` mà `tsc` không thấy — đổi sang **tham số có tên**, kiểu lỗi này biến mất hẳn; ② màn ① và màn ⑤ mỗi nơi tự cộng quỹ một kiểu nên **cùng một khoản tiền ra hai câu trả lời** (50tr vs 0đ) — gom phép tách vào `laSoTietKiem()`/`tongQuyThuong()`, đúng tinh thần §6.3. Thêm: `tongDeDanh()` giờ loại cả `lai` (tiền bank trả không phải tiền bồ để dành ra); `moSoTietKiem()` **xoá bù** hàng quỹ khi bút toán hỏng, vì PostgREST không có giao dịch trải nhiều lời gọi |
| **23/08/2026 (2)** | **Biểu đồ chênh lệch xong ⇒ Pha 3 đóng.** Sửa §10: đề xuất "cặp màu trung tính" của v2.0 bị bác — đo lại thấy hai sắc độ chỉ cách 11,7 đơn vị RGB sau mô phỏng mù màu, chốt **một màu duy nhất**, chiều thay đổi mã hoá bằng **vị trí** quanh vạch 0. Thêm luật **mẫu số chung cho cả hai chiều**. Danh mục kỳ trước 0đ hiện "mới" chứ không hiện ∞% (§7.8); danh mục **bỏ hẳn** vẫn phải có mặt vì đó là thông tin đáng giá nhất. Giữ thứ tự slot cho cả ba khối của màn ② để mắt không phải dò lại |
| **23/08/2026 (3)** | Đưa **mockup nền bầu trời vào repo** (`mockup-v3-ba-bau-troi.html`). Trước đó nó chỉ tồn tại dưới dạng artifact đã publish + một bản trong thư mục tạm — Khôi mở mockup v2 tìm nền bầu trời không thấy mới lộ ra. Phát hiện kèm: **Fraunces trên CDN Google thiếu glyph `ầ` và `ồ`**, nên mockup hiện "Sổ của Bô`" sai. App không dính vì Pha 0 đã tự host bản tiếng Việt; mockup giờ trỏ sang đúng bộ font của app để bản vẽ và bản thật giống nhau theo cấu tạo |
| **23/08/2026 (4)** | Thêm **Pha 3.5 — vỏ giao diện** vào lộ trình: §15 chia pha theo TÍNH NĂNG nên không pha nào nhận việc dựng thanh nav, lưới ghi nhanh, thanh nhịp, bộ icon — việc đó rơi qua khe giữa các pha và là lý do thật khiến UI lệch mockup. Dựng xong vỏ · **nền bầu trời** ba cảnh (chọn tay được, lưu ở `cau_hinh`) · **mặt trời, mây, sao, trăng** vẽ bằng SVG tĩnh · **hoa cúc tuần này** kéo từ Pha 5 lên vì dữ liệu đã có sẵn trong `giao_dich`, không cần truy vấn mới. Vườn 8 tuần vẫn ở Pha 5 |
| **24/08/2026** | **Luồng bốn bước lương → để dành → hũ → tổng kết** (Khôi chốt 23/08). Gom lại thành một chuỗi vì đó là NGHI THỨC ĐẦU CHU KỲ — tách rời thành bốn mục riêng thì bồ làm bước một xong là thoát, và hũ mãi mãi không được đặt. Mỗi bước bỏ qua được, nhưng "Để sau" là lối ĐI TIẾP chứ không phải lối thoát khỏi luồng. Màn tổng kết đọc từ trên xuống như một phép trừ, kết bằng đúng con số màn ① sẽ hiện — trả lời câu "vì sao hôm nay chỉ tiêu được ngần này" (§10 nguyên tắc 4). Thời điểm đề xuất hũ dời từ lúc ĐÓNG chu kỳ sang lúc NHẬP LƯƠNG: lúc đóng chu kỳ bồ đã phải quyết chuyện lấn quỹ rồi, chồng thêm quyết định thứ hai vào đó thì bồ bấm bừa |
| **24/08/2026 (2)** | **Rà xong 42 nhãn `[ĐX?]`** của vòng review 18/08 — đối chiếu từng cái với code thật, không tin trí nhớ. Gỡ hẳn **26** cái đã code và chạy được; **11** cái đã chốt nhưng chưa tới pha thì đổi sang `[Pha N]` để biết còn nợ gì; còn lại là chú thích, không phải đề xuất. Sửa nốt con số hero sai trong mockup v2 (235.000 → **156.667**) — mọi con số trong một bản vẽ phải thuộc cùng MỘT kịch bản. Màn ghi nhanh không cần mockup riêng nữa vì Pha 3.5 đã dựng thẳng theo v2 |
| **24/08/2026 (3)** | **Pha 4 phần PWA xong**: manifest · icon bông cúc · service worker · màn hướng dẫn cài (AT-06). Icon chọn hoa cúc chứ không phải ví hay đồng xu — §9.2 chốt ẩn dụ xuyên suốt là "ghi chép = hoa nở", mà bồ nhìn icon này mỗi ngày. Service worker viết tay, không Workbox (§5 cắt phụ thuộc thừa), và **tuyệt đối không cache lời gọi Supabase**: số dư cũ hiện ra như số dư thật thì tệ hơn hẳn một thông báo lỗi. Chỉ đăng ký ở bản build thật — bật ở dev thì nó cache mất bản cũ và HMR ngừng ăn. Còn lại **Web Push + cron**, phần này cần Cloudflare Worker |
| **25/08/2026** | **Đi thử từng luồng trên máy thật** (13 luồng, 10 tình huống hiếm) — tìm được 3 lỗi mà 301 test và `tsc` đều không thấy. ① Màn ② đổ vì `chuKyLienTruoc()` đổi sang nhận NGÀY nhưng một chỗ gọi vẫn truyền `chuKyId` — cùng kiểu `string` nên trình biên dịch im lặng; sửa bằng **branded type `NgayLocal`**, và nó bắt luôn một chỗ thứ hai chưa ai biết. Đây là lần thứ HAI kiểu lỗi "hai tham số cùng kiểu" cắn (lần đầu 23/08 với `ghiBienDong`) ⇒ **quy ước mới: mọi tham số là ngày phải nhận `NgayLocal`, không nhận `string`**. ② **Đổi ngày lương không chạy được** — dời ranh giới bằng hai lệnh update nối đuôi thì ở giữa chúng hai chu kỳ buộc phải hoặc chạm nhau (ràng buộc `EXCLUDE` chặn) hoặc hở ra (giao dịch rơi khỏi mọi chu kỳ); đảo thứ tự chỉ đổi lỗi này lấy lỗi kia, nên **migration 0010** làm ràng buộc `deferrable` và gộp cả hai vào MỘT giao dịch. ③ Lịch sử tự xáo thứ tự sau mỗi lần huỷ vì chỉ sắp theo `xay_ra_luc` mà nhiều khoản trùng giờ — thêm `tao_luc` làm khoá phụ |
| **25/08/2026 (2)** | **Sổ tiết kiệm CÓ kỳ hạn không nhận nạp thêm giữa chừng.** Thử bỏ 100k vào sổ 50tr mở 23/05 thì lãi nhảy 708.219đ → 709.635đ: công thức tính lãi trên gốc kể từ NGÀY GỬI nên 100k bỏ vào hôm nay được trả lãi ngược cho 94 ngày nó chưa từng nằm trong sổ. Phép tính nhất quán nhưng ngân hàng không trả đồng nào trong đó — mà §1 nói app sống bằng việc bồ TIN con số. Ngân hàng VN cũng không cho nạp thêm vào sổ đang chạy, nên `nhanThemDuoc()` là mô tả sự thật ngoài đời chứ không phải rào cản app tự dựng, cùng loại với `cho_phep_muon = 'khoa'`. Sổ **không kỳ hạn** vẫn nhận góp. Khôi chốt sau khi cân ba lựa chọn |
| **27/08/2026** | **Audit bảo mật toàn hệ thống**, đo bằng chính khoá công khai moi từ bundle chứ không đọc code. Hai lỗ hổng: ① `seed_nguoi_dung_moi` và `sinh_id` gọi được KHÔNG CẦN ĐĂNG NHẬP — Postgres mặc định cấp `EXECUTE` cho `PUBLIC` và Supabase phơi mọi hàm schema `public` thành RPC. `seed_nguoi_dung_moi` còn là `security definer` nên bỏ qua RLS, ghi vào 4 bảng; chưa hại thật vì mọi insert đều có `where not exists`, nhưng an toàn không nên dựa vào một tính chất dễ vô tình phá. Kèm hai hệ quả: uid thật trả 204 còn uid bịa trả 409 ⇒ máy dò tài khoản, và không rate limit ⇒ 20 lời gọi ghi trong 228ms. **Migration 0011** thu hồi quyền; đã đo lại: ẩn danh nhận 401, còn người đăng nhập vẫn ghi giao dịch / đặt hũ / tạo quỹ / đổi ngày lương bình thường (`sinh_id` chạy làm giá trị mặc định của cột, không qua RPC). ② **Thiếu cả 7 header bảo mật** — nặng nhất là CSP, vì §5 chọn gọi thẳng Supabase từ trình duyệt nên token nằm trong `localStorage`, dính XSS một lần là mất tài khoản. Siết CSP sau khi kiểm bản build thật: 0 script inline nên không nới `script-src`, font tự host hết nên KHÔNG mở fonts.googleapis/gstatic — mở sẵn "phòng khi" là cách CSP mục dần thành vô dụng. **Rate limit:** auth CÓ (Supabase trả 429), tầng dữ liệu KHÔNG có gì — ghi nhận, chưa xử lý. **Phần đã đo và đang tốt:** RLS đủ 13/13 bảng · token người này đọc dữ liệu người kia ra 0 dòng trên cả 13 bảng, chèn hộ bị 403 · `su_kien` chỉ ghi thêm được, chính chủ cũng không sửa/xoá nổi · chặn xoá cứng `giao_dich`/`chu_ky`/`bien_dong_quy` · npm audit 0 lỗ hổng |
| **27/08/2026 (2)** | **`vars` trong `wrangler.jsonc` THAY THẾ toàn bộ biến Text trên dashboard mỗi lần deploy.** `SUPABASE_URL` điền tay trên dashboard sẽ bị xoá ở lần deploy kế tiếp, rồi cron gọi `fetch(undefined + "/rest/v1/...")` và hỏng IM LẶNG. Khai nó thẳng vào file. Quy tắc từ nay: **mọi biến Text worker cần đều phải có mặt trong `wrangler.jsonc`**, dashboard chỉ dùng cho Secret. Cả hai giá trị trong khối `vars` đều công khai được nên nằm trong repo là đúng chỗ — thứ bảo vệ dữ liệu là RLS, không phải giấu chúng (§5) |
| **27/08/2026 (3)** | **Trần danh mục 6 → 10, và bảng màu giờ có kiểm định CHẠY ĐƯỢC.** Trần 6 bị chặn bởi MÀU chứ không bởi kỹ thuật (§7.1), nên nới trần phải giải bài toán màu trước. Lần đầu để thuật toán tối đa hoá khoảng cách màu — nó nhả ra xanh neon, navy, vàng chói: đúng số đo mà đứng cạnh sáu màu cũ thì không còn là một bộ. Khôi yêu cầu hướng pastel, **đo thử thì số liệu BÁC luôn hướng đó**: 10 màu pastel cùng độ sáng cho ΔE 1,5 với người mù đỏ-lục và 8,4 với thị giác THƯỜNG — dưới cả ngưỡng 15; cho độ sáng so le cũng chỉ lên 2,2. Không phải chuyện thẩm mỹ mà là biểu đồ hết đọc được. Cách đúng hoá ra ngược lại: đặt SÀN an toàn trước (ΔE ≥ 9 mù đỏ-lục, ≥ 16 thường, lệch hue ≥ 24°) rồi trong số đạt sàn chọn màu DỊU NHẤT. App vốn đã pastel ở chỗ cần pastel — nền thẻ và ô icon đều là bản pha trắng 86%, màu đậm chỉ ở chấm icon nhỏ và vành donut mỏng. Sáu màu gốc giữ nguyên từng ký tự. **`mu-mau.test.ts`**: mô phỏng Viénot 1999 + CIEDE2000 chạy mỗi lần test, kèm 4 ca tự kiểm chính công cụ — từ Pha 0 tới giờ "đã kiểm định mù màu" chỉ là một câu trong tài liệu, không có gì chặn nếu ai đó sửa một mã hex. ⚠️ Thước mới KHÔNG tái lập con số 9,0/16,8 của §11.1 (bộ 6 màu cũ đo ra 5,0/24,7); tài liệu không ghi phương pháp cũ nên không kết luận bên nào sai, lấy thước mới làm chuẩn với mốc "không tệ hơn bộ 6 gốc" |
| **27/08/2026 (4)** | **HAI con số trần, đừng lẫn: `SLOT_TOI_DA = 10` là trần MÀU, `O_MAN_CHINH = 6` là trần MÀN HÌNH.** Lưới ghi nhanh quá 6 ô thì đẩy thanh nhịp tuần xuống dưới nếp gấp, mà ghi nhanh là tính năng số 1 (§8) — đo thật trên iPhone 13 từ Pha 3.5. Nên từ danh mục thứ 7, bồ gạt công tắc chọn cái nào lên màn chính; màn ① hiện "Xem thêm N mục" ở góc phải, dẫn thẳng vào màn quản lý danh mục. Mục nằm ngoài vẫn ghi được qua nút +. `choManChinh()` tự cắt ở 6 kể cả khi DB bật nhiều hơn — cờ nằm ở DB nên có thể bật quá bằng SQL tay hoặc hai máy sửa cùng lúc, và không cắt thì lưới vỡ bố cục thay vì hiện ít đi. Thêm 20 icon (tổng 31) cho nhu cầu chi tiêu đời thường, cùng lưới 24 / nét 1,7 / đầu tròn / chỉ nét — trộn icon tô đặc vào là giao diện thành chắp vá ngay (§11.5) |
| **28/08/2026** | **Bỏ magic link, chuyển sang email + mật khẩu.** Khôi báo hai chuyện: "mỗi lần vào app là phải điền gmail" và "bấm icon đợi gần 5 giây". Cái đầu KHÔNG phải lỗi giữ phiên — `persistSession` vẫn bật. Gốc rễ: trên iOS, app đưa ra màn hình chính chạy trong kho lưu trữ RIÊNG tách hẳn Safari, nên link trong email mở bằng Safari và phiên rơi vào kho của Safari, còn app mở từ icon vẫn trắng tay → hỏi email → gửi link → lại mở Safari, vòng lặp không lối ra. §5 chọn magic link vì "bồ không phải nhớ thêm một thứ nữa", lý do đúng nhưng thực tế lật lại nó. Đã thử hướng giữ passwordless bằng mã 6–8 số nhập tại chỗ, nhưng email Supabase gửi CHỈ CÓ LINK và gói miễn phí không cho sửa mẫu email nếu chưa cấu hình SMTP riêng — kiểm tận nơi trên dashboard lẫn trong hộp thư thật. Mật khẩu bỏ hẳn email khỏi đường đăng nhập hằng ngày, nên gỡ luôn giới hạn 2–4 email/giờ của gói miễn phí (thứ sẽ khoá bồ ngoài cửa gần một tiếng nếu lỡ bấm gửi lại vài lần). Keychain iPhone giữ hộ mật khẩu nên "phải nhớ thêm một thứ" không còn đúng — form để cả ô email lẫn ô mật khẩu trong CÙNG một `<form>` kèm `autoComplete` chuẩn, thiếu một trong hai thì iOS không nhận ra là form đăng nhập và không mời lưu. Thêm màn **Khác → Mật khẩu** để đổi ngay trong app, nhờ đó đường khôi phục qua email thành lối thoát hiếm dùng chứ không phải đường chính — link đặt lại mật khẩu dính đúng cái bẫy iOS đó. Câu lỗi cố ý KHÔNG nói rõ sai email hay sai mật khẩu: nói rõ là biến ô đăng nhập thành máy dò "email này có tài khoản không" |
| **28/08/2026 (2)** | **Mở app mất gần 5 giây vì cache đang tắt hoàn toàn.** Đo trên bản chạy thật: mọi tài sản trả `max-age=0, must-revalidate`, KỂ CẢ file có mã băm trong tên — mỗi lần mở, trình duyệt hỏi lại máy chủ từng file (1 JS + 1 CSS + 7 font = 9 lượt đi về) chỉ để nghe "chưa đổi". Service worker càng làm nặng vì đang ưu tiên mạng cho MỌI thứ. Tên file trong `/assets/` chứa mã băm nội dung nên bất biến theo cấu tạo — đổi nội dung là Vite sinh tên khác, hỏi lại về chúng là hỏi câu đã biết trước đáp án. Giờ `/assets/*` và `/fonts/*` cache một năm, service worker lấy bản lưu TRƯỚC rồi nạp bản mới ở nền. Riêng `index.html`, `sw.js`, `manifest` vẫn phải hỏi lại: chúng TRỎ TỚI mọi thứ khác, cache là mắc kẹt ở bản cũ sau mỗi lần deploy |
| — | *(ghi tiếp khi có quyết định mới — nhớ ghi cả năm)* |

---

## 17. BẮT ĐẦU TỪ ĐÂU

1. Đọc hết file này. Mở `./mockup-v2-thien-nhien.html` bằng trình duyệt (**chỉ có màn ①, ②, ⑤**).
2. ~~Duyệt hoặc bác các mục `[ĐX?]`~~ ✅ rà xong 24/08/2026 — đó là 43 đề xuất từ review 18/08/2026,
   chốt. Dẫn chứng đầy đủ nằm trong lịch sử git của `REVIEW-CLAUDE-MD.md`.
3. Trả lời **H1 và H4** (§16). H4 ảnh hưởng tên thư mục gốc nên cần trước Pha 0.
4. Làm **Pha 0** (§15). **Không viết tính năng nào** ở Pha 0 — chỉ nền móng, backup, token màu.
5. Trước khi sang pha sau: chạy hết acceptance test của pha hiện tại, **kể cả bước "chạy lại lần 2"**.
6. Mỗi quyết định mới → một dòng vào §16 (**kèm năm**) và, nếu là quyết định kiến trúc, một file trong
   `docs/adr/`.
