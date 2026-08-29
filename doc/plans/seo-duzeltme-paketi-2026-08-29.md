# SEO Düzeltme & İyileştirme Paketi — 2026-08-29 (S1)

> **Sahiplik:** Codex implement eder, Claude Code review + canlı kabul yapar,
> GSC panel adımlarını kullanıcı yapar. Görev sırası önemlidir (T3, T1-T2'den
> önce merge edilmemeli; aşağıda açıklandı).
>
> **Teşhis kaynağı:** GSC API + URL Inspection API + canlı crawl (2026-08-29).
> Detay: `doc/raporlar/gsc-trafik-analizi-2026-08-28/README.md` + hafıza
> `[[seo-uyum-orphan-pages-and-branded-clicks]]`.

## Teşhis özeti (neden bu paket)

1. **Ceza yok.** Ana sayfa marka aramasında 1-2. sırada; çekirdek sayfalar
   indeksli, canonical'lar doğru.
2. **234 uyum sayfası fiilen öksüz** (78 çift × 3 dil; `allSignPairs()` aynı-burç
   çiftlerini de üretir). Tek iç link: her burç detayında `uyum/${signKey}-koc`
   (yalnız Koç kombinasyonu, üstelik karışık slug). Hub sayfası yok
   (`/tr/burclar/uyum` → 404). Sonuç — URL Inspection:
   - `/tr/burclar/uyum/leo-scorpio` → "Keşfedildi - şu anda dizine eklenmiş değil"
   - `/tr/burclar/uyum/aries-taurus` → "URL Google tarafından bilinmiyor"
   - DE varyantı (`/de/sternzeichen/kompatibilitaet/*`) az da olsa gösterim alıyor
     → format çalışıyor, sorun **keşif ve iç bağlantı**.
3. **Varyant URL'ler kopya üretiyor.** Çift sayfası ters sırayı
   (`scorpio-aries`), TR takma adlarını (`aries-koc`) ve logical segmenti
   (`/en/burclar/uyum/...` ≠ kanonik `/en/zodiac-signs/compatibility/...`)
   200 ile açıyor. GSC coverage: 30 "kullanıcı canonical'sız kopya" + 40
   "Google farklı canonical seçti" büyük oranda buradan.
4. **Para sayfaları 70-90. sırada.** `rising sign calculator` kümesi tek başına
   ~1.500 gösterim ama pozisyon ~80. En çok gösterimli URL
   (`/en/yukselen-burc-hesaplayici`, 1.167 gösterim) slug migrasyonuyla artık
   308 → `/en/rising-sign-calculator`; taşınma sürüyor, içerik derinliğiyle
   desteklenmeli.
5. Ağustos tıklamaları büyük oranda markalı aramaydı (8-19 Ağustos, ana sayfa,
   poz. ~2); sosyal tempo düşünce günlük tıklama 0'a indi. → Paket dışı ama
   kritik: **Eylül sosyal içerik paketi** (Tanitio tarafı, ayrı iş).

## Kurallar (Codex için bağlayıcı)

- `ALTER TABLE` yasak; DB değişikliği yalnız seed dosyasında (bu pakette yalnız
  `017_seo_pages_seed.sql` + ui_ anahtar seed'i var).
- Yeni görünür UI metni **ui_ anahtarıyla** eklenir (İngilizce fallback
  parametresiyle) ve ilgili i18n seed'ine yazılır. `ui()` SECTION_KEYS
  allowlist'ine yeni bölüm anahtarını eklemeyi unutma (bkz. hafıza
  `[[i18n-ui-section-keys-allowlist]]` — anahtar seed'de yoksa çeviri düşmez,
  sessizce fallback basar).
- Yönlendirme (redirect) mantığı **server component'e değil `proxy.ts`'e**
  yazılır — Next 16 streaming server-component redirect'i yutabiliyor (bkz.
  hafıza `[[next16-proxy-redirect]]`). Sayfa içi `permanentRedirect` yalnız
  route handler'da güvenli olduğu kanıtlanmış mevcut kalıplar için.
