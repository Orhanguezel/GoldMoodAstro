# Expo Router — GoldMoodAstro Navigation

GoldMoodAstro mobile Expo Router kullanır. React Navigation doğrudan eklenmez; Expo Router'ın üstünden ilerlenir.

## Mevcut Ana Yapı

```text
app/
├── _layout.tsx
├── index.tsx
├── onboarding/
├── auth/
├── (tabs)/
│   ├── _layout.tsx
│   ├── today.tsx
│   ├── birth-chart.tsx
│   ├── connect.tsx
│   ├── daily.tsx
│   └── profile/
├── consultant/
├── booking/
├── call/
└── feature routes...
```

## Tab Bar Standardı

- En fazla 5 görünür ana hedef.
- Mevcut ana hedefler:
  - Ana Sayfa
  - Doğum Haritası
  - Danışmanlar
  - Günlük Yorum
  - Profil
- Hidden route'lar `href: null` ile saklanır.
- Iconlar `lucide-react-native`.
- Safe area padding iOS/Android için korunur.

## Root Stack Standardı

- `onboarding/index`: `fullScreenModal`
- `booking/payment`: `fullScreenModal`
- `call/[bookingId]`: `fullScreenModal`, gesture kapalı
- detail/modal ekranları: `modal` veya `slide_from_bottom`
- content/legal/menu gibi ekranlar: `card` veya `slide_from_right`

## Programmatic Navigation

```tsx
import { router, useLocalSearchParams } from 'expo-router';

router.push('/(tabs)/connect' as any);
router.replace('/auth/login' as any);
router.back();

const { id } = useLocalSearchParams<{ id: string }>();
```

Typed route sorunlarında mevcut repo pratikleriyle `as any` kullanılabilir; yeni route stringleri mümkün olduğunca merkezi helper veya mevcut route patternleriyle uyumlu tutulur.

## Auth Guard

Protected ekran:

```tsx
const { isAuthenticated, authHydrating } = useAuth();

useFocusEffect(
  useCallback(() => {
    if (authHydrating) return;
    if (!isAuthenticated) router.replace('/auth/login' as any);
  }, [authHydrating, isAuthenticated]),
);
```

## Premium Guard

Premium feature:

```tsx
const { isPremium, loading } = usePremium();

if (loading) return <LoadingState />;
if (!isPremium) return <PaywallSheet />;
```

## Deep Link / Push

Push notification data:

- `booking_id` veya `bookingId` -> `/booking/[id]`
- `screen: 'bookings'` -> `/(tabs)/bookings`

Yeni push hedefi eklenirse `app/_layout.tsx` notification handler ve backend payload birlikte düşünülür.

## QA

- Back tuşu kullanıcıyı ödeme/call ortasında kaybettirmemeli.
- Payment ve call full-screen hissi vermeli.
- Modal close butonları 44x44 ve accessibility label taşımalı.
- Hidden tab route'lar tab bar'da görünmemeli.
