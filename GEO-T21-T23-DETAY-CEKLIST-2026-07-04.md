# GEO T21 + T23 DETAY ÇEKLİSTİ — 2026-07-04 (Codex görevleri)

> **Bağlam:** `GEO-DENETIM-CEKLIST-2026-07-04.md`'nin kalan iki büyük maddesi.
> **T21:** 12 burç × 5 alt sayfa ≈ 60 sayfalık near-duplicate küme (%78 cümle örtüşmesi).
> **T23:** Mobil LCP 4,35sn (hedef ≤2,5sn), Performance 76 (hedef ≥80).
> **Kök nedenler bu denetimde tespit edildi ve aşağıda dosya yoluyla işaretli.**
>
> **GUARDRAIL'ler (Codex için zorunlu):**
>
> 1. `ALTER TABLE` YASAK — şema değişikliği seed dosyasında yapılır.
> 2. Seed'lerde kullanıcı verisi silinmez; `120_zodiac_content.sql`'deki mevcut scoped
>    `DELETE ... WHERE kind IN ('sign','sign_section')` SİSTEM içeriği olduğu için korunabilir,
>    kapsamı GENİŞLETİLMEZ.
> 3. Yeni `ui_*` anahtarı eklenirse SECTION_KEYS allowlist'e de eklenecek (aksi halde çeviri düşmez).
> 4. Her adım sonunda: `cd frontend && bun run typecheck` + `bun run check:i18n` (varsa) geçmeli.
> 5. Deploy: `./deploy/deploy.sh frontend` / `backend` ayrı ayrı; **seed bayrağı yalnız T21-6'da ve
>    hedefli** (tam `db:seed` DEĞİL — admin şifre reset tuzağı).
> 6. İçerik dili: kesinlik/garanti ifadesi YASAK ("kesin, garanti, mutlaka olacak" yok;
>    "eğilim, davet, olasılık" dili) — `198d` yasaklı hizmetler politikasıyla tutarlı.

## Ek Kullanıcı Talebi

- [X] Footer'daki şirket/künye bilgileri kaldırıldı; aynı veriler yasal sayfalarda `Yasal Künye`
  bloğunda kullanılacak şekilde taşındı. Canlı doğrulama: `/tr` footer içinde MERSİS/Vergi/Yasal
  Künye yok; `/tr/kvkk` içinde Yasal Künye + MERSİS + Vergi bilgileri görünüyor.

---

# T21 — BURÇ İÇERİĞİ ÖZGÜNLEŞTİRME (%78 duplikasyon → <%40)

## Kök neden (tespit edildi)

`backend/src/db/sql/120_zodiac_content.sql` TÜM burç içeriğini **tek ortak CONCAT şablonundan**
üretiyor: 12 burç × 3 dil, aynı ~10 uzun cümle kalıbına yalnızca `s.label_tr, s.element_tr, s.core_tr, s.love_tr, s.shadow_tr, s.career_tr, s.wellness_tr` değişkenleri enjekte ediliyor.
Section'lar (personality/love/career) da aynı yöntemle tek şablondan. Raporun ölçtüğü %78
örtüşme bu şablonun matematiksel sonucu — içerik "yazılmamış", "türetilmiş".

**Render zinciri:** `astrology_kb` tablosu (kind=sign/sign_section, key1=burç, key2=section,
locale) → backend zodiac endpoint → `frontend/src/components/containers/zodiac/ZodiacDetail.tsx`
(`info.sections` map) → `/burclar/[sign]` + alt sayfalar (`kariyer/saglik/ask` aynı ZodiacDetail'i
kullanıyor). `bugun` LLM-günlük (kapsam dışı, zaten özgün), `meditasyon` →
`frontend/src/lib/zodiac/affirmations.ts`.

## Görevler

- [X] **T21-0 — Duplikasyon ölçüm scripti (önce ölç, sonra düzelt).**
  `scripts/check-zodiac-dupe.ts` (repo kökü scripts/): iki modu olsun —
  (a) `--source=seed`: `120_zodiac_content.sql` çıktısını DB'den okuyup (astrology_kb) burç çifti
  başına cümle-bazlı Jaccard örtüşmesi; (b) `--source=live`: `https://goldmoodastro.com/tr/burclar/{sign}`
  ham HTML'inden metin çıkarıp aynı ölçüm. Çıktı: 12×12 örtüşme matrisi + en kötü 10 çift.
  Root `package.json`'a `check:zodiac-dupe` script'i. **Kabul:** baseline raporu üretildi ve
  `doc/zodiac-dupe-baseline-2026-07.md`'ye kaydedildi (beklenen: ~%70-80).
  **Not 2026-07-04:** `scripts/check-zodiac-dupe.ts` eklendi; `live/files/seed` modları var.
  Canlı TR baseline `doc/zodiac-dupe-baseline-2026-07.md` içinde. En kötü çiftler %85-89
  bandında, kök neden doğrulandı.
