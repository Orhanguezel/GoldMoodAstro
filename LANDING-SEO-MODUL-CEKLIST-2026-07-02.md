# Landing + Statik/Hukuki İçerik → Yönetilebilir + Modül-içi SEO Kalite — Çeklist (2026-07-02)

> Amaç 1: **Landing sayfaları** (tarot, kahve-fali, ruya-tabiri, numeroloji, yildizname, birth-chart, sinastri, pricing) **+ statik/hukuki sayfalar** (Hakkımızda, KVKK, Gizlilik, Kullanım Şartları, Danışman Sözleşmesi, Editoryal Politika, SSS, Çerez, Para Nasıl Hesabıma Geçer… — tümü tr/en/de) blog gibi **admin'den (AI destekli) çok dilli düzenlenebilsin**.
> Amaç 2: SEO/index kalitesi **her içerik modülünde inline** gösterilsin; ayrı `/admin/seo-quality` sayfası sadece **genel bakış** olsun (birincil düzenleme yüzeyi değil).
>
> **Önemli kapsam notu:** Statik/hukuki sayfalar ZATEN `custom_pages`'te (module_key = about, legal_notice, privacy, terms, kvkk, faq, editorial_policy, cookies, consultant_agreement, payout_faq…). Landing DB'ye taşınınca **blog + landing + hukuki HEPSİ tek tablo (`custom_pages`)** olur → tek genelleştirilmiş "İçerik Sayfaları" editörü (module_key gruplu) hepsini kapsar. Skorları 34-55 ("Risk") çünkü çok kısa (22-462 kelime) — içerik zenginleştirme + meta gerekir (hukuki metinde AI **yalnız biçim/açıklık iyileştirir, hüküm UYDURMAZ**).
>
> **Kök sorun:** Landing içeriği şu an statik `frontend/src/components/seo/seo-landing-content.ts`. Backend seoQuality bunu **hardcoded generic `landingHtml()` şablonuyla** skorluyor (`seoQuality/repository.ts:22,73` LANDINGS) — GERÇEK içerikle değil. Yani içerik ne admin-düzenlenebilir ne de doğru skorlanıyor. Çözüm: içeriği **DB'ye taşı**, her şey (editör+AI+skor) DB'den beslensin.

---

## 0. Mimari karar (ÖNCE OKU)

**Landing içeriğini `custom_pages` tablosuna `module_key='landing'` olarak taşı.** Neden:
- Blog zaten `custom_pages` (module_key='blog') üzerinde: **admin editör + AI asistanı (`/admin/ai/content`) + SeoQualityPanel + seoQuality skorlama** hepsi hazır. Landing için sadece module_key değişir → tüm bu altyapı bedavaya gelir.
- `custom_pages_i18n` locale bazlı içerik (tr/en/de) + meta + tags + alt destekliyor.
- seoQuality calculator zaten `custom_page` entity_type'ı gerçek içerikten skorluyor → landing gerçek içerikten skorlanır (fake şablon biter).

