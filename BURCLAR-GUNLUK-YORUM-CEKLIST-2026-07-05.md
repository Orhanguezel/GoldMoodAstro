# Burçlar + Günlük Yorum — i18n & Admin Yönetim Çeklisti

**Tarih:** 2026-07-05
**Kaynak şikayet:** Burç sayfaları (`/tr/burclar/gemini`, `/de/burclar/gemini`) admin'den görülemiyor, günlük yorumlar admin'den görülemiyor; `/de` sayfada burç adı/etiketler **Türkçe** (İKİZLER, HAVA, DEĞİŞKEN, YANG, MERKÜR) çıkıyor; günlük yorumlar da her dilde Türkçe geliyor. Bunlar SEO açısından kıymetli.
**Rol dağılımı:** Bu çeklist Codex'e madde madde verilecek. Claude (mimar) analiz + kabul kriterlerini belirledi.

---

## Sorunun Kök Nedenleri (özet)

| # | Bulgu | Kanıt |
|---|-------|-------|
| 1 | Burç adı/etiket/tarih **hardcoded TR**; `ZodiacDetail.tsx` `localizeSign()` çağırmıyor, ham `meta.*` basıyor | `ZodiacDetail.tsx:16` sadece `getZodiacMeta` import; `:226 {meta.label}`, `:229 [meta.element,...]` |
| 2 | `signs.ts`'te **polarity + ruler için i18n map YOK**; `LocalizedSign` tipi de bunları içermiyor | `signs.ts:52,67,74` var; POLARITY_I18N/RULER_I18N yok; `:80` tip eksik |
| 3 | İçerik metin şablonları `localePrefix === 'tr' ? TR : EN` — **`de` dalı yok**, Almanca İngilizceye düşer | `ZodiacDetail.tsx:72,76,80,86,...` |
| 4 | Günlük yorum **sadece `tr` üretiliyor**; cron `generateAllForPeriod(period, 'tr')` hardcoded | `backend/src/cron/horoscope-job.ts:55` |
| 5 | LLM prompt'ları **yalnızca `locale='tr'`**; en/de prompt satırı yok | `backend/src/db/sql/099_horoscope_prompts_seed.sql` |
| 6 | Backend `de/en` verisi yoksa **sessizce `tr`'ye düşüyor** (çeviri katmanı yok) | `horoscopes/repository.ts:136-137` |
| 7 | Anasayfa `DailyHoroscopeSection` **locale göndermiyor + eski şema bekliyor** (contentTr/date/moodScore) → undefined render | `DailyHoroscopeSection.tsx:105,110,121`; `horoscopes.endpoints.ts` |
| 8 | Burç içeriği admin'de **düzenlenebiliyor ama gizli** (Astroloji Bilgi Bankası, kind=sign) | `astrology-kb-client.tsx:61-63` KIND_OPTIONS'ta `sign`/`sign_section` var |
| 9 | Günlük yorum admin'de **HİÇ yönetilemiyor** (sadece cron+LLM; CRUD/görüntüleme/manuel tetik yok) | `horoscopes/router.ts` yalnızca GET; admin sayfa yok |

> Not: **Tablo şeması i18n'e hazır** — `daily_horoscopes` locale kolonu + `unique(period, period_start_date, sign, locale)` her dili ayrı satır tutabiliyor (`037_daily_horoscopes_schema.sql:12,22`). Eksik olan sadece **üretim** ve **admin yönetimi**.

---

## GRUP A — Burç Detay Sayfası i18n (Frontend) — EN ACİL, GÖRÜNÜR HATA

### [x] BRC-A1 — `signs.ts`'e polarity + ruler i18n ekle
- **Dosya:** `frontend/src/lib/zodiac/signs.ts`
- **Yapılacak:**
  1. `POLARITY_I18N: Record<ZodiacPolarity, EnDe>` ekle → Yang: `{en:'Yang', de:'Yang'}`, Yin: `{en:'Yin', de:'Yin'}` (polarite terimleri evrensel; TR "Yang/Yin" zaten aynı — ama tip bütünlüğü için map olmalı).
  2. `RULER_I18N: Record<string, EnDe>` ekle → tüm yöneticiler: Merkür→Mercury/Merkur, Venüs→Venus/Venus, Mars→Mars/Mars, Ay→Moon/Mond, Güneş→Sun/Sonne, Jüpiter→Jupiter/Jupiter, Satürn→Saturn/Saturn, Plüton→Pluto/Pluto, Uranüs→Uranus/Uranus, Neptün→Neptune/Neptun.
  3. `LocalizedSign` tipini (`:80`) genişlet: `polarity: string; ruler: string` ekle.
  4. `localizeSign()` (`:83`) dönüşüne `polarity` + `ruler` çevirisini ekle (map yoksa ham değere düş: `?? meta.polarity`).
