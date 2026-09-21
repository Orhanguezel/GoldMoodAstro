# SEO Katalog İnceleme ve Uygulama Checklist'i — 2026-09-21

> Kaynak: `goldmoodastro-seo-katalog.pdf` (Tanitio katalog 1.2, analiz
> `40432f78-aa6f-45e6-bf4b-e468bc342b16`, 15.09.2026).
>
> Kapsam sınırı: katalog 10 sayfalık örneklem ve 1.145 kontrol satırı içeriyor;
> tüm site veya Google indeks durumu kanıtı değildir. Bu checklist'teki her
> madde 21.09.2026 tarihinde canlı HTML, DNS veya repo koduyla yeniden
> doğrulanmıştır.

## Başlangıç kanıtı

- Katalog: teknik SEO `86,8/100`, GEO hazırlığı `46,4/100`, 4 düşük öncelikli
  title bulgusu, 7 sorun satırı ve 136 iyileştirme satırı.
- Canlı tam i18n SEO taraması: `398 URL · 0 hata · 0 dil uyarısı`.
- Katalogdaki dört title bulgusu canlıda doğrulandı: marka title şablonuyla
  ikinci kez ekleniyor (`/tr` 70, `/en` 76, `/de` 77 karakter); `/de/berater`
  61 karakter.
- Ana sayfada iki gerçek `href="#"`; danışman listesinde 7 görsel için HTML
  `width`/`height` yok.
- `_dmarc.goldmoodastro.com`: `v=DMARC1; p=none`.
- CrUX: katalog tarihinde `NOT_FOUND`; gerçek kullanıcı Core Web Vitals verisi
  yok. Katalog Lighthouse çalıştırmamış.

## P0 — doğruluk ve taranabilirlik

- [x] **K1 — Title tekrarını tek yerde çöz.** SEO metadata üreticisinde marka
  zaten title içinde ise yeniden ekleme; sayfa title'ını `absolute` üret.
  TR ana sayfadaki elle metadata override'ını kaldır. DE ana sayfa title'ını
  30–60 karakter bandına indir. Örneklenen 10 URL'de tek `<title>` ve yinelenen
  `GoldMoodAstro` olmamalı.
- [x] **K2 — `llms.txt` ve `llms-full.txt` doğruluğunu düzelt.** İç linkleri
  gerçek lokalize kanonik URL'lere ve açıklamalı Markdown linklerine çevir;
  Iyzico, sahte destek adresleri, kanıtlanmayan E2EE/veri barındırma iddiaları
  ve eski satıcı bilgisini kaldır. Stripe Checkout + uygun para birimlerinde
  PayPal bilgisini yaz.
- [x] **K3 — `href="#"` hedeflerini kaldır.** Store URL'leri tanımlı değilken
  App Store/Google Play kontrollerini bağlantı gibi yayınlama; sahte QR
  etkileşimini gösterme.
- [x] **K4 — Organization şemasındaki adres ülkesini düzelt.** Canlı JSON-LD
  Alman adresini `addressLocality=İstanbul`, `addressCountry=TR` olarak
  işaretliyor. Yapılandırılmış adres alanlarını seed'e ekle ve schema'yı bu
  alanlardan üret.

## P1 — HTML, erişilebilirlik ve GEO sinyali

- [x] **K5 — Danışman görsellerine intrinsik ölçü ekle.** Ham `<img>`
  elemanlarına uygun `width`/`height` ve mevcut lazy-loading davranışını ekle.
  `next/image fill` elemanları CSS aspect ratio ile alan ayırdığı için katalog
  sayacı içinde kalsa bile CLS hatası olarak sınıflandırma.
- [x] **K6 — SVG ödeme logolarındaki `<title>` yanlış pozitifini kaldır.** Logo
  adı zaten `aria-label` ve kapsayıcı `title` ile mevcut; body içindeki dört
  SVG `<title>` etiketi katalog tarafından “head dışı kritik etiket” sayılıyor.
- [x] **K7 — Sosyal profil linklerini SSR HTML'de yayınla.** Server'da alınan
  `brand.social` verisini Footer'a başlangıç verisi olarak geçir; footer linkleri
  ile Organization `sameAs` aynı iki doğrulanmış hesabı göstermeli.
- [x] **K8 — Kullanılmayan global resource hint'leri temizle.** `next/font`
  fontları self-host ettiği için Google Fonts hint'lerini kaldır; sayfa HTML'inde
  doğrudan Cloudinary origin isteği yoksa global Cloudinary hint'lerini de
  kaldır.
- [x] **K9 — Regresyon kapısı ekle.** Title tekrarı/uzunluğu, hash-only link,
  llms kanonik linkleri, görsel ölçüleri ve organization adresi için tekrar
  çalıştırılabilir doğrulama script'i ekle.

## Doğrulandı, kod değişikliği gerektirmiyor

- [x] Canonical, hreflang, robots, SSL, güvenlik başlıkları, sitemap ve Googlebot
  erişimi katalogda uygun; canlı 398 URL taraması da temiz.
- [x] Katalogdaki “iletişim sayfası linki yok” kaydı güncel değil: canlı
  `/de` ve `/de/berater` HTML'inde `/de/kontakt` SSR linki var.