- Kanonik çift slug'ı **her dilde İngilizce burç anahtarlarıyla** kalır
  (`aries-taurus`); yalnız segmentler lokalize (`uyum`/`compatibility`/
  `kompatibilitaet`). Yeni bir slug migrasyonu BAŞLATMA.
- Her görev sonunda `bun run typecheck` (frontend) geçmeli; paket sonunda tek
  deploy. Çalışma ağacı temiz bırakılır.
- Sosyal cron'lara ve `packages/shared-backend`'e bu pakette dokunulmaz.

---

## Görevler

### S1-T1 — Varyant çift URL'lerini kanonik URL'ye 308 yönlendir (İLK bu)

**Neden:** Varyantlar açık kaldıkça yeni iç linkler bile kopya sinyali üretir.
T2-T3'ten önce varyant üretimi kapatılır.

**Yapılacak:**
- [x] `frontend/src/proxy.ts`'e (mevcut redirect kalıplarının yanına) çift
      sayfası kanonikleştirme kuralı: istek yolu bir uyum çift sayfasıysa —
      hangi locale segment varyantıyla gelirse gelsin — şu üç normalizasyonu
      uygula ve sonuç istekten farklıysa **308** ile kanonik lokalize URL'ye
      gönder:
      1. TR/DE burç takma adları → İngilizce anahtar (`koc→aries`,
         `widder→aries` vb. — `parsePair`'daki `TR_TO_EN` haritasını
         `localizedRoutes.ts`'e taşı/ortaklaştır, iki kopya tutma).
      2. Çift sırası → `SIGN_ORDER` kanonik sırası (`taurus-aries` →
         `aries-taurus`; `allSignPairs()` ile aynı kural).
      3. Segment → locale'in kendi segmenti (`/en/burclar/uyum/...` →
         `/en/zodiac-signs/compatibility/...`).
- [x] `[pair]/page.tsx` içindeki `parsePair` esnekliği kalabilir (savunma),
      ama metadata artık her zaman kanonik slug'la üretilmeli (bugün parsed
      sırayı olduğu gibi kullanıyor — `scorpio-aries` kendine canonical
      basıyor, düzelt).
- [x] `opengraph-image` route'u da kanonik slug'la çalışmalı.

**Kabul:**
- [x] `curl -I /tr/burclar/uyum/taurus-aries` → 308 → `/tr/burclar/uyum/aries-taurus`
- [x] `curl -I /tr/burclar/uyum/aries-koc` → 308 → `/tr/burclar/uyum/aries-aries`
- [x] `curl -I /en/burclar/uyum/aries-taurus` → 308 → `/en/zodiac-signs/compatibility/aries-taurus`
- [x] Kanonik URL 200 ve `<link rel="canonical">` kendini gösteriyor.

> 2026-08-29 Codex: T1 yerel Next 16 proxy kabulü geçti; Almanca `widder-stier`
> takma adı da `/de/sternzeichen/kompatibilitaet/aries-taurus` kanoniğine 308 oldu.

### S1-T2 — Uyum hub sayfası (3 dil)

**Yapılacak:**
- [ ] Yeni route: `frontend/src/app/[locale]/burclar/uyum/page.tsx` — server
      component, SSR içerik (bkz. `[pair]/page.tsx`'teki "botlar boş görüyordu"
      dersi — interaktiviteye gömme).
- [ ] İçerik: kısa giriş (element/modalite mantığı, sorumlu yorum çerçevesi;
      kesin-sonuç/garanti dili YASAK — `contentModeration` yasaklı konu listesine
      uygun), ardından 12 burç grubu; her grupta o burcun 12 kombinasyon linki
      (kanonik slug, `toLocalizedPublicPath` ile lokalize href).