**Landing key ↔ slug ↔ route eşleşmesi (sabit route'lar):**
| key | route (frontend) | tr slug | en slug | de slug |
|-----|------------------|---------|---------|---------|
| kahve-fali | /kahve-fali | kahve-fali | coffee-reading | kaffeesatzlesen |
| ruya-tabiri | /ruya-tabiri | ruya-tabiri | dream-interpretation | traumdeutung |
| birth-chart | /birth-chart | dogum-haritasi | birth-chart | geburtshoroskop |
| numeroloji | /numeroloji | numeroloji | numerology | numerologie |
| yildizname | /yildizname | yildizname | yildizname | yildizname |
| tarot | /tarot | tarot | tarot | tarot |
| sinastri | /sinastri | sinastri | synastry | synastrie |
| pricing | /pricing | fiyatlandirma | pricing | preise |
> **Route sabit** (/kahve-fali gibi); DB'deki slug SEO/kanonik amaçlı. Frontend landing sayfaları içeriği **key** ile çeker (slug ile değil), route değişmez.

---

## FAZ 1 — Landing içeriğini DB'ye taşı

### [x] LSM-T1 — Seed: landing içeriği custom_pages'e 🔴
- **Codex notu (2026-07-02):** `landing_key` şema/Drizzle/query desteği eklendi; `219_landing_pages_seed.sql` 8 landing parent + 24 i18n satırı üretir. Seed üretimi tekrar çalıştırılabilir `backend/scripts/generate-landing-pages-seed.ts` ile yapıldı.
- **Dosya:** `backend/src/db/sql/2XX_landing_pages_seed.sql` (yeni) + gerekiyorsa `landing_key` kolonu.
- `custom_pages`'e opsiyonel `landing_key VARCHAR(40) NULL` kolonu ekle (route↔içerik eşleşmesi için; slug'lar locale'e göre değişebilir ama key sabit). Index.
- 8 landing × tr/en/de içeriği `frontend/src/components/seo/seo-landing-content.ts` `LANDING_CONTENT`'ten al → `custom_pages`(module_key='landing', landing_key, featured_image) + `custom_pages_i18n`(locale, title, slug, content JSON{html}, summary, meta_title, meta_description, tags) olarak seed'le.
- **Prod:** additive ALTER (`landing_key`) + seed INSERT IGNORE (mevcut değilse).
- **Kabul:** `SELECT * FROM custom_pages WHERE module_key='landing'` 8 satır; i18n 24 satır; içerik dolu.

### [x] LSM-T2 — Frontend: landing içeriğini DB'den oku 🔴
- **Codex notu (2026-07-02):** `SeoLandingArticle` DB öncelikli server fetch kullanıyor (`module_key=landing&landing_key=...`); DB boşsa statik fallback devam ediyor. 8 landing sayfası ortak DB-aware bloğa bağlandı.
- **Dosya:** `frontend/src/components/seo/SeoLandingArticle.tsx` + landing sayfaları (`ruya-tabiri/page.tsx` vb.).
- `getLanding(type, locale)` statik yerine **DB'den** çeksin: public custom_pages endpoint'i (module_key='landing', landing_key=type, locale) → içerik/meta. RTK veya server fetch. **Statik `seo-landing-content.ts` fallback** olarak kalsın (DB boşsa).
- `SeoLandingArticle` DB içeriğini render etsin (content HTML + FAQ + AuthorBio). Banner başlığı DB title/eyebrow'dan.
- **Kabul:** /tr/ruya-tabiri DB içeriğini gösterir; admin'den düzenlenince canlı değişir.

### [x] LSM-T3 — Backend seoQuality: gerçek içerikten skorla 🔴
- **Codex notu (2026-07-02):** `LANDINGS/landingHtml()` sahte kaynak kaldırıldı; landing içerikleri `custom_page` olarak gerçek `custom_pages_i18n.content` üzerinden skorlanıyor. Landing URL route’u `landing_key` ile hesaplanıyor.
- **Dosya:** `packages/shared-backend/modules/seoQuality/repository.ts` — `collectEntities` içindeki hardcoded `LANDINGS` + `landingHtml()` şablonunu KALDIR. Bunun yerine `custom_pages`(module_key='landing') satırlarını `entity_type='astro_landing'` (veya 'custom_page') olarak topla, **gerçek content'i** calculator'a ver.
- Not: entity_type'ı 'custom_page' yaparsan landing admin editörü blog ile aynı olur (tek tip). Ya da 'astro_landing' koru ama gerçek içerikten skorla. **Öneri: module_key ile ayır, entity_type='custom_page' (tek editör).**
- **seoQuality calculator DEĞİŞMEZ** (skor formülü sabit).
- **Kabul:** landing skorları gerçek içerikten hesaplanır (fake 82 → gerçek).

## FAZ 2 — Admin: Genel "İçerik Sayfaları" modülü (blog editörünü genelleştir)

### [x] LSM-T4 — Blog editörünü yeniden kullanılabilir `ContentModuleClient` yap 🟠
- **Codex notu (2026-07-02):** Blog client ortak `ContentModuleClient` wrapper’ına çevrildi; AI, görsel, locale seçici ve SEO kalite paneli korunarak moduleKeys destekli hale getirildi.
- **Dosya:** `admin_panel/.../blog/_components/admin-blog-client.tsx` → ortak `admin/_components/common/ContentModuleClient.tsx` (props: `moduleKeys: string[]`, başlık, i18n öneki, `slugEditable?`, `aiCaution?`).
- Tüm mevcut özellikler korunur: Tabs (İçerik/Görseller/SEO), RichContentEditor, çoklu görsel, **AI asistanı**, **SeoQualityPanel** (✓/✗ + AdSense/index), locale seçici.
- Liste `module_key` filtresi/grubu ile ÇOKLU tip destekler.
- **Kabul:** aynı bileşen blog, landing ve hukuki/statik sayfalar için çalışır.

### [x] LSM-T5 — Admin sayfaları + sidebar (blog + landing + statik/hukuki) 🟠
- **Codex notu (2026-07-02):** `/admin/landing` ve `/admin/pages` eklendi; sidebar’a "Landing Sayfaları" ve "İçerik/Hukuki Sayfalar" eklendi. Hukuki/statik modda AI uyarısı mevcut hukuki anlamı koruyacak şekilde geçiliyor.
- **Landing:** `admin_panel/.../landing/` → `ContentModuleClient moduleKeys={['landing']}` (slug read-only, sabit route).
- **Statik/Hukuki:** `admin_panel/.../pages/` → `ContentModuleClient moduleKeys={['about','faq','privacy','privacy_notice','terms','kvkk','legal_notice','cookies','editorial_policy','consultant_agreement','consultant_agreement_v1','payout_faq']}` — module_key'e göre grupla; **hukuki metinde AI 'iyileştir/biçimle' only** (hüküm uydurma; `aiCaution` flag AI prompt'una "mevcut hukuki anlamı KORU, yeni hüküm ekleme" ekler).
- Sidebar'a "Landing Sayfaları" + "İçerik/Hukuki Sayfalar" ekle (`sidebar-items.ts`), "İçerik Yönetimi" grubunda.
- **Kabul:** admin blog + landing + tüm statik/hukuki sayfaları tek desende, tr/en/de, AI + SEO paneliyle yönetir; hukuki metinde AI hüküm uydurmaz.

