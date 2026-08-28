-- 0001 INIT â€” báº£ng lÃµi. Â§6.1, Â§14.
--
-- Quy Æ°á»›c xuyÃªn suá»‘t má»i migration:
--   Â· Tiá»n lÃ  bigint Ä‘Æ¡n vá»‹ Äá»’NG, khÃ´ng bao giá» numeric/float (Â§14 quy Æ°á»›c 1).
--     Äá»ƒ bigint thÃ¬ táº§ng TypeScript nháº­n Ä‘Æ°á»£c number nguyÃªn, khá»›p tháº³ng vá»›i
--     branded type Dong bÃªn shared/domain mÃ  khÃ´ng pháº£i chuyá»ƒn Ä‘á»•i á»Ÿ giá»¯a.
--   Â· Thá»i gian lÆ°u timestamptz UTC, LÆ¯U THÃŠM cá»™t ngay_local date (Â§14 quy Æ°á»›c 2).
--     Giao dá»‹ch 00:30 ngÃ y 29 giá» VN cÃ³ má»‘c UTC lÃ  17:30 ngÃ y 28 â€” khÃ´ng cÃ³ cá»™t
--     ngay_local thÃ¬ má»i truy váº¥n theo ngÃ y Ä‘á»u lá»‡ch.
--   Â· KhÃ´ng xoÃ¡ cá»©ng bao giá»: Ä‘á»•i tráº¡ng thÃ¡i + ghi lÃ½ do (Â§13).
--   Â· ID mang tiá»n tá»‘ Ä‘á»c Ä‘Æ°á»£c (Â§6.1) Ä‘á»ƒ nhÃ¬n log biáº¿t ngay Ä‘ang xem báº£ng nÃ o.
--
-- KHÃ”NG Sá»¬A FILE NÃ€Y SAU KHI ÄÃƒ CHáº Y (Â§14 quy Æ°á»›c 7) â€” viáº¿t migration má»›i.

create extension if not exists pgcrypto;

/**
 * Sinh id dáº¡ng 'TXN-a3f2c9d1e8b4'. Tiá»n tá»‘ Ä‘á»ƒ Ä‘á»c log, pháº§n sau láº¥y tá»« uuid.
 * 12 kÃ½ tá»± hex â‡’ ~2,8e14 kháº£ nÄƒng; á»Ÿ quy mÃ´ ~10.000 dÃ²ng/nÄƒm (Â§3) xÃ¡c suáº¥t trÃ¹ng
 * lÃ  khÃ´ng Ä‘Ã¡ng ká»ƒ, vÃ  primary key váº«n cháº·n náº¿u cÃ³.
 */
create or replace function sinh_id(tien_to text)
returns text
language sql
volatile
as $$
  select tien_to || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
$$;

/** Cáº­p nháº­t cá»™t sua_luc má»—i láº§n UPDATE. */
create or replace function dat_sua_luc()
returns trigger
language plpgsql
as $$
begin
  new.sua_luc := now();
  return new;
end;
$$;

-- â”€â”€ danh_muc â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

create table danh_muc (
  id            text primary key default sinh_id('CAT'),
  user_id       uuid not null references auth.users(id) on delete cascade,
  ten           text not null,
  -- Hiá»‡n dÆ°á»›i tÃªn nÃºt, lÃ  thá»© giá»¯ cho viá»‡c phÃ¢n loáº¡i nháº¥t quÃ¡n suá»‘t 12 thÃ¡ng (Â§7.1).
  dinh_nghia    text not null default '',
  -- Slot mÃ u 1â€“6 khá»›p Â§11.1. Null dÃ nh cho danh má»¥c há»‡ thá»‘ng "ChÆ°a biáº¿t xáº¿p Ä‘Ã¢u",
  -- vá»‘n cá»‘ Ã½ khÃ´ng chiáº¿m slot dá»¯ liá»‡u Ä‘á»ƒ khÃ´ng tranh chá»— trÃªn donut vá»›i danh má»¥c tháº­t.
  slot          smallint check (slot between 1 and 6),
  icon          text not null default 'plus',
  -- Äá»‹nh nghÄ©a cÃ³ phiÃªn báº£n: Ä‘á»•i giá»¯a chá»«ng thÃ¬ sá»‘ liá»‡u cÅ© mang nghÄ©a khÃ¡c sá»‘ liá»‡u
  -- má»›i. KhÃ´ng cÃ³ cá»™t nÃ y, biá»ƒu Ä‘á»“ so sÃ¡nh 12 thÃ¡ng sáº½ nÃ³i dá»‘i (Â§7.1).
  hieu_luc_tu   date not null default current_date,
  la_he_thong   boolean not null default false,
  thu_tu        smallint not null default 0,
  trang_thai    text not null default 'active' check (trang_thai in ('active', 'archived')),
  tao_luc       timestamptz not null default now(),
  sua_luc       timestamptz not null default now()
);

-- Tráº§n cá»©ng 6 danh má»¥c chi: báº£ng mÃ u Â§11.1 chá»‰ kiá»ƒm Ä‘á»‹nh 6 slot; danh má»¥c thá»© 7
-- khÃ´ng cÃ³ mÃ u há»£p lá»‡, mÃ  cáº¥p mÃ u tá»± Ä‘á»™ng sáº½ phÃ¡ kiá»ƒm Ä‘á»‹nh Î”E mÃ¹ mÃ u.
create unique index danh_muc_slot_duy_nhat on danh_muc (user_id, slot) where slot is not null;
create index danh_muc_theo_user on danh_muc (user_id, trang_thai);

-- â”€â”€ chu_ky â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

create table chu_ky (
  id                        text primary key default sinh_id('CYC'),
  user_id                   uuid not null references auth.users(id) on delete cascade,
  ngay_bat_dau_du_kien      date not null,
  ngay_bat_dau_thuc_te      date not null,
  ngay_ket_thuc             date not null,
  -- Trá»« sáºµn Ä‘á»ƒ dÃ nh trÆ°á»›c khi tiÃªu (Â§7.2). Máº·c Ä‘á»‹nh 0 á»Ÿ chu ká»³ Ä‘áº§u vÃ¬ bá»“ chÆ°a biáº¿t
  -- Ä‘á»ƒ dÃ nh bao nhiÃªu lÃ  há»£p lÃ½; Ä‘áº·t cao quÃ¡ lÃ  vÆ°á»£t ngÃ¢n sÃ¡ch ngay thÃ¡ng Ä‘áº§u rá»“i
  -- láº¥n quá»¹ â€” Ä‘Ãºng vÃ²ng xoÃ¡y ná»£ Â§7.3 sá»£ nháº¥t.
  so_tien_de_danh_dinh_muc  bigint not null default 0 check (so_tien_de_danh_dinh_muc >= 0),
  trang_thai                text not null default 'du_kien'
                            check (trang_thai in ('du_kien', 'dang_chay', 'da_dong')),
  -- Ngoáº¡i lá»‡ duy nháº¥t cá»§a quy táº¯c "khÃ´ng bao giá» lÆ°u sá»‘ Ä‘Ã£ tÃ­nh Ä‘Æ°á»£c" (Â§6.3) â€” cÃ³
  -- chá»§ Ä‘Ã­ch, Ä‘á»ƒ sá»­a danh má»¥c hÃ´m nay khÃ´ng lÃ m Ä‘á»•i bÃ¡o cÃ¡o thÃ¡ng trÆ°á»›c.
  snapshot_json             jsonb,
  tao_luc                   timestamptz not null default now(),
  sua_luc                   timestamptz not null default now(),

  constraint chu_ky_thu_tu_ngay check (ngay_ket_thuc >= ngay_bat_dau_thuc_te),
  -- ÄÃ£ Ä‘Ã³ng thÃ¬ báº¯t buá»™c cÃ³ snapshot, náº¿u khÃ´ng thÃ¬ "báº¥t biáº¿n" chá»‰ lÃ  lá»i há»©a suÃ´ng.
  constraint chu_ky_dong_phai_co_snapshot
    check (trang_thai <> 'da_dong' or snapshot_json is not null)
);

create index chu_ky_theo_user on chu_ky (user_id, ngay_bat_dau_thuc_te desc);
-- RÃ ng buá»™c khÃ´ng chá»“ng láº¥n náº±m á»Ÿ 0003 vÃ¬ cáº§n extension btree_gist.

-- â”€â”€ thu_nhap â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

create table thu_nhap (
  id                  text primary key default sinh_id('INC'),
  user_id             uuid not null references auth.users(id) on delete cascade,
  chu_ky_id           text not null references chu_ky(id) on delete restrict,
  -- Äá»ƒ sáºµn tá»« migration Ä‘áº§u dÃ¹ UI chá»‰ hiá»‡n má»™t nguá»“n: thÃªm cá»™t sau tá»‘n hÆ¡n nhiá»u
  -- so vá»›i Ä‘á»ƒ trá»‘ng (Â§7.5). Báº£ng nguon_thu_nhap hoÃ£n tá»›i khi tháº­t sá»± cÃ³ nguá»“n thá»© hai.
  nguon_thu_nhap_id   text,
  so_tien             bigint not null check (so_tien >= 0),
  trang_thai          text not null default 'du_kien'
                      check (trang_thai in ('du_kien', 'thuc_nhan')),
  ngay_local          date not null,
  tao_luc             timestamptz not null default now(),
  sua_luc             timestamptz not null default now()
);

create index thu_nhap_theo_chu_ky on thu_nhap (user_id, chu_ky_id);

-- â”€â”€ giao_dich â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

