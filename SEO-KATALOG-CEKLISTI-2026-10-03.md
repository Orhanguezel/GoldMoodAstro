# SEO Katalog Çeklisti — 2026-10-03

Kaynak: `goldmoodastro-seo-katalog.pdf` (Tanitio Site Sağlığı, denetim
`00f29a15-…`, 199 sayfa, 10 sayfalık örneklem, 1178 kontrol satırı).
Puanlar: Teknik SEO 74.9 · GEO 48.9 · İçerik kalitesi 46.8 · E-E-A-T 72.4.

Durum işaretleri: `[x]` yapıldı ve doğrulandı · `[~]` bilinçli karar / yanlış
pozitif (gerekçe yazılı) · `[ ]` kullanıcı eylemi gerekiyor (kod dışı).

## A. Kritik — raporun asıl kök nedeni

- [x] **A1. TR sayfaların SSR HTML'inde İngilizce metin.** Google `/tr`
  sayfalarında "Featured Consultants", "See All", "Login/Register", "Contact
  Us", "Send a message", "Search & Filters", "Popular/New/Online Consultants",
  "Client Reviews", "Share Your Wisdom…", "Free/Monthly/Yearly" görüyordu.
  Anahtar kelime tutarlılığı (31/16/15/33/3/21) ve "İçerik kalitesi" kaybının
  büyük kısmı buradan geliyordu.
  *Kök neden:* `useUiSection` metinleri yalnız istemcide (RTK, 958 KB'lık
  `site_settings?prefix=ui_` isteği) çekiyordu; SSR'da veri yokken koddaki
  İngilizce yedek HTML'e basılıyordu.
  *Çözüm:* `[locale]/layout.tsx` → `fetchUiStringsSnapshot()` locale'e
  çözülmüş sözlüğü (ui_mobile/ui_admin hariç) `UiStringsProvider` ile verir;
  `useUiSection` ilk render'da bunu kullanır ve istemci isteğini atlar.
  *Yan kazanç:* her ziyaretçinin indirdiği 958 KB JSON kalktı (HTML'e ~45 KB
  gzip eklendi).
  Dosyalar: `i18n/uiStrings.server.ts`, `i18n/uiStringsResolve.ts`,
  `i18n/UiStringsProvider.tsx`, `i18n/uiDb.ts`.
- [x] **A2. DB'de olmayan anahtarların İngilizce yedekleri.** Ana sayfa
  "View All" → mevcut `ui_header_mega_see_all`; karusel `aria-label`
  Previous/Next → `ui_hero_prev/next`; blog ana sayfa bölümündeki ASCII
  Türkçe ("Tumunu Gor") düzeltildi.
- [x] **A3. Fiyatlandırma SSR'ında İngilizce plan adları.** Planlar istemcide
  yüklendiği için SSR yedek planları basıyordu (`name_tr: 'Free'`…). Yedekler
  canlı DB ile aynı Türkçe metne çekildi; "Audio/Video Session", "Free",
  "No card required", "day trial", "/ monthly" etiketleri tr/en/de `copy`'ye
  taşındı.
- [x] **A4. Numeroloji sayfası /tr'de İngilizce başlık ve açıklama**
  ("Free Numerology Analysis — …", 66 karakter → BULGU 3). `seo_pages`'te
  `numeroloji` kaydı yok; yedek metin locale'e göre seçiliyor. Yeni TR başlık
  57 karakter. Aynı kusur `burcunu-ogren` ve `unluler-ve-burclari`'de de vardı,
  ikisi de düzeltildi.

## B. Teknik SEO

- [x] **B1. robots.txt `Disallow: /_next/`** — 38 CSS/JS + 4 görsel
  Googlebot'a kapalıydı (sayfa çizimi ve Google Görseller). Kural kaldırıldı
  (`app/robots.ts`).
- [x] **B2. Blog gövdesindeki iç linkler İngilizce slug'la** (`/tr/consultants`,
  `/tr/birth-chart`) → her biri 308 yönlendirme. `localizeHtmlLinks()` CMS
  HTML'indeki `/tr|en|de/...` linkleri locale kanoniğine çevirir.
- [x] **B3. Blog: H1 ile ilk H2 birebir aynı.** CMS gövdesinin başındaki
  başlık sayfa başlığıyla aynıysa kaldırılıyor (`stripLeadingTitleHeading`).
- [x] **B4. Görsel ölçüsü eksik (blog 6-7 görsel, CLS riski).** Blog kapak
  (1600×900, `fetchPriority=high`), ilgili yazılar (64×64), ana sayfa blog
  kartları ve yazar avatarına `width/height` eklendi.
