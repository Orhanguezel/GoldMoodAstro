# Monetization — GoldMoodAstro Mobile

GoldMoodAstro'da ödeme ve üyelik iki ayrı akış olarak ele alınır:

1. **Booking payment:** danışman seansı için Iyzipay WebView
2. **Subscription / premium:** iOS/Android için IAP stratejisi

## Booking Payment

Mevcut mobil ödeme modeli:

- Checkout ekranı booking/order oluşturur.
- Payment ekranı `react-native-webview` ile Iyzipay checkout URL'ini açar.
- Success/failure URL patternleri backend/frontend ile uyumlu izlenir.
- Başarıda bookings ekranına dönülür.

Bu akış IAP değildir; danışman seansı gibi hizmet ödemelerinde mevcut Iyzipay modeli korunur.

## Subscription / Premium

`src/lib/iap.ts` şu anda adapter/stub görevi görür. Production için iki seçenek var:

### Seçenek A: RevenueCat

Avantaj:

- Entitlement yönetimi hızlı
- Apple/Google receipt doğrulaması hazır
- Restore purchase ve subscription status daha az custom kod ister

Dezavantaj:

- Ücretli SaaS bağımlılığı
- Vendor lock-in

### Seçenek B: react-native-iap

Avantaj:

- Daha düşük SaaS maliyeti
- Apple/Google billing üzerinde daha direkt kontrol

Dezavantaj:

- Backend receipt validation gerekir
- Edge-case yükü daha fazla

## Platform Kuralları

| Platform | Premium subscription kanalı | Not |
|---|---|---|
| iOS | Apple IAP | Harici ödeme yönlendirmesi gösterme |
| Android | Google Play Billing veya policy uyumlu web seçeneği | Web/Iyzipay seçeneği dikkatli tasarlanır |
| Web | Iyzipay | Mobil IAP ile entitlement backend'de birleşir |

## Product ID Standardı

Mevcut bundle/package:

- `com.goldmoodastro.app`

Önerilen product id:

- `com.goldmoodastro.app.monthly`
- `com.goldmoodastro.app.yearly`

## Backend Entitlement

Tek gerçek kaynak backend olmalıdır:

- `/auth/me` user içinde `is_premium`
- `subscription` özeti
- gerekirse `/subscriptions/me`
- production purchase sonrası `/subscriptions/verify`

Mobile tarafı sadece local cache ve UI state tutar.

## Paywall UI Gereksinimleri

- feature list
- monthly/yearly plan cards
- yearly "EN AVANTAJLI" badge
- primary CTA
- restore purchases
- legal links
- loading state
- error state
- success haptic
- cancel durumunda sessiz/zarif fallback

## iOS Anti-Steering

iOS içinde:

- "Web'den daha ucuza al" gösterme
- Iyzipay abonelik linki verme
- Apple IAP dışı subscription yönlendirmesi yapma

Booking payment hizmet/appointment flow'u olarak ayrı değerlendirilir; yine de App Review metinlerinde netlik gerekir.

## Adapter Shape

`src/lib/iap.ts` interface'i korunmalı:

```ts
export interface IapPurchaseResult {
  ok: boolean;
  receipt?: string;
  productId?: string;
  transactionId?: string;
  purchaseToken?: string;
  message?: string;
}
```

RevenueCat veya `react-native-iap` seçildiğinde bu interface arkasında implementation değiştirilir.

## Requests

Backend ihtiyacı doğarsa `mobile/REQUESTS.md` içine şunu yaz:

```md
## YYYY-MM-DD — Subscription receipt verification

**Method + Path:** POST /api/v1/subscriptions/verify
**Body:** { platform, productId, receipt, transactionId?, purchaseToken? }
**Response:** { ok: true, is_premium: true, subscription: {...} }
**Neden:** Mobile IAP purchase sonrası entitlement doğrulamak için
**Aciliyet:** Yüksek
**Durum:** Bekliyor
```
