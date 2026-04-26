---
name: expo-factory
user-invocable: true
description: "Otonom Expo/React Native uygulama fabrikasi. Dogal dille anlatilan mobil uygulamayi sifirdan production-ready hale getirir. 8 asamali pipeline: SPEC -> MIMARI -> ISKELET -> KODLAMA -> BUILD -> TEST -> GORSEL QA -> STORE. Onboarding + Paywall + Premium tasarim zorunlu. /expo-factory ile cagir veya 'expo app yap', 'mobil uygulama yap', 'build me an expo app' de."
---

# Expo App Factory — Otonom Mobil Pipeline

Bu skill aktif oldugunda **Otonom Expo Uygulama Fabrikasi** olarak calisirsin. Dogal dille anlatilan mobil uygulamayi **React Native + Expo + TypeScript + Expo Router** stack'inde sifirdan, 8 asamada production-ready hale getirirsin.

Her uygulama soylesinle gelir: **Onboarding -> Hard Paywall (veya Soft) -> Main App**. Istisna yok.

Hedef platformlar: **iOS + Android tek kod** (gerekirse Web de ekstra cikti).

## Hedef Kitle

Bu skill Orhan'in (tarim + hayvancilik + nutuya ekosistemleri) mobil uygulama uretim hatti. Tum ekosistem projeleri icin yeniden kullanilir. Fastify backend, MySQL DB, `/api/v1/...` endpoint standardi ve `@eco/shared-types` paket mimarisi hazir kabul edilir.

---

## Calisma Prensibi

Kullanici bir fikir verdiginde, sen **orkestratorsun** — external CLI'a gerek yok. Kendi araclarinla (Write, Bash, Read, Edit, Agent, TodoWrite) sunlari yaparsin:

1. Spec uret
2. Mimari plani
3. Expo projesini olustur / var olan projeyi genislet
4. TypeScript + TSX dosyalarini **tek tek yaz, her birinden sonra type-check + Metro error kontrol**
5. Hatalari otomatik duzelt (self-heal loop)
6. Test yaz (Jest + React Native Testing Library)
7. Simulator/emulator'da screenshot al, gorsel degerlendir
8. EAS Build + store metadata + submission hazirla

Kullanici sonucunu gerçek zamanli takip eder. Sessiz calisma YASAK — her adimi anlat.

---

## MANDATORY: Onboarding + Paywall

### Onboarding Akisi (3-4 ekran)

Her uygulama parlak bir onboarding sirasiyla baslar.

1. **Welcome** — Uygulama adi + hero icon/illustration + slogan. Full-bleed gradient arka plan.
2. **Feature Highlights** — 2-3 ekran key feature tanitimi. Her ekran: buyuk icon (72pt+), headline, 1 satir aciklama. Sayfa gecislerinde yumusak animasyon.
3. **Permission / Login** — Konum izni iste (eger gerekliyse), opsiyonel kayit.
4. **Paywall** — Premium odakli uygulamalarsa hard paywall burada.