create table giao_dich (
  id            text primary key default sinh_id('TXN'),
  user_id       uuid not null references auth.users(id) on delete cascade,
  -- Cho phÃ©p null: giao dá»‹ch "trÃ´i ná»•i" khi chÆ°a thuá»™c chu ká»³ nÃ o pháº£i Lá»˜ RA Ä‘á»ƒ UI
  -- cáº£nh bÃ¡o, khÃ´ng Ä‘Æ°á»£c im láº·ng bá» qua (Â§7.2 rule 2). ÄÃ³ lÃ  cÃ¡ch dá»¯ liá»‡u biáº¿n máº¥t
  -- mÃ  khÃ´ng ai biáº¿t.
  chu_ky_id     text references chu_ky(id) on delete set null,
  loai          text not null check (loai in ('chi', 'thu', 'chuyen_vao_quy', 'rut_tu_quy')),
  danh_muc_id   text references danh_muc(id) on delete restrict,
  quy_id        text,  -- khoÃ¡ ngoáº¡i thÃªm á»Ÿ 0004 vÃ¬ báº£ng quy táº¡o sau
  so_tien       bigint not null check (so_tien > 0),
  ghi_chu       text,

  -- Nháº­p tay vÃ o tháº³ng 'da_xac_nhan' (bá»“ Ä‘ang nhÃ¬n mÃ n hÃ¬nh, Ä‘Ã³ chÃ­nh lÃ  sá»± xÃ¡c
  -- nháº­n); chá»‰ /api/ingest má»›i táº¡o 'cho_xac_nhan' â€” fail closed (Â§13).
  trang_thai    text not null default 'da_xac_nhan'
                check (trang_thai in ('cho_xac_nhan', 'da_xac_nhan', 'da_huy')),
  ly_do_huy     text,
  nguon         text not null default 'thu_cong' check (nguon in ('thu_cong', 'siri', 'ocr')),
  -- KhoÃ¡ chá»‘ng trÃ¹ng do PHÃA Gá»ŒI sinh (Â§12): Shortcut sinh UUID má»—i láº§n cháº¡y. KhoÃ¡
  -- suy ra tá»« ná»™i dung sáº½ nuá»‘t máº¥t giao dá»‹ch tháº­t khi bá»“ mua hai mÃ³n giá»‘ng há»‡t nhau
  -- trong cÃ¹ng má»™t phÃºt â€” vi pháº¡m S3 "0 sá»± cá»‘ máº¥t báº£n ghi".
  idempotency_key text,

  xay_ra_luc    timestamptz not null default now(),
  ngay_local    date not null,
  tao_luc       timestamptz not null default now(),
  sua_luc       timestamptz not null default now(),

  -- Bá»‘n loáº¡i giao dá»‹ch, má»—i loáº¡i cÃ³ bá»™ trÆ°á»ng báº¯t buá»™c riÃªng (Â§6.2). "Äá»ƒ dÃ nh"
  -- KHÃ”NG pháº£i danh má»¥c chi: náº¿u lÃ  danh má»¥c thÃ¬ Ä‘á»ƒ dÃ nh 3tr sáº½ hiá»‡n thÃ nh "Ä‘Ã£ tiÃªu
  -- 3tr", lÃ m sai tá»· lá»‡ Ä‘á»ƒ dÃ nh, donut vÃ  háº¡n má»©c.
  constraint giao_dich_truong_theo_loai check (
    case loai
      when 'chi'            then danh_muc_id is not null and quy_id is null
      when 'thu'            then danh_muc_id is null     and quy_id is null
      when 'chuyen_vao_quy' then danh_muc_id is null     and quy_id is not null
      when 'rut_tu_quy'     then danh_muc_id is null     and quy_id is not null
    end
  ),
  constraint giao_dich_huy_phai_co_ly_do
    check (trang_thai <> 'da_huy' or ly_do_huy is not null)
);

create unique index giao_dich_idempotency
  on giao_dich (user_id, idempotency_key) where idempotency_key is not null;
create index giao_dich_theo_ngay on giao_dich (user_id, ngay_local desc);
create index giao_dich_theo_chu_ky on giao_dich (user_id, chu_ky_id, trang_thai);
-- Giao dá»‹ch trÃ´i ná»•i pháº£i tra ra Ä‘Æ°á»£c ngay Ä‘á»ƒ hiá»‡n cáº£nh bÃ¡o.
create index giao_dich_troi_noi on giao_dich (user_id) where chu_ky_id is null;

-- â”€â”€ cau_hinh â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Â§14 quy Æ°á»›c 5: má»i thá»© ngÆ°á»i-khÃ´ng-pháº£i-ká»¹-sÆ° cÃ³ thá»ƒ muá»‘n Ä‘á»•i Ä‘á»u vÃ o DB â€” háº¡n
-- má»©c, giá» nháº¯c, má»‘c má»¥c tiÃªu, báº­c Ä‘á»ƒ nguá»™i, TRáº¦N 15%, ngÆ°á»¡ng cáº£nh bÃ¡o.
create table cau_hinh (
  user_id   uuid not null references auth.users(id) on delete cascade,
  khoa      text not null,
  gia_tri   jsonb not null,
  mo_ta     text,
  sua_luc   timestamptz not null default now(),
  primary key (user_id, khoa)
);

-- â”€â”€ cau_dong_vien â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Â§9.3: cÃ¢u chá»¯ náº±m trong báº£ng, KHÃ”NG nhÃ©t vÃ o code. ÄÃ¢y lÃ  má»¥c file tá»± Ä‘Ã¡nh dáº¥u
-- "rá»§i ro cao nháº¥t cá»§a dá»± Ã¡n" â€” sá»­a lá»i pháº£i sá»­a Ä‘Æ°á»£c mÃ  khÃ´ng cáº§n deploy láº¡i.
create table cau_dong_vien (
  id              text primary key default sinh_id('MSG'),
  user_id         uuid not null references auth.users(id) on delete cascade,
  loai            text not null,
  dieu_kien       jsonb,
  noi_dung        text not null,
  -- KhÃ´ng láº·p láº¡i má»™t cÃ¢u trong vÃ²ng 14 ngÃ y (Â§9.3 luáº­t 2).
  lan_dung_cuoi   timestamptz,
  trang_thai      text not null default 'active' check (trang_thai in ('active', 'archived')),
  tao_luc         timestamptz not null default now()
);

create index cau_dong_vien_chon on cau_dong_vien (user_id, loai, trang_thai, lan_dung_cuoi);

-- â”€â”€ su_kien â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Audit log append-only (Â§2, Â§12.1). KhÃ´ng sá»­a, khÃ´ng xoÃ¡. Chá»‰ há»‡ thá»‘ng ghi.
create table su_kien (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  ma          text not null,          -- TXN_CONFIRMED, CYCLE_BOUNDARY_CHANGED, ...
  doi_tuong   text,                   -- id báº£n ghi liÃªn quan
  du_lieu     jsonb not null default '{}'::jsonb,
  -- Äo tiÃªu chÃ­ S2 "má»Ÿ app â†’ lÆ°u xong â‰¤ 5 giÃ¢y" (Â§1). KhÃ´ng cÃ³ cá»™t nÃ y thÃ¬ sau 90
  -- ngÃ y khÃ´ng ai biáº¿t S2 Ä‘áº¡t hay khÃ´ng.
  duration_ms integer,
  tao_luc     timestamptz not null default now()
);

create index su_kien_theo_ma on su_kien (user_id, ma, tao_luc desc);
create index su_kien_theo_doi_tuong on su_kien (user_id, doi_tuong);

-- â”€â”€ Trigger sua_luc â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

create trigger danh_muc_sua_luc before update on danh_muc
  for each row execute function dat_sua_luc();
create trigger chu_ky_sua_luc before update on chu_ky
  for each row execute function dat_sua_luc();
create trigger thu_nhap_sua_luc before update on thu_nhap
  for each row execute function dat_sua_luc();
create trigger giao_dich_sua_luc before update on giao_dich
  for each row execute function dat_sua_luc();
-- 0002 RLS â€” Row Level Security cho cÃ¡c báº£ng á»Ÿ 0001.
--
-- Â§5 chá»n gá»i tháº³ng Supabase REST tá»« trÃ¬nh duyá»‡t, nÃªn khoÃ¡ anon náº±m trong bundle
-- lÃ  Ä‘Ãºng thiáº¿t káº¿. Äiá»u Ä‘Ã³ cÃ³ nghÄ©a RLS lÃ  thá»© DUY NHáº¤T báº£o vá»‡ dá»¯ liá»‡u â€” khÃ´ng
-- pháº£i khoÃ¡. ChÆ°a cháº¡y file nÃ y thÃ¬ Ä‘á»«ng Ä‘Æ°a dá»¯ liá»‡u tháº­t vÃ o.
--
-- Báº£ng quá»¹ cÃ³ RLS riÃªng trong 0004 vÃ¬ lÃºc nÃ y chÃºng chÆ°a tá»“n táº¡i.

-- DÃ¹ng (select auth.uid()) thay vÃ¬ auth.uid(): Postgres tÃ­nh má»™t láº§n cho cáº£ cÃ¢u
-- lá»‡nh thay vÃ¬ tÃ­nh láº¡i tá»«ng dÃ²ng.

alter table danh_muc      enable row level security;
alter table chu_ky        enable row level security;
alter table thu_nhap      enable row level security;
alter table giao_dich     enable row level security;
alter table cau_hinh      enable row level security;
alter table cau_dong_vien enable row level security;
alter table su_kien       enable row level security;

-- â”€â”€ Báº£ng ngÆ°á»i dÃ¹ng toÃ n quyá»n trÃªn dá»¯ liá»‡u cá»§a chÃ­nh mÃ¬nh â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

create policy danh_muc_chu_so_huu on danh_muc
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy chu_ky_chu_so_huu on chu_ky
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy thu_nhap_chu_so_huu on thu_nhap
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy giao_dich_chu_so_huu on giao_dich
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy cau_hinh_chu_so_huu on cau_hinh
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy cau_dong_vien_chu_so_huu on cau_dong_vien
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- â”€â”€ su_kien: append-only â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Audit log lÃ  rÃ ng buá»™c báº¯t buá»™c cá»§a Â§2. Cho Ä‘á»c vÃ  ghi thÃªm, KHÃ”NG cho sá»­a,
-- KHÃ”NG cho xoÃ¡ â€” cá»‘ Ã½ khÃ´ng táº¡o policy UPDATE/DELETE. KhÃ´ng cÃ³ policy nghÄ©a lÃ 
-- khÃ´ng ai qua Ä‘Æ°á»£c, ká»ƒ cáº£ chÃ­nh chá»§. Chá»‰ service role (Worker) má»›i bá» qua RLS.
create policy su_kien_doc on su_kien
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy su_kien_ghi_them on su_kien
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- â”€â”€ KhÃ´ng xoÃ¡ cá»©ng â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Â§13: "KhÃ´ng xoÃ¡ cá»©ng â€” da_huy + lÃ½ do + ghi su_kien". Policy FOR ALL á»Ÿ trÃªn
-- vá»‘n cho phÃ©p DELETE, nÃªn pháº£i cháº·n láº¡i báº±ng rule riÃªng. Sau lá»‡nh nÃ y, DELETE
-- trÃªn giao_dich luÃ´n tháº¥t báº¡i ká»ƒ cáº£ khi gá»i báº±ng khoÃ¡ Ä‘Ãºng.
create policy giao_dich_khong_xoa on giao_dich
  as restrictive
  for delete to authenticated
  using (false);

create policy chu_ky_khong_xoa on chu_ky
  as restrictive
  for delete to authenticated
  using (false);
-- 0003 RÃ€NG BUá»˜C CHU Ká»² â€” Â§7.2 rule 1: khÃ´ng chá»“ng láº¥n, khÃ´ng há»Ÿ.
--
-- Â§7.2 nÃ³i rÃµ rÃ ng buá»™c nÃ y pháº£i á»Ÿ Táº¦NG DB, khÃ´ng á»Ÿ UI. LÃ½ do: táº§ng domain
-- (shared/domain/chu-ky.ts) Ä‘Ã£ dá»±ng chu ká»³ báº±ng cÃ¡ch dáº«n xuáº¥t tá»« danh sÃ¡ch ngÃ y
-- lÆ°Æ¡ng nÃªn khÃ´ng thá»ƒ sai â€” nhÆ°ng Ä‘Ã³ chá»‰ Ä‘Ãºng vá»›i dá»¯ liá»‡u Ä‘i qua app. Báº¥t ká»³
-- Ä‘Æ°á»ng ghi nÃ o khÃ¡c (SQL tay, script phá»¥c há»“i, Worker) Ä‘á»u cáº§n lÆ°á»›i an toÃ n nÃ y.

create extension if not exists btree_gist;