- **Kabul kriteri:** `localizeSign(getZodiacMeta('gemini'), 'de')` → `{label:'Zwillinge', date:'21. Mai - 20. Juni', element:'Luft', modality:'Veränderlich', polarity:'Yang', ruler:'Merkur'}`.
- **Bağımlılık:** yok. BRC-A2 bunu kullanır.
  - **Tamamlandı 2026-07-05:** `POLARITY_I18N`, `RULER_I18N`, `LocalizedSign.polarity/ruler` eklendi. Snippet doğrulaması `gemini/de` için beklenen çıktıyı verdi.

### [x] BRC-A2 — `ZodiacDetail.tsx` ham `meta.*` yerine `localizeSign` kullansın
- **Dosya:** `frontend/src/components/containers/zodiac/ZodiacDetail.tsx`
- **Yapılacak:**
  1. `import { getZodiacMeta, localizeSign } from '@/lib/zodiac/signs'` (`:16`).
  2. `meta` alındıktan sonra (`:44`): `const L = localizeSign(meta, localePrefix)`.
  3. Görünen alanları değiştir: `{meta.date}` → `{L.date}` (`:222`), `{meta.label}` → `{L.label}` (`:226`), `[meta.element, meta.modality, meta.polarity, meta.ruler]` → `[L.element, L.modality, L.polarity, L.ruler]` (`:229`).
  4. Metin şablonlarındaki (`summaryText:69`, section fallbacks `:70-91`, focus narratives `:107-167`, `:321-584`) tüm `${meta.label|element|modality|ruler}` kullanımlarını `L.*` ile değiştir.
- **Kabul kriteri:** `/de/burclar/gemini` → başlık **"ZWILLINGE"**, tarih **"21. MAI - 20. JUNI"**, etiketler **"LUFT / VERÄNDERLICH / YANG / MERKUR"**. `/en/burclar/gemini` → "GEMINI", "AIR / MUTABLE / YANG / MERCURY". `/tr` değişmez ("İKIZLER / HAVA / DEĞİŞKEN / YANG / MERKÜR").
- **Bağımlılık:** BRC-A1.
  - **Tamamlandı 2026-07-05:** `ZodiacDetail` artık `localizeSign(meta, localePrefix)` çıktısını başlık, tarih, etiket, paylaşım ve CTA metinlerinde kullanıyor.

### [x] BRC-A3 — İçerik metin şablonlarına `de` dalı ekle
- **Dosya:** `frontend/src/components/containers/zodiac/ZodiacDetail.tsx`
- **Yapılacak:** `localePrefix === 'tr' ? TR : EN` şeklindeki tüm ikili dalları (`:72,76,80,86` ve devamı) üç-dilli yap. Öneri: küçük helper `const pick = (tr,en,de) => localePrefix==='tr'?tr:localePrefix==='de'?de:en`. Section başlıkları (Karakteri/Personality → Persönlichkeit; Aşk ve Uyum → Liebe & Kompatibilität; Kariyer ve Yön → Karriere & Richtung; Sağlık ve Yaşam Ritmi → Wohlbefinden & Lebensrhythmus) ve anlatı paragrafları için Almanca metin ekle.
- **Kabul kriteri:** `/de` sayfada bölüm başlıkları ve fallback anlatılar Almanca; İngilizceye düşmüyor. (API içeriği varsa zaten o gelir; bu sadece fallback.)
- **Bağımlılık:** BRC-A2. **Not:** Bu madde büyük metin çevirisi içerir — istenirse ayrı ele alınabilir; A1+A2 görünür hatayı tek başına çözer.
  - **Tamamlandı 2026-07-05:** `pick(tr,en,de)` helper'ı eklendi; section başlıkları, focus subtitle'ları ve fallback anlatılar Almanca dalı aldı.

