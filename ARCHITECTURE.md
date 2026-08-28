# BÁO CÁO TOÀN DIỆN VỀ KIẾN TRÚC & REVIEW MÃ NGUỒN
**Dự án:** `sobo` (Sổ của Bồ)  
**Phiên bản hệ thống:** 2.0 (Pha 0–3)  
**Vai trò:** Lead Architect / Senior Software Engineer  
**Ngày lập:** 27/08/2026  

---

# MỤC LỤC
1. **PHẦN I: TỔNG QUAN KIẾN TRÚC CHUẨN (`ARCHITECTURE.MD`)**
   - 1.1. Định danh dự án & Mục tiêu hệ thống
   - 1.2. Sơ đồ khối kiến trúc hệ thống (System Architecture Diagram)
   - 1.3. Cấu trúc thư mục & Đánh giá ranh giới Module (Directory Structure)
   - 1.4. Các thành phần cốt lõi (Core Components)
   - 1.5. Thiết kế dữ liệu & Bút toán (Data Stores & Ledger Design)
   - 1.6. Tích hợp ngoài & Hệ thống thông báo (External Integrations & Push)
   - 1.7. Kiến trúc bảo mật (Security & Zero-Trust Client)
   - 1.8. Các bất biến kiến trúc cốt lõi (Core Architectural Invariants)
   - 1.9. Môi trường phát triển, Kiểm thử & Vận hành (Testing & Ops)
   - 1.10. Từ điển thuật ngữ nghiệp vụ (Domain Ubiquitous Language)
2. **PHẦN II: BÁO CÁO AUDIT & REVIEW CODE CHUYÊN SÂU**
   - 2.1. Bảng ma trận rủi ro & Mức độ ưu tiên (P0 – P2)
   - 2.2. Chi tiết các Điểm Chết (Blockers, Dead Logic & Data Loss)
   - 2.3. Chi tiết các Điểm Có Thể Bị Lỗi (Potential Bugs, Race Conditions)
   - 2.4. Chi tiết các Điểm Dư Thừa & Bất Nhất (Redundancies & Inconsistencies)
3. **PHẦN III: KẾ HOẠCH HÀNH ĐỘNG KHUYẾN NGHỊ (ACTION PLAN)**

---

# PHẦN I: TỔNG QUAN KIẾN TRÚC CHUẨN (`ARCHITECTURE.MD`)

## 1.1. Định danh dự án & Mục tiêu hệ thống
- **Tên dự án:** `sobo` (Sổ của Bồ)
- **Mô hình:** Serverless Client-First PWA (Progressive Web App) + Backend-as-a-Service (BaaS) + Edge Cron Worker.
- **Thiết bị mục tiêu:** iPhone (iOS Safari PWA / Add to Home Screen).
- **Mục tiêu cốt lõi (S1–S3):**
  - **S1 (Duy trì):** $\ge$ 60/90 ngày có ít nhất 1 giao dịch.
  - **S2 (Tốc độ):** Mở app $\rightarrow$ Lưu xong $\le$ 5 giây (Đường nhập liệu 3 chạm).
  - **S3 (Toàn vẹn):** 0 sự cố mất bản ghi, không âm quỹ, audit trail bất biến.

---

## 1.2. Sơ đồ khối kiến trúc hệ thống (System Architecture Diagram)

```
[User on iPhone (Safari PWA)]
        │
        ├── (1. Tải Static Shell & Font / HMR) ────────► [Cloudflare Worker (CDN Assets)]
        │                                                       │ (Single-Page App fallback)
        │                                                       ▼
        │                                              [web/dist (Vite Build)]
        │
        ├── (2. PostgREST REST API / RLS) ────────────► [Supabase Managed Cloud]
        │   (Anon Key in Bundle, Verified by Auth UID)          ├── PostgreSQL 15 (13 Bảng)
        │                                                       ├── Row Level Security (RLS)
        │                                                       ├── Storage Bucket ('sao-luu')
        │                                                       └── Auth (Magic Link OTP)
        │
[Cloudflare Cron: 0 * * * *] ──► [Worker: Push Scheduler] ─────► [Apple Web Push (APNs via VAPID)] ──► [User Device]
[Admin Local / CI Actions]   ──► [Backup/Restore Scripts] ─────► [Supabase DB & Storage Dump]
```

---

## 1.3. Cấu trúc thư mục & Đánh giá ranh giới Module