-- daterange(..., '[]') bao gá»“m cáº£ hai Ä‘áº§u, khá»›p vá»›i soNgayGiua() bÃªn domain vá»‘n
-- cÅ©ng tÃ­nh cáº£ hai Ä‘áº§u. Lá»‡ch quy Æ°á»›c á»Ÿ Ä‘Ã¢y sáº½ cho phÃ©p hai chu ká»³ dÃ­nh nhau má»™t
-- ngÃ y mÃ  DB váº«n nháº­n.
alter table chu_ky
  add constraint chu_ky_khong_chong_lan
  exclude using gist (
    user_id with =,
    daterange(ngay_bat_dau_thuc_te, ngay_ket_thuc, '[]') with &&
  );

-- Kiá»ƒm chá»©ng theo Â§13: chÃ¨n hai chu ká»³ chá»“ng láº¥n báº±ng SQL trá»±c tiáº¿p pháº£i bá»‹ tá»« chá»‘i.
-- 0004 QUá»¸ & Sá»” BÃšT TOÃN â€” Â§7.3. Gá»“m cáº£ RLS cho cÃ¡c báº£ng táº¡o á»Ÿ Ä‘Ã¢y.

-- â”€â”€ quy â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Quá»¹ dá»± phÃ²ng = quá»¹ KHÃ”NG cÃ³ Ä‘Ã­ch. "Mua xe" = quá»¹ CÃ“ so_tien_dich + icon xe.
-- CÃ¹ng má»™t object, khÃ¡c nhau á»Ÿ chá»— cÃ³ Ä‘Ã­ch hay khÃ´ng (Â§7.3).
create table quy (
  id              text primary key default sinh_id('FND'),
  user_id         uuid not null references auth.users(id) on delete cascade,
  ten             text not null,
  so_tien_dich    bigint check (so_tien_dich > 0),   -- null = quá»¹ dá»± phÃ²ng
  -- LÆ°u SLUG (Â§11.5), khÃ´ng lÆ°u SVG: nhÃ©t SVG vÃ o DB thÃ¬ Ä‘á»•i bá»™ icon sau nÃ y
  -- pháº£i sá»­a tá»«ng dÃ²ng dá»¯ liá»‡u.
  icon            text not null default 'plant',
  -- Quá»¹ dá»± phÃ²ng Ä‘á»ƒ 'tu_do', má»i má»¥c tiÃªu dÃ i háº¡n Ä‘á»ƒ 'khoa' â€” náº¿u tiá»n "mua nhÃ "
  -- bá»‹ mÆ°á»£n Ã¢m tháº§m má»—i láº§n lá»¡ tay thÃ¬ má»¥c tiÃªu máº¥t háº¿t Ã½ nghÄ©a (Â§7.3).
  cho_phep_muon   text not null default 'khoa'
                  check (cho_phep_muon in ('tu_do', 'hoi_truoc', 'khoa')),
  thu_tu          smallint not null default 0,
  trang_thai      text not null default 'dang_chay'
                  check (trang_thai in ('dang_chay', 'tam_dung', 'hoan_thanh', 'bo')),
  tao_luc         timestamptz not null default now(),
  sua_luc         timestamptz not null default now()
);

create index quy_theo_user on quy (user_id, trang_thai, thu_tu);

-- â”€â”€ khoan_muon_quy â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

create table khoan_muon_quy (
  id                text primary key default sinh_id('BRW'),
  user_id           uuid not null references auth.users(id) on delete cascade,
  quy_id            text not null references quy(id) on delete restrict,
  chu_ky_muon_id    text not null references chu_ky(id) on delete restrict,
  so_tien           bigint not null check (so_tien > 0),
  -- 'linh_hoat' Báº®T BUá»˜C pháº£i cÃ³: ná»£ vÆ°á»£t 6 Ã— tráº§n thÃ¬ cáº£ 1/3/6 thÃ¡ng Ä‘á»u khÃ´ng
  -- há»£p lá»‡ vÃ  app sáº½ káº¹t khÃ´ng cho chá»n Ä‘Æ°á»£c gÃ¬ (Â§7.3).
  ky_han            text not null check (ky_han in ('1', '3', '6', 'linh_hoat')),
  so_tien_moi_ky    bigint not null check (so_tien_moi_ky > 0),
  con_lai           bigint not null check (con_lai >= 0),
  trang_thai        text not null default 'dang_no'
                    check (trang_thai in ('dang_no', 'dang_tra', 'da_tra_het', 'xoa_no')),
  tao_luc           timestamptz not null default now(),
  sua_luc           timestamptz not null default now(),

  constraint khoan_muon_con_lai_khong_vuot check (con_lai <= so_tien)
);

create index khoan_muon_dang_tra on khoan_muon_quy (user_id, trang_thai)
  where trang_thai in ('dang_no', 'dang_tra');

-- â”€â”€ bien_dong_quy â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Sá»‘ dÆ° quá»¹ = SUM(so_tien), KHÃ”NG BAO GIá»œ lÆ°u sáºµn (Â§6.3 quy táº¯c vÃ ng).
create table bien_dong_quy (
  id              text primary key default sinh_id('FMV'),
  user_id         uuid not null references auth.users(id) on delete cascade,
  quy_id          text not null references quy(id) on delete restrict,
  chu_ky_id       text references chu_ky(id) on delete set null,
  -- DÆ°Æ¡ng = vÃ o quá»¹, Ã¢m = ra khá»i quá»¹. KhÃ´ng tÃ¡ch hai cá»™t, Ä‘á»ƒ tá»•ng luÃ´n lÃ  má»™t
  -- phÃ©p SUM duy nháº¥t, khÃ´ng cÃ³ chá»— cho lá»—i dáº¥u.
  so_tien         bigint not null check (so_tien <> 0),
  -- 'so_du_ban_dau' lÃ  loáº¡i riÃªng, KHÃ”NG pháº£i 'gop': náº¿u tÃ­nh lÃ  gÃ³p thÃ¬ tá»· lá»‡
  -- Ä‘á»ƒ dÃ nh chu ká»³ Ä‘áº§u vá»t lÃªn vÃ´ lÃ½ vÃ  táº¡o Ä‘á»‰nh giáº£ lÃ m mÃ©o má»i biá»ƒu Ä‘á»“ so sÃ¡nh
  -- vá» sau (Â§7.3, AT-11).
  loai            text not null
                  check (loai in ('so_du_ban_dau', 'gop', 'rut', 'muon', 'tra_no')),
  khoan_muon_id   text references khoan_muon_quy(id) on delete restrict,
  ghi_chu         text,
  ngay_local      date not null,
  tao_luc         timestamptz not null default now(),

  -- BÃºt toÃ¡n mÆ°á»£n/tráº£ ná»£ báº¯t buá»™c trá» vá» khoáº£n ná»£, náº¿u khÃ´ng thÃ¬ khÃ´ng truy Ä‘Æ°á»£c
  -- tiá»n Ä‘Ã£ Ä‘i Ä‘Ã¢u.
  constraint bien_dong_muon_phai_co_khoan check (
    (loai in ('muon', 'tra_no')) = (khoan_muon_id is not null)
  )
);

create index bien_dong_theo_quy on bien_dong_quy (user_id, quy_id);
create index bien_dong_theo_chu_ky on bien_dong_quy (user_id, chu_ky_id);

-- Cháº·n sá»‘ dÆ° quá»¹ Ã¢m (Â§7.3, AT-16).
--
-- KhÃ´ng viáº¿t Ä‘Æ°á»£c báº±ng CHECK vÃ¬ rÃ ng buá»™c tráº£i trÃªn nhiá»u dÃ²ng. Trigger cháº¡y sau
-- má»—i láº§n ghi vÃ  tÃ­nh láº¡i tá»•ng cá»§a Ä‘Ãºng quá»¹ Ä‘Ã³.
--
-- VÃ¬ sao cáº§n: onboarding khÃ´ng há»i vá» quá»¹ nÃªn quá»¹ khá»Ÿi Ä‘áº§u 0Ä‘, mÃ  chu ká»³ Ä‘áº§u láº¡i
-- lÃ  chu ká»³ dá»… vÆ°á»£t ngÃ¢n sÃ¡ch nháº¥t â€” báº¥m "[Láº¥y tá»« quá»¹]" trÃªn quá»¹ rá»—ng lÃ  Ä‘Æ°á»ng
-- gáº§n nhÆ° cháº¯c cháº¯n Ä‘i qua á»Ÿ thÃ¡ng Ä‘áº§u. Â§7.8 cáº¥m hiá»‡n sá»‘ Ã¢m ra mÃ n hÃ¬nh; cháº·n
-- ngay á»Ÿ DB thÃ¬ con sá»‘ Ã¢m khÃ´ng bao giá» tá»“n táº¡i Ä‘á»ƒ mÃ  hiá»‡n.
--
-- deferrable initially deferred: kiá»ƒm lÃºc commit chá»© khÃ´ng pháº£i tá»«ng dÃ²ng, Ä‘á»ƒ
-- má»™t transaction rÃºt rá»“i bÃ¹ láº¡i váº«n cháº¡y Ä‘Æ°á»£c.
create or replace function chan_so_du_am()
returns trigger
language plpgsql
as $fn$
declare
  ton bigint;
  quy_can_kiem text := coalesce(new.quy_id, old.quy_id);
begin
  select coalesce(sum(so_tien), 0) into ton
  from bien_dong_quy where quy_id = quy_can_kiem;

  if ton < 0 then
    raise exception 'So du quy % khong duoc am (dang la %)', quy_can_kiem, ton
      using errcode = 'check_violation';
  end if;

  return null;
end;
$fn$;

create constraint trigger bien_dong_khong_am
  after insert or update or delete on bien_dong_quy
  deferrable initially deferred
  for each row execute function chan_so_du_am();

-- â”€â”€ quyet_dinh_mua â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

create table quyet_dinh_mua (
  id            text primary key default sinh_id('DEC'),
  user_id       uuid not null references auth.users(id) on delete cascade,
  ten_mon       text,
  so_tien       bigint not null check (so_tien > 0),
  danh_muc_id   text references danh_muc(id) on delete set null,
  -- Báº­c Ä‘á»ƒ nguá»™i neo theo % thu nháº­p Ä‘á»ƒ ngÆ°á»¡ng tá»± giÃ£n khi thu nháº­p tÄƒng (Â§7.4).
  bac_de_nguoi  text check (bac_de_nguoi in ('24h', '48h', '7ngay')),
  nguoi_den     timestamptz,
  trang_thai    text not null default 'dang_can_nhac'
                check (trang_thai in ('dang_can_nhac', 'da_mua', 'da_bo_qua', 'het_han')),
  giao_dich_id  text references giao_dich(id) on delete set null,
  tao_luc       timestamptz not null default now(),
  sua_luc       timestamptz not null default now()
);

create index quyet_dinh_dang_cho on quyet_dinh_mua (user_id, trang_thai, nguoi_den);

-- â”€â”€ push_subscription â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

create table push_subscription (
  id          text primary key default sinh_id('SUB'),
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null,
  p256dh      text not null,
  auth        text not null,
  -- Subscription iOS háº¿t háº¡n Ã¢m tháº§m: server tráº£ 404/410 thÃ¬ Ä‘Ã¡nh dáº¥u 'dead'
  -- rá»“i app tá»± Ä‘Äƒng kÃ½ láº¡i má»—i láº§n má»Ÿ (Â§5).
  trang_thai  text not null default 'active' check (trang_thai in ('active', 'dead')),
  tao_luc     timestamptz not null default now(),

  constraint push_endpoint_duy_nhat unique (user_id, endpoint)
);