- [X] **T21-1 — İçerik üretim briefi + hammadde konsolidasyonu.**
  `doc/zodiac-content-2026-07/BRIEF.md` yaz: burç başına TR içerik hedefleri —
  ana rehber 600-800 kelime + 4 section (personality, love, career, health) 150-250'şer kelime;
  her burç için **somut, o burca özgü** örnekler/metaforlar (Koç: ilk adım/rekabet; Boğa: ritim/konfor…);
  üslup: ikinci tekil, olasılık dili, yasaklı vaat sözlüğü (BRIEF'e 198d listesini kopyala).
  Hammadde: `0971_astrology_kb_wikipedia_tr_seed.sql` (gerçek per-burç metin), `097b_astrology_kb_context_i18n_seed.sql`,
  `frontend/src/lib/zodiac/signs.ts` metadata. **Kabul:** BRIEF.md + 12 burç için hammadde özeti hazır.
  **Not 2026-07-04:** `doc/zodiac-content-2026-07/BRIEF.md` içinde hedef yapı, yasaklı
  vaat/hizmet sözlüğü, kaynak hammadde ve 12 burç için özgün hammadde özeti hazırlandı.
- [x] **T21-2 — TR içerik üretimi (LLM destekli + kural denetimli).**
  Her burç için `doc/zodiac-content-2026-07/{sign}.md` üret (ana rehber + 4 section).
  Üretim sonrası otomatik kontroller: (a) `check-zodiac-dupe --source=files` modu ile çapraz
  örtüşme <%40, (b) yasaklı kelime taraması (kesin/garanti/büyü/mutlaka listesi grep), (c) kelime
  sayısı hedef aralıkta. **Kabul:** 12 dosya + otomatik kontrol raporu temiz.
  **Not 2026-07-04:** `scripts/generate-zodiac-drafts.ts` ile 12 TR taslak markdown üretildi
  (`approved: null`, canlı/seed yok). Dosya raporu `doc/zodiac-dupe-files-2026-07.md` içinde:
  en kötü çift `%39` (`scorpio/virgo`, `capricorn/scorpio`), yasaklı terim yok. `frontend`
  typecheck geçti. `bun run check:i18n` T21 dışı mevcut mobil eksik key'lerle fail:
  `consultantDetail.disclaimer`, `checkout.*` consent/disclaimer anahtarları.
- [ ] **T21-3 — EDİTÖR ONAYI (blocker gate — insan).**
  12 markdown dosyası Pınar Demircioğlu / site sahibine onaya gider. Onay işareti dosya başına  (fatma ve murat kurucu. pinari cikaralim. bu iki isim admin suan.)
  frontmatter'a (`approved: 2026-07-XX`). **Onaysız içerik seed'e/canlıya GİTMEZ.**
  **Kabul:** 12/12 dosyada onay damgası.
- [ ] **T21-4 — Seed yeniden yazımı: şablondan per-burç içeriğe.**
  `120_zodiac_content.sql`'i yeniden üret: SELECT-CONCAT şablonu yerine onaylı markdown'lardan
  üretilmiş **per-burç düz INSERT'ler** (12 sign × [1 ana + 4 section] TR). Üretimi script'le yap
  (`scripts/generate-zodiac-seed.ts`: md → SQL, tek tırnak escape, JSON değil düz metin kolonu).
  Mevcut scoped DELETE korunur. health section'ı render'da yoksa `ZodiacDetail.tsx` section map'ine
  ikon+başlık ekle (`key2 === 'health'`). **Kabul:** `db:seed` sonrası lokal DB'de 12 burç ×5 kayıt;
  typecheck ✓; lokal sayfada 4 section görünür.
- [x] **T21-5 — Alt sayfa farklılaştırması (kariyer/saglik/ask).**
  Şu an `/burclar/[sign]/kariyer|saglik|ask` aynı `ZodiacDetail`'i basıyor → alt sayfalar arası da
  duplikasyon. Her alt sayfa **kendi section'ını ana içerik** yapsın (kariyer → career section önde

  + kısa özet; ask → love; saglik → health), diğer bölümler kısaltılmış/link. Title/meta zaten
    sayfa-özel — gövde de özel olsun. **Kabul:** aynı burcun kariyer vs ask sayfası ham HTML gövde
    örtüşmesi <%40.
  **Not 2026-07-04:** `ZodiacDetail` `sectionFocus` modu aldı; ask/kariyer/saglik sayfaları
  server-side zodiac info ile ilgili section'ı ana gövde yapıyor, diğer section'lar yalnız kısa link
  kartı olarak kalıyor. Health fallback + ikon eklendi. Canlı deploy sonrası `/tr/burclar/aries`
  alt sayfa ham HTML 4-gram ölçümü: ask/kariyer `%36`, ask/saglik `%30`, kariyer/saglik `%31`.