### Cấu trúc thực tế:
```
App Chi tieu/
├── web/                       # Ứng dụng PWA Frontend (React 19 + Vite + Tailwind v4)
│   ├── public/                # Static assets (fonts, icons, sw.js, manifest)
│   └── src/
│       ├── app/               # Root App, State Navigation & Context Shell
│       ├── features/          # Feature-Driven Modules (hom-nay, ghi-nhanh, quy, thong-ke...)
│       ├── shared/
│       │   ├── api/           # Supabase PostgREST Client & Typed Wrappers
│       │   ├── design/        # Design Tokens (Màu an toàn mù màu, Icon)
│       │   ├── domain/        # 100% Pure Business Logic (Toán, Chu kỳ, Ngân sách)
│       │   └── ui/            # UI Primitives & Pure SVG Visualizations
├── worker/                    # Edge Worker (Static Asset Routing + Hourly Cron Push)
│   └── index.ts
├── supabase/                  # Quản lý Database & Migrations
│   ├── migrations/            # 13 migration SQL files (DDL, Triggers, RLS)
│   └── tests/                 # SQL Verification Scripts
├── scripts/                   # Ops Scripts (Backup JSON, Disaster Recovery Restore)
│   ├── backup.ts
│   ├── restore-from-backup.ts
│   └── chung.ts
├── backups/                   # Lưu trữ bản snapshot JSON cục bộ off-site
└── wrangler.jsonc             # Cấu hình triển khai Cloudflare Worker & Cron triggers
```

### Đánh giá cấu trúc:
- **Ưu điểm lớn:** Áp dụng mô hình **Feature-Driven Architecture** và **Domain-Driven Design (DDD)**. Tầng `shared/domain` là các Pure Functions không phụ thuộc React/DOM, giúp đạt 355 unit tests xanh tuyệt đối với tốc độ < 800ms.
- **Điểm cần chuẩn hoá:** `worker/index.ts` đang import ngược vào `web/src/shared/domain/`. Về ranh giới Module, nên gom `domain/` thành thư mục dùng chung cấp cao nhất (`packages/domain/` hoặc `shared/domain/` ở root).

---

## 1.4. Các thành phần cốt lõi (Core Components)

### 1.4.1. Frontend PWA (`web/`)
- **Công nghệ:** React 19, TypeScript (strict), Vite 8, Tailwind CSS v4, Vitest.
- **Nhiệm vụ:**
  - Cung cấp giao diện nhập liệu 3 chạm (Bàn phím đơn vị nghìn, nút số tắt).
  - Quản lý trạng thái xem theo 4 Tab chính (`Hôm nay`, `Lịch sử`, `Quỹ`, `Khác`) và các luồng chức năng độc lập.
  - Vẽ trực quan hoá tài chính bằng SVG thuần (Donut chart, Thanh nhịp, Biểu đồ chênh lệch, Hoa cúc).
- **Offline / Caching:** `sw.js` thủ công (chỉ cache Static Shell và Fonts; **tuyệt đối không cache dữ liệu tiền tệ Supabase** để tránh hiển thị sai lệch).

### 1.4.2. Edge Worker (`worker/index.ts`)
- **Công nghệ:** Cloudflare Workers (TypeScript native, V8 isolate).
- **Nhiệm vụ:**
  - Phục vụ Static Assets cho binding `ASSETS` với fallback Single Page Application.
  - Lịch Cron hằng giờ (`0 * * * *` UTC) tính toán múi giờ Việt Nam (UTC+7) để gửi Web Push Notification nhắc nhở ghi chép khi nhịp tuần sắp đạt (4/7 cánh hoa cúc).

### 1.4.3. Backend-as-a-Service (`Supabase Cloud`)
- **Công nghệ:** Managed PostgreSQL 15, PostgREST REST API, GoTrue Auth.
- **Nhiệm vụ:**
  - Cung cấp REST endpoint với cơ chế phân quyền hàng (RLS).
  - Quản lý phiên đăng nhập Magic Link (Passwordless).

---

## 1.5. Thiết kế dữ liệu & Bút toán (Data Stores & Ledger Design)

Hệ thống gồm **13 bảng** với nguyên tắc cốt lõi: **"Không bao giờ lưu số đã tính được (Calculated on-the-fly)"**.