> **Hukuki içerik notu:** KVKK/gizlilik/şartlar gibi sayfalarda skoru yükseltmek için içerik doğal olarak uzar; ancak **hukuki doğruluk** korunmalı. AI yalnız yapı/başlık/açıklık iyileştirir; asıl hükümler insan onayından geçmeli. Düşük skorlu ama kısa-olması-doğal sayfalar (ör. çerez) için index_ready eşiği ayrı değerlendirilebilir (opsiyonel: `seo_index=0` bazı hukuki alt-sayfalara).

## FAZ 3 — Modül-içi SEO kalite (her yerde inline)

### [x] LSM-T6 — SeoQualityPanel'i ortak bileşen yap 🟠
- **Codex notu (2026-07-02):** Panel `admin/_components/common/SeoQualityPanel.tsx` dosyasına taşındı; `ContentModuleClient` buradan kullanıyor.
- **Dosya:** blog client'taki `SeoQualityPanel`'i `admin/_components/common/SeoQualityPanel.tsx`'e taşı (paylaşılan). Blog + landing + (ileride consultants) import etsin.
- **Kabul:** tek kaynak; her içerik modülü aynı paneli gösterir.

### [x] LSM-T7 — Consultants adminine SEO paneli 🟡
- **Codex notu (2026-07-02):** Danışman detay ekranına `entity_type='consultant'` SEO kalite paneli eklendi; mevcut meta alanlarıyla aynı SEO bölümünde görünüyor.
- Danışman profil düzenlemede `SeoQualityPanel` (entity_type='consultant') — SEO alanları (meta_title/description/og — SEO-T16) + skor.
- **Kabul:** danışman düzenlemede SEO skoru + eksikler görünür.

