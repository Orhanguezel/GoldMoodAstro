import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import { InterTight_400Regular, InterTight_500Medium, InterTight_700Bold } from '@expo-google-fonts/inter-tight';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';

import { initI18n } from '@/lib/i18n';
import { registerPushToken } from '@/lib/notifications';

initI18n();
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const router = useRouter();
  const lastNotification = Notifications.useLastNotificationResponse();

  const [fontsReady] = useFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_700Bold,
    InterTight_400Regular,
    InterTight_500Medium,
    InterTight_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });
  const [ready, setReady] = useState(false);

  // Bildirime tıklanınca ilgili ekrana git
  useEffect(() => {
    if (!lastNotification || !ready) return;
    const data = lastNotification.notification.request.content.data as Record<string, unknown>;
    if (data?.booking_id) {
      router.push(`/(tabs)/bookings`);
    }
  }, [lastNotification, ready]);

  useEffect(() => {
    if (fontsReady) {
      SplashScreen.hideAsync().catch(() => {});
      setReady(true);
      registerPushToken().catch(err => console.warn('Push init error:', err));
    }
  }, [fontsReady]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          {/* Ana navigasyon */}
          <Stack.Screen name="(tabs)" />

          {/* Onboarding — ilk açılış */}
          <Stack.Screen
            name="onboarding/index"
            options={{ presentation: 'fullScreenModal' }}
          />

          {/* Auth ekranları */}
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register" />

          {/* Danışman detay — modal olarak açılır */}
          <Stack.Screen
            name="consultant/[id]"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />

          {/* Randevu ödeme */}
          <Stack.Screen
            name="booking/checkout"
            options={{ presentation: 'modal' }}
          />

          {/* Iyzipay WebView ödeme */}
          <Stack.Screen
            name="booking/payment"
            options={{ presentation: 'fullScreenModal' }}
          />

          {/* Sesli görüşme — tam ekran */}
          <Stack.Screen
            name="call/[bookingId]"
            options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
          />

          {/* Seans sonu değerlendirme */}
          <Stack.Screen
            name="call/rate"
            options={{ presentation: 'modal' }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
