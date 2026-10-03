# CODEX BRIEF — Mobil: SEO katalog değişikliklerinin etkisi ve mobil karşılıkları

Tarih: 2026-10-03 · Hazırlayan: Claude Code (mimar) · Uygulayan: Codex
İlgili: `SEO-KATALOG-CEKLISTI-2026-10-03.md`, commit `5c420e2` (web, canlıda).

## 1. Web değişiklikleri mobili etkiliyor mu? — Kısa cevap: kırıcı etki yok

| Değişiklik | Mobil etkisi |
|---|---|
| Web SSR `ui_*` snapshot (`UiStringsProvider`) | Yok. Mobil `ui_mobile_i18n` + paketli sözlük kullanır; snapshot `ui_mobile*` ve `ui_admin*` anahtarlarını zaten dışarıda bırakıyor. |
| `POST /numerology/calculate` | Yanıt şekli aynı (`{ id, calculation, interpretation }`). LLM düşükken artık 500 yerine deterministik `interpretation` döner → mobil numeroloji ekranı da düzeldi. |
| Numeroloji/tarot okumaları artık `req.user.sub` ile kullanıcıya bağlanıyor | Mobil Bearer token gönderdiği için kendi okumasını görmeye devam eder. Yeni: giriş yapmış kullanıcının okumaları "Okumalarım" geçmişinde görünebilir (önceden `user_id` hep NULL'dı). |
| `GET /numerology/reading/:id` | Kullanıcıya bağlı okuma yalnız sahibine döner (ad + doğum tarihi içerir). Mobil `me/readings/numerology/[id]` token'la çağırdığı için sorun yok. Token'sız/başka hesapla açılırsa 404. |
| `GET /tarot/reading/:id` | Paylaşım linki için açık; sahibi olmayan görüntüleyene `question` ve `userId` **null** döner. Mobil kendi okumasını token'la çektiği için tam veri alır. |
| `ui_consultantbrowse_page_title` DB değeri değişti | Mobil bu anahtarı kullanmıyor. |
| robots.txt, llms.txt, blog/landing link yerelleştirme, meta başlıklar | Yalnız web. |

**Codex için doğrulama:** `me/readings/[type]/[id].tsx` → tarot ve numeroloji
detaylarını giriş yapmış hesapla aç; `question` alanı null gelirse UI boş satır
yerine alanı gizlemeli (paylaşılan okuma senaryosu).

## 2. Mobilde yapılacaklar (aynı sınıf kusurlar)

Raporun web'de bulduğu asıl kusur "kullanıcının dilinde olmayan metin" ve
"yönlendirmeye düşen link" idi. Mobilde aynı sınıf kusur **paylaşım
mesajlarında** var.

### M1. Paylaşım URL'leri locale'e ve kanonik slug'a göre üretilmeli

7 `Share.share` çağrısının 6'sı sabit `https://goldmoodastro.com/tr/...` kullanıyor:

| Dosya | Sorun |
|---|---|
| `app/zodiac/[sign].tsx:122` | `/tr/burclar/${signKey}` — `signKey` İngilizce (`aries`) → canlıda **308** `/tr/burclar/koc`. Ayrıca EN/DE kullanıcısı TR sayfaya gider. |
| `app/(tabs)/tarot.tsx:148` | `/tr/tarot/reading/:id` sabit TR |
| `app/coffee/index.tsx:129` | `/tr/kahve-fali/result/:id` sabit TR (EN: `coffee-reading`, DE: `kaffeesatzlesen`) |
| `app/dreams/index.tsx:191` | `/tr/ruya-tabiri/result/:id` sabit TR |
| `app/synastry/index.tsx:202` | `/tr/sinastri/result/:id` sabit TR |
| `app/yildizname/index.tsx:210` | `/tr/yildizname/result/:id` sabit TR |

**Yapılacak:** `src/lib/` altına tek bir `webShareUrl(locale, logicalPath, utm)`
yardımcısı. Slug tablosu web'deki
`frontend/src/i18n/localizedRoutes.ts` (`PUBLIC_SEGMENTS`, `ZODIAC_SIGNS`) ile
**birebir aynı** olmalı — kopyalama yerine `packages/shared-config`'e taşıyıp
iki taraftan import etmek tercih (web tarafını Claude/Codex birlikte bağlar).
Site kökü sabit değil, env/config'ten (`EXPO_PUBLIC_SITE_URL` veya mevcut
config) gelir.

Kabul: EN cihazda burç paylaşımı `https://…/en/zodiac-signs/aries`, TR'de
`/tr/burclar/koc`; hiçbir paylaşım linki 3xx dönmemeli
(`curl -s -o /dev/null -w '%{http_code}'` ile 6 link 200).

### M2. Paylaşım metinleri i18n'den gelmeli

Mesajlar Türkçe sabit: "Tarot Açılımım", "Kartlarım", "Kahve Falım",
"Burcu Günlük Yorumu", "… ile keşfet!". EN/DE kullanıcısı Türkçe mesaj
paylaşıyor. Metinleri mobil sözlüğe (`share.*` anahtarları, tr/en/de) taşı;
`bun run scripts/check-mobile-i18n.ts` geçmeli.

### M3. Marka adı paylaşım metninde koddan gelmesin (MARKA KURALI)

Paylaşım mesajlarında ve `title`'larda "GoldMoodAstro" sabit yazılı. Marka
`APP_NAME`/brand config'ten gelmeli; marka-denetimi bunu raporlar.

### M4. Okuma detayında boş `question`

Bkz. bölüm 1 doğrulama notu.

## 3. Kapsam dışı / dokunma

- Ana klasördeki `codex/mobile-core-2026-10-03` dalındaki commit'lenmemiş mobil
  işine Claude dokunmadı; bu brief yalnız yeni dosya olarak `main`'e girdi.
- Backend yanıt şekilleri değişmedi; mobil API tiplerinde değişiklik gerekmez.
- LLM sağlayıcı kesintisi (Anthropic kredi, Groq 401, OpenAI 429) kullanıcı
  eylemi bekliyor; mobilde ayrıca bir şey yapılmayacak.