### [x] LSM-T8 — /admin/seo-quality → genel bakış rolüne indir 🟡
- **Codex notu (2026-07-02):** Sayfa başlığı/metni "SEO Genel Bakış" olarak güncellendi; satır aksiyonları blog/landing/pages/consultants modül editörlerine yönlendiriyor.
- Standalone sayfa **kaldırılmaz** ama "birincil düzenleme" yerine **genel bakış/dashboard** olarak konumlanır: tüm modüllerin skor dağılımı, düşük skorlular, AdSense-riskli sayfalar; her satır **ilgili modül editörüne** link (blog→/admin/blog, landing→/admin/landing). Detay düzenleme modülde yapılır.
- Sidebar'da grup/etiket güncelle (ör. "SEO Genel Bakış").
- **Kabul:** seo-quality özet gösterir, düzenleme modüllere yönlendirir.

## FAZ 4 — İçerik kalite (blog gibi yükselt) + deploy

### [x] LSM-T9 — Landing içeriğini AI ile zenginleştir 🟠
- **Codex notu (2026-07-02):** Landing seed HTML’i ek sorumlu kullanım/sonraki adım bölümleri, 2 iç link ve skor aralığına uygun meta title/description üretimiyle zenginleştirildi. Skor formülü değiştirilmedi.
- Landing'ler zaten ~633 kelime, 82/100 (gerçek skorlama sonrası). Eksik bileşenlere göre (muhtemelen schema/heading) AI ile iyileştir; hedef ≥90.
- `apply-blog-uplift` benzeri veya admin AI butonuyla; **native-dil**, konuya sadık.
- **Kabul:** landing'ler ≥90, AdSense/index hazır.

### [x] LSM-T10 — Deploy + doğrula 🔴
- **Codex notu (2026-07-02):** backend/admin/frontend typecheck ve build geçti; canlıya rsync ile dağıtıldı, backend/admin/frontend PM2 reload edildi. Prod seed + SEO recalc çalıştı (`custom_page` count=84); 24 landing için minimum skor 95, AdSense/index hazır 24/24. Canlı doğrulama: `/admin/landing`, `/admin/pages`, `/tr/ruya-tabiri` HTTP 200; landing API DB içeriği döndürüyor.
- typecheck (backend+admin+frontend) → commit → git-deploy (⚠️ eşzamanlı deploy çakışmasına dikkat).
- Prod: landing seed/ALTER, recalc.
- Canlı: /tr/ruya-tabiri DB içeriği + admin'den düzenlenebilir + skor gerçek + her modülde SEO paneli.

---

## Uygulama sırası
1. **LSM-T1, T2, T3** (landing → DB, frontend+backend rewire) — mimari temel.
2. **LSM-T4, T5** (ortak editör + landing admin).
3. **LSM-T6, T7, T8** (SEO paneli her modülde + seo-quality overview).
4. **LSM-T9, T10** (içerik yükselt + deploy).

## Kesin kurallar
- **seoQuality calculator/formül DEĞİŞMEZ** — skor gerçek içerikten.
- Landing **route'ları sabit** (/kahve-fali vb.) — slug değişmez, SEO URL bozulmaz.
- Statik `seo-landing-content.ts` **fallback** olarak kalır (DB boşsa çökme yok).
- Mevcut blog editörü + AI + SEO paneli **regresyon olmadan** genelleştirilir.

## Kilit dosyalar
| İş | Yol |
|----|-----|
| Landing statik içerik (kaynak→DB) | `frontend/src/components/seo/seo-landing-content.ts` |
| Landing render | `frontend/src/components/seo/SeoLandingArticle.tsx` + `frontend/src/app/[locale]/{ruya-tabiri,tarot,...}/page.tsx` |
| seoQuality landing skorlama | `packages/shared-backend/modules/seoQuality/repository.ts` (LANDINGS/landingHtml → DB) |
| Blog editör (genelleştir) | `admin_panel/.../blog/_components/admin-blog-client.tsx` |
| AI asistanı (hazır) | `packages/shared-backend/modules/aiContent/` + `/admin/ai/content` |
| SeoQualityPanel (ortaklaştır) | blog client → `admin/_components/common/SeoQualityPanel.tsx` |
| Admin sidebar | `admin_panel/src/navigation/sidebar/sidebar-items.ts` |
| custom_pages şema | `backend/src/db/sql/197_custom_pages_schema.sql` (+ landing_key) |
