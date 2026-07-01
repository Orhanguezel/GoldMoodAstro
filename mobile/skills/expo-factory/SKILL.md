---
name: goldmoodastro-expo-premium
user-invocable: true
description: "GoldMoodAstro mobile için Expo/React Native premium implementation ve QA skill'i. SwiftUI App Printer kurallarını React Native/Expo Router karşılıklarına çevirir; onboarding, shared premium components, paywall/IAP planı, HIG audit ve critical flow smoke için kullanılır."
---

# GoldMoodAstro Expo Premium Mobile Skill

Bu skill aktif olduğunda `goldmoodastro/mobile/app` içinde çalışan senior Expo/React Native geliştiricisi gibi davranırsın. Amaç sıfırdan SwiftUI app üretmek değildir. Amaç mevcut GoldMoodAstro mobil uygulamasını **premium, güvenilir, HIG'e yakın ve production-ready** hale getirmektir.

Kaynak ilham: `app-printer-main`. Uygulama karşılığı: React Native + Expo Router + TypeScript.

## Kapsam

Kullan:

- Premium onboarding
- Shared UI component foundation
- Paywall/subscription UX ve IAP planı
- Tab/modal/sheet/accessibility/motion/haptic audit
- Critical flow smoke
- Yeni mobil feature ekranlarını premium standarda taşırken

Kullanma:

- Backend mimarisi tasarlamak
- SwiftUI/XcodeGen/StoreKit 2 dosyası üretmek
- Native iOS/Android ayrı app yazmak
- Web/admin/frontend refactor yapmak

## Stack Sabitleri

- Expo SDK 54
- React Native 0.81
- React 19
- Expo Router 6
- TypeScript strict
- Theme: `src/theme/tokens.ts`, `src/theme/appTheme.ts`, `ThemeProvider`
- Icons: `lucide-react-native`
- Haptics: `expo-haptics`
- Gradients: `expo-linear-gradient`
- Motion: `react-native-reanimated` veya RN `Animated`
- Voice: LiveKit
- Payment: Iyzipay WebView
- IAP plan: RevenueCat veya `react-native-iap`

## App Printer -> Expo Karşılıkları

| App Printer / SwiftUI | GoldMoodAstro / Expo |
|---|---|
| `Theme.swift` | `src/theme/tokens.ts` + `useAppTheme()` |
| SF Symbols | `lucide-react-native` |
| StoreKit 2 `StoreManager` | `src/lib/iap.ts` adapter + backend subscription verification |
| SwiftUI `ButtonStyle` | `PrimaryButton` component |
| SwiftUI cards/materials | `PremiumCard` + `expo-linear-gradient` + token shadow |
| `.symbolEffect`, `.transition` | Reanimated/RN `Animated` |
| `.sensoryFeedback` | `expo-haptics` |
| XcodeGen pipeline | Expo Router route/file manifest |
| XCTest | `bun run lint` + planned RN tests + smoke flow |

## Mandatory Premium Foundation

Önce ortak bileşenleri kur veya mevcutları bu standarda yaklaştır:

1. `src/components/PrimaryButton.tsx`
2. `src/components/PremiumCard.tsx`
3. `src/components/ScreenShell.tsx`
4. `src/components/EmptyState.tsx`
5. `src/components/LoadingState.tsx`

### PrimaryButton Standardı

- `Pressable` veya Animated wrapper
- `expo-haptics` impact on press
- pressed state scale `0.97` civarı
- token background / text / radius
- `accessibilityRole="button"`
- `accessibilityLabel` prop desteği
- loading/disabled state

### PremiumCard Standardı

- `colors.surface` veya `LinearGradient`
- `radius.lg` veya `radius.xl`
- `colors.line` / `lineSoft` border
- `shadows.card`
- optional icon/header/action slot

### ScreenShell Standardı

- Safe area
- themed background
- keyboard-aware ihtiyaç varsa destek
- scroll veya fixed layout seçimi
- consistent horizontal padding

### EmptyState Standardı

- large `lucide-react-native` icon
- title + body + optional CTA
- tek satır "Veri yok" yasak

### LoadingState Standardı

- brand color spinner, skeleton veya premium loading panel
- full-screen blank spinner-only ekranlardan kaçın

## Premium Onboarding Brief

Dosyalar:

- `app/onboarding/index.tsx`
- `app/onboarding/birthdata.tsx`
- `src/lib/storage.ts`
- `src/lib/i18n.ts`

3 aşamalı akış:

1. **Welcome:** GoldMoodAstro marka sinyali, astro atmosferi, tek güçlü CTA.
2. **Personalization:** doğum bilgisi, günlük yorum, doğum haritası ve kişisel deneyim değeri.
3. **Trust + Conversion:** gerçek danışmanlar, güvenli ödeme, sesli seans, register/login handoff.

UI rules:

- Full-bleed themed background
- `expo-linear-gradient` ile gold/ink/cream/plum tonları
- controlled star/orbit motion, abartısız
- haptic on primary CTA and step changes
- custom progress indicator
- i18n TR + EN + DE
- no default white tutorial screens

## Paywall / Subscription Plan

Dosyalar:

- `src/components/PaywallSheet.tsx`
- `app/(tabs)/profile/subscription.tsx`
- `src/lib/iap.ts`
- `src/hooks/usePremium.ts`

Yapılacak:

- `src/lib/iap.ts` mevcut interface'i korur.
- Production vendor seçimi açıkça planlanır:
  - **RevenueCat:** daha hızlı entitlement + receipt validation
  - **react-native-iap:** daha ucuz/özelleştirilebilir, backend validation gerekir
- Restore purchase UX zorunludur.
- iOS'ta Iyzipay/web yönlendirme gösterilmez.
- Android/Web Iyzipay alternatifi policy uyumuyla tasarlanır.
- Backend tek gerçek kaynak: `/auth/me` subscription özeti veya subscription endpointleri.

Paywall UI:

- plan cards
- yearly "en avantajlı" badge
- feature list
- primary CTA
- restore action
- legal links
- loading/error state

## HIG-Inspired QA Checklist

Referans olarak `app-printer-main/skills/hig/` okunabilir. Uygulama React Native kalır.

Kontrol başlıkları:

- Layout: safe area, bottom tab safe padding, readable spacing
- Typography: hero-scale type sadece hero/onboarding; compact alanlarda küçük başlıklar
- Buttons: primary/secondary/icon button ayrımı
- Tab bar: en fazla 5 görünür ana hedef
- Modality: booking/payment/call gibi kritik akışlarda doğru fullScreenModal/modal
- Haptics: CTA, success, selection, warning
- Accessibility: 44x44 tap target, labels, roles, contrast
- Motion: anlamlı, kısa, reduced-motion hassasiyetini zorlamayan
- Empty/loading/error: eylem odaklı

## Implementation Pipeline

Her görevde:

1. İlgili plan/dokümanı oku: `AGENTS.md`, `MOBILE-STRATEGY.md`, varsa feature dosyası.
2. Mevcut dosyayı oku, pattern'i öğren.
3. Küçük manifest çıkar:
   - files touched
   - component dependencies
   - i18n keys
   - API/storage needs
4. Kod değiştir.
5. `bun run lint` çalıştır.
6. Critical flow etkileniyorsa smoke listesi yaz.

## Default Work Order

Kullanıcı "mobile premium QA skill gibi kullanalım" veya "mobil projeyi mükemmel hale getir" dediğinde şu sırayı öner ve uygula:

1. Shared premium components
2. Onboarding premium rewrite
3. Paywall/subscription production plan
4. HIG navigation/modal/accessibility/motion/haptic audit
5. Critical flow smoke: onboarding -> auth -> consultant -> booking -> payment -> call -> review

## File Manifest Örneği

Foundation için:

```text
src/components/PrimaryButton.tsx
src/components/PremiumCard.tsx
src/components/ScreenShell.tsx
src/components/EmptyState.tsx
src/components/LoadingState.tsx
src/theme/index.ts
src/lib/i18n.ts
```

Onboarding için:

```text
app/onboarding/index.tsx
app/onboarding/birthdata.tsx
app/index.tsx
src/lib/storage.ts
src/lib/i18n.ts
```

Paywall için:

```text
src/lib/iap.ts
src/hooks/usePremium.ts
src/components/PaywallSheet.tsx
app/(tabs)/profile/subscription.tsx
mobile/REQUESTS.md
```

## Verification

Minimum:

```bash
cd mobile/app
bun run lint
```

Görsel/route işi:

```bash
cd mobile/app
bun run start
```

Build/release işi:

```bash
cd mobile/app
bun run build:android
bun run build:ios
```

Store submit açık onay olmadan yapılmaz.

## Communication

Kısa, net, Türkçe ilerle. Kullanıcıyı sıkmadan hangi dosyayı neden değiştirdiğini söyle. Kod dışı repo değişikliklerine ve mobile dışı worktree değişikliklerine dokunma.
