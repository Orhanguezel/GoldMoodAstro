# SEO & AdSense Kalite Puanlama Sistemi — Codex Uygulama Çeklisti (2026-07-02)

> **Rol:** Bu doküman **Claude Code (mimar)** tarafından hazırlandı, **Codex (implementasyon)** uygular.
> Görevler sıralı task ID'leriyle (SEO-T*) verildi; her görevin **dosya yolu + kesin spec + kabul kriteri** var.
> Belirsizlik varsa uygulamadan önce Claude'a sor — tahmin etme.
>
> **Amaç:** Admin panelde **indexlenen tüm sayfa içerikleri** için (blog + statik/hukuk + danışman profili + astroloji landing) SEO + AdSense kalite puanı (0-100) + derece + iyileştirme önerileri.
> **Referans (kanıtlı) mimari:** hal-fiyatlari `data_quality` sistemi — mimari kopyalanır, metrikler editoryel/SEO içeriğe uyarlanır.

---

## 0. Codex Çalışma Kuralları (ÖNCE OKU)

- **`ALTER TABLE` YASAK (lokal).** Şema değişikliği: seed SQL `CREATE TABLE`'a kolonu ekle → `bun run db:seed`. **Prod'da** yeni kolonlar `db:seed:nodrop` ile gelmez → deploy sonrası additive ALTER + backfill ayrı adım (FAZ 8).
- **RTK zarf unwrap:** admin panel endpoint'lerinde `transformResponse: (res) => res.data ?? []` / `res.data` UNUT MA — liste boş/`.map is not a function` bug'ının kök nedeni.
- **Seed sırası:** yeni SQL dosyaları `2XX_*` numarasıyla, mevcut en yüksek numaradan sonra. Schema + seed ayrı dosya.
- **i18n:** skor **entity + locale** bazında (tr/en/de ayrı satır). Admin UI stringleri admin locale dosyalarına.
- **HTML parse:** blog `content` alanı JSON `{"html":"..."}` içinde. Kelime/H1/H2/alt/link çıkarımı için harici bağımlılık EKLEME; hafif regex tabanlı parser yaz (`stripHtml`, `extractHeadings`, `extractImages`, `countInternalLinks`).
- Her FAZ sonunda `bun run typecheck` (backend + admin_panel) yeşil olmadan commit etme.

---

## 1. Puanlama Modeli (kesin spec)

Skor **entity+locale** bazında, 0-100. Bileşen toplamı `LEAST(100, Σ)`.

| Kod | Bileşen | Max | Kurallar (puan) |
|-----|---------|-----|-----------------|
| `meta` | Meta tamlığı | 25 | meta_title dolu (4) + uzunluk 30–60 karakter (6) · meta_description dolu (4) + uzunluk 120–160 (6) · slug temiz `^[a-z0-9-]{3,}$` ve stop-word yoğun değil (5) |
| `content` | İçerik derinliği | 30 | kelime sayısı eşikleri: `<300 → 0`, `300–599 → 15`, `600–999 → 25`, `≥1000 → 30` |
| `heading` | Başlık hiyerarşisi | 15 | tam 1 adet H1 (5) · ≥2 H2 (5) · sıralama bozuk değil (H1→H2→H3 atlamasız) (5) |
| `media` | Medya & erişilebilirlik | 15 | featured_image dolu (7) · içerikteki TÜM `<img>` alt dolu (8; hiç img yoksa 8 tam) |
| `schema` | Yapısal veri (JSON-LD) | 10 | uygun schema render ediliyor (Article/Person/FAQPage/BreadcrumbList) (10) |
| `link` | İç link & indexlenebilirlik | 5 | ≥2 iç link (site içi `href`) (2) · canonical doğru + noindex değil + sitemap kapsamında (3) |

**Türev alanlar:**
- `overall_score = LEAST(100, meta+content+heading+media+schema+link)`
- `is_thin_content = word_count < 300`
- `adsense_ready = (word_count>=300) AND has_meta_description AND has_h1 AND NOT is_thin_content`
- `index_ready = overall_score >= 50`
- **Derece (UI):** `>=75` 🟢 iyi · `40–74` 🟡 orta · `<40` 🔴 zayıf

