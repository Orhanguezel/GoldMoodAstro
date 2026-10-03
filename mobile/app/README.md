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
- SecureStore auth token + AsyncStorage non-sensitive app state
- expo-notifications
- LiveKit voice call
- react-native-webview
- i18next: TR + EN + DE
- expo-haptics
- expo-linear-gradient
- react-native-reanimated / RN Animated
- lucide-react-native

## Hızlı Başlangıç

Mobil uygulama repo workspace'idir; bağımlılıkların tek kilidi kökteki `bun.lock`.
Eski, başka proje adı taşıyan `mobile/app/bun.lock` 3 Ekim 2026'da kaldırıldı;
Git geçmişinden geri alınabilir.

```bash
cd ../..
bun install --frozen-lockfile --ignore-scripts --filter goldmoodastro-mobile
cd mobile/app
bun run start
```

İlk `cd ../..` bu README'nin bulunduğu `mobile/app` içinden repo köküne çıkar.
Güncel ortak çekirdek düzeltmeleri, açık cihaz kapıları ve taşıma kaydı:
[kök çeklist](../../MOBIL-ORTAK-ALTYAPI-CEKLISTI-2026-10-03.md).

iOS simulator:

```bash
bun run ios
```

Android emulator:

```bash
bun run android
```

Yerel Android debug APK için Java 21 JDK ve Android SDK gerekir. Expo native klasörü
Git'e alınmaz; `app.json` içindeki `./plugins/withLiveKit` her prebuild'de LiveKit
başlangıç çağrısını Android `MainApplication` ve iOS `AppDelegate` içine ekler.

```bash
bun x expo prebuild --platform android --no-install
cd android
./gradlew :app:assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb reverse tcp:8081 tcp:8081
cd ..
bun run start:localhost
```

Metro gerektirmeyen yerel Android önizleme APK'sı için üretim API adresini
derleme sırasında verin. `arm64-v8a` fiziksel Android cihaz içindir; bu Gradle
`release` yapılandırması yerel debug anahtarıyla imzalandığından mağazaya
gönderilmez.

```bash
cd android
EXPO_PUBLIC_API_URL=https://goldmoodastro.com/api \
EXPO_PUBLIC_SITE_URL=https://goldmoodastro.com \
EXPO_PUBLIC_PUBLIC_URL=https://goldmoodastro.com \
NODE_ENV=production ./gradlew :app:assembleRelease \
  -PreactNativeArchitectures=arm64-v8a --max-workers=2 --no-daemon
```

Çıktı: `android/app/build/outputs/apk/release/app-release.apk`.

Mağaza/iOS hazırlığını `bun run check:release` ile kontrol edin. iOS Firebase
`GoogleService-Info.plist` ve EAS App Store Connect kimlikleri güvenli yerel
ortamda sağlanana dek iOS release kapısı açıktır; iOS push teslimi ayrıca gerçek
cihazda doğrulanmalıdır.

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

- Dev: `http://localhost:8094/api`
- Prod: `https://goldmoodastro.com/api`

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
