# AGENTS.md — GoldMoodAstro Mobile

Expo (React Native) + TypeScript projesi. Kod kökü: `mobile/app/`.

Bu repo için ana hedef artık yalnızca "çalışan MVP" değil: **premium, iOS HIG'e yakın, güvenilir ve gelir üretmeye hazır mobil deneyim**. `app-printer-main` doğrudan kullanılmaz; oradaki App Printer yaklaşımı bu repoda **GoldMoodAstro Expo Premium Mobile QA standardı** olarak uygulanır.

---

## Teknoloji Kararları

- **Runtime:** Expo SDK 54, React Native 0.81
- **Routing:** Expo Router 6, file-based routing
- **Language:** TypeScript strict, `any` yasak
- **State:** React state + AsyncStorage; mevcut Zustand/React Query kullanımı varsa korunur
- **API:** `src/lib/api.ts`, auth token header ile
- **Storage:** `src/lib/storage.ts`
- **i18n:** `src/lib/i18n.ts`, TR + EN + DE
- **Tema:** `src/theme/tokens.ts`, `src/theme/appTheme.ts`, `ThemeProvider`
- **Motion:** `react-native-reanimated` veya RN `Animated`
- **Haptics:** `expo-haptics`
- **Visual depth:** `expo-linear-gradient`, token shadow/radius sistemi
- **Icons:** `lucide-react-native`; yeni ikon ihtiyacında önce bunu kullan
- **Push:** `expo-notifications` + Firebase FCM
- **Auth:** email/password + Apple Sign In
- **Ödeme:** Iyzipay WebView; abonelik/IAP production planı RevenueCat veya `react-native-iap`
- **Sesli görüşme:** LiveKit (`@livekit/react-native`)
- **Fontlar:** Cinzel, Fraunces, Manrope, JetBrains Mono

SwiftUI, XcodeGen, StoreKit 2 dosyaları, SF Symbol zorunluluğu ve native-only App Printer kuralları bu repo için geçerli değildir. Karşılığı Expo/React Native ile uygulanır.

## Premium Mobile QA Standardı

Her mobil iş şu kalite kapısından geçer:

1. **Tema tokenları:** Renk, font, radius, spacing, shadow hardcoded yazılmaz. `useAppTheme()` kullan.
2. **Reusable UI:** Yeni ekranlarda önce ortak bileşenleri kullan veya çıkar: `ScreenShell`, `PrimaryButton`, `PremiumCard`, `EmptyState`, `LoadingState`.
3. **Gradient/depth:** Ana kartlar düz blok gibi durmaz; `expo-linear-gradient`, border, shadow ve spacing ile premium derinlik taşır.
4. **Motion:** Ekran girişinde en az bir yumuşak fade/slide; liste öğelerinde stagger; butonda press scale.
5. **Haptics:** CTA, başarı, seçim ve uyarı aksiyonlarında `expo-haptics`.
6. **Icons:** `lucide-react-native` ikonları token renkleriyle kullanılır; emoji ikon yerine gerçek ikon tercih edilir.
7. **Accessibility:** Tüm kritik Pressable'larda `accessibilityRole`, `accessibilityLabel`; dokunma alanı en az 44x44.
8. **Empty/loading/error:** Tek satır "Veri yok" veya spinner-only ekran yok; ikon + başlık + açıklama + CTA veya retry gerekir.
9. **i18n:** Kullanıcıya görünen yeni metinler TR + EN + DE anahtarlarıyla eklenir.
10. **Critical path:** Onboarding -> auth -> consultant -> booking -> payment -> call -> review akışı bozulamaz.

HIG referansı: `../app-printer-main/skills/hig/` içindeki layout, typography, buttons, tab-bars, sheets, accessibility, motion ve haptics dokümanları tasarım kontrol listesi olarak okunabilir. Uygulama React Native kalır.

## Brand Tokens

Mevcut GoldMoodAstro paleti korunur:

```ts
colors.bg          // warm ink / cream theme background
colors.surface     // card surface
colors.surfaceHigh // elevated surface
colors.text        // primary text
colors.textDim     // secondary text
colors.textMuted   // muted text
colors.gold        // primary CTA / premium accent
colors.goldDeep
colors.goldLight
colors.plum
colors.ink
colors.cream
colors.line
colors.lineSoft
```

Backward-compatible eski adlar (`midnight`, `deep`, `stardust`, `amethyst`) mevcut olabilir; yeni kod semantik yeni adları kullanır.

## Dosya Yapısı

```text
mobile/app/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── onboarding/
│   ├── auth/
│   ├── (tabs)/
│   │   ├── today.tsx
│   │   ├── birth-chart.tsx
│   │   ├── connect.tsx
│   │   ├── daily.tsx
│   │   └── profile/
│   ├── consultant/
│   ├── booking/
│   ├── call/
│   └── feature routes...
├── src/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── theme/
│   └── types/
└── package.json
```