### [x] BRC-A4 — Fallback tutarsızlığını gider (`page.tsx` eski İngilizce-only fallback)
- **Dosya:** `frontend/src/app/[locale]/burclar/[sign]/page.tsx`
- **Yapılacak:** Eski, yalnız-İngilizce `buildFallbackInfo` (`:48-74`, kullanım `:132`) yerine `frontend/src/lib/zodiac/pageInfo.server.ts`'teki `buildZodiacFallbackInfo`'yu kullan (alt sayfalar ask/kariyer/saglik zaten onu kullanıyor — `ask/page.tsx:37`).
- **Kabul kriteri:** Ana burç sayfası ile alt sayfalar aynı fallback kaynağını kullanır; `/tr` fallback Türkçe gelir (şu an İngilizce).
- **Bağımlılık:** yok (A grubundan bağımsız yapılabilir).
  - **Tamamlandı 2026-07-05:** Ana `/burclar/[sign]` sayfası eski lokal `buildFallbackInfo` yerine `buildZodiacFallbackInfo` + `fetchZodiacInfoServer` kullanıyor.

### [x] BRC-A5 — `buildZodiacFallbackInfo`'ya gerçek `de` desteği (opsiyonel kalite)
- **Dosya:** `frontend/src/lib/zodiac/pageInfo.server.ts`
- **Yapılacak:** `:62-107` `isTr ? TR : EN` yapısı `de`'yi İngilizceye düşürüyor; üç-dilli yap (Almanca fallback metinleri ekle).
- **Kabul kriteri:** `/de` fallback içeriği Almanca. **Not:** düşük öncelik; API içeriği varsa devreye girmez.
- **Bağımlılık:** BRC-A4.
  - **Tamamlandı 2026-07-05:** `zodiacLabelsDe`, `getZodiacLabelForLocale` ve Almanca fallback title/summary/content/section metinleri eklendi.

---

## GRUP B — Günlük Yorum Çok-Dilli Üretim (Backend)

### [x] BRC-B1 — LLM prompt'larına `en` + `de` locale satırları ekle
- **Dosya:** `backend/src/db/sql/099_horoscope_prompts_seed.sql`
- **Yapılacak:** `horoscope_daily_general` (+ weekly/monthly/compatibility) için `locale='en'` ve `locale='de'` prompt satırları ekle. System/user prompt metinleri ilgili dilde ("...write the horoscope in English/German", ikinci tekil şahıs). Mevcut `tr` satırını referans al. **INSERT IGNORE** kullan (seed idempotent kuralı — mevcut içeriği ezme).
- **Kabul kriteri:** DB'de her promptKey için 3 locale satırı; `bun run db:seed:nodrop` tekrar çalıştırınca duplicate/ezme yok.
- **Bağımlılık:** yok. **DB Kuralı:** ALTER yasak; sadece seed INSERT.
  - **Tamamlandı 2026-07-05:** `099_horoscope_prompts_seed.sql` içine `INSERT IGNORE` ile `en/de` satırları eklendi. Lokal hedefli seed (`--no-drop --only=099`) çalıştırıldı; DB kontrolünde dört prompt key için `de,en,tr` locale satırları doğrulandı.