- [ ] Metadata: `buildPageMetadata` `pageKey: 'burclar-uyumu'`; üç dil için
      `017_seo_pages_seed.sql`'e kayıt ekle + **fallback'i tam yaz** (DB kaydı
      prod'a uygulanana kadar fallback yayında kalacak). Başlık kalıbı örn.
      TR: "Burç Uyumu — 78 Kombinasyon Rehberi", EN: "Zodiac Compatibility —
      All 78 Sign Combinations", DE benzeri.
- [ ] Hub'a giden linkler: `burclar/page.tsx` (hub kartı), `ZodiacDetail`
      uyum bölümü başlığı, `[pair]/page.tsx` breadcrumb/"tüm kombinasyonlar"
      linki.
- [ ] `sitemap.ts`'e 3 hub URL'si ekle (`changeFrequency: 'weekly'`,
      `priority: 0.7`, `alternates` ile).

**Kabul:**
- [ ] `/tr/burclar/uyum`, `/en/zodiac-signs/compatibility`,
      `/de/sternzeichen/kompatibilitaet` → 200, SSR HTML'de 78 kanonik çift
      linki + hreflang üçlüsü.
- [ ] Sitemap'te 3 hub URL'si; `bun scripts/seo-i18n-audit.ts` 0 hata.

### S1-T3 — Burç detayına 12'li uyum bloğu + karışık slug temizliği

**Yapılacak:**
- [ ] `ZodiacDetail.tsx:568` `uyum/${signKey}-koc` linkini kaldır; yerine o
      burcun 12 kombinasyonunu listeleyen SSR blok (kanonik slug + lokalize
      href + hub linki). Böylece her çift sayfası iki burç sayfasından da link
      alır (78 sayfanın tamamı ≥2 iç link).
- [ ] Blok başlığı/metinleri ui_ anahtarlarıyla (3 dil seed).

**Kabul:**
- [ ] `/tr/burclar/koc` HTML'inde 12 kanonik uyum linki + hub linki; hiçbir
      yerde `-koc`/`-boga` tarzı karışık çift slug'ı kalmadı
      (`grep -rn 'uyum/\${' frontend/src` temiz).

### S1-T4 — Çift sayfasına çapraz linkler

**Yapılacak:**
- [ ] `[pair]/page.tsx` SSR bölümüne: iki burcun detay sayfası linki
      (lokalize), aynı elementten 3-4 ilgili çift (deterministik seçim,
      rastgele değil), hub linki. Sinastri CTA'sı zaten var, kalsın.

**Kabul:**
- [ ] `/tr/burclar/uyum/aries-taurus` HTML'inde: 2 burç detay + ≥3 ilgili çift
      + 1 hub linki.

### S1-T5 — Blog şablonuna "İlgili araçlar" SSR bölümü

**Neden:** Blog yazıları (sinastri, tarot, retro...) araç sayfalarına hiç link
vermiyor; konu otoritesi kümeleri kopuk.

**Yapılacak:**
- [ ] Blog detay şablonuna server-rendered "İlgili araçlar" bölümü: yazı
      slug'ına/anahtar kelimesine göre deterministik eşleme (sinastri→ uyum hub
      + `/sinastri`; tarot→ `/tarot`; retro/gezegen→ `/burclar` + günlük;
      rüya→ `/ruya-tabiri`; numeroloji→ `/numeroloji`; genel→ doğum haritası).
      Eşleme statik bir map dosyasında dursun; DB içeriğine dokunulmaz.
- [ ] Başlık/metinler ui_ anahtarlı, 3 dil.

**Kabul:**
- [ ] `/tr/blog/sinastri-uyumu-nasil-okunur` HTML'inde uyum hub + sinastri
      linkleri; EN/DE blog sayfalarında lokalize karşılıkları.

### S1-T6 — Hesaplayıcı kümesine içerik derinliği

