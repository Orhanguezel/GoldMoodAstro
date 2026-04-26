# EAS Build Rehberi — GoldMoodAstro Mobile

Expo (React Native) uygulamasını iOS + Android için üretim build'lerine çıkarma.

## Mevcut Durum

| Konfigürasyon | Değer | Durum |
|---------------|-------|-------|
| Bundle ID (iOS) | `com.goldmoodastro.app` | ✅ |
| Package (Android) | `com.goldmoodastro.app` | ✅ |
| Permissions | mic, kamera, push notifications | ✅ |
| Plugins | expo-router, expo-localization, expo-notifications, expo-secure-store | ✅ |
| EAS profilleri | development / preview / production | ✅ |
| `EXPO_PUBLIC_API_URL` | env-driven (eas.json'da production: `https://goldmoodastro.com/api/v1`) | ✅ |
| `extra.eas.projectId` | **boş** | ⏳ ilk `eas init` ile dolar |
| `updates.url` | **boş** | ⏳ OTA istemiyorsan boş bırak |
| Apple Developer Account | gerekli (iOS submit için) | ⏳ |
| Google Play Console | gerekli (Android submit için) | ⏳ |
| Firebase iOS plist + Android google-services.json | FCM için | ⏳ |
| APNs sertifikası | iOS push için | ⏳ |

## 1. Lokal Hazırlık (bir kerelik)

```bash
# EAS CLI
npm install -g eas-cli

# Expo hesabı (yoksa expo.dev'de oluştur)
eas login

# Mobile dizinine geç
cd mobile/app

# Lokal env (dev için)
cp .env.example .env
# .env içindeki EXPO_PUBLIC_API_URL'i kendi cihaz/simülatör IP'nize göre düzenleyin

# Bağımlılıkları kur
bun install
```

## 2. Expo Projesini Bağla (bir kerelik)

```bash
cd mobile/app
eas init
```

Bu komut Expo cloud'da yeni bir proje açar, `app.json` içindeki `extra.eas.projectId` alanını doldurur. Ardından bu değişikliği commit'leyin.

## 3. Lokal Geliştirme

Simulator/emulator'da hızlı test:
```bash
cd mobile/app
bun run start          # Expo Dev Tools — QR kodu, simulator, web preview
bun run ios            # Direkt iOS simulator
bun run android        # Direkt Android emulator
```

Gerçek cihazda (Expo Go) test:
1. `EXPO_PUBLIC_API_URL`'e bilgisayarınızın LAN IP'sini yazın (`http://192.168.x.x:8094/api/v1`)
2. `backend/.env` `CORS_ORIGIN`'e aynı IP'yi ekleyin
3. `bun run start` → telefonda Expo Go ile QR'ı tarayın

## 4. İlk Build — Preview (test için)

Preview profili: internal distribution, debug değil ama signed (TestFlight / APK install ile dağıtılabilir).

```bash
cd mobile/app
bun run build:android       # → APK (Android için en kolay test)
bun run build:ios           # → IPA (iOS için Apple Dev Account gerekli)
```

İlk Android build'de EAS sizden:
- Keystore üretimini ister → "Generate new keystore" seçin (EAS yönetir)

İlk iOS build'de EAS sizden:
- Apple ID + App Store Connect erişimi
- Provisioning profile + distribution certificate (otomatik üretebilir)

Build EAS Cloud'da ~10-20 dk sürer. Bittikten sonra link gelir, APK/IPA indirilebilir.

## 5. Production Build + Submit

```bash
cd mobile/app
eas build --platform android --profile production
eas build --platform ios --profile production

# Submit (App Store / Play Store)
bun run submit:android
bun run submit:ios
```

## 6. Push Notifications (FCM) Setup

Firebase Console'da yeni proje oluştur, sonra:

### Android
1. Android app ekle (package: `com.goldmoodastro.app`)
2. `google-services.json` indir → `mobile/app/google-services.json` (gitignore'lı bırak)
3. `app.json` `android.googleServicesFile` ekle:
   ```json
   "android": {
     "package": "com.goldmoodastro.app",
     "googleServicesFile": "./google-services.json"
   }
   ```

### iOS
1. iOS app ekle (bundle: `com.goldmoodastro.app`)
2. `GoogleService-Info.plist` indir → `mobile/app/GoogleService-Info.plist` (gitignore'lı)
3. `app.json` `ios.googleServicesFile` ekle
4. APNs key veya sertifika oluştur (Apple Developer → Certificates), Firebase'e yükle

### Backend
`.secrets/credentials.env` içinde `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` doldur (Firebase Service Account JSON'dan), sonra:
```bash
./deploy/sync-env.sh
```

## 7. Agora SDK (sesli görüşme)

`react-native-agora` zaten `package.json`'da. Çalışması için:
1. Agora.io'da hesap aç, projende `App ID` + `App Certificate` al
2. `.secrets/credentials.env`: `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE` doldur
3. `./deploy/sync-env.sh` ile VPS'e gönder
4. Backend `/api/v1/agora/token` endpoint'i kanal token üretir, mobile bunu kullanıp kanaldan bağlanır

## Sık Karşılaşılan Sorunlar

- **`Project not configured`** — `eas init` yapılmamış. Çözüm: `cd mobile/app && eas init`.
- **Build başarılı ama uygulama açılınca crash** — `EXPO_PUBLIC_API_URL` yanlış (eas.json profile'larını kontrol edin).
- **iOS build "Code signing required"** — Apple Developer Account üzerinden EAS otomatik sertifika üretebilir; ilk build'de "Generate new" seçin.
- **Push test çalışmıyor** — google-services.json + GoogleService-Info.plist gerekli. APNs ek olarak iOS için zorunlu.

## İlgili Dosyalar

- `mobile/app/app.json` — Expo config (bundle ID, plugins, permissions)
- `mobile/app/eas.json` — Build profilleri + env
- `mobile/app/.env.example` — Lokal dev env şablonu (`.env` git'e gitmez)
- `mobile/MOBILE-STRATEGY.md` — Faz planı
- `mobile/AGENTS.md` — Codex'in mobile görev listesi