| Bảng | Vai trò | Ràng buộc then chốt |
| :--- | :--- | :--- |
| `danh_muc` | Phân loại chi tiêu | Tối đa 10 slot màu; Slot duy nhất cho các mục `active`; 1 mục hệ thống `la_he_thong = true`. |
| `chu_ky` | Chu kỳ theo ngày lương | Ràng buộc loại trừ `EXCLUDE USING gist (daterange)` không chồng lấn, không hở. |
| `thu_nhap` | Thu nhập thực nhận | Neo theo `chu_ky_id`, không gộp vào `giao_dich`. |
| `giao_dich` | Các khoản chi/thu/để dành | Trạng thái `da_xac_nhan`, `cho_xac_nhan`, `da_huy` (kèm `ly_do_huy`). |
| `quy` | Quỹ dự phòng & Sổ tiết kiệm | `lai_suat_nam` (lưu dạng điểm cơ bản bps), `cho_phep_muon` (`tu_do` / `khoa`). |
| `khoan_muon_quy`| Quản lý nợ quỹ khi lấn quỹ | Ràng buộc trần 15% thu nhập, kỳ hạn linh hoạt. |
| `bien_dong_quy` | Sổ cái bút toán quỹ | Bút toán kép: `so_du_ban_dau`, `gop`, `rut`, `muon`, `tra_no`, `lai`. Trigger chặn số dư âm. |
| `han_muc` | Hũ ngân sách danh mục | Primary key ghép `(chu_ky_id, danh_muc_id)`. Xoá dòng khi đặt 0đ. |
| `quyet_dinh_mua`| Trì hoãn mua sắm | Bậc để nguội 24h / 48h / 7 ngày. |
| `cau_hinh` | Tham số hệ thống | Key-value JSONB (giờ nhắc, mốc cảnh báo, trần nợ). |
| `cau_dong_vien`| Lời nhắn động lực | Tông mừng / trung tính / quan tâm. Không lặp trong 14 ngày. |
| `su_kien` | Audit log bất biến | Append-only (chặn UPDATE / DELETE bằng RLS). Đo `duration_ms` phục vụ S2. |
| `push_subscription` | Quản lý Web Push Endpoint | Unique `(user_id, endpoint)`. |

---

## 1.6. Tích hợp ngoài & Hệ thống thông báo (External Integrations)
- **Apple Web Push (APNs via VAPID RFC 8292):**
  - Đẩy gói tin rỗng không payload (service worker tự hiển thị câu chữ). Bỏ qua mã hóa AES-128-GCM phức tạp.
  - Tự động đánh dấu `dead` khi nhận HTTP 404/410 để dọn subscription cũ trên iOS.
- **Supabase Auth:** Xác thực qua Magic Link gửi email trực tiếp, không sử dụng mật khẩu.

---

## 1.7. Kiến trúc bảo mật (Security & Zero-Trust Client)
1. **Zero-Trust Client Key:** Khoá `anon` nằm công khai trong bundle Vite. Bức tường bảo vệ **DUY NHẤT** là Postgres Row Level Security (RLS) với predicate `user_id = (select auth.uid())`.
2. **Strict Append-Only & No Hard-Delete:** 
   - `giao_dich`, `chu_ky`, `bien_dong_quy` có policy cấm lệnh `DELETE`.
   - `su_kien` cấm cả `UPDATE` lẫn `DELETE`.
3. **Quản lý Secrets an toàn:** Khóa `SUPABASE_SERVICE_ROLE_KEY` và `VAPID_RIENG_TU` chỉ tồn tại trong Cloudflare Worker Secret và file `.env` local của lập trình viên.

---

## 1.8. Các bất biến kiến trúc cốt lõi (Core Architectural Invariants)
1. **Tiền tệ (Money Invariant):** 100% số nguyên đơn vị Đồng (`bigint` trong SQL, Branded type `Dong = number & { readonly __brand: 'dong' }` trong TypeScript). **Tuyệt đối cấm `float`, `numeric`, `parseFloat`**.
2. **Thời gian & Múi giờ (Timezone Invariant):** Database lưu UTC `timestamptz`. Tầng logic kinh doanh luôn quy đổi và dẫn xuất theo ngày lịch Việt Nam UTC+7 (`ngay_local: 'YYYY-MM-DD'`).
3. **Số dư dẫn xuất (Derived Balances):** Số dư quỹ là $\sum \text{bien\_dong\_quy.so\_tien}$, không bao giờ lưu trường `so_du` tĩnh.
4. **Không âm tính (Non-negativity & Safe UI):** Không bao giờ hiển thị NaN, $\infty$, hoặc số âm tại con số lớn màn hình chính. Quỹ được bảo vệ bằng trigger kiểm tra số dư commit-time `chan_so_du_am()`.

---