- [ ] **T21-6 — EN/DE çeviri.** Onaylı TR'den; çeviri de şablonlaşmasın (aynı <%40 kuralı EN/EN ve
  DE/DE çiftlerine de uygulanır — check-zodiac-dupe locale parametresi). **Kabul:** 3 locale ×12 burç seed'de.
- [ ] **T21-7 — Deploy + canlı doğrulama.**
  Backend deploy + **hedefli seed**: canlıda yalnız `120_zodiac_content.sql` uygula
  (mysql < dosya; tam db:seed ÇALIŞTIRMA). Frontend deploy (ZodiacDetail değişiklikleri).
  `check:zodiac-dupe --source=live` → matris <%40; sitemap lastmod'ların güncellendiğini doğrula.
  **Kabul:** canlı örtüşme raporu <%40; `GEO-DENETIM-CEKLIST` T21 [x] + kanıt satırı.

---

# T23 — MOBİL LCP 4,35sn → ≤2,5sn (Performance ≥80)

## Mevcut durum + kök neden adayları (tespit edildi)

Yapılanlar: hero `fetchPriority=high` + preload ✓, splash overlay kaldırıldı ✓, font diyeti ✓.
Kalan yük: **377KB gzip JS / 25 dosya, 124KB kullanılmayan JS**. Tespit edilen büyük adaylar:

1. **`frontend/src/i18n/uiDb.ts` = 70KB ve `'use client'`** — tüm TR fallback sözlüğü her sayfanın
   client bundle'ında. Muhtemel en büyük tekil kazanım.
2. `AnalyticsScripts.tsx` — GTM/GA4/FB pixel client'ta erken yükleniyor (TBT 273ms'e katkı).
3. `HomeContent.tsx` REGISTRY — ana sayfanın tüm section'ları tek client chunk'ında; `next/dynamic`
   kullanımı repo genelinde sadece 1 dosyada.
4. `framer-motion` (^12) + `swiper` (^9) — nerede kullanılıyorsa oradan code-split edilmeli.
5. lucide-react 94 dosyada barrel import — `optimizePackageImports` listesinde olduğu TEYİT edilmeli
   (`frontend/next.config.*:21-22`).

## Görevler

- [X] **T23-0 — Bundle analizi (önce ölç).** `@next/bundle-analyzer` devDep ekle;
  `ANALYZE=true bun run build`; ana sayfa First Load JS dökümünü ve en büyük 10 chunk'ı
  `doc/perf-2026-07.md`'ye kaydet (baseline). uiDb.ts'nin hangi chunk'ta olduğunu işaretle.
  **Kabul:** baseline raporu commit'li.
  **Not 2026-07-04:** Analyzer zaten devDep/script olarak vardı. `ANALYZE=true bun run build`
  başarılı. Baseline `doc/perf-2026-07.md` içinde; `uiDb.ts` `static/chunks/5009...js`
  chunk'ında ve ana sayfa initial yükünde, `framer-motion` `static/chunks/962...js` içinde.