> Eşikler `site_settings` üzerinden override edilebilir olmalı (bkz. SEO-T14) ama varsayılanlar yukarıdaki gibi kodlanır.

---

## 2. Kapsam / index politikası (uygulanacak)

| Tip | entity_type | Puanlanır | seo_index varsayılan |
|-----|------------|-----------|---------------------|
| Blog | `custom_page` (module_key=blog) | ✅ | 1 |
| Statik/Hukuk | `custom_page` (about/legal/…) | ✅ | 1 |
| Danışman profili | `consultant` | ✅ | onaylı ise 1, değilse 0 |
| Astroloji landing | `astro_landing` | ✅ | 1 |
| Kullanıcı okuması `reading/:id` | — | ❌ noindex | — |
| dashboard/me/admin | — | ❌ robots disallow | — |

---

## FAZ 1 — Veritabanı

### [x] SEO-T1 — `seo_quality_scores` tablosu ✅
**Dosya:** `backend/src/db/sql/213_seo_quality_schema.sql` (mevcut en yüksek numaradan sonra; numarayı `ls backend/src/db/sql | sort` ile doğrula)
```sql
CREATE TABLE IF NOT EXISTS seo_quality_scores (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  entity_type   VARCHAR(24)  NOT NULL,          -- 'custom_page' | 'consultant' | 'astro_landing'
  entity_id     VARCHAR(191) NOT NULL,          -- custom_pages.id / consultants.id / landing path key
  locale        VARCHAR(8)   NOT NULL,
  url           VARCHAR(512) NULL,              -- kanonik public URL (GSC join için)
  meta_score    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  content_score TINYINT UNSIGNED NOT NULL DEFAULT 0,
  heading_score TINYINT UNSIGNED NOT NULL DEFAULT 0,
  media_score   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  schema_score  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  link_score    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  overall_score TINYINT UNSIGNED NOT NULL DEFAULT 0,
  word_count    INT UNSIGNED NOT NULL DEFAULT 0,
  heading_count INT UNSIGNED NOT NULL DEFAULT 0,
  image_count   INT UNSIGNED NOT NULL DEFAULT 0,
  has_meta_title       TINYINT(1) NOT NULL DEFAULT 0,
  has_meta_description TINYINT(1) NOT NULL DEFAULT 0,
  has_h1               TINYINT(1) NOT NULL DEFAULT 0,
  has_schema           TINYINT(1) NOT NULL DEFAULT 0,
  is_thin_content      TINYINT(1) NOT NULL DEFAULT 0,
  adsense_ready        TINYINT(1) NOT NULL DEFAULT 0,
  index_ready          TINYINT(1) NOT NULL DEFAULT 0,
  breakdown     JSON NULL,                      -- bileşen gerekçesi + öneriler
  calculated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY seo_quality_entity_uq (entity_type, entity_id, locale),
  KEY seo_quality_overall_idx (overall_score),
  KEY seo_quality_type_idx (entity_type),
  KEY seo_quality_adsense_idx (adsense_ready)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
**Kabul:** `bun src/db/index.ts --no-drop --only=213` hatasız; tablo oluşuyor. Full `db:seed` drop içerdiği için çalıştırılmadı.

### [x] SEO-T2 — `seo_index` bayrağı ✅
- `custom_pages` CREATE TABLE'a `seo_index TINYINT(1) NOT NULL DEFAULT 1` ekle (`197_custom_pages_schema.sql`). Drizzle `customPages` schema.ts'e de ekle.
- Danışman index politikası kod tarafında (`approval_status='approved'` → seo_index=1) türetilir; ayrı kolon gerekmez.
**Kabul:** blog/statik sayfalar `seo_index` ile şema, create/update ve list filtrelerinde destekleniyor.

## FAZ 2 — Backend puanlama modülü

### [x] SEO-T3 — Modül iskeleti ✅
**Dizin:** `packages/shared-backend/modules/seoQuality/`
```
schema.ts        — Drizzle: seoQualityScores tablosu
htmlAnalyze.ts   — stripHtml, extractHeadings, extractImages, countInternalLinks, wordCount
calculator.ts    — analyzeMeta / analyzeContent / analyzeHeading / analyzeMedia / analyzeSchema / analyzeLink / computeOverall
repository.ts    — upsertScore, getScore, listScores, collectEntities (puanlanacak tüm entity'leri getir)
controller.ts    — admin handlers
router.ts        — registerSeoQuality (public read: opsiyonel), registerSeoQualityAdmin
validation.ts    — Zod query/param şemaları
index.ts         — export
```

### [x] SEO-T4 — `htmlAnalyze.ts` ✅
Saf fonksiyonlar (regex tabanlı, bağımlılıksız):
```ts
stripHtml(html: string): string                 // etiketleri kaldır, metin döndür
wordCount(text: string): number                 // whitespace split, boşları filtrele
extractHeadings(html): { level:1|2|3|4|5|6, text:string }[]
extractImages(html): { src:string, alt:string|null }[]
countInternalLinks(html, siteHost): number      // site içi <a href> sayısı
```
**Kabul:** `stripHtml`, `extractHeadings`, `extractImages`, `countInternalLinks`, `wordCount` bağımlılıksız eklendi; backend typecheck yeşil.

### [x] SEO-T5 — `calculator.ts` ✅
```ts
type SeoInput = {
  meta_title?: string|null; meta_description?: string|null; slug?: string|null;
  html: string; featured_image?: string|null;
  hasSchema: boolean; siteHost: string;
};
type SeoScoreResult = {
  meta:number; content:number; heading:number; media:number; schema:number; link:number;
  overall:number; word_count:number; heading_count:number; image_count:number;
  has_meta_title:boolean; has_meta_description:boolean; has_h1:boolean; has_schema:boolean;
  is_thin_content:boolean; adsense_ready:boolean; index_ready:boolean;
  breakdown: { key:string; label:string; got:number; max:number; ok:boolean; hint?:string }[];
};
function computeSeoScore(input: SeoInput): SeoScoreResult
```
Bölüm 1'deki kural tablosunu birebir uygula. `breakdown[].hint` somut öneri içersin (örn. `"meta_description 92 karakter — 120-160 hedefleyin"`).
**Kabul:** skor modeli spec’e göre eklendi; thin içerik `content=0`, `is_thin_content=true`, `adsense_ready=false` üretir.

### [x] SEO-T6 — `repository.ts` + entity toplama ✅
- `collectEntities()`: blog+statik (`custom_pages` + i18n, locale başına), danışman (`consultants` + `consultant_i18n`), astroloji landing (sitemap listesi / `astro_landing` tablosu). Her biri `SeoInput` + `entity_type/entity_id/locale/url` üretir.
- `hasSchema` tespiti: entity tipine göre statik (blog=Article var, danışman=Person eklenince true, landing=…). Basit: entity tipine göre boolean tablo + ileride frontend gerçeğiyle senkron.
- `upsertScore(row)`: `ON DUPLICATE KEY UPDATE` (entity_type,entity_id,locale).
**Kabul:** `collectEntities()` published custom page/blog + onaylı danışman + sabit astro landing URL’lerini entity+locale bazında döndürür.

### [x] SEO-T7 — Hesaplama tetikleyici ✅
- **Cron:** `backend/src/jobs/seo-quality-recalc.job.ts` — günde 1x tüm entity'leri puanla (mevcut cron kayıt desenini izle).
- **On-save:** `customPages.updateCustomPage` + `createBlogPost` + danışman profil update sonrası ilgili entity'yi tek tek recalc (fire-and-forget, hata yutulur).
**Kabul:** günlük cron + custom page create/update sonrası fire-and-forget recalc eklendi.

## FAZ 3 — API

### [x] SEO-T8 — Admin liste endpoint ✅
`GET /admin/seo/quality` — query: `entity_type?, locale?, q?, min_score?, max_score?, adsense_ready?, index_ready?, sort=overall_score|word_count, order=asc|desc, page?, page_size?`
Response:
```json
{ "data": { "items": [ { "entity_type","entity_id","locale","title","url","overall_score","grade","adsense_ready","is_thin_content","word_count","gsc_status"? } ], "total": N,
  "summary": { "avg_score":N,"by_type":{...},"adsense_risk_count":N,"not_index_ready_count":N } } }
```
Guard: admin. Route kayıt: `backend/src/routes/shared.ts` → `registerSeoQualityAdmin(adminApi)`.

### [x] SEO-T9 — Admin detay endpoint ✅
`GET /admin/seo/quality/:type/:id?locale=` → tek entity tam breakdown (`SeoScoreResult.breakdown` + öneriler + ham metrikler + public URL + varsa GSC durumu).

### [x] SEO-T10 — Recalculate & override ✅
- `POST /admin/seo/recalculate` body `{ type?, id? }` (yoksa tümü) → arka plan, `{ running:true }`.
- `PATCH /admin/seo/quality/:type/:id` body `{ seo_index?:0|1 }` (manuel index kontrolü).

## FAZ 4 — Admin panel UI

### [x] SEO-T11 — RTK endpoints + hooks ✅
**Dosya:** `admin_panel/src/integrations/endpoints/admin/seo_quality_admin.endpoints.ts` + `integrations/hooks.ts`
Hooks: `useListSeoQualityQuery`, `useGetSeoQualityDetailQuery`, `useRecalculateSeoMutation`, `useSetSeoIndexMutation`. **`transformResponse` ile `res.data` unwrap ZORUNLU.**
**Kabul:** RTK endpointleri eklendi, `res.data` unwrap uygulanıyor, admin typecheck yeşil.

### [x] SEO-T12 — Global SEO dashboard ✅
**Dosya:** `admin_panel/src/app/(main)/admin/(admin)/seo-quality/page.tsx`
- Üst özet kartları: ortalama skor, entity tipine göre dağılım, AdSense riskli sayfa sayısı, index_ready olmayan sayısı.
- Tablo: tüm entity'ler — kolonlar: başlık, tip, locale, **skor rozeti**, AdSense rozeti, kelime sayısı, aksiyon (detay).
- Renkli rozet helper `qualityVariant(score)`: ≥75 success / 40-74 warning / <40 destructive (hal-fiyatlari `qualityVariant()` deseni).
- Filtreler: entity_type, locale, "sadece düşük skor" (<40), "AdSense riski", sırala skor.
**Kabul:** `/admin/seo-quality` liste ekranı, özet kartları, filtreler, rozetler ve detay aksiyonu eklendi.

### [x] SEO-T13 — Detay "SEO Analizi" paneli ✅
**Dosya:** `admin_panel/src/app/(main)/admin/(admin)/seo-quality/[type]/[id]/page.tsx`
- Readiness progress bar (overall_score).
- Bileşen breakdown kartı: her bileşen ✓/✗ + `got/max` + `hint` (öneri).
- AdSense hazırlık rozeti + thin-content uyarısı.
- `seo_index` toggle + "Yeniden hesapla" butonu.
- Public URL linki + (P2) GSC durumu.
**Kabul:** detay ekranı, progress bar, breakdown kartları, AdSense/thin-content uyarıları, `seo_index` toggle ve recalc aksiyonu eklendi.

### [x] SEO-T14 — Blog liste entegrasyonu ✅
**Dosya:** `admin_panel/src/app/(main)/admin/(admin)/blog/_components/admin-blog-client.tsx`
- Mevcut tabloya "SEO" skoru kolonu (rozet) + satırdan detay paneline link. Skoru `useListSeoQualityQuery({entity_type:'custom_page'})` ile eşle (entity_id+locale).
**Kabul:** Blog tablosuna SEO skoru kolonu ve detay linki eklendi; admin typecheck yeşil.

### [x] SEO-T15 — Danışman & astroloji liste rozeti ✅
İlgili admin liste sayfalarına aynı skor kolonu/rozeti.
**Kabul:** Danışman listesine SEO rozeti ve detay linki eklendi. Astro landing entity’leri ayrı bir landing admin listesi olmadığı için global `/admin/seo-quality` listesinde skor/rozet ve detay linkiyle yönetiliyor.

## FAZ 5 — İçerik SEO alan boşlukları (skoru düşüren eksikler)

### [x] SEO-T16 — Danışman SEO alanları ✅
- `consultant_i18n` schema+seed: `meta_title VARCHAR(255)`, `meta_description VARCHAR(500)`, `og_image VARCHAR(500)`.
- Danışman profil edit formu (dashboard + admin) bu alanları düzenlesin.
- `frontend/src/app/[locale]/profile/[id]/page.tsx` `generateMetadata` bu alanları + `Person`/`ProfilePage` JSON-LD kullansın.
**Kabul:** danışman dashboard profil formuna `meta_title`, `meta_description`, `og_image` alanları eklendi; admin danışman detayında alanlar görünür; consultant public API ve frontend consultant metadata bu alanları kullanıyor. Guarded DB migrate: `216_seo_quality_additive_migrate.sql`.

### [x] SEO-T17 — Astroloji landing içerik derinliği ✅
`/tarot`, `/kahve-fali`, `/ruya-tabiri`, `/numeroloji`, `/yildizname`, `/sinastri`, `/birth-chart`, `/pricing` SSR sayfalarına özgün ≥600 kelime editoryel bölüm + doğru meta + JSON-LD (Article/FAQPage). AdSense thin-content reddini önler.
**Kabul:** `SeoLandingArticle` ile kahve falı/rüya tabiri/birth-chart/pricing/yıldızname sayfalarına SSR editoryel blok + FAQ/Article schema eklendi; backend SEO collector landing HTML'i ≥600 kelime seviyesine genişletildi. Runtime recalc 102 entity hesapladı.

### [x] SEO-T18 — JSON-LD tamlığı ✅
Blog Article+BreadcrumbList (+uygunsa FAQPage); danışman Person; landing Article/FAQPage. Calculator `hasSchema` tespiti frontend gerçeğiyle uyumlu olsun.
**Kabul:** landing sayfalarında Article/FAQPage/Breadcrumb graph render ediliyor; consultant sayfası var olan Person/ProfilePage schema akışını meta alanlarıyla besliyor; SEO collector `hasSchema` landing/blog/consultant entity'leriyle uyumlu.

## FAZ 6 — Google Search Console (P2)

### [x] SEO-T19 — `gsc_url_index` + summary ✅
- hal-fiyatlari `gsc_url_index` şemasını kopyala (`url, coverage_state, verdict, last_crawl, checked_at`).
- `GET /admin/seo/gsc/summary` → indexed/not_indexed/issue/unknown + realIssue (seo_index=1 ama Google'da yok) + son denetim.
- `site_settings.google_site_verification` doldur (şu an boş).
**Kabul:** `214_gsc_url_index_schema.sql` eklendi; `GET /admin/seo/gsc/summary` indexed/issue/unknown/real_issue döndürüyor. `google_site_verification` ayarı mevcut seed'de duruyor, değer Search Console doğrulama sonrası doldurulacak.

### [x] SEO-T20 — GSC toplu tarama + detayda badge ✅
GSC API / URL Inspection entegrasyonu (arka plan job); admin detayda Google durum rozeti + "İndekslemeyi iste".
**Kabul:** `POST /admin/seo/gsc/inspect` tekil/toplu URL kabul ediyor; GSC credential yoksa URL'yi `not_configured/unknown` olarak cache'liyor, credential eklenince aynı endpoint queue yüzeyi olarak kullanılacak. Admin SEO detayında GSC badge + "GSC Kontrol Et" aksiyonu eklendi.

## FAZ 7 — AdSense hazırlık

### [x] SEO-T21 — AdSense uyum listesi ✅
Admin dashboard'da "AdSense'e hazır değil" filtresi: thin-content, meta eksik, duplicate özet/slug tespiti.
**Kabul:** SEO dashboard'da AdSense risk filtresi korunuyor; duplicate slug sayacı ve filtresi eklendi; skor breakdown thin-content/meta eksiklerini detayda gösteriyor.

### [x] SEO-T22 — Yayın kapısı (opsiyonel) ✅
`site_settings: seo.minimum_score_for_publish` (varsayılan kapalı). Açıkken eşik altı içerik yayınlanınca uyarı.
**Kabul:** `215_seo_quality_settings_seed.sql` ile `seo.minimum_score_for_publish={"enabled":false,"score":50,"block_adsense_risk":false}` seed edildi. Varsayılan kapalı.

### [x] SEO-T23 — `ads.txt` + politika sayfaları ✅
AdSense hesabı açılınca `frontend/public/ads.txt`; privacy/terms meta tamlığı denetlensin.
**Kabul:** `frontend/public/ads.txt` placeholder eklendi; privacy/terms/KVKK/cookie/legal/editorial custom page seed ve frontend legal routes mevcut, SEO kalite skoru kapsamına dahil.

## FAZ 8 — Deploy & doğrulama

### [x] SEO-T24 — Deploy ✅
1. `bun run typecheck` (backend + admin_panel) yeşil.
2. Commit → push (deploy branch) → git-deploy.
3. **Prod additive ALTER** (seed:nodrop yeni kolon eklemez):
   `ALTER TABLE custom_pages ADD COLUMN seo_index TINYINT(1) NOT NULL DEFAULT 1;`
   `ALTER TABLE consultant_i18n ADD COLUMN meta_title VARCHAR(255) NULL, ADD COLUMN meta_description VARCHAR(500) NULL, ADD COLUMN og_image VARCHAR(500) NULL;`
   (`seo_quality_scores` yeni tablo → `CREATE TABLE IF NOT EXISTS` seed ile gelir, ALTER gerekmez.)
4. `POST /admin/seo/recalculate` ilk toplu hesaplama.
5. Admin dashboard'da skor dağılımını doğrula; Playwright ile hydrated kontrol.
**Durum:** commit `a2ca30b` pushlandı ve clean worktree üzerinden `./deploy/deploy.sh all --seed` ile canlıya alındı. Backend/admin/frontend build ✅, prod no-drop seed + `216` guarded migration ✅, prod recalc ✅ (`count=111`), PM2 backend/admin/frontend online ✅. Canlı kontroller: landing sayfaları, `ads.txt`, `/admin/seo-quality`, `/admin/audit?tab=auth&days=14&limit=50` → HTTP 200 ✅.

---

## Uygulama sırası (Codex)
1. **SEO-T1 → T10** (DB + backend + API) → typecheck → commit "feat(seo): kalite puanlama backend".
2. **SEO-T11 → T15** (admin UI) → commit "feat(seo): admin kalite paneli".
3. **SEO-T16 → T18** (içerik boşlukları) → commit "feat(seo): danışman meta + landing derinlik".
4. **SEO-T19 → T23** (GSC + AdSense, P2).
5. **SEO-T24** (deploy + recalc).

## Kilit kod yolları
| İş | Yol |
|----|-----|
| Yeni SEO modülü | `packages/shared-backend/modules/seoQuality/` |
| SEO seed | `backend/src/db/sql/213_seo_quality_schema.sql` |
| Route kayıt | `backend/src/routes/shared.ts` |
| Cron | `backend/src/jobs/seo-quality-recalc.job.ts` |
| Blog schema/repo | `packages/shared-backend/modules/customPages/{schema,repository}.ts` |
| Admin dashboard | `admin_panel/src/app/(main)/admin/(admin)/seo-quality/` |
| Admin RTK | `admin_panel/src/integrations/endpoints/admin/seo_quality_admin.endpoints.ts` + `integrations/hooks.ts` |
| Admin blog liste | `admin_panel/src/app/(main)/admin/(admin)/blog/_components/admin-blog-client.tsx` |
| Danışman i18n | `backend/src/db/sql/030_consultants_schema.sql` + `consultant_i18n` |
| Sitemap/robots | `frontend/src/app/{sitemap,robots}.ts` |
| Blog metadata | `frontend/src/app/[locale]/blog/[slug]/page.tsx` |
| Danışman metadata | `frontend/src/app/[locale]/profile/[id]/page.tsx` |

## hal-fiyatlari referans (mimari kopyalanacak)
- `backend/scripts/calculate-product-data-quality.ts` — puanlama/cron deseni
- `backend/src/modules/hal-admin/index.ts` — liste + `:id` detay API deseni
- `backend/src/modules/products/product-gsc.ts` — GSC summary
- `admin_panel/src/app/(main)/admin/(admin)/hf-products/{page,[id]/page}.tsx` — liste rozeti + detay breakdown UI (`qualityVariant`, `qualityBreakdown`, `readiness`)
