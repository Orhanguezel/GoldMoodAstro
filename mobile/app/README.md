# GoldMoodAstro Mobile App

Bu klasör GoldMoodAstro Expo uygulamasıdır. Hedef platformlar iOS ve Android'dir.

## Referans Dokümanlar

- [../AGENTS.md](../AGENTS.md): mobil kodlama kuralları ve premium QA standardı
- [../MOBILE-STRATEGY.md](../MOBILE-STRATEGY.md): ürün stratejisi
- [../skills/expo-factory/SKILL.md](../skills/expo-factory/SKILL.md): Expo premium skill
- [../README.md](../README.md): mobile klasörü genel dokümanı

## Stack

- Expo SDK 54
- React Native 0.81
- React 19
- TypeScript strict
- Expo Router 6
- AsyncStorage + SecureStore
- expo-notifications
- LiveKit voice call
- react-native-webview
- i18next: TR + EN + DE
- expo-haptics
- expo-linear-gradient
- react-native-reanimated / RN Animated
- lucide-react-native

## Hızlı Başlangıç

```bash
cd mobile/app
bun install
bun run start
```

iOS simulator:

```bash
bun run ios
```

Android emulator:

```bash
bun run android
```

## Build

```bash
bun run build:android
bun run build:ios
```

## Uygulama Yapısı

```text
app/
  _layout.tsx
  index.tsx
  onboarding/
  auth/
  (tabs)/
    today.tsx
    birth-chart.tsx
    connect.tsx
    daily.tsx
    profile/
  consultant/
  booking/
  call/

src/
  components/
  hooks/
  lib/
    api.ts
    storage.ts
    i18n.ts
    notifications.ts
    iap.ts
  theme/
    tokens.ts
    appTheme.ts
    ThemeContext.tsx
  types/
```

## Premium Bileşen Standardı

Yeni veya yenilenen ekranlarda şu bileşenler öncelikli olmalıdır:

- `PrimaryButton`: press scale, haptic feedback, token renkleri
- `PremiumCard`: gradient/surface, radius, border, shadow
- `ScreenShell`: safe area, background, keyboard/scroll davranışı
- `EmptyState`: ikon + başlık + açıklama + CTA
- `LoadingState`: skeleton veya markalı yüklenme paneli

Mevcut bileşenler bu standarda taşınırken kapsam küçük tutulur. Aynı iş içinde alakasız refactor yapılmaz.

## API Ortamı

- Dev: `http://localhost:8094/api/v1`
- Prod: `https://www.goldmoodastro.com/api/v1`

Android emulator'de localhost yerine `10.0.2.2` gerekebilir. Token yönetimi `src/lib/api.ts` ve `src/lib/storage.ts` üzerinden yürür.

## Geliştirme Kuralları

- Hardcoded renk/font yerine `useAppTheme()` kullan.
- Kullanıcı metinlerini i18n'e ekle.
- Auth gereken ekranlarda token yoksa login'e yönlendir.
- `any` kullanma.
- Yeni API çağrılarını `src/lib/api.ts` içinde grupla.
- `lucide-react-native` dışında ikon paketi ekleme.
- `expo-haptics` ve motion davranışlarını kritik CTA'larda unutma.

## Premiumlaştırma Milestone'u

1. Foundation components
2. 3 aşamalı onboarding
3. Paywall/subscription production plan
4. HIG tab/modal/accessibility audit
5. Critical flow smoke: onboarding -> auth -> consultant -> booking -> payment -> call -> review
