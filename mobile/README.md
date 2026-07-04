# GoldMoodAstro Mobile

GoldMoodAstro mobil uygulaması Expo + React Native + TypeScript ile iOS ve Android için geliştirilir.

Bu klasördeki ana standart: **GoldMoodAstro Expo Premium Mobile QA**. `app-printer-main` SwiftUI/Xcode projesi olarak kullanılmaz; oradaki premium uygulama üretim disiplini bu repoda React Native/Expo Router karşılıklarıyla uygulanır.

## Temel Dokümanlar

- [AGENTS.md](AGENTS.md): Codex/Cursor uygulama kuralları ve premium QA standardı
- [MOBILE-STRATEGY.md](MOBILE-STRATEGY.md): ürün stratejisi ve premiumlaştırma yol haritası
- [app/README.md](app/README.md): Expo uygulama klasörü geliştirici rehberi
- [skills/expo-factory/SKILL.md](skills/expo-factory/SKILL.md): GoldMoodAstro'ya uyarlanmış Expo premium skill

## Mobil Hedef

Kullanıcı akışının mobilde premium ve güvenilir çalışması:

1. 3 aşamalı premium onboarding
2. Login/Register + session persistence
3. Danışman keşfetme
4. Slot seçimi ve booking
5. Iyzipay ödeme WebView
6. LiveKit ile sesli görüşme
7. Seans değerlendirme

## Stack

- Expo SDK 54
- React Native 0.81
- React 19
- Expo Router 6
- TypeScript strict
- SecureStore auth token + AsyncStorage non-sensitive app state
- `src/lib/api.ts` API istemcisi
- i18next: TR + EN + DE
- `expo-notifications`
- LiveKit voice call
- `react-native-webview` ile Iyzipay checkout
- `expo-haptics`
- `expo-linear-gradient`
- `react-native-reanimated` / RN Animated
- `lucide-react-native`

## Premium UI Kuralları

- Renk/font/spacing/radius hardcoded yazılmaz; `useAppTheme()` ve tokenlar kullanılır.
- Yeni ekranlar `ScreenShell`, `PrimaryButton`, `PremiumCard`, `EmptyState`, `LoadingState` standardına göre yazılır.
- Düz kart, spinner-only loading, tek satır empty state ve generic tutorial görünümü kabul edilmez.
- CTA'larda press scale + haptic feedback gerekir.
- Liste ve kartlarda hafif giriş animasyonu veya stagger kullanılır.
- Kritik Pressable alanlarında accessibility label/role bulunur.

## Dizin Yapısı

```text
mobile/
├── AGENTS.md
├── MOBILE-STRATEGY.md
├── README.md
├── REQUESTS.md
├── app/                     # Expo projesi
│   ├── app/                 # Expo Router route dosyaları
│   ├── src/
│   ├── package.json
│   ├── app.json
│   └── eas.json
├── ios/
├── android/
└── skills/
    └── expo-factory/        # GoldMoodAstro Expo premium skill
```

## Hızlı Başlangıç

```bash
cd mobile/app
bun install
bun run start
```

iOS:

```bash
bun run ios
```

Android:

```bash
bun run android
```

## API Ortamları

- Dev API: `http://localhost:8094/api`
- Prod API: `https://goldmoodastro.com/api`

Android emulator için localhost yerine `10.0.2.2` gerekebilir.

## Öncelikli Parlatma Sırası

1. Ortak premium bileşenler: `PrimaryButton`, `PremiumCard`, `ScreenShell`, `EmptyState`, `LoadingState`
2. Onboarding'i 3 aşamalı premium akışa çevir
3. Paywall/subscription tarafını RevenueCat veya `react-native-iap` production planına taşı
4. iOS HIG'e göre tab bar, modal/sheet, accessibility, motion ve haptic audit yap
5. Kritik akışları test et: onboarding -> auth -> consultant -> booking -> payment -> call -> review

## Geliştirme Notları

- Mobile dışındaki backend/frontend/admin/shared dosyalara mobil işi kapsamında dokunma.
- Yeni backend ihtiyacı `REQUESTS.md` içine tarihli yazılır.
- `bun run lint` TypeScript doğrulaması için ana komuttur.
- Store submit ve EAS production işlemleri açık onayla yapılır.
