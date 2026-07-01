# GoldMoodAstro — Dönüşüm Tracking Brief (Codex)

> Tarih: 2026-06-25 · Mimar: Claude Code · Implement: Codex
> Kaynak: ekosistem-sosyal-medya GA4 analizi. Site modeli: **astroloji danışmanlık** — seans/randevu (booking) + üyelik. GA4 temel (page_view) çalışıyor ama **dönüşüm event'i yok**.

## Durum
- GA4 G-M8FPZB5FFC bağlı, page_view akıyor; **hostname temiz**, trafik ~0 (yeni site).
- Ekosistem tarafı yapıldı: `analyticsType=lead` + hayalet key event temizliği (close_convert_lead/qualify_lead kaldırıldı; purchase kaldı).
- **Eksik:** asıl hedefler (seans/randevu booking + üyelik) GA4'e dönüşüm olarak gitmiyor → ölçüm yok.

## Analytics mimarisi (mevcut)
- `src/features/analytics/AnalyticsScripts.tsx`: gtmId/ga4Id either-or. DB'de **GTM yok** → GA4 gtag **doğrudan** yükleniyor (`window.gtag` mevcut).
- Event helper YOK. `window.gtag('event', ...)` doğrudan çağrılabilir.

## Yapılacak

### 1) Küçük event helper (opsiyonel ama temiz) — `src/lib/track.ts`
```ts
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  try {
    const w = window as any;
    if (typeof w.gtag === 'function') w.gtag('event', name, params);
    else if (Array.isArray(w.dataLayer)) w.dataLayer.push({ event: name, ...params });
  } catch {}
}
```

### 2) Booking (seans/randevu) dönüşümü — ANA HEDEF
- **Dosya:** `src/app/[locale]/booking/page.tsx` (≈satır 138, `createBooking({...})` başarılı olduktan sonra).
- Başarılı booking sonrası:
```ts
const booking = await createBooking({...}).unwrap();
// GA4 dönüşüm
trackEvent('generate_lead', { event_source: 'booking', currency: 'TRY' /*, value: ücret varsa */ });
// Ücretli seans ise generate_lead yerine/yanına: trackEvent('purchase', { value, currency:'TRY', transaction_id: booking.id })
```
- **Karar (kullanıcı):** seans ücretsiz lead mi (generate_lead) yoksa online ödemeli mi (purchase + value)? Model "fiyat" içeriyor → ödemeli ise `purchase` (value ile) daha doğru.

### 3) Üyelik/kayıt dönüşümü
- Public register başarılı olunca: `trackEvent('sign_up', { method: 'email' })`.
- (Register bileşeni public tarafta nerede ise oraya; admin register'a değil.)

### 4) Deploy sonrası — ekosistem (Claude Code)
- `generate_lead` (+ `sign_up`, varsa `purchase`) → GA4 key event (property 542424498). [ ]
- analyticsType zaten `lead` (gerekirse `purchase` modeline göre güncellenir).

## Strateji notu (ayrı — trafik)
Site yeni, trafik ~0. Dönüşüm tracking kurulduktan sonra asıl iş **trafik**: burç/fal içerikleri SEO için güçlü (organik), sosyal medya, ileride Ads. Bu brief sadece **ölçüm altyapısı**.

## İlgili
- Ekosistem takip: `ekosistem-sosyal-medya/yapilacak-isler/goldmoodastro/`
- Referans event kalıbı: woody `lib/ads-conversion.ts`, vistaseeds `fireAdsConversion`.