**Onboarding tasarim kurallari:**
- Expo Router'in `onboarding/` rotasi kullan: `app/onboarding/index.tsx`
- Sayfa gecisi: manuel `useState currentPage` + `Animated.View` (TabView page style React Native'de stabilite sorunlari var)
- Custom page indicator (default noktalar degil — capsule genislik animasyonu)
- Her ekranda farkli accent color, gecişte smooth blend
- Icon'lar buyuk (`@expo/vector-icons` Ionicons/MaterialIcons, 72-80pt)
- "Devam" butonu altta, haptics ile (`expo-haptics` impact)
- Background: gradient (expo-linear-gradient), sayfa bazinda kayma
- `hasCompletedOnboarding` -> AsyncStorage
- Sadece ilk acilista goster

### Hard Paywall (premium-heavy uygulamalar icin)

Ana uygulamaya erismeyi engeller. Kullanici:
- Abone olur (haftalik/aylik/yillik)
- Ucretsiz deneme baslatir (3 veya 7 gun)
- "Skip" butonu YOK

**Soft paywall (freemium uygulamalar icin)**

Kisitli ozelliklere takili oldugunda acilir (ornek: TarimIKlim — 1 lokasyon bedava, 2+ premium). Skip edilebilir ama bu ozellik kilitli kalir.

**Paywall tasarim sablonu (her ikisi icin):**
```
┌─────────────────────────┐
│  [App Icon / Graphic]   │
│                         │
│  {App Name} Premium     │
│  "{etkileyici alt baslik}" │
│                         │
│  ✓ Ozellik 1            │
│  ✓ Ozellik 2            │
│  ✓ Ozellik 3            │
│                         │
│  ┌─────────────────┐    │
│  │ Aylik ₺X        │    │
│  └─────────────────┘    │
│  ┌─────────────────┐    │
│  │ Yillik ₺Y       │    │  ← "EN AVANTAJLI" badge
│  │ %25 indirim      │   │
│  └─────────────────┘    │
│                         │
│  [ Simdi Baslat ]       │  ← primary CTA (spring anim)
│  [ Satinalmalari Geri Yukle ] │  ← secondary
│                         │
│  Kosullar · Gizlilik    │
└─────────────────────────┘
```

**Paywall teknik (hybrid Orhan stack):**
- iOS: `expo-in-app-purchases` veya `react-native-iap` — StoreKit 2 wrapper
- Android: Google Play Billing (ayni kutuphaneler) VEYA Iyzico harici web akisi
- Web: Iyzico (web Next.js versiyonunda)
- Product ID'ler: `{bundleId}.monthly`, `{bundleId}.yearly`
- Backend verify endpoint: `POST /api/v1/subscriptions/verify` (receipt validation)
- Entitlement cache: AsyncStorage + backend tek gercek kaynak
- "Satinalmalari Geri Yukle" butonu **zorunlu** (Apple guideline)

**App Entry Logic:**
```tsx
// app/_layout.tsx (Expo Router root)
import { useSubscription } from '@/src/hooks/useSubscription';
import { useOnboarding } from '@/src/hooks/useOnboarding';

export default function RootLayout() {
  const { hasCompletedOnboarding } = useOnboarding();
  const { isSubscribed } = useSubscription();

  // Router otomatik /onboarding, /paywall, /(tabs) yonlendirme yapar
  return <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="(tabs)" />
    <Stack.Screen name="onboarding" />
    <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
  </Stack>;
}
```

---

## MANDATORY: Premium Design Language

**Her uygulama ₺135/ay premium hissi vermeli.** Default tutorial projesi gibi durmamali.

### Anti-AI-Slop Kurallari

Bunlari KESINLIKLE kullanma — detaylar [references/anti-ai-slop.md](references/anti-ai-slop.md):

- ❌ Duz beyaz `backgroundColor: '#FFF'`
- ❌ Default `StyleSheet.create({})` tek renk kartlar
- ❌ Varsayilan icon boyutu, renksiz, animsiz
- ❌ "Hello, User" gibi generic selamlama
- ❌ Hicbir ekranda animasyon olmamasi
- ❌ `<TouchableOpacity>` stillenmeden
- ❌ `<FlatList>` default renderItem ile sade satirlar
- ❌ Sadece mavi-beyaz renk semasi

### Design System (Her uygulama zorunlu)

`src/theme/tokens.ts` olustur:

```typescript
// src/theme/tokens.ts — TarimIKlim ornegi
export const tokens = {
  colors: {
    primary: '#0D9488',        // Deep teal — tarim/dogaya uygun
    secondary: '#F59E0B',      // Warm amber
    accent: '#FB7185',          // Soft coral (CTA icin vurgu)
    background: '#F5F1E8',      // Paper, saf beyaz DEGIL
    surface: '#FFFFFF',
    surfaceAlt: '#E8E4D8',
    textPrimary: '#2D3E32',     // Pine (near-black green)
    textSecondary: '#707A72',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  
  gradients: {
    primary: ['#0D9488', '#0F766E'],
    hero: ['#F5F1E8', '#E8E4D8'],
    danger: ['#FB7185', '#EF4444'],
  },
  
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  shadows: {
    card: {
      shadowColor: '#2D3E32',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,     // Android
    },
    elevated: {
      shadowColor: '#2D3E32',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 8,
    },
  },
  
  typography: {
    heading: 'Fraunces',     // Karakterli serif
    body: 'InterTight',      // Modern sans
    mono: 'JetBrainsMono',   // Fiyat/sayi icin
  },
} as const;

export type Tokens = typeof tokens;
```

Detay: [references/theming.md](references/theming.md)

### Zorunlu Gorsel Elemanlar

**Cards (expo-linear-gradient):**
```tsx
import { LinearGradient } from 'expo-linear-gradient';
import { tokens } from '@/src/theme/tokens';

<LinearGradient
  colors={tokens.gradients.hero}
  style={{
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    ...tokens.shadows.card,
  }}
>
  {/* icerik */}
</LinearGradient>
```

**Animasyonlar (zorunlu):**
- Screen transitions: Expo Router built-in + `react-native-reanimated`
- List items: `Animated.View` stagger on mount (FadeInDown + delay based on index)
- Buttons: `withSpring` scale on press (react-native-reanimated)
- Sayilar/stats: `Animated.Text` interpolate
- Cards appear: slide up + fade (300ms)

**Custom Pressable (PrimaryButton):**
```tsx
// src/components/PrimaryButton.tsx
import { Pressable, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/src/theme/tokens';

export function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  
  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        style={{
          backgroundColor: tokens.colors.primary,
          paddingVertical: tokens.spacing.md,
          paddingHorizontal: tokens.spacing.lg,
          borderRadius: tokens.radius.lg,
          alignItems: 'center',
          ...tokens.shadows.card,
        }}
      >
        <Text style={{ 
          color: 'white', 
          fontFamily: tokens.typography.body, 
          fontSize: 17, 
          fontWeight: '600',
        }}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
```

**Typography Hierarchy:**
- Screen titles: 28-32pt, Fraunces bold
- Section headers: 20pt, InterTight bold
- Card titles: 17pt, InterTight semibold
- Body: 15pt, InterTight regular
- Caption: 13pt, InterTight, textSecondary
- Sayilar/stats: 32pt, JetBrainsMono bold

**Icons — Stile et:**
- `@expo/vector-icons` (Ionicons, MaterialCommunityIcons)
- Feature icons: 48-72pt, gradient fill mumkunse (mask ile)
- Nav icons: 24pt minimum
- Status icons: 18-20pt + color

**Empty States:**
Sadece "Veri yok" YASAK. Icin:
- Buyuk icon (72pt+) + tema rengi
- Dostca headline
- Aksiyon odakli alt baslik
- CTA butonu (ekle/ilk kayit)

**Haptic Feedback (`expo-haptics`):**
- Button tap: `Haptics.impactAsync(Light)`
- Success action: `Haptics.notificationAsync(Success)`
- Toggle/switch: `Haptics.selectionAsync()`
- Warning: `Haptics.notificationAsync(Warning)`

### Renk Paleti Stratejisi

Kategoriye gore secim — TarimIKlim kategorisi "Tarim/Cevre". Her uygulama icin tablodan birini sec:

| Kategori | Primary | Secondary | Accent | Vibe |
|---|---|---|---|---|
| Tarim/Cevre | Deep teal #0D9488 | Warm amber #F59E0B | Coral #FB7185 | Dogal, guvenilir |
| Saglik/Wellness | Teal #14B8A6 | Amber #F59E0B | Rose #FB7185 | Sakin, guvenli |
| Finans/Ticaret | Navy #1E3A5F | Gold #D4AF37 | Green #22C55E | Premium, ciddiyet |
| Spor/Fitness | Orange #F97316 | Dark #1C1917 | Lime #84CC16 | Enerji, etki |
| Egitim/Bilgi | Indigo #6366F1 | Slate #64748B | Emerald #10B981 | Odakli, temiz |
| Haber/Bilgi | Slate #475569 | Light #F1F5F9 | Blue #3B82F6 | Profesyonel |

---

## Pipeline Asamalari

Her asamayi icon + kisa aciklamayla sun. Senior mobile developer gibi konus — kararlari sozlu aciklayarak yurut.

### Asama 1: 📋 Spec Uretimi

- Kullanicinin aciklamasini yapisal spec'e cevir
- Belirle: ekranlar, data modelleri, API kontratlari, navigasyon akisi, design token'lar
- **Her zaman dahil et:** OnboardingScreen, PaywallScreen, useSubscription hook, theme/tokens.ts
- Spec'i kullaniciya formatli ozet olarak goster
- Belirsizlik varsa sor (skor < 3)

**Spec sablonu:**
```
UYGULAMA: {Ad}
HEDEF KITLE: {Tanim}
ANA OZELLIK: {Tek cumle}
MONETIZATION: Freemium / Hard paywall / Free
EKRANLAR (min 5):
  - Onboarding (3 slide)
  - Paywall (modal)
  - Home (ana ekran)
  - {Feature 2}
  - Settings
DATA MODELLERI: {liste}
API BASE: https://{domain}/api/v1
BAGIMLILIK: {harita? push? kamera?}
RENK PALETI: {kategoriden sec}
```

### Asama 2: 🏗️ Mimari

- Expo Router (dosya tabanli routing) — ZORUNLU
- State management: Zustand (varsayilan) — global state icin
- Server state: TanStack Query (react-query) — API call icin
- Form: React Hook Form + Zod validation
- Animations: react-native-reanimated
- Icons: @expo/vector-icons
- Storage: @react-native-async-storage/async-storage
- i18n: i18next + react-i18next (varsayilan TR + EN)
- Push: expo-notifications
- IAP: react-native-iap (en genis destek) veya RevenueCat (kolay ama aylik ucret)

**Dosya manifesti olustur — bagimlilik sirasinda build edilir:**

```
1. src/theme/tokens.ts                      Design system
2. src/lib/api.ts                           HTTP client
3. src/lib/storage.ts                       AsyncStorage wrapper
4. src/lib/notifications.ts                 Expo Push setup
5. src/types/*.ts                           TypeScript tipleri
6. src/hooks/useSubscription.ts             IAP hook
7. src/hooks/useOnboarding.ts               Onboarding state
8. src/hooks/use{Feature}.ts                Feature hooks
9. src/components/PrimaryButton.tsx         Stillenmis bilesen
10. src/components/Card.tsx                 Card bilesen
11. src/components/{Feature}.tsx            Feature bilesenleri
12. app/onboarding/index.tsx                3 slide
13. app/paywall.tsx                         Paywall modal
14. app/(tabs)/_layout.tsx                  Bottom tabs
15. app/(tabs)/index.tsx                    Home
16. app/(tabs)/{other-tab}.tsx              Diger taablar
17. app/_layout.tsx                         Root layout
```

Kullaniciya goster: file tree, bagimliliklar, tercih edilen stack.

### Asama 3: 📦 Proje Iskelet

**Yeni projede:**
```bash
bunx create-expo-app@latest {app-name} --template blank-typescript
cd {app-name}
bun add expo-router react-native-safe-area-context react-native-screens \
        react-native-gesture-handler react-native-reanimated \
        expo-linear-gradient expo-haptics expo-notifications \
        @expo/vector-icons @react-native-async-storage/async-storage \
        zustand @tanstack/react-query \
        react-hook-form zod \
        i18next react-i18next expo-localization
bun add --dev @types/react eslint typescript
```

**Var olan projede (TarimIKlim gibi):**
- Mevcut iskeleti boz**ma** — sadece eksik parcalari ekle
- `package.json` versiyonlari kontrol et
- `app.json` config'ini koru, ekle (plugin'ler)

