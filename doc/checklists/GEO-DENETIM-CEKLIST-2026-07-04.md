# GEO DENETİM ÇEKLİSTİ — 2026-07-04

> **Kaynak:** `goldmoodastro-geo-raporu-2026-07-04.pdf` (geoserra.com, 17 sayfa) — canlı site denetimi.
> **Skor: 39/100 — Müdahale Gerekli.** Hedef: 30 günde ~52, 60 günde ~60, 90 günde ~65+.
> **Kök neden (raporun ana tezi):** Site altyapısı iyi kurulmuş (robots.txt, llms.txt, 3 dilli sitemap,
> güçlü JSON-LD üretimi) AMA iki render hatası her şeyi görünmez kılıyor: (1) en değerli içerikler
> client-side render — JS çalıştırmayan AI crawler'lar boş kabuk görüyor; (2) tüm JSON-LD şemaları
> `afterInteractive` ile istemcide enjekte ediliyor — ham HTML'de tek bir şema yok.
> **Bulgular repo'da doğrulandı** — dosya yolları aşağıda her maddede.

## SKOR DAĞILIMI

| Kategori | Skor | Ağırlık | Ana sorun |
|---|---|---|---|
| AI Alıntılanabilirlik | 58/100 | %25 | CSR — içerik ham HTML'de yok |
| Marka Otoritesi | **5/100** | %20 | Hiçbir platformda iz yok + Astro Gold çakışması |
| İçerik E-E-A-T | 33/100 | %20 | Boş yasal sayfalar, isimsiz içerik, %78 şablon |
| Teknik Altyapı | 68/100 | %15 | En iyi alan; LCP + llms-full.txt sorunlu |
| Yapılandırılmış Veri | 35/100 | %10 | Şemalar var ama görünmez (afterInteractive) |
| Platform Optimizasyonu | 32/100 | %10 | Gemini 22, Perplexity 25, Copilot 35 |

---

## P0 — KRİTİK: Render ve Güven Onarımı (BU HAFTA — beklenen etki 39→~52)