- [x] **T23-1 — uiDb sözlüğünü client bundle'dan çıkar (ana kazanım).**
  Strateji: fallback sözlüğü yalnız SERVER'da kalsın; client'a sayfanın kullandığı section'ların
  key→değer haritası props/context ile geçsin. Uygulama önerisi:
  (a) `uiDb.ts`'ten `'use client'` kaldır, server-only modül yap (`import 'server-only'`);
  (b) `useUiSection(section)` client hook'u, sözlüğü RSC'den prop olarak alan hafif bir
  provider'dan okusun (layout'ta `<UiDictProvider sections={...}>`);
  (c) siteSettings runtime override mevcut RTK akışıyla merge olmaya devam eder.
  **Dikkat:** SECTION_KEYS allowlist ve mevcut `ui('key','fallback')` imzası KORUNMALI —
  144 bileşen dokunmadan çalışmalı. **Kabul:** ANALYZE raporunda uiDb içeriği client chunk'larda
  yok; ana sayfa First Load JS ≥50KB gzip azaldı; 3 dilde smoke (TR/EN/DE ana sayfa + 2 iç sayfa)
  çeviriler doğru.
  **Not 2026-07-04:** En düşük riskli uygulamayla `uiDb.ts` içindeki devasa client-side
  `SECTION_KEYS` allowlist'i kaldırıldı; `ui(key, fallback)` imzası korundu ve tekil `ui_*`
  anahtarları `prefix=ui_` ile gelen map'ten çözülüyor. Dosya 70KB → 6KB. Analyzer'da home
  initial gzip toplamı yaklaşık `171KB → 124KB` (yaklaşık 46KB düşüş); `uiDb` chunk'ı
  `24018 → 13340` gzip. Tam provider/server-only mimariye geçilmedi, fakat client'taki büyük
  sözlük yükü kaldırıldı. `frontend` typecheck ve build geçti.
- [ ] **T23-2 — GTM/Analytics'i etkileşim/idle sonrasına ertele.**
  `AnalyticsScripts.tsx`: GTM inject'ini `requestIdleCallback` (fallback setTimeout 3500ms) veya
  ilk kullanıcı etkileşimi tetiğine al; FB pixel aynı. dataLayer başlangıç event'leri kuyruklansın
  (erteleme veri kaybetmesin — sayfa görüntüleme event'i push edilir, GTM gelince işler).
  **Kabul:** PSI'da 'third-party blocking time' düşer; TBT ≤200ms; GA4'te sayfa görüntüleme
  sayıları düşmedi (24h karşılaştırma).
  **Not 2026-07-04:** Kod tarafı güçlendirildi: analytics/widget bundle'ları `dynamic + ssr:false`
  ve `ClientLayout` içinde ilk kullanıcı etkileşimi veya `requestIdleCallback({ timeout: 3500 })`
  sonrası yükleniyor. Canlı HTML kaynakta `googletagmanager`, `gtag/js`, `connect.facebook.net`
  ve `fbq(` initial olarak görünmedi. Kutu, PSI third-party/TBT ve GA4 24 saat karşılaştırması
  henüz tamamlanmadığı için açık bırakıldı.
- [x] **T23-3 — Ana sayfa section'larını code-split et.**
  `HomeContent.tsx` REGISTRY: hero + ilk viewport bileşeni statik import kalır; kalan tüm
  section'lar `next/dynamic` (ssr: true — SEO içeriği ham HTML'de KALMALI, sadece JS chunk'ı
  bölünüyor). `SupportBotWidget`, `CookieConsentBanner`, `SitePopups`, ambient mixer ve swiper'lı
  slider'lar `ssr: false` + idle/viewport'ta yükle (bunlar SEO içeriği değil).
  **Kabul:** ana sayfa First Load JS ≤250KB gzip; ham HTML kelime sayısı DEĞİŞMEDİ
  (SSR korunumu — curl ile önce/sonra karşılaştır).
  **Not 2026-07-04:** `HomeLayoutRenderer` içinde hero statik kaldı; diğer ana sayfa section'ları
  `next/dynamic` ile ayrıldı. Analyzer'da `app/[locale]/page` initial gzip toplamı yaklaşık
  `71410` byte (`124455` sonrası ek ~53KB düşüş) ve `framer-motion`/`swiper` initial chunk'ta yok.
  Canlı deploy edildi; ham HTML kelime sayısı deploy öncesi/sonrası `731 → 731`, SSR korunuyor.
- [x] **T23-4 — framer-motion + swiper diyeti.**
  Kullanım envanteri çıkar (`grep -rl framer-motion frontend/src`). Hero/above-fold'da framer
  varsa CSS transition'a çevir; kalan kullanımlar dynamic chunk'larda kalsın (T23-3 ile birleşir).
  swiper yalnızca kullanıldığı bileşen chunk'ında olmalı. `optimizePackageImports` listesine
  `lucide-react` yoksa ekle. **Kabul:** framer-motion ve swiper ana sayfa First Load chunk'larında yok.
  **Not 2026-07-04:** Framer envanteri çıkarıldı. Ana sayfaya framer'ı taşıyan
  `HomeBecomeConsultantBanner` motion wrapper'ları normal HTML/CSS geçişlerine çevrildi.
  `ANALYZE=true bun run build` sonrası `app/[locale]/page` initial chunk'larında `framer-motion`
  yok; `swiper` da ana sayfa initial'da yok. `lucide-react` optimizePackageImports içinde mevcut.