-- â”€â”€ KhoÃ¡ ngoáº¡i cÃ²n thiáº¿u tá»« 0001 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- giao_dich.quy_id Ä‘á»ƒ trá»‘ng khoÃ¡ ngoáº¡i á»Ÿ 0001 vÃ¬ báº£ng quy chÆ°a tá»“n táº¡i lÃºc Ä‘Ã³.
alter table giao_dich
  add constraint giao_dich_quy_fk foreign key (quy_id) references quy(id) on delete restrict;

-- â”€â”€ Trigger sua_luc â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

create trigger quy_sua_luc before update on quy
  for each row execute function dat_sua_luc();
create trigger khoan_muon_sua_luc before update on khoan_muon_quy
  for each row execute function dat_sua_luc();
create trigger quyet_dinh_sua_luc before update on quyet_dinh_mua
  for each row execute function dat_sua_luc();

-- â”€â”€ RLS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

alter table quy               enable row level security;
alter table khoan_muon_quy    enable row level security;
alter table bien_dong_quy     enable row level security;
alter table quyet_dinh_mua    enable row level security;
alter table push_subscription enable row level security;

create policy quy_chu_so_huu on quy
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy khoan_muon_chu_so_huu on khoan_muon_quy
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy bien_dong_chu_so_huu on bien_dong_quy
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy quyet_dinh_chu_so_huu on quyet_dinh_mua
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy push_chu_so_huu on push_subscription
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Sá»• bÃºt toÃ¡n lÃ  chá»©ng tá»« tiá»n báº¡c: huá»· báº±ng bÃºt toÃ¡n ngÆ°á»£c, khÃ´ng xoÃ¡ dÃ²ng (Â§13).
create policy bien_dong_khong_xoa on bien_dong_quy
  as restrictive for delete to authenticated using (false);
-- 0005 SEED â€” dá»¯ liá»‡u máº·c Ä‘á»‹nh cho tÃ i khoáº£n má»›i.
--
-- LÃ m báº±ng TRIGGER trÃªn auth.users chá»© khÃ´ng pháº£i script cháº¡y tay: tÃ i khoáº£n nÃ o
-- táº¡o sau nÃ y cÅ©ng cÃ³ sáºµn danh má»¥c, vÃ  script phá»¥c há»“i (AT-14) khÃ´ng pháº£i nhá»›
-- seed láº¡i thá»§ cÃ´ng.
--
-- HÃ m idempotent â€” cháº¡y láº¡i trÃªn user Ä‘Ã£ cÃ³ dá»¯ liá»‡u thÃ¬ khÃ´ng nhÃ¢n Ä‘Ã´i.