- [x] **B5. Lazy loading %29 (danışmanlar).** `ConsultantCard` görselleri
  `loading="lazy" decoding="async"`.
- [x] **B6. Inline CSS minify değil (0/1, blogda 0/2).** `minifyCss()` →
  design-tokens, custom-css ve `CMS_FALLBACK_CSS`.
- [x] **B7. llms.txt açıklamalı giriş 0/34.** Girişler llmstxt.org biçimine
  (`- [ad](url): açıklama`) çevrildi, EN/DE girişlerine açıklama eklendi,
  "Key facts" bölümü adlandırıldı. Doğrulama: 34/34 açıklamalı.
- [x] **B8. SSL kalan 45 gün.** Sunucuda `certbot.timer` aktif, webroot
  yenileme `--dry-run` başarılı; sertifika 30 gün kala kendiliğinden yenilenir.
  Kod/işlem gerekmez.
- [~] **B9. "Boş href: 1" (ana sayfa).** Yanlış pozitif: tarayıcı Next.js'in
  satır içi `$RC` script'indeki `<a.length` ifadesini bağlantı sanıyor. Gerçek
  DOM'da boş href yok.
- [~] **B10. JS dosyası 21-25 (>15).** Next.js App Router chunk'ları; route
  bazlı bölme zaten var. Sayıyı düşürmek bundling'i bozar, ölçülmüş bir hız
  sorunu yok (TTFB 267 ms, toplam 401 ms).
- [~] **B11. Inline style 43 attribute.** React `style` prop'ları (dinamik
  arka plan/konum); CSS'e taşımanın SEO etkisi yok.

## C. İçerik ve E-E-A-T

- [x] **C1. İletişim sayfası ince içerik (85 kelime, tek H2).** Yerelleştirilmiş
  "Size nasıl yardımcı olabiliriz?" bölümü (4 konu + iç link) ve FAQPage
  şemalı SSS eklendi; künye etiketleri (Ticari Unvan/Adres…) artık en/de'de de
  doğru dilde.
- [x] **C2. Ana sayfa: SSS ve somut güvence eksik.** Danışman onayı, canlı
  seans, Stripe ödeme ve ücretsiz araçlar üzerine SSS + FAQPage şeması
  (`components/seo/trustFaq.ts`). Zayıf kavramlar (seans, numeroloji, onaylı,
  güvenli ödeme) gövdeye taşındı.
- [x] **C3. Hakkımızda: başlıktaki "misyon/güven" gövdede yok.** "Misyon ve
  Güven" SSS bölümü; işletici adı/şehri DB'den (`company_brand`).
- [x] **C4. Blog yazılarında güvence ve somut bilgi yok.** Her yazıya "Bu
  konuyu bir danışmanla konuşmak isterseniz" bloğu (profil incelemesi,
  dakika+ücret şeffaflığı, Stripe) + danışmanlar/fiyatlandırma linkleri. DE
  için blog SSS'i eklendi (önceden İngilizce düşüyordu).
- [x] **C5. Danışmanlar: başlık "Onaylı Astrolog ve Danışman Listesi", H1
  "Danışmanları Keşfet".** H1 seed'i ve yedeği "Onaylı Astrolog ve
  Danışmanlar" yapıldı; canlı DB değeri deploy sırasında yalnız eski varsayılan
  hâlâ duruyorsa güncellenir.
- [x] **C6. Fiyatlandırma: başlık "Fiyatlar ve Hizmet Paketleri", H1
  "Fiyatlandırma".** TR H1 başlıkla hizalandı.
- [~] **C7. Müşteri yorumu / sosyal kanıt (10 sayfanın çoğunda).** Ana sayfa
  ve danışman profillerinde gerçek yorumlar zaten var; A1 düzeltmesiyle
  başlıkları artık Türkçe ("Client Reviews" yerine) taranıyor. Rapor da
  uyarıyor: kendi işletmesi için puan almak amacıyla Review/AggregateRating
  eklenmez. Uydurma yorum eklenmedi.
- [~] **C8. "Birinci el veri / özgün ölçüm" (BULGU 1).** İçerik üretim kuralı
  gereği iddialar motordan gelir; yeni özgün veri içerik ekibinin işidir. Bu
  turda yalnız doğrulanabilir somut bilgiler (süre/ücret şeffaflığı, ödeme
  akışı, işletici) eklendi.