## 1.9. Môi trường phát triển, Kiểm thử & Vận hành (Testing & Ops)
- **Kiểm thử tự động:** Vitest với 355 unit tests kiểm thử 100% các tình huống biên (ngày nhuận, chu kỳ qua năm, mù màu đỏ-lục CIEDE2000, lãi suất ngân hàng).
- **Quy trình Sao lưu & Phục hồi:**
  - Dump toàn bộ DB ra JSON, upload lên Private Bucket Storage và ghi file cục bộ tại `backups/`.
  - Phục hồi khẩn cấp tự động hoá theo đúng thứ tự phụ thuộc khoá ngoại.

---

## 1.10. Từ điển thuật ngữ nghiệp vụ (Domain Ubiquitous Language)
- **Nhịp tuần (Hoa cúc):** Đo lường sự chăm sóc ghi chép trong tuần (5/7 cánh nở vàng nhuỵ).
- **Hũ (Hạn mức):** Số tiền phân bổ tối đa cho một danh mục trong một chu kỳ cụ thể.
- **Tiêu chung:** Phần ngân sách còn lại sau khi đã trừ các hũ và khoản để dành.
- **Chưa biết xếp đâu:** Danh mục hệ thống dành cho trường hợp lưỡng lự khi ghi nhanh, không chiếm slot màu dữ liệu.
- **Điểm cơ bản (bps):** Đơn vị đo lãi suất sổ tiết kiệm ($1\% = 100 \text{ bps}$, $5.5\% = 550 \text{ bps}$) để loại bỏ sai số dấu phẩy động.

---

# PHẦN II: BÁO CÁO AUDIT & REVIEW CODE CHUYÊN SÂU

Sau khi rà soát toàn bộ các tầng mã nguồn, dưới đây là các phát hiện phân loại theo mức độ nghiêm trọng.

---

## 2.1. Bảng ma trận rủi ro & Mức độ ưu tiên

| Mức độ | Nhóm vấn đề | Vị trí phát hiện | Tác động hệ thống |
| :--- | :--- | :--- | :--- |
| **P0** | **Mất dữ liệu sao lưu** | `scripts/chung.ts` | Không backup/restore được bảng `han_muc`. |
| **P0** | **Crash Runtime Exception** | `shared/api/supabase.ts`, `chu-ky.ts` | `bocLoi()` ném lỗi crash UI khi gọi hàm `void`. |
| **P1** | **Tê liệt tính năng Cron** | `worker/index.ts` | Đổi giờ nhắc vô tác dụng do Type Mismatch. |
| **P1** | **Deadlock / Sai luồng UI** | `App.tsx` (dòng 377) | Nút "Quay lại" ở Đặt hũ nhảy sang bước Tổng kết. |
| **P1** | **Truy vấn tràn bộ nhớ** | `worker/index.ts` | Fetch toàn bộ bảng `giao_dich` không lọc ngày. |
| **P2** | **Mất màu danh mục mới** | `ManGhiNhanh.tsx`, `ManDanhSach.tsx` | Slot 7–10 bị fallback về màu xám do hardcode. |
| **P2** | **Bất nhất dữ liệu phân tán** | `shared/api/quy.ts` (`deDanh`) | Mất mạng làm lệch giữa giao dịch và bút toán quỹ. |
| **P2** | **Kẹt màn hình Auth** | `ManDangNhap.tsx` | Không có nút gửi lại khi đã phát OTP. |

---

## 2.2. Chi tiết các Điểm Chết (Blockers, Dead Logic & Data Loss)

### 🔴 Điểm chết 1: Bỏ quên bảng `han_muc` trong hệ thống Backup & Phục hồi
- **Vị trí:** `scripts/chung.ts` (dòng 16–29), `scripts/backup.ts`, `scripts/restore-from-backup.ts`
- **Thực trạng mã nguồn:**
  Mảng `BANG` khai báo 12 bảng: `danh_muc`, `chu_ky`, `quy`, `thu_nhap`, `khoan_muon_quy`, `giao_dich`, `bien_dong_quy`, `quyet_dinh_mua`, `cau_hinh`, `cau_dong_vien`, `su_kien`, `push_subscription`. Bảng `han_muc` (tạo ở migration `0008`) **bị bỏ quên hoàn toàn**.
- **Hậu quả:** 
  Khi xảy ra sự cố cần restore từ bản sao lưu, dữ liệu hũ chi tiêu của toàn bộ các chu kỳ sẽ **bị xóa sạch vĩnh viễn**, vi phạm tiêu chí sống còn **S3**.