### [x] BRC-B2 — Cron'u tüm diller için döngüye al
- **Dosya:** `backend/src/cron/horoscope-job.ts`
- **Yapılacak:** `:55` `generateAllForPeriod(period, 'tr')` yerine desteklenen dilleri döngüye al. Dil listesini `site_settings.app_locales`'ten (ya da env/sabit `['tr','en','de']`) al: `for (const loc of locales) await generateAllForPeriod(period, loc)`. Idempotent skip zaten generator'da var (mevcut satır varsa LLM çağırmaz).
- **Kabul kriteri:** Cron bir tur sonrası `daily_horoscopes` tablosunda her burç için `tr/en/de` satırları oluşur (LLM prompt'ı ilgili dilde olduğu için içerik o dilde). LLM maliyeti 3×; kabul edilebilir (opsiyonel: sadece en+de için gece farklı saat).
- **Bağımlılık:** BRC-B1 (yoksa en/de prompt bulunamaz, generator hata/boş döner).
  - **Tamamlandı 2026-07-05:** Cron `HOROSCOPE_LOCALES` listesini (`tr,en,de` varsayılan) döngüye alacak şekilde güncellendi; mevcut satırları generator skip ettiği için idempotent davranış korunuyor. Backend typecheck geçti.

### [x] BRC-B3 — Fallback davranışını netleştir (tr'ye düşmeden önce)
- **Dosya:** `backend/src/modules/horoscopes/repository.ts:136-137`
- **Yapılacak:** Mevcut `if (!row && locale !== 'tr') row = await tryFetch('tr')` fallback'i **kalabilir** (veri henüz üretilmemişse boş sayfadan iyidir) ANCAK response'a `is_fallback: true` + `content_locale` alanı ekle ki frontend "bu içerik henüz X dilinde yok" durumunu bilebilsin ve SEO'da yanlış `inLanguage` vermesin.
- **Kabul kriteri:** de sayfada tr içerik dönerse response `content_locale:'tr'`, `is_fallback:true` içerir; en/de üretildikten sonra `is_fallback:false`.
- **Bağımlılık:** BRC-B2 ile birlikte anlamlı.
  - **Tamamlandı 2026-07-05:** Horoscope response modeline `content_locale` ve `is_fallback` eklendi; istenen locale bulunamazsa TR fallback açıkça işaretleniyor. Backend typecheck geçti.

---

## GRUP C — Admin Yönetimi

### [x] BRC-C1 — Burç içeriğini admin'de keşfedilebilir yap (küçük UX)
- **Dosya:** `admin_panel/src/navigation/sidebar/sidebar-items.ts`
- **Durum:** Burç içeriği ZATEN `/admin/astrology-kb` (kind=sign / sign_section) üzerinden düzenlenebiliyor — sadece gizli/yanlış isimlendirilmiş.
- **Yapılacak:** İçerik grubuna "Burç İçerikleri" adlı nav item ekle → `/admin/astrology-kb?kind=sign` (önfiltreli). `astrology-kb-client.tsx`'in URL query'den `kind` başlangıç filtresini okuması gerekiyorsa küçük ekleme yap.
- **Kabul kriteri:** Admin sidebar'da "Burç İçerikleri" linki; tıklayınca kind=sign filtreli liste açılır; gemini kaydı bulunup düzenlenebilir (tr/en/de).
- **Bağımlılık:** yok. Yeni backend GEREKMEZ (mevcut astrology_kb CRUD).
  - **Tamamlandı 2026-07-05:** Sidebar'a `Burç İçerikleri` → `/admin/astrology-kb?kind=sign` eklendi. `astrology-kb-client` URL `kind` filtresini okuyup listeyi `sign` türüyle açıyor. Admin typecheck geçti.

### [x] BRC-C2 — Günlük yorum admin endpoint'leri (Backend)
- **Dosya:** `backend/src/modules/horoscopes/router.ts` (+ controller/repository)
- **Yapılacak:** Admin-korumalı (`requireAuth+requireAdmin`) endpoint'ler ekle:
  - `GET /admin/horoscopes` — liste/filtre (sign, period, date, locale, source). `repository.ts:161 getRecentHoroscopes` şu an dead code — bunu genişletip kullan.
  - `PUT /admin/horoscopes/:id` — content düzenle, `source='astrolog_manual'` işaretle.
  - `POST /admin/horoscopes/generate` — belirli sign/period/locale için cron generator'ı manuel tetikle.
- **Kabul kriteri:** Admin token ile liste/düzenle/tetikle çalışır; düzenlenen satır `source='astrolog_manual'` olur ve cron onu ezmez (idempotent skip mevcut içeriği korumalı).
- **Bağımlılık:** yok. **Not:** `controller.ts:63` zaten "manuel tetiklemek için admin panel" diyor — enum `astrolog_manual` bu iş için tasarlanmış.
  - **Tamamlandı 2026-07-05:** `/admin/horoscopes` liste/filtre, `PUT /admin/horoscopes/:id` manuel düzenleme (`source='astrolog_manual'`) ve `POST /admin/horoscopes/generate` tekil üretim endpoint'leri eklendi. `registerGoldmoodAdmin` kaydı yapıldı; backend typecheck geçti.

### [x] BRC-C3 — Günlük yorum admin sayfası (Admin Panel)
- **Dosya:** yeni `admin_panel/src/app/(main)/admin/(admin)/horoscopes/` + `sidebar-items.ts`
- **Yapılacak:** Liste (sign/period/date/locale filtre) + düzenleme formu + "Yeniden Üret" butonu. `sidebar-items.ts`'e yeni `AdminNavItemKey` ('horoscopes') + FALLBACK_TITLES + adminNavConfig kaydı. BRC-C2 endpoint'lerini kullanır.
- **Kabul kriteri:** Admin "Günlük Yorumlar" sayfasında satırları görebilir, düzenleyebilir, manuel üretebilir; kaydettiği içerik canlıda görünür.
- **Bağımlılık:** BRC-C2.
  - **Tamamlandı 2026-07-05:** `/admin/horoscopes` sayfası, filtreli liste, düzenleme paneli, manuel kaydetme ve yeniden üretim butonları eklendi. Sidebar'a `Günlük Yorumlar` nav item'i ve RTK admin endpoint hook'ları bağlandı; admin_panel typecheck geçti.

---

## GRUP D — Ek Buglar (Bonus, i18n ile ilgili)

### [x] BRC-D1 — Anasayfa `DailyHoroscopeSection` locale + şema uyumsuzluğu
- **Dosya:** `frontend/src/components/containers/home/DailyHoroscopeSection.tsx` + `.../horoscopes.endpoints.ts`
- **Yapılacak:**
  1. Endpoint'e `locale` parametresi ekle (şu an sadece `{sign, date}` gönderiyor → hep `tr` alır).
  2. Response alan adlarını backend'e hizala: `contentTr/contentEn` → `content`, `date` → `period_start_date`, `moodScore` → `mood_score`. `[sign]/bugun/page.tsx:139-142` normalize kalıbını (`data.contentTr ?? data.content`) örnek al.
- **Kabul kriteri:** Anasayfa günlük yorum kartında metin/tarih/mood **görünür** (şu an undefined) ve `/de`'de Almanca (B grubu üretildikten sonra).
- **Bağımlılık:** görsel düzelme için B grubu; alan-adı fix'i bağımsız.
  - **Tamamlandı 2026-07-05:** `DailyHoroscopeSection` locale parametresi gönderiyor, backend alanları (`content`, `period_start_date`, `mood_score`, `lucky_number`, `lucky_color`) normalize edilip kartta kullanılıyor. Public horoscope hook'ları ve ana burç sayfası SSR daily fetch'i locale ile hizalandı; backend/frontend typecheck geçti.

---

## Önerilen Uygulama Sırası

1. **BRC-A1 → BRC-A2** (görünür hatayı çözer: /de artık "ZWILLINGE / LUFT..." — en yüksek etki, en düşük risk)
2. **BRC-C1** (burç içeriği admin'de erişilebilir — sıfır backend)
3. **BRC-B1 → BRC-B2** (günlük yorum en/de üretimi başlar)
4. **BRC-C2 → BRC-C3** (günlük yorum admin yönetimi)
5. **BRC-A4, BRC-D1** (fallback/anasayfa tutarlılık)
6. **BRC-A3, BRC-A5, BRC-B3** (kalite/derinlik — opsiyonel/sonra)

## Notlar
- **DB kuralı:** ALTER TABLE YASAK. Şema değişikliği gerekirse seed dosyasını düzenle + `bun run db:seed`. (B grubu şema değişikliği gerektirmiyor — locale kolonu zaten var.)
- **Seed kuralı:** INSERT IGNORE / idempotent; kullanıcı/LLM içeriğini ezme (BRC-B1).
- **Deploy:** commit+push → prod `git pull` + build + restart (mevcut kural).
- **SEO kazanımı:** A grubu burç sayfalarında doğru `inLanguage` + yerelleştirilmiş başlık/etiket → /de ve /en sayfalar gerçekten çok-dilli indekslenir. B grubu günlük yorumların her dilde özgün içeriği → duplicate/yanlış-dil cezası önlenir.
