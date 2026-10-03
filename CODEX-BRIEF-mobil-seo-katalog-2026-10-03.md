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

## 2. Mobil maddeler — Claude tarafından YAPILDI (2026-10-03, Codex başka işteydi)

| Madde | Durum |
|---|---|
| M1 paylaşım URL'leri | `src/lib/webShare.ts` → `webShareUrl(logicalPath, campaign)`; slug tablosu `@goldmood/shared-config/publicRoutes`, web tablosuyla eşitliği `frontend/tests/public-routes-sync.test.ts` zorlar. 6 `Share.share` çağrısı geçirildi; 18 adres (6 yol × tr/en/de) canlıda yönlendirmesiz açıldı. |
| M2 paylaşım metinleri | `share.*` anahtarları tr/en/de (`mobileI18n.ts`); seed jeneratörle yeniden üretildi. |
| M3 marka | `shareTitle` değerleri `{{brand}}`; marka `mobileBrandConfig.appName`'den (`shareBrand()`). |
| M4 boş `question` | İş yok: okuma detayı soruyu hiç göstermiyor. |

**Codex için tek iş — birleştirme:** `codex/mobile-core-2026-10-03` dalını
`main` ile güncellerken şu dosyalar çakışabilir (hunk'lar küçük, yalnız
`handleShare` blokları + yeni import satırı):
`app/coffee/index.tsx`, `app/dreams/index.tsx`, `app/synastry/index.tsx`,
`app/yildizname/index.tsx`, `app/zodiac/[sign].tsx`, `app/(tabs)/tarot.tsx`,
`packages/shared-config/src/mobileI18n.ts` (her locale'in başına `share` bloğu
+ `shareTitle` → `{{brand}}`).
`backend/src/db/sql/019_ui_mobile_i18n_seed.sql` ÜRETİLMİŞ dosyadır: çakışırsa
elle birleştirme, `bun run scripts/generate-mobile-i18n-seed.ts` ile yeniden üret.
Sonra `bun run check:i18n` — main'de kalan 9 eksik anahtar
(`consultantDetail.disclaimer`, `checkout.consent*`, `checkout.distanceLink`…)
Codex'in kaydedilmemiş işinde zaten var.

## 3. Kapsam dışı / dokunma

- Ana klasördeki `codex/mobile-core-2026-10-03` dalındaki commit'lenmemiş mobil
  işine Claude dokunmadı; bu brief yalnız yeni dosya olarak `main`'e girdi.
- Backend yanıt şekilleri değişmedi; mobil API tiplerinde değişiklik gerekmez.
- LLM sağlayıcı kesintisi (Anthropic kredi, Groq 401, OpenAI 429) kullanıcı
  eylemi bekliyor; mobilde ayrıca bir şey yapılmayacak.
