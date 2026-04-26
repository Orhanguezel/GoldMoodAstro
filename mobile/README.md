# GoldMoodAstro Mobile

GoldMoodAstro mobil uygulamasi Expo (React Native) + TypeScript ile iOS ve Android icin gelistirilir.

## Temel Dokumanlar

- [MOBILE-STRATEGY.md](MOBILE-STRATEGY.md): Mobil strateji ozeti
- [AGENTS.md](AGENTS.md): Copilot/Codex uygulama kurallari ve gorev listesi
- [app/README.md](app/README.md): Uygulama klasoru gelistirici rehberi

## Mobil Hedef

Kullanici akisinin mobilde tam calismasi:

1. Onboarding
2. Login/Register
3. Danisman kesfetme
4. Slot secimi ve booking
5. Iyzipay odeme (WebView)
6. Agora ile sesli gorusme
7. Seans degerlendirme

## Teknoloji Kararlari

- Expo + React Native + TypeScript
- Expo Router (file-based routing)
- AsyncStorage tabanli local state/session
- API istemcisi: `mobile/app/src/lib/api.ts`
- i18n: TR + EN
- Push: expo-notifications
- Sesli gorusme: react-native-agora
- Odeme: react-native-webview (Iyzipay checkout)

Detaylar icin: [AGENTS.md](AGENTS.md)

## Dizin Yapisi

```text
mobile/
├── AGENTS.md
├── MOBILE-STRATEGY.md
├── README.md
├── app/                     # Expo projesi (gelistirme burada)
│   ├── app/
│   ├── src/
│   ├── package.json
│   ├── app.json
│   └── eas.json
├── ios/
├── android/
└── skills/
```

## Hızlı Baslangic

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

## API Ortamlari

- Dev API: http://localhost:8094/api/v1
- Prod API: https://www.goldmoodastro.com/api/v1

Not: Android emulator icin localhost yerine 10.0.2.2 kullanilir.

## Gelistirme Notlari

- Renk ve font degerleri dogrudan yazilmaz, tema tokenlari kullanilir
- Auth gerektiren ekranlarda token yoksa login ekranina yonlendirilir
- Tum stringler i18n uzerinden yonetilir (TR + EN birlikte)
- TypeScript strict kuraliyla any kullanimi engellenir

## Durum

Mobil proje GoldMoodAstro yol haritasina gore asamali ilerletilir.
Milestone detaylari ve dosya bazli TODO listesi icin [AGENTS.md](AGENTS.md) dosyasini referans alin.