## Öncelikli Premiumlaştırma Sırası

### P0 — Premium Foundation

- `src/components/PrimaryButton.tsx`
- `src/components/PremiumCard.tsx`
- `src/components/ScreenShell.tsx`
- `src/components/EmptyState.tsx`
- `src/components/LoadingState.tsx`

Exit criteria:

- Yeni ve yenilenen ekranlar ortak bileşenleri kullanır.
- Button press scale + haptic standartlaşır.
- Loading/empty/error durumları marka dilinde görünür.

### P1 — Onboarding

Dosyalar:

- `app/onboarding/index.tsx`
- `app/onboarding/birthdata.tsx`
- `src/lib/storage.ts`
- `src/lib/i18n.ts`

Hedef:

- 3 aşamalı premium akış:
  1. Welcome: GoldMoodAstro marka sinyali, yıldız/astro atmosferi, tek net CTA
  2. Personalization: doğum bilgisi değer önerisi ve izin/hesap yönlendirmesi
  3. Trust/Conversion: danışmanlık, güven, premium hissi, devam/login/register
- `Animated` veya Reanimated ile fade/slide/orbit/twinkle gibi kontrollü motion.
- `expo-haptics` ile CTA ve step geçiş feedback'i.
- Entry routing `app/index.tsx` üzerinden onboarded kontrolünü korur.

### P2 — Paywall / Subscription Planı

Dosyalar:

- `src/components/PaywallSheet.tsx`
- `app/(tabs)/profile/subscription.tsx`
- `src/lib/iap.ts`
- `src/hooks/usePremium.ts`

Hedef:

- `src/lib/iap.ts` stub kalabilir ama production planı dokümante edilir.
- Seçim: RevenueCat veya `react-native-iap`.
- Backend doğrulama: `/api/v1/subscriptions/verify` veya mevcut abonelik endpointleriyle receipt/status doğrulama.
- iOS'ta harici ödeme yönlendirmesi gösterilmez.
- Android/Web tarafında Iyzipay akışı policy uyumuyla planlanır.

### P3 — Navigation / HIG Audit

Dosyalar:

- `app/_layout.tsx`
- `app/(tabs)/_layout.tsx`
- modal/sheet ekranları

Kontrol:

- Tab bar 5 ana işlevi aşmaz.
- Hidden route'lar tab içinde görünmez.
- Modal/sheet animasyonları platforma uygun.
- Back davranışı `safeRouterBack` ile kontrollü.
- Header butonları 44x44 erişilebilir alan sağlar.

### P4 — Critical Flow QA

Manuel ve otomasyon smoke sırası:

1. Onboarding
2. Login/Register
3. Consultant discovery
4. Slot selection + booking checkout
5. Iyzipay WebView payment
6. LiveKit call join/leave
7. Rating/review

Her akışta loading, empty, error, offline/timeout ve auth-expired durumları kontrol edilir.

## Backend API

- Dev: `http://localhost:8094/api/v1`
- Prod: `https://www.goldmoodastro.com/api/v1`
- `app.json` içinde `extra.apiUrl` şu anda local dev için `http://localhost:8094/api` olabilir; API client path normalizasyonunu bozma.
- Auth: `Authorization: Bearer <token>`
- Token belleğe `setAuthToken(token)` ile yüklenir, kalıcı storage `src/lib/storage.ts` üzerinden yürür.

Yeni endpoint gerekiyorsa `mobile/REQUESTS.md` dosyasına tarihli istek yazılır. Backend, admin, frontend ve shared paketlere mobil işi sırasında dokunulmaz.

## Kodlama Kuralları

- Mevcut mimariyi bozma; önce ilgili dosyaları oku.
- `project.portfolio.json` ve mobile dışı proje metadata dosyalarına dokunma.
- `node_modules`, `.expo`, native build çıktıları editlenmez.
- Yeni paket eklemeden önce gerçekten mevcut alternatifi kontrol et.
- `lucide-react-native`, `expo-linear-gradient`, `expo-haptics`, `react-native-reanimated`, mevcut theme provider önceliklidir.
- API çağrıları `src/lib/api.ts` dışına dağılmaz.
- Auth guard'lar token yoksa login'e yönlendirir.
- Kullanıcı metinleri i18n'e eklenir.

## Test ve Doğrulama

Her anlamlı değişiklikten sonra:

```bash
cd mobile/app
bun run lint
```

UI veya route değişikliklerinde mümkünse:

```bash
bun run start
```

Release öncesi:

```bash
bun run build:android
bun run build:ios
```

EAS submit sadece açık onayla yapılır.