## D. GEO / sosyal / ölçüm

- [~] **D1. sameAs 2 profil (5+ öneriliyor).** Yalnız Instagram ve Facebook
  gerçek. `config/brand.json`'daki YouTube adresi (`@goldmoodastro`) **404**
  döndüğü için temizlendi. Yeni profil uydurulmaz → kullanıcı eylemi E3.
- [~] **D2. "İzleme kodları tespit edilmedi."** GA4 (`G-M8FPZB5FFC`) çerez
  onayından sonra yükleniyor (Almanya'daki işletici için TTDSG/GDPR gereği).
  Tarayıcı onay vermediği için görmüyor; bilinçli.
- [~] **D3. Açık e-posta adresi (spam).** İletişim adresi görünür olmalı
  (E-E-A-T "iletişim" sinyali + künye zorunluluğu); gizlenmedi.

## F. Genişletilmiş taramada bulunanlar (raporun 10 sayfalık örnekleminin dışı)

Rapor yalnız 10 sayfaya baktı; aynı kontroller 28 TR sayfası + 13 EN/DE
sayfasında yerel prod build'e karşı tekrarlandı.

- [x] **F1. Araç sayfalarında (`/tr/tarot`, `/tr/kahve-fali`, `/tr/numeroloji`,
  `/tr/dogum-haritasi`, `/tr/sinastri`, `/tr/ruya-tabiri`, `/tr/yildizname`,
  `/tr/fiyatlandirma`) `/tr/consultants` linki** (landing içerik HTML'i) →
  `SeoLandingArticle` da `localizeHtmlLinks` kullanıyor.
- [x] **F2. Ana sayfa fiyat kartlarında `/tr/pricing`** → `localizePath`.
- [x] **F3. `/tr/sss`: H1 ile ilk H2 aynı** ("Sık Sorulan Sorular") →
  `stripLeadingTitleHeading` ortak yardımcıya taşındı, SSS sayfasında da
  kullanılıyor.
- [x] **F4. Blog listesi 10 ölçüsüz görsel + yazar avatarı** → `width/height`.
- [x] **F5. 60 karakteri aşan başlıklar** (`/tr/yukselen-burc-hesaplayici` 73,
  danışman profili 67) → marka eki başlığı 60'ın üzerine taşıyorsa eklenmiyor
  (`buildMetadataFromSeo`).
- [x] **F6. EN/DE sayfalarda Türkçe sızıntı** (`/en/contact` "Ticari Unvan",
  "Adres"; `/en/consultants` "Hemen Görüş") → C1 ve A1 ile kapandı.
- [x] **F7. Numeroloji hesaplama ucu 500** (LLM yok) → deterministik yorum
  (bkz. E1). Ayrıca numeroloji/tarot okumaları `req.user.id` (her zaman
  undefined) yüzünden kullanıcıya bağlanmıyordu → `sub ?? id`.

## E. Kod dışı — kullanıcı eylemi

- [ ] **E1. Anthropic API kredisi bitti; Groq anahtarı geçersiz (401);
  OpenAI kotası dolu (429).** Rapor dışı ama inceleme sırasında bulundu:
  günlük/haftalık/aylık burç üretimi (540+ başarısız çağrı), tarot ve
  numeroloji yorumları en az 2026-09-21'den beri LLM alamıyor. Kodda
  yapılan: numeroloji artık LLM düşükken 500 yerine deterministik yorum
  döndürüyor (tarot zaten kart anlamlarına düşüyordu). **Yapılacak:**
  Anthropic kredisi yükle (veya Groq anahtarını yenile), ardından eksik burç
  satırlarını idempotent script'le tamamla.
- [ ] **E2. DMARC `p=none`.** Turkticaret DNS'inde `_dmarc` TXT kaydını
  `v=DMARC1; p=quarantine; rua=mailto:info@goldmoodastro.com` yap (SPF ve
  DKIM zaten geçiyor).
- [ ] **E3. Sosyal profil sayısı.** YouTube/Pinterest/X gibi profiller
  açılırsa admin → `brand.social` alanlarına girilir; sameAs otomatik dolar.
- [ ] **E4. Alan adı 2027-04-26'da bitiyor.** Turkticaret'te otomatik
  yenilemeyi aç veya çok yıllık uzat (raporun "kalan gün 205" uyarısı).

## Doğrulama

Yerel prod build (`next build` + `next start`, canlı API'ye karşı) ile SSR
HTML'i tarandı; sonuçlar commit mesajında ve aşağıda.