---

### 🔴 Điểm chết 2: Hàm `bocLoi()` ném Exception khi RPC trả về `void`
- **Vị trí:** `web/src/shared/api/supabase.ts` (dòng 59–61), `web/src/shared/api/chu-ky.ts` (dòng 178)
- **Thực trạng mã nguồn:**
  Hàm Stored Procedure `doi_ranh_gioi_chu_ky` có kiểu `RETURNS void`. PostgREST trả về `{ data: null, error: null }`.
  Trong khi đó, `bocLoi()` kiểm tra:
  ```ts
  if (kq.data === null || kq.data === undefined) {
    throw new Error(`${viec}: không có dữ liệu trả về`)
  }
  ```
- **Hậu quả:** Thao tác đổi ngày bắt đầu chu kỳ dù database thực thi hoàn hảo nhưng UI client luôn bị ném lỗi `"Dời ranh giới chu kỳ: không có dữ liệu trả về"`, khiến giao diện báo đỏ thất bại.

---

### 🔴 Điểm chết 3: Type Mismatch làm vô hiệu hoá giờ nhắc trong Worker Cron
- **Vị trí:** `worker/index.ts` (dòng 125–130), `supabase/migrations/20260818180000_seed_nguoi_dung_moi.sql` (dòng 50)
- **Thực trạng mã nguồn:**
  Trong DB seed, `gio_nhac` được lưu là chuỗi JSON: `'gio_nhac', '"21:00"'`.
  Worker đọc giá trị:
  ```ts
  const gioNhac = typeof ch[0]?.gia_tri === 'number' ? ch[0].gia_tri : GIO_NHAC_MAC_DINH
  ```
- **Hậu quả:** `typeof ch[0]?.gia_tri` trả về `'string'`, phép so sánh kiểu `number` luôn trả về `false`. Worker bị ghim cứng vào giá trị mặc định 21h; người dùng chỉnh giờ nhắc thành 20h hay 22h đều hoàn toàn vô tác dụng.

---

### 🔴 Điểm chết 4: Lỗi điều hướng ngược (Deadlock UX) trong Luồng 4 bước
- **Vị trí:** `web/src/app/App.tsx` (dòng 377)
- **Thực trạng mã nguồn:**
  Tại màn hình `ManDatHu` (Bước 3):
  ```tsx
  onQuayLai={() => (buoc > 0 ? void buocKe('tong_ket') : setMan('hom_nay'))}
  ```
- **Hậu quả:** Khi người dùng đang trong luồng nhập lương $\rightarrow$ để dành $\rightarrow$ đặt hũ (`buoc = 3`), nếu bấm nút "Quay lại", app lại gọi `buocKe('tong_ket')`, **tự động đẩy người dùng sang Bước 4 (Tổng kết) thay vì quay về Bước 2 (Để dành)**.

---

## 2.3. Chi tiết các Điểm Có Thể Bị Lỗi (Potential Bugs & Inconsistencies)

### 🟡 Điểm lỗi 1: Worker fetch toàn bộ bảng `giao_dich` không giới hạn thời gian
- **Vị trí:** `worker/index.ts` (dòng 140–147)
- **Chi tiết:** Câu truy vấn `giao_dich?select=ngay_local&user_id=eq.${userId}&trang_thai=neq.da_huy` không có `gte/lte` theo ngày đầu/cuối tuần. Khi dữ liệu vượt trần 1000 bản ghi của PostgREST, các giao dịch tuần mới nhất có nguy cơ bị loại bỏ khỏi mảng trả về, làm Worker tính sai nhịp hoa cúc.

---

### 🟡 Điểm lỗi 2: Thiếu rollback bù khi ghi giao dịch Để dành (`deDanh`)
- **Vị trí:** `web/src/shared/api/quy.ts` (dòng 133–165)
- **Chi tiết:** `deDanh()` thực hiện 2 lệnh gọi REST riêng rẽ: `giao_dich` (chuyển vào quỹ) và `bien_dong_quy` (góp). Nếu lệnh thứ hai thất bại do mất kết nối, hệ thống không xoá bản ghi `giao_dich` đã tạo ở bước 1, dẫn đến lịch sử có giao dịch để dành nhưng số dư thực tế của quỹ không tăng.

---

