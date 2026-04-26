# Expo Router — Navigasyon Konvansiyonlari

Orhan'in ekosisteminde tum Expo uygulamalar **Expo Router** kullanir. Dosya bazli routing (Next.js'e benzer).

## Temel Kurallar

1. `app/` klasoru — her dosya bir route
2. `_layout.tsx` — o seviyedeki layout (nested navigator)
3. `(group)/` — grup klasor (URL'de gorunmez, layout paylasir)
4. `[param].tsx` — dinamik route
5. `[...rest].tsx` — catch-all

## Standart Yapi

```
app/
├── _layout.tsx                  Root Stack
├── index.tsx                    Anasayfa (/) - genelde redirect
├── (tabs)/                      Tab grubu
│   ├── _layout.tsx              Bottom tab layout
│   ├── index.tsx                Ana tab (Home)
│   ├── {feature}.tsx            Diger tablar
│   └── settings.tsx
├── onboarding/
│   └── index.tsx                Onboarding (/onboarding)
├── paywall.tsx                  Paywall modal (/paywall)
├── auth/
│   ├── login.tsx
│   └── signup.tsx
├── {feature}/
│   └── [id].tsx                 Dinamik detay
└── +not-found.tsx               404
```

## Root Layout Ornegi

```tsx
// app/_layout.tsx
import { Stack, Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { queryClient } from '@/src/lib/queryClient';
import { useOnboarding } from '@/src/hooks/useOnboarding';
import { useSubscription } from '@/src/hooks/useSubscription';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
            <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
            <Stack.Screen name="auth" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

## Tabs Layout Ornegi

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { tokens } from '@/src/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.colors.primary,
        tabBarInactiveTintColor: tokens.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: tokens.colors.surface,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: tokens.typography.body.familyBold,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hava',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="partly-sunny" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="hourly"
        options={{
          title: 'Saatlik',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="timelapse" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Uyarilar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

## Navigasyon Islemleri

```tsx
import { useRouter, useLocalSearchParams, Link, Redirect } from 'expo-router';

// Programatik
const router = useRouter();
router.push('/paywall');
router.replace('/(tabs)');
router.back();
router.dismiss();        // modal kapat
router.dismissAll();

// Params
const { id } = useLocalSearchParams<{ id: string }>();

// Link bilesen
<Link href="/(tabs)/settings" asChild>
  <Pressable><Text>Ayarlar</Text></Pressable>
</Link>

// Redirect (component)
<Redirect href="/onboarding" />
```

## Guards (Auth + Subscription)

```tsx
// app/(tabs)/_layout.tsx
import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';

export default function TabsLayout() {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect href="/auth/login" />;
  
  return <Tabs> {/* ... */} </Tabs>;
}
```

Paywall guard:
```tsx
// Sadece premium ozellikte
import { useSubscription } from '@/src/hooks/useSubscription';

export default function PremiumFeature() {
  const { isSubscribed } = useSubscription();
  if (!isSubscribed) return <Redirect href="/paywall" />;
  
  return <FeatureContent />;
}
```

## Modal Presentation

```tsx
// Root layout'ta:
<Stack.Screen 
  name="paywall" 
  options={{ 
    presentation: 'modal',                  // iOS modal sheet
    animation: 'slide_from_bottom',         // Android
  }} 
/>

// Sayfa icinde:
router.push('/paywall');                    // Modal olarak acilir
```

Modal kapatma:
```tsx
<Pressable onPress={() => router.back()}>
  <Ionicons name="close" size={28} />
</Pressable>
```

## Deep Linking

`app.json`'da scheme tanimi:
```json
{
  "expo": {
    "scheme": "tarimiklim",
    "android": { "intentFilters": [/* ... */] },
    "ios": { "associatedDomains": ["applinks:tarimiklim.com"] }
  }
}
```

Otomatik calisan deep link'ler:
- `tarimiklim://paywall` -> `/paywall`
- `tarimiklim://location/search` -> `/location/search`
- `tarimiklim://field/123` -> `/field/[id].tsx` (id=123)

Universal links (https) iOS icin `applinks` setup + Apple-App-Site-Association dosyasi gerekir (web tarafindan servis edilir).

## Push Notification -> Deep Link

```tsx
// src/lib/notifications.ts
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

Notifications.addNotificationResponseReceivedListener(response => {
  const { data } = response.notification.request.content;
  if (data.deepLink) {
    router.push(data.deepLink as string);
  }
});
```

Backend'den gonderirken:
```typescript
await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: expoPushToken,
    title: 'Don Uyarisi',
    body: 'Antalya icin yarin gece don riski var',
    data: { deepLink: '/field/antalya-merkez' },
  }),
});
```

## Tabs Ayrintisi — Dikkat Edilecekler

1. **Tab iconlari** her zaman `@expo/vector-icons` kullan. Custom SVG sadece gerekli ise.
2. **Tab badge** (`tabBarBadge`) — uyari sayilari icin:
   ```tsx
   <Tabs.Screen
     name="alerts"
     options={{
       tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
       tabBarBadgeStyle: { backgroundColor: tokens.colors.error },
     }}
   />
   ```
3. **Tab scroll to top** — ayni tabba tiklaninca en ust:
   ```tsx
   import { useScrollToTop } from '@react-navigation/native';
   const ref = useRef();
   useScrollToTop(ref);
   <ScrollView ref={ref}>...</ScrollView>
   ```

## Screen Options — Screen Transitions

```tsx
// Slide from right (iOS default, Android custom)
<Stack.Screen
  name="detail/[id]"
  options={{
    animation: 'slide_from_right',
    animationDuration: 250,
    headerShown: false,
  }}
/>

// Fade
options={{ animation: 'fade' }}

// None (instant — sekme gibi)
options={{ animation: 'none' }}
```

## Typed Routes (Yeni)

Expo Router 3.5+ TypeScript safe routes:
```tsx
// TypeScript tabanli auto-complete
router.push('/field/[id]' as const, { id: '123' });
```

`app.json` icinde:
```json
{
  "experiments": { "typedRoutes": true }
}
```

## Yapma Listesi (NOT TO DO)

- React Navigation'i dogrudan import etme — Expo Router onu sararak sunar
- Native stack navigator'i manuel olustrma
- `NavigationContainer`'i manuel wrap etme — Expo Router otomatik yapiyor
- Hash routing (`#`) yapma — mobilde karsiligi yok
- URL'i manuel stringlemeye calisma — `useRouter` + typed routes kullan

## Oruntu Kontrol Listesi

Her yeni ekran eklerken:
- [ ] Dosya adi convention'a uyuyor mu? (`[param].tsx` vs `param.tsx`)
- [ ] Parent `_layout.tsx` rotayi taniyor mu?
- [ ] Auth/subscription guard gerekli mi? Redirect ile koy
- [ ] Modal mi normal mi? Presentation belirle
- [ ] Deep link support lazim mi? scheme + test et
- [ ] TabBar icon var mi (eger tab ise)?
- [ ] Transition animation uygun mu?
- [ ] iOS + Android davranis farki test edildi mi?