**Hedef sorgular:** "rising sign calculator" (EN, poz. ~80, 1.500+ gösterim),
"yükselen burç hesaplama" (TR, poz. ~73).

**Yapılacak:**
- [ ] `LANDING_CONTENT['yukselen-burc']` üç dilde derinleştir: yükselenin ne
      olduğu, doğum saati hassasiyeti (2 saat kuralı), ev sistemine etkisi,
      "saatimi bilmiyorum" (rektifikasyon CTA) bölümleri + en az 5 SSS.
      Mevcut editoryal üslup ve sorumlu-yorum çerçevesi korunur.
- [ ] `SeoLandingArticle` SSS bölümü için FAQPage JSON-LD basıyor mu kontrol
      et; basmıyorsa ekle (yalnız gerçek, sayfada görünen SSS'lerle).
- [ ] Hesaplayıcı sayfasından `buyuk-uclu`, `burcunu-ogren`, `birth-chart` ve
      uyum hub'ına bağlamsal linkler; bu üç sayfadan da hesaplayıcıya geri link.
- [ ] EN/TR/DE title+description'ı `017_seo_pages_seed.sql`'de sorgu niyetine
      göre keskinleştir (EN örn. "Free Rising Sign Calculator — Exact by Birth
      Time"); yildizname'de yapılan işin aynısı.

**Kabul:**
- [ ] Üç dilde sayfa HTML'inde yeni bölümler + SSS; JSON-LD validator'dan
      geçen FAQPage; typecheck + build yeşil.

### S1-T7 — Paket kabulü (Claude Code yapar)

- [ ] Kod review (`/code-review` çıktısı temiz veya bulgular kapatıldı).
- [ ] Deploy sonrası canlı: T1-T6 kabul kriterlerinin tamamı canlıda `curl` ile
      doğrulandı; `bun scripts/seo-i18n-audit.ts https://goldmoodastro.com`
      → `0 hata · 0 dil uyarısı` (URL sayısı 395+3 hub = 398 beklenir).
- [ ] URL Inspection yeniden: TR kanonik 3 çift + EN kanonik 2 çift + 3 hub.
- [ ] Sitemap GSC'ye yeniden gönderildi (API, mevcut script kalıbı).
- [ ] `017_seo_pages_seed.sql` yeni kayıtları prod DB'ye uygulandı
      (kullanıcı onaylı script — Claude hazırlar, kullanıcı çalıştırır).

### S1-T8 — GSC panel adımları (kullanıcı yapar)

- [ ] Coverage'daki 5xx grubunda "Düzeltmeyi Doğrula"yı yeniden başlat.
- [ ] URL Inspection'dan elle "Dizine ekleme iste": 3 uyum hub URL'si +
      `/en/rising-sign-calculator` + `/tr/yukselen-burc-hesaplayici`.
- [ ] (Paralel, paket dışı) Eylül sosyal içerik paketi üretimi — marka
      aramalarının tek tıklama kaynağı olduğu 20 Ağustos sonrasında kanıtlandı.

## Ölçüm (paket sonrası)

| Metrik | Bugün (2026-08-29) | 14 gün hedefi | 28 gün hedefi |
|---|---|---|---|
| İndeksli uyum sayfası (TR+EN+DE) | ~yalnız birkaç DE | ≥30 | ≥100 |
| "Keşfedildi/tarandı - indekslenmedi" toplamı | 307 | düşüşte | ≤200 |
| Kopya coverage grupları (30+40) | 70 | düşüşte | ≤20 |
| Günlük tıklama (7g ort.) | ~0 | ≥1 | ≥3 |
| `/en/rising-sign-calculator` pozisyon | ~79 | ≤60 | ≤40 |

Ölçüm komutları: `doc/raporlar/gsc-trafik-analizi-2026-08-28/` içindeki API
kalıpları + URL Inspection scriptleri (Claude oturumunda mevcut).