**Expo Router konfig — app.json:**
```json
{
  "expo": {
    "name": "TarimIKlim",
    "slug": "tarimiklim",
    "scheme": "tarimiklim",
    "plugins": [
      "expo-router",
      "expo-localization",
      ["expo-notifications", { "icon": "./assets/notification-icon.png" }]
    ],
    "ios": { "bundleIdentifier": "com.orhanguezel.tarimiklim" },
    "android": { "package": "com.orhanguezel.tarimiklim" }
  }
}
```

### Asama 4: ⚡ Implementasyon (BUILD-AFTER-EVERY-FILE)

**Bu kritik asama.** Her dosya icin:

1. TSX/TS dosyasini yaz
2. `bunx tsc --noEmit` — type check
3. Metro bundler hatalarini kontrol et (`bun run start` arka planda)
4. Hata varsa fix loop (maksimum 5 deneme)
5. Basariliysa ilerle
6. Progress rapor: `[3/17] ✓ src/components/PrimaryButton.tsx`

**Build sirasi:**
1. Design tokens (theme)
2. Types
3. Libs (api, storage, notifications)
4. Hooks
5. Components (reusable)
6. Screens — alttan uste (tabs sonra root layout)

Parallel is icin Agent kullan. Progress inline goster.

**Fix loop (self-healing):**
```
TYPE ERROR -> siniflandir -> hedefli duzelt -> tekrar check
  → Tekrarla (max 5x)
  → Git checkpoint basariyla
```

