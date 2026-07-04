# GoldMoodAstro Mobile - Strategy

Date: 2026-05-23  
Platform: Expo SDK 54 + React Native 0.81 + TypeScript  
Source of execution rules: `AGENTS.md`

## 1) Product Goal

Mobil uygulama GoldMoodAstro'nun premium kanalidir. Hedef, kullanıcının mobilde şu akışı güvenilir ve şık biçimde tamamlamasıdır:

1. Premium onboarding
2. Auth veya hesap oluşturma
3. Danışman keşfi
4. Slot seçimi ve booking
5. Iyzipay ödeme WebView
6. LiveKit sesli görüşme
7. Seans değerlendirme

Başarı ölçütü yalnızca "akış çalışıyor" değildir. Uygulama, App Store/Play Store'da premium astroloji markası gibi görünmeli ve her kritik durumda kullanıcıya net feedback vermelidir.

## 2) Strategic Principles

1. **Single codebase:** iOS + Android birlikte ilerler.
2. **Premium first:** yeni ekranlar token, motion, haptic ve accessibility standardıyla yazılır.
3. **Reliability first:** payment ve call akışları görsel polish için bozulmaz.
4. **Reuse before rebuild:** ortak bileşenler çıkarılır, ekranlar bu bileşenlere taşınır.
5. **API-first:** backend kontratı değişirse `REQUESTS.md` ile istenir.
6. **Scope discipline:** premiumlaştırma işi alakasız backend/frontend refactor'a dönüşmez.

## 3) Target Users

1. Günlük astroloji ve kişisel içgörü arayan kullanıcı
2. Doğum haritası, tarot, kahve, rüya ve sinastri gibi feature'ları kullanan mobil kullanıcı
3. Danışmanla ücretli sesli seans almak isteyen kullanıcı
4. Premium üyelik/credit satın alma potansiyeli olan kullanıcı

## 4) MVP Scope

- 3 aşamalı onboarding
- Login/Register + Apple Sign In
- Consultant list + detail + slots
- Booking oluşturma
- Iyzipay ödeme ekranı
- LiveKit sesli görüşme
- Booking history + status görüntüleme
- Rating/review gönderme
- Push token kaydı ve booking deep link
- Profile, credits, subscription ve privacy ekranları

## 5) Premium Upgrade Scope

### P0 - Shared Premium Components

- `PrimaryButton`
- `PremiumCard`
- `ScreenShell`
- `EmptyState`
- `LoadingState`

Exit criteria:

- Yeni ekranlar ortak temel bileşenleri kullanır.
- CTA basışında scale + haptic vardır.
- Loading ve empty durumları marka hissi taşır.

### P1 - Premium Onboarding

- 3 aşamalı akış:
  1. Welcome / brand signal
  2. Personalization / birth data value
  3. Trust + conversion / register-login handoff
- `expo-linear-gradient`
- `expo-haptics`
- `Animated` veya Reanimated
- i18n: TR + EN + DE

Exit criteria:

- İlk açılış premium onboarding'e gider.
- Devam/login/register yönlendirmeleri bozulmaz.
- Motion düşük güçlü cihazlarda abartılı veya yorucu değildir.

### P2 - Paywall and Subscription Production Plan

- `src/lib/iap.ts` stub durumundan çıkış planı:
  - Tercih A: RevenueCat
  - Tercih B: `react-native-iap` + backend receipt validation
- iOS anti-steering kurallarına uyum
- Ödeme kapsam ayrımı:
  - Dijital içerik, premium abonelik ve kredi paketleri iOS'ta Apple IAP, Android'de Play Billing/RevenueCat üzerinden satılır.
  - Canlı birebir danışmanlık seansı gerçek zamanlı kişisel hizmettir; Iyzipay WebView bu akışta kalabilir.
  - Kredi paketleri dijital tüketilebilir ürün sayıldığı için iOS/Android store build'lerinde Iyzipay ile satılmaz; IAP consumable entegrasyonu tamamlanana kadar gizlenir veya pasif gösterilir.
- `usePremium` ve `/auth/me` subscription özetiyle tutarlı entitlement

Exit criteria:

- Uygulama IAP stratejisini doküman ve kod seviyesinde bilir.
- Purchase/restore/error/loading durumları UI'da tasarlanmıştır.

### P3 - HIG Navigation and Interaction Audit

- Tab bar
- Modal/sheet sunumları
- Header/back davranışı
- Accessibility labels
- 44x44 tap target
- Haptic feedback matrix
- Reduced motion hassasiyeti

Exit criteria:

- iOS'ta native hissi bozan bariz navigation/modal davranışı kalmaz.
- Android davranışı iOS polish uğruna bozulmaz.

### P4 - Critical Flow QA

Smoke sırası:

1. Onboarding
2. Auth
3. Consultant discovery
4. Booking checkout
5. Payment WebView
6. Call join/leave
7. Review submit

Exit criteria:

- Happy path çalışır.
- Loading/empty/error/offline/auth-expired durumları kontrol edilir.
- `bun run lint` geçer.

## 6) Out of Scope

- Native SwiftUI/Swift ekran yazımı
- XcodeGen veya App Printer proje scaffold'u
- Backend schema değişikliği
- Admin/frontend refactor
- App Store submit işlemi onaysız
- Production IAP vendor seçimini kodda gizlice yapmak

## 7) Backend Dependency Map

Kritik backend modülleri:

1. auth
2. profiles
3. consultants
4. availability
5. bookings
6. orders/payments
7. subscriptions/credits
8. LiveKit token
9. review
10. push token

Dev API base:

- `http://localhost:8094/api`

Prod API base:

- `https://goldmoodastro.com/api`

## 8) KPI and Success Metrics

Launch sonrası ilk 30 gün:

1. Activation rate >= 40%
2. Booking conversion >= 15%
3. Payment success >= 90%
4. Call join success >= 95%
5. Review submit rate >= 25%
6. Onboarding completion >= 65%
7. Subscription/credit CTA tap-through ölçülebilir hale gelir

## 9) QA Checklist

- iOS simulator smoke
- Android emulator smoke
- Real-device payment/call smoke
- Auth token refresh/logout edge cases
- Push notification deep link
- Accessibility labels for CTA/header/tab buttons
- Reduced text overflow check on small devices
- Dark mode theme consistency
- `bun run lint`

## 10) Risks and Mitigation

Risk: Payment callback uyumsuzluğu  
Mitigation: Success/failure URL patternlerini backend ile sabitlemek.

Risk: LiveKit token timing ve yetki sorunları  
Mitigation: Booking ownership + time-window kontrollerini backend tarafında zorunlu kılmak.

Risk: IAP vendor kararının gecikmesi  
Mitigation: `src/lib/iap.ts` interface'ini koru, RevenueCat ve `react-native-iap` için adapter planı yaz.

Risk: Premium UI çalışması scope creep'e dönüşür  
Mitigation: Önce ortak bileşenler, sonra onboarding, sonra paywall, sonra audit.

Risk: App Printer kurallarının yanlışlıkla SwiftUI olarak uygulanması  
Mitigation: Sadece HIG ve premium QA yaklaşımı alınır; kod React Native/Expo kalır.

## 11) Ownership

Bu doküman ürün ve kalite yönünü tanımlar. Kod seviyesinde yürütme için `AGENTS.md`, skill çalışmaları için `skills/expo-factory/SKILL.md` tek kaynak kabul edilir.