- [x] Katalogdaki fiyatlandırma sayfalarında `0` iç link sinyali güncel HTML'i
  temsil etmiyor: SSR footer ve editoryal içerik bağlantıları mevcut.
- [x] “İzleme kodu tespit edilmedi” bir hata değil: GA4/Meta kullanıcı onayı
  sonrasına erteleniyor; consent öncesinde izleyici yüklememek KVKK davranışıdır.
- [x] Anahtar kelime tutarlılığı `18–38/100` tek başına SEO hatası sayılmadı.
  Sayfalarda 532–1.166 kelime, tekil arama niyeti, görünür içerik ve uygun H1/H2
  yapısı var; skor uğruna keyword stuffing yapılmayacak.
- [x] Açık e-posta adresi kaldırılmadı: yasal iletişim ve Organization
  `contactPoint` için gerekli. Spam riski operasyonel e-posta filtresiyle
  yönetilmeli.
- [x] `23 JS dosyası`, inline style ve minification önerileri performans ölçümü
  değildir. Lighthouse/CrUX kanıtı olmadan işlevsel chunk'lar rastgele
  birleştirilmeyecek.
- [x] `sameAs` için “5+ platform” hedefi uygulanmadı. Yalnız gerçekten sahip
  olunan Instagram ve Facebook hesapları yayınlanacak; profil sayısı artırmak
  için sahte/boş hesap eklenmeyecek.

## Harici / insan işlemi gerekenler

- [ ] **E1 — DMARC'ı kademeli sıkılaştır.** Önce raporları incele, ardından
  `p=quarantine; pct=...`, son aşamada `p=reject`. Bu DNS sağlayıcısında yapılır;
  repo deploy'u DNS kaydını değiştirmez.
- [ ] **E2 — Alan adı yenileme.** WHOIS bitişi `2027-04-26`; katalogdaki 223
  gün uyarısı SEO sıralama hatası değildir. Registrar auto-renew ve ödeme
  yöntemini doğrula.
- [ ] **E3 — Core Web Vitals kanıtı oluşunca yeniden değerlendir.** CrUX
  `NOT_FOUND`; bu nedenle gerçek kullanıcı LCP/INP/CLS sonucu iddia edilmeyecek.
  Ayrı mobil/masaüstü Lighthouse ölçümü laboratuvar tabanı olarak saklanabilir.

## Kabul komutları

```bash
bun run --cwd frontend typecheck
bun run --cwd frontend build
bun run --cwd frontend seo:catalog-regression -- https://goldmoodastro.com
bun frontend/scripts/seo-i18n-audit.ts https://goldmoodastro.com
```

Canlı kabul hedefi: tam tarama `0 hata · 0 dil uyarısı`; örneklenen 10 URL'de
title tekrarı yok; ana sayfada hash-only link yok; danışman kartı ham
görsellerinde ölçü var; `llms.txt` yalnız 200 dönen kanonik bağlantıları ve
güncel ödeme/işletme bilgisini içeriyor.

## Tamamlama kanıtı — 2026-09-21

- CI build kapısı ve canlı dağıtım başarılı: GitHub Actions `35588038302`.
- Seçili `company_brand` ve `seo_pages` seed'leri canlı veritabanına uygulandı;
  backend/frontend yeniden yüklendi ve iki sağlık endpoint'i `200` döndü.
- Katalog regresyonu: `10 sample pages, 5 measured raw images, 33 llms links — clean`.
- Tam canlı i18n SEO taraması: `398 URL · 0 hata · 0 dil uyarısı`.
- K1–K9 kapandı. E1–E3 repo dışı DNS/registrar/CrUX kanıt kapıları olarak açık.

## Ek katalog bulguları — 2026-09-21

- [x] **K10 — Blog OG/Twitter görseli.** TR/EN/DE blog liste sayfalarında
  1200×630, sayfaya özel ve yazısız paylaşım görseli yayınla.
- [x] **K11 — Hakkımızda OG/Twitter görseli.** Sayfanın kendi metadata
  tanımının layout görselini ezmesini engelle; TR/EN/DE için aynı sayfa-özel
  1200×630 görseli hem Open Graph hem Twitter kartına bağla.
- [x] **K12 — Fiyatlandırma görselini ayrıştır.** Ana sayfa OG görselini tekrar
  kullanmak yerine fiyatlandırmaya özel 1200×630 görsel yayınla.
- [x] **K13 — Hakkımızda title uzunluğu.** Üç dilde başlığı anlamı koruyan
  30–60 karakter aralığına getir ve marka tekrarını önle.
- [x] **K14 — İkon bağlantı erişilebilirliği.** Mobil header giriş/profil
  bağlantılarına lokalize erişilebilir ad ekle.
- [x] **K15 — Regresyonu genişlet.** Blog ve Hakkımızda dahil 16 örnek URL'de
  `og:image`, `twitter:image`, title ve erişilebilir bağlantı adlarını; beş TR
  çekirdek sayfada görsel benzersizliğini otomatik denetle.

Canlı kabul: `16 sample pages, 5 measured raw images, 33 llms links — clean`;
tam tarama `398 URL · 0 hata · 0 dil uyarısı`; üç yeni WebP görseli canlıda
`HTTP 200` ve `image/webp` döndürüyor. GitHub Actions: `35591478762`.