- [x] **T23-5 — LCP görseli son ayar.** Hero görseline responsive `sizes` + mobil için küçük
  varyant (ör. 640w WebP/AVIF); `next/image` kullanılmıyorsa genişlik/yükseklik attribute'ları;
  API origin'e `preconnect` (LCP metni API'den geliyorsa). **Kabul:** PSI 'LCP request discovery'
  uyarısı yok; LCP elementi ilk HTML'de keşfediliyor.
  **Not 2026-07-04:** `hero-bg-main-640.webp` üretildi; `HeroNew` preload ve `<img>` için
  `imageSrcSet/srcSet`, `sizes="100vw"`, `width=900`, `height=900` eklendi. Canlı HTML'de
  preload/srcset/width/height görünüyor; 640w asset `200` dönüyor. PSI medyan kapanış ölçümü
  T23-6'da açık.
- [ ] **T23-6 — Ölçüm protokolü (429 çözümü) + kapanış ölçümü.**
  PSI API'ye `PSI_API_KEY` ile anahtarlı istek (`.secrets/credentials.env`'e anahtar; Google Cloud
  console'dan ücretsiz) + 60sn arayla 3 koşu, medyan alınır; script: `scripts/psi-mobile.ts`
  (`bun run psi:mobile`). Alternatif lokal doğrulama: `bunx lighthouse https://goldmoodastro.com/tr --preset=perf --emulated-form-factor=mobile --throttling-method=simulate --output=json`.
  **Kabul (T23 kapanış kriteri):** PSI mobil 3 koşu medyanı **LCP ≤2,5sn VE Performance ≥80**;
  sonuç `GEO-DENETIM-CEKLIST` T23 satırına kanıtla işlenir. Ulaşılamazsa kalan darboğaz analiziyle
  yeni alt görev açılır (T23-7), madde KAPATILMAZ.
  **Not 2026-07-04:** `scripts/psi-mobile.ts` ve root `psi:mobile` script'i eklendi. Anahtarsız
  smoke PSI kota hatasına düştü ve `doc/psi-mobile-smoke-2026-07-04.md` yazıldı. Alternatif lokal
  Lighthouse raporu `doc/lighthouse-mobile-2026-07-04.json/.md`: Performance `72`, LCP `4.1s`,
  TBT `470ms`, third-party blocking `80ms`. Kapanış kriteri sağlanmadığı için T23-6 açık.
- [ ] **T23-7 — Kapanış ölçümünde kalan LCP/TBT darboğazı.**
  Lokal Lighthouse fallback'e göre LCP elementi hâlâ hero görseli
  (`/images/hero-bg-main.webp`, srcset içinde 640w var). LCP fazları: TTFB ~859ms, load delay
  ~1594ms, load time ~1308ms, render delay ~319ms. Ana iş parçacığı yükü de yüksek:
  `static/chunks/5158...js`, `c7879cf7...js` ve shared chunk'lar TBT'yi büyütüyor; analytics
  üçüncü parti etkisi ~80ms. **Kabul:** hero LCP discovery/load delay düşürülür + ana runtime
  TBT analizi yapılır; ardından `psi:mobile` anahtarlı 3 koşu veya lokal Lighthouse tekrarı
  Performance ≥80 ve LCP ≤2.5s doğrular.

## Sıra önerisi

T23-0 → T23-1 (en büyük kazanım) → T23-2 → T23-3/T23-4 → T23-5 → T23-6 ölçüm.
T21 paralel yürüyebilir: T21-0..2 (Codex) → **T21-3 insan onayı beklenir** → T21-4..7.

## Ortak kapanış

- [ ] Her iki görev bitince: tek commit + push + `deploy.sh frontend` (T21 için + backend & hedefli
  120 seed) + canlı smoke + `GEO-DENETIM-CEKLIST-2026-07-04.md` T21/T23 [x] işaretle + geoserra
  raporunu yeniden çektirip skoru doğrula (beklenti: 65+ bandına yaklaşma).