### 🟡 Điểm lỗi 3: Race condition trong hàm nạp dữ liệu `nap()` tại `App.tsx`
- **Vị trí:** `web/src/app/App.tsx` (dòng 145–183)
- **Chi tiết:** Hàm `nap()` thực hiện nhiều lời gọi mạng bất đồng bộ nhưng không có cơ chế huỷ bỏ (cờ huỷ hoặc `AbortController`). Khi người dùng chuyển tab hoặc tương tác nhanh, kết quả trả về chậm từ request cũ có thể ghi đè làm sai lệch state của request mới.

---

### 🟡 Điểm lỗi 4: Trạng thái render mồ côi (Orphan State Fallthrough)
- **Vị trí:** `web/src/app/App.tsx` (dòng 392, dòng 417)
- **Chi tiết:** Điều kiện `if (man === 'tong_ket' && thuNhap !== null && ns !== null)` nếu không thỏa mãn sẽ rơi xuống nhánh render mặc định `ManHomNay`, trong khi biến state `man` vẫn giữ giá trị `'tong_ket'`, gây bất nhất giữa thanh điều hướng và nội dung hiển thị.

---

## 2.4. Chi tiết các Điểm Dư Thừa & Bất Nhất (Redundancies & Inconsistencies)

### 🟡 Điểm dư thừa 1: Hardcode bảng màu 6 slot tại các màn hình thao tác
- **Vị trí:** `web/src/features/ghi-nhanh/ManGhiNhanh.tsx` (dòng 24–31), `web/src/features/giao-dich/ManDanhSach.tsx` (dòng 19–26)
- **Chi tiết:** Cả 2 file đều tự khai báo hằng số cục bộ `MAU_SLOT` chỉ chứa slot 1–6. Khi người dùng tạo danh mục ở slot 7, 8, 9, 10, các mục này bị fallback về màu xám (`bg-chua-biet`), làm mất các token màu `c7`–`c10` đã được định nghĩa trong `mau.ts`.

---

### 🟡 Điểm dư thừa 2: Tính toán trùng lặp khi chuẩn bị props cho `ManHomNay`
- **Vị trí:** `web/src/app/App.tsx` (dòng 498–520)
- **Chi tiết:** Thao tác lọc `danhMuc.filter(!la_he_thong)` và cắt mảng `choManChinh()` bị lặp lại 2 lần liên tiếp trong cùng một chu kỳ render (cho prop `danhMuc` và prop `soDanhMucAn`).

---

### 🟡 Điểm dư thừa 3: Biến cờ module `daGhiTrongPhien`
- **Vị trí:** `web/src/shared/api/giao-dich.ts` (dòng 25)
- **Chi tiết:** Biến `daGhiTrongPhien` là biến module cấp file, không được reset trong suốt vòng đời của SPA PWA, khiến chỉ duy nhất giao dịch đầu tiên sau khi load trang được đo `duration_app_ms`, các lần ghi sau đó đều nhận `null`.

---

# PHẦN III: KẾ HOẠCH HÀNH ĐỘNG KHUYẾN NGHỊ (ACTION PLAN)

Dưới đây là thứ tự xử lý đề xuất cho các phiên làm việc tiếp theo:

```
[BƯỚC 1: SỬA CÁC LỖI CRITICAL P0]
 ├── 1. Thêm 'han_muc' vào mảng BANG trong scripts/chung.ts (Sau 'quy' và 'danh_muc').
 └── 2. Cập nhật bocLoi() hoặc hàm gọi doi_ranh_gioi_chu_ky để chấp nhận { data: null, error: null }.

[BƯỚC 2: CHUẨN HOÁ LOGIC EDGE WORKER & UX P1]
 ├── 3. Chuẩn hoá kiểu dữ liệu 'gio_nhac' trong Worker (hỗ trợ cả string "21:00" và number 21).
 ├── 4. Thêm bộ lọc ngày (ngay_local >= dauTuan) khi Worker query bảng giao_dich.
 ├── 5. Sửa điều hướng nút "Quay lại" tại ManDatHu (chuyển về 'de_danh' khi buoc > 0).
 └── 6. Bổ sung nút "Nhập lại email" tại ManDangNhap khi đã gửi OTP.

[BƯỚC 3: DỌN DẸP MÃ NGUỒN & ĐỒNG BỘ DESIGN TOKENS P2]
 ├── 7. Thay thế MAU_SLOT cục bộ trong ManGhiNhanh và ManDanhSach bằng mauSlot() từ design/mau.ts.
 ├── 8. Thêm khối try/catch xoá bù cho giao_dich trong hàm deDanh() tại shared/api/quy.ts.
 └── 9. Tối ưu hoá tính toán lặp cho danh mục hiển thị trong App.tsx.
```