- [x] **GEO-T1 — JSON-LD'yi server-side render'a çevir.** `frontend/src/seo/JsonLd.tsx:24`
  `<Script strategy="afterInteractive">` → düz `<script type="application/ld+json">` etiketi
  (server component'te render). Tek satırlık strateji değişikliği; zaten yazılmış TÜM şemalar
  (Organization, WebSite+SearchAction, Article+speakable, FAQPage, Person, BreadcrumbList,
  AggregateRating) bir anda 4 AI platformuna görünür olur.
  **Kabul:** `curl -s https://goldmoodastro.com/tr | grep -c 'application/ld+json'` ≥ 1; GPTBot
  user-agent'ıyla da aynı sonuç. **Raporun en yüksek etki/efor oranlı maddesi.**
  **Tamamlandı:** `frontend/src/seo/JsonLd.tsx` artık `next/script afterInteractive` yerine server-render edilen düz `<script type="application/ld+json">` döndürüyor. `frontend` typecheck geçti; SEO/app/layout katmanında `afterInteractive` kalıntısı yok. Canlı doğrulama: `/tr` ham HTML JSON-LD=2, GPTBot JSON-LD=2, `afterInteractive`=0.

- [x] **GEO-T2 — Günlük burç sayfalarını SSR/ISR'a taşı.** `/tr/burclar/*/bugun` ham HTML'de yalnızca
  **15 kelime** + 6 skeleton placeholder içeriyor; günlük yorum client-side API'den geliyor
  ('Koç' kelimesi HTML'de 0 kez). Sayfa: `frontend/src/app/[locale]/burclar/[sign]/bugun/page.tsx`
  (generateMetadata server'da ama gövde client fetch). Yorum metnini server'da çek + `revalidate: 3600`.
  Title'a burç adı + tarih ekle ('Koç Burcu Günlük Yorumu — 4 Temmuz 2026'; şu an jenerik
  'Bugünün Burç Yorumu'). Sitemap 'changefreq: daily' derken içeriğin boş olması çelişkisi kapanır.
  **Kabul:** ham HTML'de günün yorum metni tam görünür; title'da burç+tarih.
  **Tamamlandı:** `/burclar/[sign]/bugun` sayfası `async` server component'e taşındı; sign info ve günlük yorum server'da çekiliyor, `revalidate=3600` kullanılıyor, geçersiz burçlar `notFound()` oluyor. Metadata fallback'i locale'e göre burç adı + tarih içeriyor (`Koç Burcu Günlük Yorumu — ...`). `frontend` typecheck geçti. Canlı doğrulama: `/tr/burclar/aries/bugun` title `Koç Burcu Günlük Yorumu — 4 Temmuz 2026`, ham HTML 754 kelime ve Koç/Günlük/Yorum metinleri mevcut.

- [x] **GEO-T3 — Canlıdaki test verilerini temizle.** Danışman listesinde 'Test Danışman' profili,
  ₺0 ve ₺5 seans fiyatları, '5.0 puan / 0 yorum' çelişkisi, mükerrer kayıtlar (aynı danışman
  slug + UUID ile iki kez), pricing'de 'Updating pricing plans...' placeholder'ı YAYINDA.
  Ödeme alan platformda güven sinyalini aktif negatife çeviriyor. Backend/DB temizliği + seed
  kontrolü (031_consultants_seed mükerrer üretiyor mu bak).
  **Kabul:** canlı /tr/consultants listesinde test/mükerrer kayıt yok; pricing gerçek planları gösteriyor.
  **Tamamlandı:** Seed kaynaklarında test danışmanı tekrar üretilmeyecek hale getirildi; 0/5 TL yayın
  fiyatları temizlendi, public consultant listesi `approved + is_available + fiyat > 0` filtresine alındı.
  Canlı DB'de test, hazırlıksız ve mükerrer profiller `approved` dışına çıkarıldı; yayın fiyatları
  650/900/1100/1800 TRY olarak düzeltildi. `frontend` ve `backend` typecheck geçti. Canlı doğrulama:
  `/api/consultants` içinde test/0 TL/5 TL/mükerrer kayıt yok; `/tr/consultants` ham HTML bad-match=0;
  `/tr/pricing` gerçek plan kartlarını gösteriyor.

- [x] **GEO-T4 — Yasal sayfaları SSR ile gerçek metin olarak yayınla.** Rapor: /tr/privacy-policy 20,
  /tr/terms 17, /tr/kvkk 22 kelime — yalnızca başlık render ediyor (YMYL + KVKK ihlali).
  **NOT — içerik tarafı BÜYÜK ÖLÇÜDE HAZIR:** `5c1bb85` commit'i ile mesafeli sözleşme, ön
  bilgilendirme, iptal/iade, danışman kuralları, yasaklı hizmetler seed'leri (198c/198d) + footer
  künye yazıldı ama **HENÜZ DEPLOY EDİLMEDİ**. Kalan iş: (1) deploy + `db:seed`, (2) legal sayfa
  bileşeninin custom_pages içeriğini **server-side** render ettiğini doğrula — CSR ise SSR'a çevir,
  (3) Contact sayfasına şirket unvanı+adres+telefon+e-posta ekle (şu an 67 kelime, sadece form).
  **Kabul:** ham HTML'de KVKK/koşullar/iade tam metin; contact'ta künye görünür.
  **Tamamlandı:** Legal sayfalar client RTK fetch yerine server-render `LegalCmsPage` ile custom_pages içeriğini
  ham HTML'e basıyor; `privacy-policy/gizlilik`, `terms/kullanim-sartlari`, `kvkk` alias'ları bağlandı.
  `198c/198d` legal seed'leri canlı DB'ye hedefli uygulandı; `company_brand` künyesi canlıda tamamlandı.
  Contact route'u server-render künye bloğu ekliyor. Canlı doğrulama: privacy/terms/kvkk 261-267 kelime,
  contact 284 kelime ve şirket unvanı/adres/telefon/e-posta mevcut; `/legal/mesafeli-satis-sozlesmesi`,
  `/legal/on-bilgilendirme-formu`, `/legal/iptal-iade-politikasi` ham HTML'de 439-684 kelime.

- [x] **GEO-T5 — Editorial-policy canonical hatası.** Sayfa kendine değil ana sayfaya
  (goldmoodastro.com/tr) canonical veriyor → kendini indekslenemez kılmış. Ayrıca içerik yalnızca
  İngilizce (217 kelime). Canonical'ı kendine çevir + sayfayı Türkçeleştir.
  `frontend/src/app/[locale]/editorial-policy/` + canonical üretimi `frontend/src/seo/` katmanında.
  **Kabul:** canonical self-referencing; TR locale'de Türkçe gövde.
  **Tamamlandı:** `editorial-policy` TR kopyası eklendi; metadata canonical/hreflang açıkça
  `/{locale}/editorial-policy` üretiyor. Canlı doğrulama: canonical
  `https://goldmoodastro.com/tr/editorial-policy`; TR başlık/gövde görünüyor, eski İngilizce ana
  kalıplar ham HTML'de yok.

- [x] **GEO-T6 — llms dosyalarını düzelt.** (a) `llms-full.txt` HTTP 200 dönüyor ama Content-Type
  text/html ile 121KB Next.js uygulama kabuğu servis ediyor — text/plain markdown olmalı;
  (b) `frontend/public/llms.txt:12,39,40...` **www** URL'leri kullanıyor, site non-www — her URL
  308 redirect yiyor; non-www'a çevir.
  **Kabul:** `curl -I /llms-full.txt` → text/plain; llms.txt'te 308 atan URL yok.
  **Tamamlandı:** `frontend/public/llms.txt` URL'leri non-www canonical domaine çevrildi;
  `frontend/public/llms-full.txt` gerçek markdown referans dosyası olarak eklendi. Canlı doğrulama:
  `/llms-full.txt` `content-type: text/plain; charset=UTF-8`; `llms.txt` içinde `www.goldmoodastro.com`
  yok; örnek non-www URL redirect sayısı 0.

- [ ] **GEO-T7 — E-posta güvenliği: SPF + DKIM + DMARC.** Domain'de hiçbir doğrulama kaydı yok
  (0/100). Ödeme/hesap e-postası gönderen platform için spoofing + spam klasörü riski.
  DNS'e 3 kayıt (DevOps; SMTP sağlayıcısına göre DKIM key).
  **Kabul:** `dig txt goldmoodastro.com` SPF; `_dmarc` kaydı; DKIM selector doğrulanmış → skor 100.
  **Blokaj:** DNS TürkTicaret nameserver'larında (`ns1/2/3.turkticaret.net`) ve repo/canlı erişimde DNS
  panel yetkisi yok. Canlı doğrulama: `goldmoodastro.com` TXT yalnızca Google site verification döndürüyor;
  SPF yok, `_dmarc.goldmoodastro.com` TXT yok, yaygın DKIM selector'ları (`default`, `google`, `selector1`,
  `selector2`, `mail`, `smtp`) boş. DKIM public key aktif SMTP sağlayıcısından alınmadan üretilemez.

## P1 — YÜKSEK: İçerik Görünürlüğü ve Kimlik (BU AY — ~52→~60)

- [x] **GEO-T8 — SSS'yi gerçek soru-cevaplarla SSR render et + uyumlu FAQPage şeması.** /tr/faqs ham
  HTML'de 47 kelime — soru-cevapların hiçbiri yok, FAQPage şeması da yok. SSS, AI alıntısı için
  en değerli sayfa tipi. Görünür içerikle birebir eşleşen şema üret.
  **Kabul:** ham HTML'de tüm Q&A; şema soruları = sayfadaki sorular.
  **Tamamlandı:** `/tr/faqs` server component'e çevrildi; CMS `faq` sayfası SSR render ediliyor ve
  FAQPage JSON-LD aynı HTML'deki `h3 + p` soru-cevap çiftlerinden üretiliyor. Canlı doğrulama:
  ham HTML 1219 kelime; 4 gerçek SSS sorusu görünür; FAQPage şeması aynı 4 soruyu içeriyor.

- [x] **GEO-T9 — Burç sayfası FAQPage şema uyumsuzluğunu düzelt.** /tr/burclar/aries şemasındaki FAQ
  soruları İngilizce ('What is Aries?') ve sayfada görünen içerikte YOK (0 eşleşme); bir cevap meta
  description kopyası. Google 'şema içeriği sayfada görünür olmalı' politikasına aykırı — spam/manuel
  aksiyon riski. Şemayı sayfadaki gerçek TR içerikle eşleştir veya kaldır.
  **Kabul:** şema-görünür içerik eşleşmesi %100; dil tutarlı.
  **Tamamlandı:** Burç FAQ metinleri `buildZodiacFaq` ortak helper'ına alındı; hem görünür
  accordion hem JSON-LD aynı soru-cevap listesini kullanıyor. Canlı `/tr/burclar/aries` doğrulama:
  FAQPage şeması 3 TR soru içeriyor, 3/3 soru ham HTML'de görünür, eski `What is Aries?` vb.
  İngilizce sorular yok.

- [x] **GEO-T10 — Danışman profillerini SSR yap + Service/Offer/Review şemaları.** Profil sayfaları
  crawler'a **14 kelime** dönüyor — kredansiyel, uzmanlık, yorumlar client-side. 'Onaylı uzman'
  konumlandırmasının kanıtı AI'lara görünmüyor; Person şemaları da erişilemez. SSR + görünür
  yorumlarla eşleşen Review şeması.
  **Kabul:** ham HTML'de bio+uzmanlık+yorumlar; Person/Service/Offer şemaları ham HTML'de.
  **Tamamlandı:** Danışman detay server sayfası gerçek consultant id ile hizmetleri ve onaylı yorumları
  server'da çekiyor; bio/uzmanlık/hizmet/yorum özeti ham HTML'de görünür. JSON-LD graph'a Person,
  Service+Offer ve görünür yorumlarla eşleşen Review node'ları eklendi. Canlı `/tr/consultants/fatma-guclu`
  doğrulama: ham HTML 2031 kelime; bio/uzmanlık/hizmet/yorum var; schema Person=1, Service=8,
  Review=5, Person içinde 8 Offer.

- [x] **GEO-T11 — i18n sızıntısı temizliği (TR sayfalarda İngilizce).** Bulgular:
  (a) TR ana sayfada 8+ İngilizce H2 — bazıları bitişik-kelime hatalı ('ExploreAreas of Expertise',
  'ClientReviews', 'How Does Your JourneyWork?');
  (b) About + Editorial Policy gövdesi tamamen İngilizce;
  (c) **kurucu adı encoding bug'ı** — `frontend/src/components/containers/about/AboutPageContent.tsx:39,172`
  literal `Pınar Demircioğlu` basılıyor (escape edilmiş backslash);
  (d) Breadcrumb şema değerleri İngilizce ('Zodiac Signs');
  (e) meta description tüm sayfalarda aynı ve İngilizce (site geneli duplicate) → sayfa bazlı benzersiz
  TR description'lar.
  **Dikkat:** yeni ui_* anahtarları eklerken SECTION_KEYS allowlist tuzağı (bkz. memory/302621f).
  **Kabul:** TR sayfalarda İngilizce başlık/gövde yok; kurucu adı doğru; her sayfa benzersiz TR meta.
  **Tamamlandı:** Ana sayfa SSR fallback başlıkları TR'ye çevrildi; About gövdesine TR fallback eklendi ve
  sayfa server metadata üretir hale getirildi; root layout'taki sabit duplicate meta description kaldırıldı;
  editorial/about/home TR meta açıklamaları benzersiz basıyor; burç breadcrumb şeması `Burçlar > Koç Burcu`
  oldu; kurucu adı `Pınar Demircioğlu` olarak doğru karakterle basılıyor. Canlı doğrulama: `/tr` eski
  İngilizce H2 kalıpları 0; `/tr/about` eski İngilizce paragraf kalıpları 0 ve escape kalıntısı yok;
  `/tr`, `/tr/about`, `/tr/editorial-policy` meta description'ları farklı ve TR.

- [ ] **GEO-T12 — Organization şemasına sameAs + sosyal profiller.** Şemada sameAs dizisi hiç yok,
  footer'da tek sosyal link yok; contactPoint, address, foundingDate eksik. Önce müşteriden/pazarlamadan
  Instagram + YouTube + LinkedIn + X hesapları açılmalı (GEO-T18 ile birlikte), sonra footer +
  Organization şemasına eklenecek. Adres/telefon `company_brand` setting'inde zaten mevcut (5c1bb85)
  — contactPoint + address şemaya bağlanabilir.
  **Kabul:** Organization şemasında sameAs(≥3) + contactPoint + address; footer'da sosyal linkler.
  **Kısmi tamamlandı / blokaj:** `company_brand` canlı ayarından Organization JSON-LD'ye `telephone`,
  `email`, `address` ve `contactPoint` bağlandı. Canlı doğrulama: telefon `0212 807 09 59`, e-posta
  `goldmoodastro@gmail.com`, İstanbul adresi ve customer support contactPoint görünüyor. `sameAs` ve
  footer sosyal linkleri için doğrulanmış Instagram/YouTube/LinkedIn/X URL'leri yok; gerçek sosyal hesaplar
  açılmadan kabul kriteri tamamlanamaz.

- [x] **GEO-T13 — Blog'u fiilen yayına al.** Ham HTML'de tek yazı linki yok. DB'de yalnızca 3 yazı var
  (199_blog_posts_seed.sql) + liste muhtemelen CSR. (1) Liste + yazı sayfalarını SSR yap,
  (2) ilk 5-10 tarihli-isimli-yazarlı yazıyı yayınla (İçerik), (3) sitemap lastmod'larına gerçek
  yayın tarihleri. **Dikkat:** blog seed ON DUPLICATE içerik ezme tuzağı (memory: 199 seed INSERT IGNORE olmalı).
  **Kabul:** ham HTML'de yazı listesi + yazılar; ≥5 yazı; lastmod gerçek.
  **Tamamlandı:** Blog liste sayfası server component'e çevrildi ve CMS `blog` kayıtlarını SSR render ediyor;
  blog detay sayfası CMS HTML gövdesini server'da basıyor; sitemap'e blog yazıları `updated_at/created_at`
  tabanlı `lastmod` ile eklendi. Canlı doğrulama: `/tr/blog` ham HTML 1493 kelime ve 8 tekil yazı linki;
  `/tr/blog/dogum-haritasi-nedir` ham HTML 2803 kelime, yazı gövdesi görünür, Article+FAQPage schema var;
  `/sitemap.xml` blog URL'lerinde `lastmod` var.

- [x] **GEO-T14 — Sitemap lastmod + on-page hreflang.** 279 URL'nin tamamı aynı timestamp taşıyor
  (üretim anı damgası) — freshness sinyali değersiz; gerçek güncelleme tarihlerine bağla.
  Hreflang yalnızca sitemap'te; sayfalara `link rel=alternate` ekle. EN/DE lokallerde Türkçe slug
  korunuyor (/de/burclar/aquarius/ask) — kabul edilebilir ama alternate etiketleri şart.
  **Kabul:** lastmod içerik güncellemesiyle değişiyor; her sayfada hreflang alternates.
  **Tamamlandı:** Sitemap statik sayfalar, burç sayfaları, günlük burç alt sayfaları ve blog yazıları
  için rota/içerik bazlı `lastmod` üretir hale getirildi; blog yazıları CMS `updated_at/created_at`
  tarihinden geliyor. On-page hreflang zaten Next metadata alternates ile basılıyor. Canlı doğrulama:
  sitemap `lastmod` dağılımı 3 farklı tarih grubu; `/tr/burclar/aries/bugun` lastmod `2026-07-04`,
  `/tr/blog/dogum-haritasi-nedir` lastmod CMS tarihi; `/tr/about` üzerinde 4 alternate link var
  (`tr/en/de/x-default`).

- [ ] **GEO-T15 — Bing Webmaster Tools + IndexNow.** Günlük 36+ sayfa değişimi (burç yorumları) için
  özellikle değerli; Copilot görünürlüğü buradan besleniyor. IndexNow altyapısı repo'da kısmen var
  (`[indexNowKey].txt` route) — Bing WMT doğrulaması + günlük ping akışını bağla.
  **Kabul:** Bing WMT doğrulanmış; burç güncellemeleri IndexNow'a otomatik bildiriliyor.
  **Kısmi tamamlandı / blokaj:** IndexNow tarafı canlıda tamamlandı: `INDEXNOW_KEY` üretim `.env`ye eklendi,
  key doğrulama dosyası `text/plain` olarak 200 dönüyor, `frontend/scripts/indexnow-ping.ts daily-zodiac`
  3 dil x 12 burç = 36 günlük yorum URL'i üretiyor ve canlıdan gönderilen ping IndexNow tarafından kabul
  edildi. Sunucu cron'u her gün 04:20'de aynı ping'i çalıştırıyor; ayrıca `.github/workflows/indexnow.yml`
  manuel/zamanlı GitHub Actions akışı olarak eklendi. Bing WMT doğrulaması için Bing hesabı/panel erişimi ve
  doğrulama kodunun `bing_site_verification` ayarına girilmesi gerekiyor; bu dış panel erişimi olmadan
  kabul kriterinin WMT kısmı tamamlanamaz.

## P2 — MARKA & PLATFORM (BU ÇEYREK — ~60→~65+)

- [ ] **GEO-T16 — Entity disambiguation: 'GoldMoodAstro' vs Astro Gold.** Marka araması Wikipedia,
  Wikidata, Ekşi Sözlük, Reddit, Instagram, YouTube, LinkedIn, Google Play ve App Store'da SIFIR
  sonuç veriyor; 'gold mood astro' sorgularını rakip **Astro Gold (astrogold.io)** domine ediyor —
  AI modelleri markaları karıştırabilir. Tüm platformlarda tutarlı 'GoldMoodAstro' yazımı; orta
  vadede Wikidata kaydı.
  **Kabul:** marka aramasında ≥3 platform sonucu; Wikidata entity oluşturulmuş.
  **Kısmi doğrulama / blokaj:** Web aramasında artık `@goldmoodastro` Instagram sonucu görünüyor; ancak
  Wikidata entity yok ve kabul kriterindeki ≥3 bağımsız platform sonucu hâlâ tamamlanmış değil. Ekşi/Reddit,
  YouTube, LinkedIn, Google Business/App Store/Google Play gibi dış platformlarda hesap/içerik açma ve
  Wikidata uygunluk değerlendirmesi müşteri/pazarlama hesabı erişimi gerektiriyor.

- [x] **GEO-T17 — llms.txt'deki mobil uygulama vaadini gerçekle hizala.** llms.txt mobil uygulamayı
  tanıtıyor ama mağazalarda bulunamıyor — AI'a verilen bilgi doğrulanamıyor (güven tutarlılığı).
  İki seçenek: (a) uygulamayı mağazalara yayınla (mobil çeklist Sprint 4 zaten planlı), veya
  (b) yayına kadar llms.txt'den mobil iddiasını çıkar. **Öneri: (b) hemen, (a) sonra geri ekle.**
  **Kabul:** llms.txt'teki her iddia canlıda doğrulanabilir.
  **Tamamlandı:** `frontend/public/llms.txt` içindeki doğrulanamayan Expo/iOS/Android ve "any platform"
  mobil mağaza vaadi kaldırıldı; canlı oturum metni tarayıcı tabanlı LiveKit görüşme, erişim metni ise
  desktop ve mobil tarayıcıda çalışan Next.js web deneyimi olarak hizalandı.

- [ ] **GEO-T18 — Topluluk varlığı inşası (Pazarlama/Müşteri).** Ekşi Sözlük başlığı, Reddit
  r/astroloji, kadın forumları, Google yorumları. Rakip Faladdin/Binnaz'ın güven krizinden 'onaylı
  danışman + moderasyon' konumlandırmasıyla ayrış — Perplexity/ChatGPT topluluk doğrulama sinyali.
  **Kabul:** ≥2 platformda organik marka bahsi; Google Business yorumları aktif.
  **Blokaj:** Bu madde gerçek üçüncü taraf hesapları/topluluk paylaşımları ve organik kullanıcı yorumu
  gerektiriyor; repo veya canlı sunucu üzerinden üretilemez. Pazarlama/müşteri hesabıyla Google Business,
  Reddit/Ekşi/forum içerik planı ve yorum toplama süreci başlatılmalı.

- [ ] **GEO-T19 — YouTube kanalı: haftalık burç videoları + danışman tanıtımları.** Gemini/Google
  ekosistemi + genç TR astroloji kitlesi. (Müşteri kararı + içerik operasyonu.)
  **Kabul:** kanal açık, ≥4 video, site footer + sameAs'te bağlı.
  **Blokaj:** YouTube kanal erişimi, video prodüksiyonu ve en az 4 yayın kararı müşteri/pazarlama operasyonu
  gerektiriyor. Kanal URL'i oluşunca footer ve Organization `sameAs` bağlantısı T12 ile birlikte eklenebilir.

- [x] **GEO-T20 — İsimli uzman stratejisi (E-E-A-T).** Kurucu Pınar Demircioğlu ve onaylı astrologlar
  için Person şemalı yazar profilleri; günlük yorumlara 'İnceleyen: Astrolog X' imzası — YMYL-komşu
  içerikte kimlikli uzmanlık.
  **Kabul:** günlük yorum sayfalarında görünür inceleme imzası + Person şeması.
  **Tamamlandı:** Günlük burç route'u (`/burclar/[sign]/bugun`) server-render `İnceleyen: Pınar
  Demircioğlu` editoryal inceleme bloğu basıyor; JSON-LD graph'a Pınar Demircioğlu `Person` node'u ve
  günlük yorum `Article.reviewedBy` ilişkisi eklendi. Canlı doğrulama: `/tr/burclar/aries/bugun` ham
  HTML'de `İnceleyen`, `Pınar Demircioğlu`, 4 JSON-LD script, Person schema ve Article `reviewedBy` var.

- [ ] **GEO-T21 — 12 burç şablonundaki %78 duplikasyonu burca özgü içerikle değiştir.** Aries vs
  Taurus: 58 cümlenin 45'i birebir aynı; 12 burç × 5 alt sayfa ≈ 60 sayfalık near-duplicate küme —
  hem ince içerik hem AI-şablon sınıflandırma riski. Hedef: sayfa başına ≥%60 benzersiz metin.
  (İçerik + astrolog işi; LLM destekli üretim + insan onayı akla yatkın.)
  **Kabul:** rastgele iki burç sayfası karşılaştırmasında cümle örtüşmesi <%40.
  **Blokaj:** Bu madde 60 civarı burç/alt sayfa için burca özgü metin üretimi ve astrolog/editör onayı
  gerektiriyor. Kodla şablon çeşitlendirmek kabul kriterindeki insan onaylı içerik hedefini karşılamaz;
  içerik brief'i, üretim ve editoryal onay süreci tamamlandıktan sonra seed/CMS içerikleri güncellenmeli.

- [x] **GEO-T22 — Pricing'e OfferCatalog + hesaplayıcılara WebApplication şeması.** Her paket Offer
  olarak; doğum haritası/yükselen/sinastri hesaplayıcıları 'AI-atıf mıknatısı' olarak konumlandır
  (paylaşılabilir statik açıklama katmanı + WebApplication şeması) — AI cevaplarında 'hesaplamak
  için şu aracı kullanın' atıfları.
  **Kabul:** ham HTML'de OfferCatalog + WebApplication şemaları.
  **Tamamlandı:** `pricingOfferCatalogSchema` ve `webApplicationSchema` helper'ları eklendi. `/tr/pricing`
  ham HTML'de `OfferCatalog`; `/tr/birth-chart`, `/tr/yukselen-burc-hesaplayici`, `/tr/sinastri` ve
  `/tr/buyuk-uclu` ham HTML'de `WebApplication` JSON-LD basıyor. Canlı doğrulama: pricing OfferCatalog=1;
  dört ana hesaplayıcı sayfasında WebApplication=1.

## P3 — PERFORMANS & TEKNİK KALİTE

- [ ] **GEO-T23 — Mobil LCP 4,9sn → ≤2,5sn.** Lighthouse mobil 65 (masaüstü 83). Nedenler: LCP
  isteğinin geç keşfi (preload/fetchpriority yok), render-engelleyen istekler, 377KB gzip JS
  (25 dosya), 124KB kullanılmayan JS, eski JavaScript. Aksiyonlar: LCP görseline
  `fetchpriority=high` + preload, render-blocking erteleme, JS inceltme/code-split.
  **Kabul:** PSI mobil LCP ≤2,5sn; Performance ≥80.
  **Kısmi tamamlandı / ölçüm blokajı:** Ana sayfa hero LCP görseline explicit `fetchPriority="high"` eklendi;
  canlı ham HTML'de hero image preload=1 ve `fetchPriority="high"` görünüyor. Görsel kalite hedefi düşürüldü.
  Google PageSpeed Insights API mobil ölçümü bu turda 429 Too Many Requests döndüğü için kabul metriği
  (`LCP ≤2,5sn`, Performance ≥80) doğrulanamadı; PSI/Lighthouse ölçümü geçmeden madde kapatılmadı.
  **Devam optimizasyonu:** Açılışta görünen destek görseli 736KB → 13KB, logo 137KB → 21KB indirildi;
  hero görseli statik 63KB WebP'e taşındı ve analytics scriptleri idle sonrası dynamic chunk'a ayrıldı.
  Canlı Lighthouse mobile ölçümü: ilk ek ölçüm `Performance 50 / LCP 6859ms / TBT 781ms`; görsel
  optimizasyon sonrası `62 / 5231ms / 412ms`; hero WebP + analytics defer sonrası `67 / 4905ms / 377ms`.
  Kabul eşiği hâlâ geçilmediği için madde açık.
  **Devam optimizasyonu 2:** Root layout'taki fazla Google font yükleri azaltıldı (`Outfit`/`Gabriela`
  next/font yükleri kaldırıldı; kalan ağırlıklar daraltıldı), ilk ziyaret splash overlay'i kaldırıldı ve
  hero WebP/preload düzeni canlıda doğrulandı. En iyi tek koşu `Performance 82 / LCP 4257ms / TBT 148ms`;
  son canlı koşu `Performance 76 / LCP 4350ms / TBT 273ms`. Performans artık 80 civarına yaklaştı fakat
  LCP hâlâ 2.5sn eşiğini geçmediği için madde açık.

- [x] **GEO-T24 — Brotli aç.** Yalnızca gzip var; Brotli ile JS transferi ~%15-20 küçülür.
  `nginx/goldmoodastro.conf`'a brotli modül/direktifleri.
  **Kabul:** `curl -H 'Accept-Encoding: br' -I` → `content-encoding: br`.
  **Tamamlandı:** Canlı sunucuda `libnginx-mod-http-brotli-filter` ve `libnginx-mod-http-brotli-static`
  kuruldu; `/etc/nginx/snippets/performance.conf` içinde `brotli on`, `brotli_comp_level 6` ve
  `brotli_types` açıldı; `nginx -t` başarılı, nginx reload edildi. Canlı doğrulama: `/tr` HTML ve
  `/_next/static/...js` yanıtları `content-encoding: br` dönüyor.

- [x] **GEO-T25 — Kök URL cache sinyal tutarsızlığı.** `/` redirect yerine x-middleware-rewrite ile
  /tr içeriğini `private, no-store` başlığıyla döndürüyor — canonical ile kapatılmış ama sinyal
  tutarsız. Kök için 308 → /tr redirect veya public cache başlığı. (Next16 proxy.ts kalıbı —
  memory: middleware yok, yönlendirme proxy.ts'te.)
  **Kabul:** kök URL davranışı tek ve tutarlı (redirect veya cache'lenebilir yanıt).
  **Tamamlandı:** `frontend/src/proxy.ts` kök `/` isteğini internal rewrite yerine 308 redirect ile
  `/{DEFAULT_LOCALE}` (`/tr`) adresine yönlendiriyor. Canlı doğrulama: `https://goldmoodastro.com/`
  `HTTP/2 308` ve `location: /tr` döndürüyor.

---

## SORUMLU DAĞILIMI ÖZETİ

| Sorumlu | Görevler |
|---|---|
| **Web ekibi (kod)** | T1, T2, T4(render), T5, T6, T8, T9, T10, T11, T13(SSR), T14, T15, T22, T23, T24, T25 |
| **Backend/DB** | T3 (test verisi + seed), T13 (blog seed) |
| **İçerik** | T4(metin-hazır ✅), T11(çeviri), T13(yazılar), T20, T21 |
| **DevOps** | T7 (DNS), T24 (nginx) |
| **Pazarlama/Müşteri** | T12(hesaplar), T16, T17(karar), T18, T19 |

## KPI TAKİBİ (rapor hedefleri)

| KPI | Şu an | 90 gün hedefi |
|---|---|---|
| Genel GEO skoru | 39/100 | 65+ |
| Günlük burç SSR içeriği | 15 kelime | Tam yorum + tarih + imza |
| Ham HTML JSON-LD blok | 0 | Tüm sayfalarda |
| Brand Authority | 5/100 | 30+ |
| Mobil LCP | 4,9sn | ≤2,5sn |
| Yasal sayfa içeriği | 17-22 kelime | Tam metinler (seed hazır ✅) |
| SPF/DKIM/DMARC | 0/100 | 100 |
| Blog yazı sayısı | 0 görünür | 10+ |

> **Kesişim notları:** (1) Yasal içerik + künye işi `5c1bb85` ile kodda hazır — T4 fiilen "deploy + SSR
> doğrulama"ya indirgendi. (2) Mobil mağaza yayını mobil çeklistin Sprint 4'ü — T17 ile senkron.
> (3) i18n işlerinde ui() SECTION_KEYS allowlist ve seed-önce-build sırası tuzaklarına dikkat.
> (4) Deploy sonrası bu rapor geoserra'dan yeniden çektirilerek skor doğrulanmalı.
