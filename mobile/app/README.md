# GoldMoodAstro Mobile App (Expo)

Bu klasor, GoldMoodAstro mobil uygulamasinin Expo projesidir.
Hedef platformlar iOS ve Android'dir.

## Referans Dokumanlar

- [../AGENTS.md](../AGENTS.md): Mobil kodlama kurallari ve milestone gorevleri
- [../MOBILE-STRATEGY.md](../MOBILE-STRATEGY.md): Mobil strateji ozeti
- [../README.md](../README.md): Mobile klasoru genel dokumani

## Stack

- Expo ~52
- React Native 0.76
- TypeScript strict
- Expo Router (file-based routing)
- AsyncStorage
- expo-notifications
- react-native-agora
- react-native-webview
- i18next (TR + EN)

## Hızlı Baslangic

```bash
cd mobile/app
bun install
bun run start
```

iOS simulator (macOS):

```bash
bun run ios
```

Android emulator:

```bash
bun run android
```

## Build (EAS)

```bash
bun run build:android
bun run build:ios
```

## Uygulama Yapisi

```text
app/
  _layout.tsx
  index.tsx
  (tabs)/
  onboarding/
  auth/
  consultant/
  booking/
  call/

src/
  lib/
    api.ts
    storage.ts
    i18n.ts
    notifications.ts
  components/
  hooks/
  theme/
    tokens.ts
  types/
    index.ts
```

## API Ortami

- Dev: http://localhost:8094/api/v1
- Prod: https://www.goldmoodastro.com/api/v1

Not: Android emulator'de localhost yerine 10.0.2.2 kullanilir.

## Gelistirme Kurallari

- Hardcoded renk/font yerine tema tokenlarini kullan
- Auth gerektiren ekranlarda token yoksa login'e yonlendir
- Tum metinleri i18n anahtari ile yonet (TR + EN birlikte)
- TypeScript strict modda any kullanmaktan kac
- API token yonetimini `src/lib/api.ts` ve `src/lib/storage.ts` uzerinden yurut

## Milestone Akisi

Kodlama sirasi [../AGENTS.md](../AGENTS.md) dosyasindaki milestone'lara gore ilerler:

1. M0: Onboarding + app entry + notifications
2. M1: Auth akisi
3. M2: Danisman kesfetme + booking listesi + favoriler
4. M3: Checkout + Iyzipay WebView
5. M4: Agora call + degerlendirme
6. M5: Ayarlar + profil
