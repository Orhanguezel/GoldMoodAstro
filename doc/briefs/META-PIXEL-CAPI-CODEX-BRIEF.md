# Codex Brief — Meta Pixel Tamamlama (Dönüşüm Event'leri + Server-side CAPI)

> **Repo:** goldmoodastro · **Yazan:** Claude Code (mimar) · **Tarih:** 2026-07-30
> **Kapsam:** Frontend dönüşüm event'leri + server-side Conversions API (CAPI), event_id ile deduplication.
> **Ön koşul:** Pixel ID kullanıcıdan gelecek → `facebook_pixel_id` site setting'e yazılır. CAPI token
> Meta Events Manager'dan üretilecek → `facebook_capi_token` (secret) site setting'e yazılır.

---

## 0. Mevcut durum — kod okumasıyla doğrulanmış

| Alan | Durum |
|------|-------|
| Pixel base kodu | ✅ `frontend/src/features/analytics/AnalyticsScripts.tsx` §4 — consent-mode uyumlu (revoke→grant), `facebook_pixel_id` config-driven |
| PageView | ✅ init + SPA (`GAViewPages.tsx:90`) |
| Panel diagnostics | ✅ ekosistem "Meta Pixel & CAPI" sekmesi (pixel_id/capi_token/test_event_code kontrolü) |
| Pixel ID | ❌ `facebook_pixel_id` boş → `hasFbPixel=false` → pixel yüklenmiyor |
| **Dönüşüm event'leri** | ❌ **YOK** — sadece PageView. Purchase/Lead/CompleteRegistration/InitiateCheckout hiç atılmıyor |
| **Server CAPI** | ❌ **YOK** — backend'de gerçek event gönderimi yok (sadece diagnostics) |

**Hedef:** Pixel ID + CAPI token girildiğinde, kilit dönüşümler hem tarayıcıdan (fbq) hem sunucudan
(CAPI) **aynı `event_id` ile** Meta'ya gitsin (Meta dedup eder). iOS/ad-blocker kayıplarına dayanıklı ölçüm.

---

## WP-1 — Frontend dönüşüm event helper + kablolama 🟢

**`frontend/src/lib/fbpixel.ts` (YENİ)** — `ga.ts` kalıbı, asla hata fırlatmaz, consent'e saygılı:
```ts
export function fbEvent(name: string, params: Record<string, unknown> = {}, eventId?: string): void {
  if (typeof window === "undefined") return;
  try {
    const w = window as any;
    if (typeof w.fbq !== "function") return;         // pixel yoksa sessiz
    if (!w.__analyticsConsentGranted) return;         // KVKK: izin yoksa gönderme
    w.fbq("track", name, params, eventId ? { eventID: eventId } : undefined);
  } catch { /* akışı bozma */ }
}
```

**Kablolanacak dönüşümler (GA4 `gaEvent` ile YAN YANA, aynı yerlerde):**
| Event | Nerede | Parametre + event_id |
|-------|--------|----------------------|
| `InitiateCheckout` | `app/[locale]/booking/payment/page.tsx` (sayfa açılışı) | value, currency; `event_id=checkout_<bookingId>` |
| `Purchase` | ödeme başarılı dönüşü (booking/payment success state) | value, currency=TRY; `event_id=purchase_<orderId>` |
| `Lead` | become-consultant başvuru submit (`BecomeConsultantHero`/`ConsultantFunnelCTA`) | `event_id=lead_<userId|ts>` |
| `CompleteRegistration` | `app/[locale]/register/page.tsx` başarılı kayıt | `event_id=reg_<userId>` |

- `event_id` **kesinlikle** backend CAPI ile aynı kural (order/booking/user id tabanlı) → dedup çalışır.
- Değer/para birimi doğrulanmış gerçek tutardan; uydurma değer yok.

## WP-2 — Server-side CAPI 🟡 (asıl sağlamlık)

**`packages/shared-backend/modules/marketing/meta-capi.ts` (YENİ)** (veya `modules/analytics/`):
- `sendCapiEvent({ eventName, eventId, userData, customData, eventSourceUrl, actionSource:"website" })`
- Endpoint: `POST https://graph.facebook.com/v21.0/{pixel_id}/events?access_token={capi_token}`
- **PII hash zorunlu:** email/phone/name/externalId → normalize + **SHA-256** (Meta kuralı). Ham PII gönderme.
- `event_id` frontend ile aynı → Meta browser+server event'ini birleştirir.
- Config: `facebook_pixel_id` + `facebook_capi_token` (secret) + opsiyonel `facebook_test_event_code`
  goldmood **site settings**'ten (mevcut `siteSettings` modülü; token secret olarak saklanır, log'lanmaz).