create or replace function seed_nguoi_dung_moi(uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  -- â”€â”€ 5 danh má»¥c theo Ã Äá»ŠNH (Â§7.1) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  -- Ä‚n uá»‘ng Cá» Ã gá»™p vÃ o Sinh hoáº¡t: ma sÃ¡t lá»›n nháº¥t khi ghi chi tiÃªu khÃ´ng pháº£i
  -- gÃµ sá»‘ mÃ  lÃ  chá»n danh má»¥c. PhÃ¢n loáº¡i theo Ã½ Ä‘á»‹nh ("má»™t mÃ¬nh / vá»›i ngÆ°á»i
  -- khÃ¡c") quyáº¿t Ä‘á»‹nh nhanh hÆ¡n phÃ¢n loáº¡i theo mÃ³n Ä‘á»“.
  -- Slot 6 Ä‘á»ƒ trá»‘ng cho bá»“ tá»± Ä‘áº·t tÃªn; tráº§n cá»©ng 6 vÃ¬ báº£ng mÃ u Â§11.1 chá»‰ kiá»ƒm
  -- Ä‘á»‹nh 6 slot.
  insert into danh_muc (user_id, ten, dinh_nghia, slot, icon, thu_tu)
  select uid, x.ten, x.dinh_nghia, x.slot, x.icon, x.slot
  from (values
    ('Sinh hoáº¡t',           'Ä‚n ngoÃ i má»™t mÃ¬nh, mua Ä‘á»“ Äƒn cho báº£n thÃ¢n, Ä‘i siÃªu thá»‹, Ä‘á»“ dÃ¹ng thiáº¿t yáº¿u', 1::smallint, 'bowl-steam'),
    ('PhÃ¡t triá»ƒn báº£n thÃ¢n', 'Há»c, sÃ¡ch, khoÃ¡ há»c',                                                       2,           'book-open'),
    ('Giáº£i trÃ­',            'Äi Äƒn vá»›i báº¡n bÃ¨, Ä‘i chÆ¡i, mua vui',                                         3,           'martini'),
    ('Äáº§u tÆ°',              'Tiá»n bá» ra Ä‘á»ƒ sinh lá»i',                                                     4,           'plant'),
    ('MÄ© pháº©m',             'Skincare, makeup',                                                           5,           'lipstick')
  ) as x(ten, dinh_nghia, slot, icon)
  where not exists (select 1 from danh_muc d where d.user_id = uid and d.slot = x.slot);

  -- Danh má»¥c há»‡ thá»‘ng, khÃ´ng xoÃ¡ Ä‘Æ°á»£c (Â§7.1 rÃ ng buá»™c 3). KhÃ´ng chiáº¿m slot mÃ u
  -- Ä‘á»ƒ khÃ´ng tranh chá»— trÃªn donut vá»›i danh má»¥c tháº­t.
  -- KhÃ´ng cÃ³ lá»‘i thoÃ¡t nÃ y thÃ¬ lÆ°á»¡ng lá»± â†’ khÃ´ng ghi â†’ bá» app.
  insert into danh_muc (user_id, ten, dinh_nghia, slot, icon, la_he_thong, thu_tu)
  select uid, 'ChÆ°a biáº¿t xáº¿p Ä‘Ã¢u',
         'LÆ°u nhanh khi chÆ°a cháº¯c xáº¿p vÃ o Ä‘Ã¢u. PhÃ¢n loáº¡i láº¡i á»Ÿ buá»•i tá»•ng káº¿t Chá»§ Nháº­t.',
         null, 'question', true, 99
  where not exists (select 1 from danh_muc d where d.user_id = uid and d.la_he_thong);

  -- â”€â”€ Cáº¥u hÃ¬nh (Â§14 quy Æ°á»›c 5) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  -- Má»i ngÆ°á»¡ng neo theo % thu nháº­p, khÃ´ng neo sá»‘ cá»©ng, Ä‘á»ƒ tá»± giÃ£n khi thu nháº­p
  -- tÄƒng (Â§2). Äá»•i Ä‘Æ°á»£c mÃ  khÃ´ng cáº§n deploy láº¡i.
  insert into cau_hinh (user_id, khoa, gia_tri, mo_ta)
  select uid, x.khoa, x.gia_tri::jsonb, x.mo_ta
  from (values
    ('tran_tra_no_phan_tram',  '15',              'Tráº§n tráº£ ná»£ quá»¹ má»—i ká»³, % thu nháº­p tháº¥p nháº¥t 3 chu ká»³ gáº§n nháº¥t (Â§7.3)'),
    ('nguong_bay_lua_chon',    '300000',          'Ná»£ dÆ°á»›i má»©c nÃ y thÃ¬ tráº£ luÃ´n 1 ká»³, khÃ´ng bÃ y lá»±a chá»n (Â§7.3)'),
    ('gio_nhac',               '"21:00"',         'Giá» nháº¯c ghi chi tiÃªu, theo giá» Viá»‡t Nam'),
    ('bac_de_nguoi',           '{"nho":5,"vua":20}', 'NgÆ°á»¡ng % thu nháº­p chia báº­c Ä‘á»ƒ nguá»™i 24h/48h/7 ngÃ y (Â§7.4)'),
    ('moc_canh_bao_ngan_sach', '[50,80,100]',     'Má»‘c % ngÃ¢n sÃ¡ch báº¯n thÃ´ng bÃ¡o, má»—i má»‘c 1 láº§n/chu ká»³ (Â§7.6)'),
    ('moc_muc_tieu',           '[25,50,75,100]',  'Má»‘c % má»¥c tiÃªu báº¯n chÃºc má»«ng (Â§12 GOAL_MILESTONE)'),
    ('so_canh_hoa_du',         '5',               'Äá»§ bao nhiÃªu cÃ¡nh thÃ¬ nhuá»µ chuyá»ƒn vÃ ng (Â§9.2)'),
    ('ngay_khong_lap_cau',     '14',              'KhÃ´ng láº·p láº¡i má»™t cÃ¢u Ä‘á»™ng viÃªn trong bao nhiÃªu ngÃ y (Â§9.3)')
  ) as x(khoa, gia_tri, mo_ta)
  where not exists (select 1 from cau_hinh c where c.user_id = uid and c.khoa = x.khoa);

  -- â”€â”€ CÃ¢u Ä‘á»™ng viÃªn (Â§9.3) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  -- Ba tÃ´ng cho phÃ©p: má»«ng Â· trung tÃ­nh thÃ´ng tin Â· quan tÃ¢m. KHÃ”NG cÃ³ tÃ´ng chÃª.
  -- Má»—i cÃ¢u cáº£nh bÃ¡o báº¯t buá»™c kÃ¨m má»™t hÃ nh Ä‘á»™ng cá»¥ thá»ƒ, khÃ´ng Ä‘Æ°á»£c chá»‰ phÃ¡n xÃ©t.
  -- So sÃ¡nh vá»›i chÃ­nh bá»“ á»Ÿ chu ká»³ trÆ°á»›c, khÃ´ng bao giá» so vá»›i ngÆ°á»i khÃ¡c.
  insert into cau_dong_vien (user_id, loai, noi_dung)
  select uid, x.loai, x.noi_dung
  from (values
    ('nhac_ghi',      'HÃ´m nay chÆ°a cÃ³ ghi chÃ©p nÃ o â€” thÃªm nhanh nhÃ© ðŸ‘‡'),
    ('nhac_ghi',      'Ghi má»™t dÃ²ng thÃ´i cÅ©ng Ä‘Æ°á»£c, 5 giÃ¢y lÃ  xong ðŸŒ±'),
    ('sap_vuot',      'Chu ká»³ nÃ y Ä‘Ã£ dÃ¹ng {phan_tram}% ngÃ¢n sÃ¡ch, cÃ²n {so_ngay} ngÃ y.'),
    ('sap_vuot',      'CÃ²n {con_lai} cho {so_ngay} ngÃ y tá»›i â€” khoáº£ng {moi_ngay}/ngÃ y.'),
    ('hoa_sap_du',    'CÃ²n 1 ngÃ y ná»¯a lÃ  hoa ná»Ÿ Ä‘á»§ ðŸŒ¼'),
    ('hoa_du',        'Tuáº§n nÃ y hoa ná»Ÿ Ä‘á»§. Nhuá»µ vÃ ng rá»“i âœ¨'),
    ('moc_muc_tieu',  '{ten_quy}: {phan_tram}%. ThÃªm {con_thieu} ná»¯a lÃ  qua má»‘c tiáº¿p theo.'),
    ('tra_xong_no',   'ÄÃ£ tráº£ xong khoáº£n mÆ°á»£n quá»¹. Quá»¹ vá» nguyÃªn tráº¡ng ðŸ’š'),
    ('thu_nhap_tang', 'Thu nháº­p trung bÃ¬nh 3 chu ká»³ gáº§n Ä‘Ã¢y tÄƒng {phan_tram}% â€” má»«ng nhÃ© ðŸŽ‰'),
    ('khong_tieu',    'ÄÃ£ quyáº¿t Ä‘á»‹nh khÃ´ng tiÃªu {so_tien}. Cá»™ng dá»“n tá»›i giá»: {tong}.')
  ) as x(loai, noi_dung)
  where not exists (select 1 from cau_dong_vien c where c.user_id = uid and c.noi_dung = x.noi_dung);
end;
$fn$;

-- â”€â”€ Trigger cho tÃ i khoáº£n má»›i â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

create or replace function xu_ly_nguoi_dung_moi()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  perform seed_nguoi_dung_moi(new.id);
  return new;
end;
$fn$;

drop trigger if exists nguoi_dung_moi_seed on auth.users;
create trigger nguoi_dung_moi_seed
  after insert on auth.users
  for each row execute function xu_ly_nguoi_dung_moi();

-- â”€â”€ BÃ¹ cho tÃ i khoáº£n Ä‘Ã£ táº¡o trÆ°á»›c migration nÃ y â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

do $bu$
declare u record;
begin
  for u in select id from auth.users loop
    perform seed_nguoi_dung_moi(u.id);
  end loop;
end;
$bu$;
-- 0006 ÄO THá»œI GIAN â€” hai má»‘c cho tiÃªu chÃ­ S2.
--
-- Â§1 Ä‘á»‹nh nghÄ©a S2 lÃ  "má»Ÿ app â†’ lÆ°u xong â‰¤ 5 giÃ¢y". Má»™t cá»™t khÃ´ng Ä‘á»§ Ä‘á»ƒ tráº£ lá»i
-- cáº£ hai cÃ¢u há»i khÃ¡c nhau mÃ  ta cáº§n biáº¿t:
--
--   duration_ms      tá»« lÃºc MÃ€N NHáº¬P má»Ÿ ra â†’ Ä‘o riÃªng thao tÃ¡c nháº­p liá»‡u.
--                    ÄÃ¢y lÃ  con sá»‘ nÃ³i lÃªn thiáº¿t káº¿ bÃ n phÃ­m vÃ  nÃºt sá»‘ táº¯t tá»‘t
--                    tá»›i Ä‘Ã¢u, khÃ´ng bá»‹ nhiá»…u bá»Ÿi thá»i gian táº£i app.
--
--   duration_app_ms  tá»« lÃºc Má»ž APP â†’ chÃ­nh lÃ  S2 theo Ä‘Ãºng chá»¯ trong Â§1.
--                    Bao gá»“m cáº£ táº£i trang, Ä‘Äƒng nháº­p láº¡i, vÃ  sá»‘ cháº¡m pháº£i Ä‘i qua
--                    trÆ°á»›c khi tá»›i mÃ n nháº­p.
--
-- Ghi cáº£ hai vÃ¬ dá»¯ liá»‡u chá»‰ ghi Ä‘Æ°á»£c Má»˜T láº§n nhÆ°ng Ä‘á»c Ä‘Æ°á»£c nhiá»u nÄƒm. ThÃªm cá»™t
-- sau khi Ä‘Ã£ cháº¡y vÃ i thÃ¡ng thÃ¬ máº¥t luÃ´n pháº§n lá»‹ch sá»­ Ä‘Ã³.
--
-- Vá» sau khi cÃ³ shortcut Siri má»Ÿ tháº³ng vÃ o mÃ n nháº­p (Â§4.1 Ä‘Æ°á»ng 3), hiá»‡u sá»‘ giá»¯a
-- hai cá»™t chÃ­nh lÃ  cÃ¡i giÃ¡ pháº£i tráº£ cho viá»‡c Ä‘i vÃ²ng qua mÃ n â‘ .

alter table su_kien add column duration_app_ms integer;

comment on column su_kien.duration_ms is
  'Mili giÃ¢y tá»« lÃºc mÃ n nháº­p má»Ÿ ra tá»›i khi lÆ°u xong. Äo riÃªng thao tÃ¡c nháº­p liá»‡u.';
comment on column su_kien.duration_app_ms is
  'Mili giÃ¢y tá»« lÃºc má»Ÿ app tá»›i khi lÆ°u xong. ÄÃ¢y lÃ  S2 theo Ä‘Ãºng Â§1.';
-- 0007 NGÆ¯á» NG XÃC NHáº¬N Sá» Lá»šN.
--
-- MÃ n ghi nhanh nháº­p theo Ä‘Æ¡n vá»‹ nghÃ¬n, nÃªn thá»«a má»™t chá»¯ sá»‘ lÃ  sai Gáº¤P MÆ¯á»œI Láº¦N:
-- gÃµ 100 ra 100.000Ä‘, lá»¡ tay thÃ nh 1000 lÃ  1.000.000Ä‘. KhÃ´ng cÃ³ gÃ¬ cáº£n láº¡i.
-- Vá»›i app mÃ  S3 lÃ  "khÃ´ng máº¥t / sai dá»¯ liá»‡u" thÃ¬ Ä‘Ã¢y lÃ  chá»— pháº£i cháº·n.
--
-- TrÃªn ngÆ°á»¡ng nÃ y thÃ¬ há»i láº¡i má»™t cÃ¢u trÆ°á»›c khi lÆ°u. DÆ°á»›i ngÆ°á»¡ng váº«n giá»¯ nguyÃªn
-- Ä‘Æ°á»ng 3 cháº¡m â€” khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ viá»‡c cháº·n lá»—i hiáº¿m lÃ m cháº­m viá»‡c thÆ°á»ng xuyÃªn.
--
-- Äá»ƒ trong cau_hinh chá»© khÃ´ng hardcode: Â§14 quy Æ°á»›c 5 xáº¿p "ngÆ°á»¡ng cáº£nh bÃ¡o" vÃ o
-- nhÃ³m ngÆ°á»i-khÃ´ng-pháº£i-ká»¹-sÆ° cÃ³ thá»ƒ muá»‘n Ä‘á»•i, sá»­a Ä‘Æ°á»£c mÃ  khÃ´ng cáº§n deploy láº¡i.
--
-- âš ï¸ 1.000.000Ä‘ lÃ  sá»‘ Cá»¨NG do KhÃ´i chá»‘t 20/08/2026, hÆ¡i lá»‡ch vá»›i Â§2 ("má»i ngÆ°á»¡ng
-- tiá»n neo theo % thu nháº­p Ä‘á»ƒ tá»± giÃ£n khi thu nháº­p tÄƒng"). TrÃªn thu nháº­p 9tr thÃ¬
-- nÃ³ tÆ°Æ¡ng Ä‘Æ°Æ¡ng ~11%. Náº¿u vá» sau thu nháº­p tÄƒng mÃ  ngÆ°á»¡ng Ä‘á»©ng yÃªn, há»™p xÃ¡c nháº­n
-- sáº½ báº­t lÃªn quÃ¡ thÆ°á»ng xuyÃªn vÃ  bá»“ sáº½ báº¥m qua theo pháº£n xáº¡ â€” lÃºc Ä‘Ã³ nÃ³ háº¿t tÃ¡c
-- dá»¥ng. CÃ¢n nháº¯c Ä‘á»•i sang pháº§n trÄƒm khi cÃ³ Ä‘á»§ dá»¯ liá»‡u thu nháº­p.

create or replace function seed_nguoi_dung_moi(uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into danh_muc (user_id, ten, dinh_nghia, slot, icon, thu_tu)
  select uid, x.ten, x.dinh_nghia, x.slot, x.icon, x.slot
  from (values
    ('Sinh hoáº¡t',           'Ä‚n ngoÃ i má»™t mÃ¬nh, mua Ä‘á»“ Äƒn cho báº£n thÃ¢n, Ä‘i siÃªu thá»‹, Ä‘á»“ dÃ¹ng thiáº¿t yáº¿u', 1::smallint, 'bowl-steam'),
    ('PhÃ¡t triá»ƒn báº£n thÃ¢n', 'Há»c, sÃ¡ch, khoÃ¡ há»c',                                                       2,           'book-open'),
    ('Giáº£i trÃ­',            'Äi Äƒn vá»›i báº¡n bÃ¨, Ä‘i chÆ¡i, mua vui',                                         3,           'martini'),
    ('Äáº§u tÆ°',              'Tiá»n bá» ra Ä‘á»ƒ sinh lá»i',                                                     4,           'plant'),
    ('MÄ© pháº©m',             'Skincare, makeup',                                                           5,           'lipstick')
  ) as x(ten, dinh_nghia, slot, icon)
  where not exists (select 1 from danh_muc d where d.user_id = uid and d.slot = x.slot);

  insert into danh_muc (user_id, ten, dinh_nghia, slot, icon, la_he_thong, thu_tu)
  select uid, 'ChÆ°a biáº¿t xáº¿p Ä‘Ã¢u',
         'LÆ°u nhanh khi chÆ°a cháº¯c xáº¿p vÃ o Ä‘Ã¢u. PhÃ¢n loáº¡i láº¡i á»Ÿ buá»•i tá»•ng káº¿t Chá»§ Nháº­t.',
         null, 'question', true, 99
  where not exists (select 1 from danh_muc d where d.user_id = uid and d.la_he_thong);

  insert into cau_hinh (user_id, khoa, gia_tri, mo_ta)
  select uid, x.khoa, x.gia_tri::jsonb, x.mo_ta
  from (values
    ('tran_tra_no_phan_tram',  '15',                 'Tráº§n tráº£ ná»£ quá»¹ má»—i ká»³, % thu nháº­p tháº¥p nháº¥t 3 chu ká»³ gáº§n nháº¥t (Â§7.3)'),
    ('nguong_bay_lua_chon',    '300000',             'Ná»£ dÆ°á»›i má»©c nÃ y thÃ¬ tráº£ luÃ´n 1 ká»³, khÃ´ng bÃ y lá»±a chá»n (Â§7.3)'),
    ('gio_nhac',               '"21:00"',            'Giá» nháº¯c ghi chi tiÃªu, theo giá» Viá»‡t Nam'),
    ('bac_de_nguoi',           '{"nho":5,"vua":20}', 'NgÆ°á»¡ng % thu nháº­p chia báº­c Ä‘á»ƒ nguá»™i 24h/48h/7 ngÃ y (Â§7.4)'),
    ('moc_canh_bao_ngan_sach', '[50,80,100]',        'Má»‘c % ngÃ¢n sÃ¡ch báº¯n thÃ´ng bÃ¡o, má»—i má»‘c 1 láº§n/chu ká»³ (Â§7.6)'),
    ('moc_muc_tieu',           '[25,50,75,100]',     'Má»‘c % má»¥c tiÃªu báº¯n chÃºc má»«ng (Â§12 GOAL_MILESTONE)'),
    ('so_canh_hoa_du',         '5',                  'Äá»§ bao nhiÃªu cÃ¡nh thÃ¬ nhuá»µ chuyá»ƒn vÃ ng (Â§9.2)'),
    ('ngay_khong_lap_cau',     '14',                 'KhÃ´ng láº·p láº¡i má»™t cÃ¢u Ä‘á»™ng viÃªn trong bao nhiÃªu ngÃ y (Â§9.3)'),
    ('nguong_xac_nhan_so_lon', '1000000',            'TrÃªn má»©c nÃ y thÃ¬ há»i láº¡i trÆ°á»›c khi lÆ°u, cháº·n lá»—i thá»«a chá»¯ sá»‘')
  ) as x(khoa, gia_tri, mo_ta)
  where not exists (select 1 from cau_hinh c where c.user_id = uid and c.khoa = x.khoa);

  insert into cau_dong_vien (user_id, loai, noi_dung)
  select uid, x.loai, x.noi_dung
  from (values
    ('nhac_ghi',      'HÃ´m nay chÆ°a cÃ³ ghi chÃ©p nÃ o â€” thÃªm nhanh nhÃ© ðŸ‘‡'),
    ('nhac_ghi',      'Ghi má»™t dÃ²ng thÃ´i cÅ©ng Ä‘Æ°á»£c, 5 giÃ¢y lÃ  xong ðŸŒ±'),
    ('sap_vuot',      'Chu ká»³ nÃ y Ä‘Ã£ dÃ¹ng {phan_tram}% ngÃ¢n sÃ¡ch, cÃ²n {so_ngay} ngÃ y.'),
    ('sap_vuot',      'CÃ²n {con_lai} cho {so_ngay} ngÃ y tá»›i â€” khoáº£ng {moi_ngay}/ngÃ y.'),
    ('hoa_sap_du',    'CÃ²n 1 ngÃ y ná»¯a lÃ  hoa ná»Ÿ Ä‘á»§ ðŸŒ¼'),
    ('hoa_du',        'Tuáº§n nÃ y hoa ná»Ÿ Ä‘á»§. Nhuá»µ vÃ ng rá»“i âœ¨'),
    ('moc_muc_tieu',  '{ten_quy}: {phan_tram}%. ThÃªm {con_thieu} ná»¯a lÃ  qua má»‘c tiáº¿p theo.'),
    ('tra_xong_no',   'ÄÃ£ tráº£ xong khoáº£n mÆ°á»£n quá»¹. Quá»¹ vá» nguyÃªn tráº¡ng ðŸ’š'),
    ('thu_nhap_tang', 'Thu nháº­p trung bÃ¬nh 3 chu ká»³ gáº§n Ä‘Ã¢y tÄƒng {phan_tram}% â€” má»«ng nhÃ© ðŸŽ‰'),
    ('khong_tieu',    'ÄÃ£ quyáº¿t Ä‘á»‹nh khÃ´ng tiÃªu {so_tien}. Cá»™ng dá»“n tá»›i giá»: {tong}.')
  ) as x(loai, noi_dung)
  where not exists (select 1 from cau_dong_vien c where c.user_id = uid and c.noi_dung = x.noi_dung);
end;
$fn$;

-- BÃ¹ khoÃ¡ má»›i cho tÃ i khoáº£n Ä‘Ã£ táº¡o trÆ°á»›c migration nÃ y.
do $bu$
declare u record;
begin
  for u in select id from auth.users loop
    perform seed_nguoi_dung_moi(u.id);
  end loop;
end;
$bu$;
-- 0008 han_muc â€” "hÅ©" tá»«ng danh má»¥c (Â§7.6).
--
-- Grain lÃ  (chu ká»³, danh má»¥c), KHÃ”NG pháº£i (danh má»¥c): háº¡n má»©c Ä‘á»•i theo tá»«ng chu
-- ká»³, cÃ²n danh_muc lÃ  báº£ng config dÃ¹ng chung má»i chu ká»³. Äáº·t cá»™t so_tien lÃªn
-- danh_muc thÃ¬ thÃ¡ng sau Ä‘á»•i hÅ© lÃ  sá»‘ liá»‡u thÃ¡ng trÆ°á»›c Ä‘á»•i theo â€” Ä‘Ãºng loáº¡i lá»—i
-- snapshot_json á»Ÿ Â§6.3 sinh ra Ä‘á»ƒ cháº·n.
--
-- KhoÃ¡ chÃ­nh ghÃ©p cÃ¹ng khuÃ´n cau_hinh(user_id, khoa) á»Ÿ 0001 â€” khÃ´ng thÃªm khÃ¡i
-- niá»‡m má»›i, vÃ  tá»± cháº·n má»™t danh má»¥c cÃ³ hai háº¡n má»©c trong cÃ¹ng chu ká»³.

create table han_muc (
  user_id     uuid   not null references auth.users(id) on delete cascade,
  chu_ky_id   text   not null references chu_ky(id)   on delete cascade,
  danh_muc_id text   not null references danh_muc(id) on delete restrict,
  so_tien     bigint not null check (so_tien > 0),
  tao_luc     timestamptz not null default now(),
  sua_luc     timestamptz not null default now(),
  primary key (chu_ky_id, danh_muc_id)
);

create index han_muc_theo_user on han_muc (user_id, chu_ky_id);

-- so_tien > 0 chá»© khÃ´ng >= 0: hÅ© 0Ä‘ vÃ  KHÃ”NG cÃ³ hÅ© lÃ  hai chuyá»‡n khÃ¡c nhau vá»
-- Ã½ nghÄ©a nhÆ°ng giá»‘ng há»‡t nhau vá» hÃ nh vi. Bá» hÅ© thÃ¬ xoÃ¡ dÃ²ng, Ä‘á»«ng Ä‘áº·t vá» 0 â€”
-- náº¿u khÃ´ng, mÃ n â‘¡ sáº½ pháº£i hiá»‡n má»™t thanh rá»—ng cho hÅ© mÃ  bá»“ Ä‘Ã£ thÃ´i khÃ´ng dÃ¹ng.

-- Cá» Ã KHÃ”NG cÃ³ rÃ ng buá»™c "tá»•ng háº¡n má»©c <= ngÃ¢n sÃ¡ch" (Â§7.6).
-- ÄÃ£ chá»‘t cho pháº§n chÆ°a phÃ¢n bá»• Ä‘Æ°á»£c Ä‘á»ƒ dÆ°, mÃ  rÃ ng buá»™c cá»©ng á»Ÿ DB sáº½ cháº·n luÃ´n
-- cáº£ trÆ°á»ng há»£p bá»“ Ä‘áº·t vÆ°á»£t rá»“i chá»‰nh láº¡i ngay sau Ä‘Ã³. Cáº£nh bÃ¡o má»m á»Ÿ UI lÃ  Ä‘á»§ â€”
-- cÃ¹ng lÃ½ do Â§7.3 chá»n hiá»‡n má» kÃ¨m lÃ½ do thay vÃ¬ áº©n lá»±a chá»n Ä‘i.

-- CÅ©ng KHÃ”NG cÃ³ cá»™t "Ä‘Ã£ tiÃªu trong hÅ©": Ä‘Ã³ lÃ  SUM(giao_dich) lá»c theo chu ká»³ vÃ 
-- danh má»¥c. Quy táº¯c vÃ ng Â§6.3 â€” khÃ´ng bao giá» lÆ°u sá»‘ Ä‘Ã£ tÃ­nh Ä‘Æ°á»£c.

alter table han_muc enable row level security;

create policy han_muc_chu_so_huu on han_muc
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create trigger han_muc_sua_luc before update on han_muc
  for each row execute function dat_sua_luc();
-- 0009 Sá»• tiáº¿t kiá»‡m = quá»¹ CÃ“ LÃƒI SUáº¤T (Â§7.10).
--
-- KhÃ´ng pháº£i há»‡ thá»‘ng má»›i. Quá»¹ vá»‘n Ä‘Ã£ lÃ  "sá»‘ dÆ° = SUM bÃºt toÃ¡n vÃ o/ra", Ä‘Ã£ cÃ³
-- vÃ²ng Ä‘á»i, Ä‘Ã£ cÃ³ mÃ n hÃ¬nh. Sá»• tiáº¿t kiá»‡m khÃ¡c quá»¹ thÆ°á»ng Ä‘Ãºng ba thá»©: cÃ³ lÃ£i
-- suáº¥t, cÃ³ ngÃ y gá»­i, cÃ³ ká»³ háº¡n. Bá»‘n cá»™t nullable, má»™t giÃ¡ trá»‹ enum.
--
-- cho_phep_muon='khoa' (máº·c Ä‘á»‹nh cá»§a quy) khá»›p sáºµn vá»›i thá»±c táº¿: rÃºt trÆ°á»›c háº¡n
-- thÃ¬ lÃ£i bá»‹ tÃ­nh láº¡i vá» lÃ£i suáº¥t khÃ´ng ká»³ háº¡n, gáº§n nhÆ° máº¥t sáº¡ch pháº§n lÃ£i. ÄÃ³ lÃ 
-- quy Ä‘á»‹nh chung cá»§a NHNN chá»© khÃ´ng pháº£i rÃ o cáº£n app tá»± dá»±ng.

alter table quy
  -- ÄIá»‚M CÆ  Báº¢N (1/100 cá»§a 1%), sá»‘ nguyÃªn: 5,5%/nÄƒm = 550; 5,35%/nÄƒm = 535.
  -- Bank niÃªm yáº¿t tá»›i hai chá»¯ sá»‘ tháº­p phÃ¢n, mÃ  Â§14 quy Æ°á»›c 1 cáº¥m float cho má»i
  -- thá»© Ä‘i vÃ o phÃ©p tÃ­nh tiá»n. Äiá»ƒm cÆ¡ báº£n giá»¯ Ä‘Æ°á»£c Ä‘Ãºng hai chá»¯ sá»‘ Ä‘Ã³ báº±ng sá»‘
  -- nguyÃªn, nÃªn phÃ©p nhÃ¢n ra tiá»n lÃ£i lÃ  chÃ­nh xÃ¡c tuyá»‡t Ä‘á»‘i, khÃ´ng cÃ³ sai sá»‘.
  add column lai_suat_nam  integer check (lai_suat_nam > 0),
  add column ngay_gui      date,
  add column ky_han_thang  smallint check (ky_han_thang > 0),
  add column lich_tra_lai  text
    check (lich_tra_lai in ('dau_ky', 'cuoi_ky', 'hang_thang', 'hang_quy', 'khong_ky_han'));

-- Bá»‘n cá»™t Ä‘i cÃ¹ng nhau hoáº·c cÃ¹ng váº¯ng máº·t. CÃ³ lÃ£i suáº¥t mÃ  thiáº¿u ngÃ y gá»­i thÃ¬
-- khÃ´ng tÃ­nh Ä‘Æ°á»£c gÃ¬; thiáº¿u lá»‹ch tráº£ lÃ£i thÃ¬ khÃ´ng biáº¿t tiá»n lÃ£i tá»›i tay khi nÃ o.
-- Cho phÃ©p ná»­a vá»i lÃ  Ä‘á»ƒ dá»¯ liá»‡u há»ng náº±m im tá»›i lÃºc bá»“ má»Ÿ mÃ n â‘¤ má»›i lá»™ ra.
--
-- 'khong_ky_han' lÃ  ngoáº¡i lá»‡ DUY NHáº¤T Ä‘Æ°á»£c thiáº¿u ká»³ háº¡n â€” nÃ³ vá»‘n khÃ´ng cÃ³ ngÃ y
-- Ä‘Ã¡o háº¡n nÃ o.
alter table quy add constraint so_tiet_kiem_du_bo check (
  (lai_suat_nam is null and ngay_gui is null and ky_han_thang is null
     and lich_tra_lai is null)
  or
  (lai_suat_nam is not null and ngay_gui is not null and lich_tra_lai is not null
     and (ky_han_thang is not null or lich_tra_lai = 'khong_ky_han'))
);

-- Tiá»n lÃ£i bank tráº£ THáº¬T. KhÃ¡c 'gop' á»Ÿ chá»— nÃ³ khÃ´ng pháº£i tiá»n bá»“ Ä‘á»ƒ dÃ nh ra, nÃªn
-- bá»‹ loáº¡i khá»i tá»· lá»‡ Ä‘á»ƒ dÃ nh y nhÆ° 'so_du_ban_dau' (Â§7.10).
alter table bien_dong_quy drop constraint bien_dong_quy_loai_check;
alter table bien_dong_quy add constraint bien_dong_quy_loai_check
  check (loai in ('so_du_ban_dau', 'gop', 'rut', 'muon', 'tra_no', 'lai'));
-- 0010 Äá»”I RANH GIá»šI CHU Ká»² TRONG Má»˜T GIAO Dá»ŠCH NGUYÃŠN KHá»I â€” Â§7.2 rule 1 & 3.
--
-- Lá»—i tÃ¬m Ä‘Æ°á»£c khi Ä‘i thá»­ luá»“ng (25/08/2026): báº¥m "ngÃ y lÆ°Æ¡ng trá»… 1 ngÃ y" thÃ¬
-- bÃ¡o lá»—i rÃ ng buá»™c vÃ  khÃ´ng Ä‘á»•i Ä‘Æ°á»£c gÃ¬. RÃ ng buá»™c khÃ´ng sai â€” code sai.
--
-- Dá»i ngÃ y báº¯t Ä‘áº§u chu ká»³ nÃ y pháº£i kÃ©o theo ngÃ y káº¿t thÃºc chu ká»³ trÆ°á»›c, vÃ 
-- trong lÃºc má»›i Ä‘á»•i Ä‘Æ°á»£c má»™t trong hai thÃ¬ hai khoáº£ng NHáº¤T Äá»ŠNH pháº£i hoáº·c cháº¡m
-- nhau hoáº·c há»Ÿ ra:
--
--   Ä‘ang cÃ³:  trÆ°á»›c [30/06 â†’ 30/07]   nÃ y [31/07 â†’ 30/08]
--   muá»‘n cÃ³:  trÆ°á»›c [30/06 â†’ 31/07]   nÃ y [01/08 â†’ 30/08]
--
--   nong "trÆ°á»›c" ra trÆ°á»›c  â‡’ cháº¡m nhau ngÃ y 31/07  â‡’ EXCLUDE cháº·n, há»ng háº³n
--   dá»i "nÃ y" Ä‘i trÆ°á»›c     â‡’ há»Ÿ ngÃ y 31/07         â‡’ qua Ä‘Æ°á»£c, nhÆ°ng náº¿u app
--                                                     cháº¿t ngay lÃºc Ä‘Ã³ thÃ¬ cÃ¡c
--                                                     khoáº£n ngÃ y 31/07 khÃ´ng
--                                                     thuá»™c chu ká»³ nÃ o cáº£
--
-- Sá»­a cÃ¡i CO Láº I trÆ°á»›c thÃ¬ trÃ¡nh Ä‘Æ°á»£c lá»—i rÃ ng buá»™c á»Ÿ Cáº¢ HAI chiá»u â€” Ä‘Ã³ lÃ  Ä‘Æ°á»ng
-- lui `coLaiTruoc()` bÃªn client dÃ¹ng khi migration nÃ y chÆ°a cháº¡y, vÃ  Ä‘Ã£ Ä‘o trÃªn
-- DB tháº­t: sai thá»© tá»± cho 23P01 cáº£ hai chiá»u, Ä‘Ãºng thá»© tá»± qua cáº£ hai chiá»u.
--
-- NhÆ°ng nÃ³ váº«n Ä‘á»ƒ há»Ÿ má»™t khoáº£nh kháº¯c, mÃ  Â§7.2 rule 1 nÃ³i "khÃ´ng chá»“ng láº¥n, KHÃ”NG
-- Há»ž". Muá»‘n háº¿t háº³n tráº¡ng thÃ¡i ná»­a vá»i thÃ¬ cáº£ hai lá»‡nh pháº£i náº±m trong Má»˜T giao
-- dá»‹ch vÃ  hoÃ£n kiá»ƒm tra rÃ ng buá»™c tá»›i lÃºc chá»‘t. ÄÃ³ lÃ  viá»‡c cá»§a file nÃ y.

-- `initially immediate` giá»¯ nguyÃªn hÃ nh vi cÅ© cho má»i Ä‘Æ°á»ng ghi khÃ¡c: chÃ¨n hai
-- chu ká»³ chá»“ng láº¥n báº±ng SQL tay váº«n bá»‹ cháº·n NGAY, khÃ´ng Ä‘á»£i tá»›i cuá»‘i giao dá»‹ch.
-- Chá»‰ hÃ m bÃªn dÆ°á»›i má»›i chá»§ Ä‘á»™ng hoÃ£n.
alter table chu_ky drop constraint chu_ky_khong_chong_lan;

alter table chu_ky
  add constraint chu_ky_khong_chong_lan
  exclude using gist (
    user_id with =,
    daterange(ngay_bat_dau_thuc_te, ngay_ket_thuc, '[]') with &&
  )
  deferrable initially immediate;

-- security invoker (máº·c Ä‘á»‹nh): RLS váº«n Ã¡p theo ngÆ°á»i gá»i. Â§5 nÃ³i RLS lÃ  lá»›p báº£o
-- vá»‡ DUY NHáº¤T â€” má»™t hÃ m cháº¡y báº±ng quyá»n ngÆ°á»i táº¡o sáº½ chá»c thá»§ng Ä‘Ãºng lá»›p Ä‘Ã³.
create or replace function doi_ranh_gioi_chu_ky(
  p_truoc_id        text,
  p_truoc_ket_thuc  date,
  p_nay_id          text,
  p_nay_bat_dau     date
) returns void
language plpgsql
as $$
begin
  set constraints chu_ky_khong_chong_lan deferred;

  if p_truoc_id is not null then
    update chu_ky set ngay_ket_thuc = p_truoc_ket_thuc where id = p_truoc_id;
  end if;

  update chu_ky set ngay_bat_dau_thuc_te = p_nay_bat_dau where id = p_nay_id;
end;
$$;

-- Kiá»ƒm chá»©ng theo Â§13: gá»i hÃ m nÃ y Ä‘á»ƒ dá»i ranh giá»›i cáº£ hai chiá»u Ä‘á»u pháº£i cháº¡y
-- Ä‘Æ°á»£c; cÃ²n chÃ¨n hai chu ká»³ chá»“ng láº¥n báº±ng SQL trá»±c tiáº¿p thÃ¬ váº«n pháº£i bá»‹ tá»« chá»‘i.
-- 0011 THU Há»’I QUYá»€N Gá»ŒI HÃ€M â€” vÃ¡ lá»— há»•ng tÃ¬m Ä‘Æ°á»£c á»Ÿ audit 27/08/2026.
--
-- Postgres máº·c Ä‘á»‹nh cáº¥p EXECUTE trÃªn hÃ m má»›i cho PUBLIC, vÃ  Supabase phÆ¡i má»i
-- hÃ m trong schema public ra thÃ nh endpoint RPC. Há»‡ quáº£: hai hÃ m dÆ°á»›i Ä‘Ã¢y gá»i
-- Ä‘Æ°á»£c tá»« Internet mÃ  KHÃ”NG cáº§n Ä‘Äƒng nháº­p. ÄÃ£ Ä‘o báº±ng khoÃ¡ cÃ´ng khai moi tá»«
-- chÃ­nh bundle trÃ¬nh duyá»‡t:
--
--   POST /rest/v1/rpc/seed_nguoi_dung_moi  {"uid": "<uuid cá»§a bá»“>"}   â†’ HTTP 204
--   POST /rest/v1/rpc/sinh_id              {"tien_to": "HACK"}        â†’ HTTP 200
--
-- `seed_nguoi_dung_moi` lÃ  security definer, tá»©c lÃ  nÃ³ Bá»Ž QUA RLS. Hiá»‡n táº¡i chÆ°a
-- gÃ¢y háº¡i tháº­t vÃ¬ má»i lá»‡nh insert bÃªn trong Ä‘á»u cÃ³ `where not exists`, nhÆ°ng Ä‘Ã³
-- lÃ  má»™t tÃ­nh cháº¥t ráº¥t dá»… vÃ´ tÃ¬nh phÃ¡: chá»‰ cáº§n sau nÃ y ai Ä‘Ã³ thÃªm má»™t dÃ²ng insert
-- khÃ´ng kÃ¨m Ä‘iá»u kiá»‡n lÃ  thÃ nh Ä‘Æ°á»ng ghi dá»¯ liá»‡u vÃ o tÃ i khoáº£n ngÆ°á»i khÃ¡c.
-- KhÃ´ng nÃªn Ä‘á»ƒ an toÃ n cá»§a há»‡ thá»‘ng phá»¥ thuá»™c vÃ o viá»‡c nhá»› giá»¯ má»™t tÃ­nh cháº¥t.
--
-- Hai váº¥n Ä‘á» ná»¯a cá»§a cÃ¹ng lá»— há»•ng Ä‘Ã³:
--
--   â‘  MÃ¡y dÃ² tÃ i khoáº£n. uid cÃ³ tháº­t tráº£ 204, uid bá»‹a tráº£ 409 (khoÃ¡ ngoáº¡i). ÄÆ°a
--      má»™t uuid vÃ o lÃ  biáº¿t nÃ³ cÃ³ pháº£i tÃ i khoáº£n tháº­t hay khÃ´ng.
--   â‘¡ KhÃ´ng cÃ³ rate limit. Äo Ä‘Æ°á»£c 20 lá»i gá»i ghi vÃ o 4 báº£ng trong 228ms. Auth
--      cá»§a Supabase CÃ“ cháº·n (429 over_email_send_rate_limit), nhÆ°ng táº§ng PostgREST
--      thÃ¬ khÃ´ng cháº·n gÃ¬ cáº£.

-- Trigger `nguoi_dung_moi_seed` váº«n cháº¡y bÃ¬nh thÆ°á»ng sau lá»‡nh nÃ y: nÃ³ gá»i hÃ m
-- dÆ°á»›i quyá»n ngÆ°á»i Táº O hÃ m (security definer), khÃ´ng pháº£i quyá»n anon.
revoke all on function seed_nguoi_dung_moi(uuid) from public, anon, authenticated;

-- `sinh_id` khÃ´ng bá» qua RLS nÃªn nháº¹ hÆ¡n, nhÆ°ng nÃ³ váº«n lÃ  má»™t endpoint tÃ­nh toÃ¡n
-- má»Ÿ cho cáº£ Internet. CÃ¡c cá»™t `default sinh_id('TXN')` váº«n cháº¡y Ä‘Æ°á»£c: giÃ¡ trá»‹ máº·c
-- Ä‘á»‹nh Ä‘Æ°á»£c tÃ­nh dÆ°á»›i quyá»n ngÆ°á»i ghi vÃ o báº£ng, khÃ´ng qua Ä‘Æ°á»ng RPC.
revoke all on function sinh_id(text) from public, anon;

-- HÃ m 0010 thÃ¬ Ä‘á»ƒ nguyÃªn cho `authenticated`: nÃ³ lÃ  security invoker, RLS váº«n Ã¡p
-- Ä‘Ãºng theo ngÆ°á»i gá»i, vÃ  app cáº§n gá»i nÃ³ tháº­t.
revoke all on function doi_ranh_gioi_chu_ky(text, date, text, date) from public, anon;
grant execute on function doi_ranh_gioi_chu_ky(text, date, text, date) to authenticated;

-- Kiá»ƒm chá»©ng theo Â§13: sau lá»‡nh nÃ y, gá»i hai hÃ m Ä‘áº§u báº±ng khoÃ¡ cÃ´ng khai pháº£i tráº£
-- 404 PGRST202 (PostgREST khÃ´ng cÃ²n tháº¥y hÃ m), cÃ²n app Ä‘Äƒng nháº­p rá»“i váº«n Ä‘á»•i Ä‘Æ°á»£c
-- ngÃ y lÆ°Æ¡ng bÃ¬nh thÆ°á»ng.
-- 0012 áº¨N DANH Má»¤C THÃŒ NHáº¢ SLOT RA â€” Â§7.1 tráº§n cá»©ng 6 nghÄ©a lÃ  6 CÃ™NG LÃšC.
--
-- Chá»‰ má»¥c cÅ© giá»¯ slot cá»§a cáº£ danh má»¥c Ä‘Ã£ áº©n:
--
--   create unique index danh_muc_slot_duy_nhat
--     on danh_muc (user_id, slot) where slot is not null;
--
-- Há»‡ quáº£ tÃ¬m Ä‘Æ°á»£c lÃºc thá»­ luá»“ng (27/08/2026): áº©n "Äáº§u tÆ°" Ä‘i rá»“i thÃªm danh má»¥c
-- má»›i thÃ¬ mÃ n hÃ¬nh tháº¥y slot 4 trá»‘ng nÃªn bÃ y nÃºt "+ ThÃªm danh má»¥c", mÃ  lá»‡nh chÃ¨n
-- láº¡i tráº£ 23505 duplicate key. BÃ y ra má»™t nÃºt báº¥m vÃ o lÃ  lá»—i â€” Ä‘Ãºng thá»© mÃ n Ä‘Ã³
-- Ä‘Æ°á»£c viáº¿t ra Ä‘á»ƒ trÃ¡nh.
--
-- Gá»‘c rá»… lÃ  hai cÃ¡ch hiá»ƒu khÃ¡c nhau vá» "tráº§n cá»©ng 6":
--   â‘  6 danh má»¥c cÃ¹ng lÃºc          â† Ã½ cá»§a Â§7.1, vÃ¬ lÃ½ do lÃ  báº£ng mÃ u chá»‰ cÃ³ 6
--   â‘¡ 6 danh má»¥c trong cáº£ Ä‘á»i app  â† thá»© chá»‰ má»¥c cÅ© tháº­t sá»± Ã¡p
--
-- Â§7.1 nÃ³i rÃµ lÃ½ do cá»§a tráº§n: "báº£ng mÃ u Â§11.1 chá»‰ kiá»ƒm Ä‘á»‹nh 6 slot". ÄÃ³ lÃ  rÃ ng
-- buá»™c vá» thá»© ÄANG HIá»†N trÃªn mÃ n hÃ¬nh, khÃ´ng pháº£i vá» tá»•ng sá»‘ tá»«ng tá»“n táº¡i. NÃªn â‘ 
-- má»›i Ä‘Ãºng.
--
-- Danh má»¥c Ä‘Ã£ áº©n VáºªN GIá»® giÃ¡ trá»‹ `slot` cá»§a nÃ³ â€” khÃ´ng Ä‘áº·t vá» null â€” Ä‘á»ƒ biá»ƒu Ä‘á»“
-- cÃ¡c chu ká»³ cÅ© cÃ²n tÃ´ Ä‘Ãºng mÃ u nhÆ° lÃºc bá»“ nhÃ¬n tháº¥y nÃ³. Chá»‰ lÃ  nÃ³ thÃ´i chiáº¿m
-- chá»— cá»§a danh má»¥c Ä‘ang dÃ¹ng.

drop index if exists danh_muc_slot_duy_nhat;

create unique index danh_muc_slot_duy_nhat
  on danh_muc (user_id, slot)
  where slot is not null and trang_thai = 'active';

-- Kiá»ƒm chá»©ng theo Â§13: áº©n má»™t danh má»¥c rá»“i thÃªm danh má»¥c má»›i vÃ o Ä‘Ãºng slot Ä‘Ã³
-- pháº£i cháº¡y Ä‘Æ°á»£c; cÃ²n hai danh má»¥c ÄANG DÃ™NG mÃ  trÃ¹ng slot thÃ¬ váº«n pháº£i bá»‹ cháº·n.
-- 0013 Ná»šI TRáº¦N DANH Má»¤C LÃŠN 10 + CHá»ŒN CÃI NÃ€O HIá»†N á»ž MÃ€N CHÃNH.
--
-- KhÃ´i chá»‘t 27/08/2026: bá» tráº§n cá»©ng 6, tá»‘i Ä‘a 10.
--
-- Tráº§n 6 khÃ´ng pháº£i con sá»‘ tuá»³ tiá»‡n â€” Â§7.1 Ä‘áº·t nÃ³ vÃ¬ báº£ng mÃ u Â§11.1 chá»‰ cÃ³ 6 mÃ u
-- Ä‘Ã£ kiá»ƒm Ä‘á»‹nh cho ngÆ°á»i mÃ¹ mÃ u Ä‘á»-lá»¥c, vÃ  cáº¥p mÃ u tá»± Ä‘á»™ng cho slot thá»© 7 sáº½ phÃ¡
-- vá»¡ kiá»ƒm Ä‘á»‹nh Ä‘Ã³. NÃªn ná»›i tráº§n báº¯t buá»™c pháº£i giáº£i xong bÃ i toÃ¡n mÃ u TRÆ¯á»šC.
--
-- ÄÃ£ giáº£i: bá»‘n mÃ u má»›i chá»n báº±ng cÃ¡ch Ä‘áº·t SÃ€N an toÃ n (Î”E â‰¥ 9 vá»›i ngÆ°á»i mÃ¹ Ä‘á»-lá»¥c
-- theo ViÃ©not 1999 + CIEDE2000, â‰¥ 16 vá»›i thá»‹ giÃ¡c thÆ°á»ng, lá»‡ch hue â‰¥ 24Â°) rá»“i
-- trong sá»‘ Ä‘áº¡t sÃ n láº¥y mÃ u Dá»ŠU NHáº¤T. SÃ¡u mÃ u gá»‘c giá»¯ nguyÃªn tá»«ng kÃ½ tá»±. ToÃ n bá»™
-- phÃ©p Ä‘o Ä‘Ã³ giá» náº±m trong `mu-mau.test.ts` vÃ  cháº¡y má»—i láº§n test â€” trÆ°á»›c Ä‘Ã¢y nÃ³
-- chá»‰ lÃ  má»™t cÃ¢u trong tÃ i liá»‡u, khÃ´ng cÃ³ gÃ¬ cháº·n náº¿u ai Ä‘Ã³ sá»­a má»™t mÃ£ hex.
--
-- VÃ¬ sao dá»«ng á»Ÿ 10 chá»© khÃ´ng má»Ÿ vÃ´ háº¡n: má»—i mÃ u thÃªm vÃ o láº¡i Ã©p cÃ¡c mÃ u cÅ© sÃ¡t
-- nhau hÆ¡n. 10 lÃ  má»©c cÃ²n giá»¯ Ä‘Æ°á»£c khoáº£ng cÃ¡ch khÃ´ng tá»‡ hÆ¡n bá»™ 6 gá»‘c.

alter table danh_muc drop constraint danh_muc_slot_check;
alter table danh_muc add constraint danh_muc_slot_check check (slot between 1 and 10);

-- â”€â”€ Chá»n danh má»¥c nÃ o hiá»‡n á»Ÿ lÆ°á»›i ghi nhanh â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
--
-- LÆ°á»›i ghi nhanh trÃªn mÃ n â‘  chá»©a tá»‘i Ä‘a 6 Ã´ â€” Ä‘Ã³ lÃ  giá»›i háº¡n cá»§a MÃ€N HÃŒNH, Ä‘o
-- tháº­t trÃªn iPhone 13 á»Ÿ Pha 3.5: quÃ¡ 6 thÃ¬ lÆ°á»›i Ä‘áº©y thanh nhá»‹p tuáº§n xuá»‘ng dÆ°á»›i
-- náº¿p gáº¥p, mÃ  ghi nhanh lÃ  tÃ­nh nÄƒng sá»‘ 1 (Â§8).
--
-- NÃªn khi cÃ³ nhiá»u hÆ¡n 6 danh má»¥c, bá»“ chá»n cÃ¡i nÃ o náº±m ngoÃ i mÃ n chÃ­nh. Nhá»¯ng
-- cÃ¡i cÃ²n láº¡i váº«n ghi Ä‘Æ°á»£c, chá»‰ lÃ  qua nÃºt "+" thay vÃ¬ cháº¡m tháº³ng.
--
-- Máº·c Ä‘á»‹nh `true`: nÄƒm danh má»¥c seed sáºµn vÃ  cÃ¡i thá»© sÃ¡u bá»“ tá»± thÃªm Ä‘á»u nÃªn cÃ³
-- máº·t ngay. Viá»‡c chá»n lá»c chá»‰ báº¯t Ä‘áº§u cÃ³ nghÄ©a tá»« cÃ¡i thá»© báº£y trá»Ÿ Ä‘i.
alter table danh_muc
  add column if not exists hien_man_chinh boolean not null default true;

comment on column danh_muc.hien_man_chinh is
  'CÃ³ náº±m trÃªn lÆ°á»›i ghi nhanh cá»§a mÃ n â‘  khÃ´ng. LÆ°á»›i chá»©a tá»‘i Ä‘a 6 Ã´ (Â§7.1).';

-- Kiá»ƒm chá»©ng theo Â§13: sau lá»‡nh nÃ y, chÃ¨n danh má»¥c slot 7â€“10 pháº£i cháº¡y Ä‘Æ°á»£c;
-- slot 11 vÃ  slot 0 váº«n pháº£i bá»‹ tá»« chá»‘i.