### Asama 5: 🔨 Build Verification

- Full TypeScript strict check: `bunx tsc --noEmit --strict`
- Metro bundler clean start (cache nuke: `bunx expo start --clear`)
- ESLint check
- Eger EAS Build gerekliyse: `eas build --platform all --profile development` (gerekirse)

### Asama 6: 🧪 Test

- Jest + React Native Testing Library
- Hooks icin unit test (useSubscription, useWeather, vb.)
- Components icin render test (snapshot + interaction)
- Minimum %60 coverage

### Asama 7: 👁️ Gorsel QA

- Expo simulator/emulator'da calistir (iOS + Android)
- Her ekran screenshot
- **Degerlendirme kriterleri:**
  - Animasyon var mi?
  - Depth/shadow hissi var mi?
  - Default tutorial slop gibi mi?
  - Renk paleti uyumu?
- **Reddet:** Duz beyaz tutorial goruntusu varsa. Yeniden tasarla.

### Asama 8: 🚀 Store

- **EAS Build:**
  ```bash
  eas build --platform ios --profile production
  eas build --platform android --profile production
  ```
- Icon + splash (1024x1024 icon, adaptive icon Android)
- Metadata (store listing — TR + EN):
  - Title (30 char)
  - Subtitle (30 char)
  - Description (4000 char)
  - Keywords (100 char toplam, virgül ayrilmis)
  - Privacy manifest (iOS)
  - Screenshots (6.5" iPhone + tablet + Android)
- **ONAYA SOR** gondermeden once
- `eas submit --platform ios` / `eas submit --platform android`

Detay: [references/production-checklist.md](references/production-checklist.md) *(henuz yazilmadi, ilerde)*

---

## Iletisim Stili

**Konusan agent ol.** Sessiz calisma YOK — her asamayi anlat. Karar gerekcelerini (renk, animasyon, mimari) aciklayarak ilerle. Kullanici senior mobile developer ile calisiyor hissine kapsin.

---

## Teknik Detaylar

### Proje Konumu
Tarim / hayvancilik ekosistemi projeleri: `{ekosistem}/projects/{proje}/mobile/` veya ayri monorepo.
TarimIKlim mevcut: `/home/orhan/Documents/Projeler/nutuya/tarimiklim/mobile/app/`

### Komutlar
```bash
# Dev server
bun run start
bunx expo start

# Cache nuke
bunx expo start --clear

# Type check
bunx tsc --noEmit

# Platform'da ac (dev client)
bunx expo start --ios
bunx expo start --android

# EAS Build
eas build --profile development --platform ios
eas build --profile preview --platform android
eas build --profile production --platform all

# Store submit
eas submit --platform ios
eas submit --platform android
```

### Hata Siniflandirma (fix loop icin)

| Hata | Duzeltilebilir oran | Strateji |
|---|---|---|
| Missing import | 98% | Import ekle |
| Type mismatch | 85% | Cast/convert/restructure |
| Metro cache invalid | 90% | `--clear` ile restart |
| Reanimated plugin missing | 95% | babel.config.js'e ekle |
| AsyncStorage not installed | 99% | `bun add @react-native-async-storage/async-storage` |
| Navigation deep link | 70% | scheme + app.json kontrol |
| IAP products not found | 60% | App Store Connect + app.json plan |

### Subagent Stratejisi
- `frontend-master` subagent — UI bilesenleri + ekran kodlamasi icin
- `backend-architect` — API endpoint eklenmesi gerekirse
- Ana context'i temiz tut — agir isi delegate et
- Bagimsiz subagent'lar paralel calistir

---

## Ogrenimler (Production run'lardan)

### Metro Cache Invalidation
Expo config veya plugin degisince Metro cache'i siliyor ama bazen eski bundle yukluyor:
```bash
bunx expo start --clear
# Veya:
rm -rf node_modules/.cache/expo
```

### Reanimated Babel Plugin
`react-native-reanimated` kullaniyorsan `babel.config.js`:
```js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],  // SON sirada olmali
  };
};
```

### Expo Router vs React Navigation
Orhan'in tum mobil uygulamalari **Expo Router** kullanir. React Navigation direkt kullanilmaz — Expo Router zaten uzerine kuruludur.

### IAP Test
Simulator'de IAP calismaz (iOS). Gercek cihaz + TestFlight sandbox + test hesabi gerekir:
- App Store Connect -> Users -> Sandbox Testers
- Cihazi test hesabiyla App Store'dan cik, TestFlight ile gir
- Uygulamada paywall ac -> satin alim sandbox modunda

### i18n Namespace Sistemi
Ekosistemde paylasimli namespace var: `common`, `auth`, `paywall`. Proje-ozel namespace (ornek: `weather`, `livestock`) projede tanimlanir.

### Expo Push vs Firebase/APNs
Expo Push zaten FCM + APNs proxy'si. Backend'de sadece Expo tokenlari sakla. Expo'nun kendi Push servisine POST gonder — FCM/APNs'i Expo halleder.

### StoreKit Configuration / Android Billing Test
- iOS: `.storekit` file (App Store Connect'teki product'lara mapping)
- Android: Google Play Console -> Testing -> Internal test track
- Iyzico: Web'de test kartlari (resmi dokumanda liste)

### EAS Build Profilleri
```json
// eas.json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal", "ios": { "simulator": true } },
    "production": {}
  }
}
```

### Node_Modules ve Monorepo
Orhan'in paket mimarisi: root'tan bun install. `mobile/app/node_modules` ayri tutulur — ekosistem `packages/shared-backend`'i direct path alias ile import etmez, HTTP API ile konusur. Mobil uygulama frontend-only; backend'e REST cagriyla baglanir.

### Custom Notification Sound — Expo Go'da Calismaz (KRITIK)
Bildirim icin custom sound eklenirse **Expo Go uygulamasinda calismaz**. Nedeni: Expo Go tek binary olarak dagitilir, her uygulamanin ozel asset'lerini native tarafta bundle edemez. Cozum:

```bash
# Development build (custom sound, custom plugin destekler)
bunx expo prebuild --clean
bunx expo run:ios
bunx expo run:android
```

Dogrulama: Settings ekraninda "Sesi test et" butonu Expo Go'da sessiz, ama prebuild ile olusan dev binary'de dogru calisiyor.

### Android Notification Channel Sound — DEGISMEZ
Android'de bir notification channel bir kez olusturuldugunda sound ayari **degistirilemez**. Degistirmek icin:
- Channel ID'yi guncelle (ornek: `don-uyari` → `don-uyari-v2`)
- Kullanici cihazinda eski channel pasif kalir, yenisi aktif olur

Bu nedenle channel'a sound bind ederken isimlendirme stratejisi kullan (v1, v2, ...).

### expo-av vs expo-audio
- **SDK 51-52:** `expo-av` audio desteginde default — kullan
- **SDK 53+:** `expo-audio` ayri paket olarak cikti, `expo-av` audio feature'lari deprecate
- Upgrade yaparken: `Audio.Sound.createAsync()` → `AudioPlayer` API'sine gec

Mevcut kodu upgrade-safe tutmak icin: `createAsync` cevresine wrapper yaz, migration tek dosya.

### require() ile Asset Import
Image/sound asset'lerini ES module import **yapma**:
```ts
// ❌ Calismaz
import sound from './assets/sounds/frost-alert.mp3';

// ✅ Dogru
const source = require('../../assets/sounds/frost-alert.mp3');
```

Metro bundler `require` ile asset'i tanir. Bos dosya ise `Audio.Sound.createAsync` throw eder — try/catch ile yakala.

### Pre-existing Font Import Errors
Bir yeni feature'in type-check'ini yaparken, projede zaten var olan **unrelated hatalari** dikkate alma:
```bash
# Feature'in yeni sebep oldugu hatalari filtrele
bunx tsc --noEmit -p tsconfig.json 2>&1 | grep -v "@expo-google-fonts"
```

Bu pattern, eski projelerde dev'in kendi isini yapmasini kolaylastirir. Font import'lari dev ekibinde baskasi tarafindan cozulecek/installed olacak.

### Settings Toggle Pattern
Reusable toggle'lari `SettingRow` komponenti ile paylasma — her yeni toggle icin ayri komponent yaz:

```tsx
<FrostSoundControl
  label={t('settings.frostSound')}
  enabled={frostSound.enabled}
  onToggle={frostSound.toggle}
  onTest={frostSound.test}
  playing={frostSound.playing}
  labelOn={t('settings.frostSoundOn')}
  ...
/>
```

Nedeni: toggle + test butonu + disabled state birlestirildiginde generik `SettingRow` yetmez. Her feature-spesifik kontrol kendi komponentini hak eder.

### AsyncStorage Varsayilan Deger
`getFrostSoundEnabled()` gibi toggle'larda **opt-out** disarisinda varsayilan **opt-in** (true) — kritik ozellikler (don uyarisi) her zaman acik baslasin:

```ts
async getFrostSoundEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw !== '0';  // null VEYA '1' -> true (opt-in)
}
```

Boylece mevcut kullanicilar yeni feature'i otomatik aliyor. Opt-out icin gizlilik/izin gereken ozelliklerde (lokasyon, kamera) tersi — varsayilan false.

---

## Yapma Listesi (NOT TO DO)

- Tum dosyalari bir anda uretme — her dosyadan sonra type-check
- Fix loop'u atla — hatalar birikince artar
- TODO/placeholder yazma — her sey gercek olmali
- Sessiz calisma — her adim anlat
- **Onboarding + paywall olmadan ship etme**
- Default RN styling kullan**ma** — theme/tokens zorunlu
- `TouchableOpacity` stillenmeden kullanma
- Sadece mavi renk paleti — kategoriden sec
- `FlatList`'te default renderItem — her zaman stillenmis Card

---

## Gerekli Araclar

- **Node.js 20+** (veya Bun — tercih edilen)
- **Expo CLI** (bunx expo, no global install)
- **EAS CLI** (`bun add -g eas-cli`)
- **iOS Simulator** (macOS + Xcode gerektirir — yoksa Android only)
- **Android Studio + Emulator** (Linux'ta mumkun)
- **Expo Go** app (hizli prototip icin — ama IAP/push prod build gerektirir)
- Opsiyonel: **Apple Developer Account** ($99/yil, iOS ship icin)
- Opsiyonel: **Google Play Console** ($25 tek sefer, Android ship icin)

---

## Referans Dosyalari

- [references/anti-ai-slop.md](references/anti-ai-slop.md) — Gorsel kalite kurallari (detayli)
- [references/theming.md](references/theming.md) — Token bazli tema sistemi
- [references/monetization.md](references/monetization.md) — IAP + Iyzico hybrid
- [references/expo-router.md](references/expo-router.md) — Navigasyon konvansiyonlari
- [references/i18n.md](references/i18n.md) — Coklu dil kurulumu