- Config eksikse **no-op + tek seferlik warn** (akışı bozma, throw yok).

**Trigger noktaları (server, gerçek dönüşüm anı):**
| Event | Modül | Not |
|-------|-------|-----|
| `Purchase` | `modules/orders/iyzico.service.ts` ödeme **confirmed** callback | value, currency; userData=alıcı (hashli); `event_id=purchase_<orderId>` |
| `Lead` | `modules/consultantSelf/controller.ts` başvuru oluşturma | `event_id=lead_<userId>` |
| `CompleteRegistration` | auth register başarılı | opsiyonel |

## WP-3 — Config + panel senkronu 🟢

- Site settings anahtarları: `facebook_pixel_id` (var), **`facebook_capi_token`** (secret, YENİ),
  **`facebook_test_event_code`** (opsiyonel debug, YENİ).
- ekosistem "Meta Pixel & CAPI" diagnostics sekmesi bu değerleri okuyup "Hazır/Eksik" gösteriyor →
  aynı anahtar isimleriyle tutarlı olsun (secret sızdırmadan sadece "tanımlı mı").
- Admin panelde site-settings formuna CAPI token alanı (secret için `__KEEP__` sentinel deseni).

## WP-4 — Consent & KVKK uyumu 🔴 kural

- Frontend fbq zaten consent-gated (revoke→grant). **CAPI de consent bypass DEĞİLDİR.**
- CAPI event'i yalnızca kullanıcı analitik/pazarlama iznini vermişse gönderilir (Purchase gibi
  sözleşmesel işlemde meşru menfaat tartışılır ama varsayılan: **izin varsa gönder**).
- İzin durumu server'a taşınmalı (ör. order kaydında consent flag) veya event'e consent bilgisi eklenmeli.

---

## Ön koşullar (kullanıcı / Meta Events Manager)
1. **Pixel ID** — kullanıcı verecek → `facebook_pixel_id` site setting.
2. **CAPI token** — Events Manager → Settings → Conversions API → **Generate access token** → `facebook_capi_token` (secret).
3. (Opsiyonel) **Test Event Code** — Events Manager → Test Events → kurulum doğrulaması için.

## Kabul kriterleri
- [ ] `fbEvent` helper; InitiateCheckout/Purchase/Lead/CompleteRegistration frontend'de atılıyor (consent-gated, event_id'li)
- [ ] `sendCapiEvent` PII'yi SHA-256 hash'liyor; Purchase/Lead server'dan gidiyor; config eksikse no-op
- [ ] Browser + server event'i **aynı event_id** → Meta Test Events'te **deduplicated** görünüyor
- [ ] CAPI token secret olarak saklanıyor, log'a/response'a **sızmıyor**
- [ ] Consent yokken ne fbq ne CAPI event'i gidiyor
- [ ] `bun run typecheck` (backend + frontend) temiz

## Kurallar (CLAUDE.md / AGENTS.md — goldmoodastro + workspace)
- ❌ Secret'ı koda/`.env.example`'a dolu yazma; token secret site-setting (şifreli), fallback yok
- ❌ `ALTER TABLE` yok — yeni kolon gerekiyorsa seed/şema akışıyla
- ✅ PII daima hash (SHA-256), ham gönderme · analytics asla akışı bozmaz (try/catch, no-op)
- ✅ Bun, TypeScript strict, Drizzle · consent'e saygı (KVKK)

## Dokunulacak dosyalar
```
frontend/src/lib/fbpixel.ts                                   WP-1 (YENİ)
frontend/src/app/[locale]/booking/payment/page.tsx           WP-1 (InitiateCheckout + Purchase)
frontend/src/app/[locale]/register/page.tsx                  WP-1 (CompleteRegistration)
frontend/src/components/common/public/BecomeConsultantHero.tsx WP-1 (Lead)
packages/shared-backend/modules/marketing/meta-capi.ts       WP-2 (YENİ)
packages/shared-backend/modules/orders/iyzico.service.ts     WP-2 (Purchase trigger)
packages/shared-backend/modules/consultantSelf/controller.ts WP-2 (Lead trigger)
packages/shared-backend/modules/siteSettings/helpers/constants.ts WP-3 (yeni anahtarlar)
admin_panel/.../site-settings/...                            WP-3 (CAPI token alanı)
```

## Öncelik
**WP-1 → WP-3 → WP-2 → WP-4**

Gerekçe: WP-1 (frontend event'ler) Pixel ID gelince hemen değer üretir; WP-3 config'i açar; WP-2 (CAPI)
sağlamlığı ekler; WP-4 uyum her ikisini de kapsar. Pixel ID + CAPI token gelene kadar kod ID-agnostik
yazılır, config girilince aktifleşir.
