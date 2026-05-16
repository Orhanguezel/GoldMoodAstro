import '@/polyfills';
import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import {
  Cinzel_400Regular,
  Cinzel_500Medium,
  Cinzel_700Bold,
} from '@expo-google-fonts/cinzel';
import {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_700Bold,
  Fraunces_400Regular_Italic,
} from '@expo-google-fonts/fraunces';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';

import { initI18n } from '@/lib/i18n';
import { registerPushToken } from '@/lib/notifications';
import { ThemeProvider, useAppTheme } from '@/theme';

initI18n();
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutInner() {
  const { statusBar } = useAppTheme();
  const router = useRouter();
  const lastNotification = Notifications.useLastNotificationResponse();

  const [fontsReady] = useFonts({
    Cinzel_400Regular,
    Cinzel_500Medium,
    Cinzel_700Bold,
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_700Bold,
    Fraunces_400Regular_Italic,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_700Bold,
  });
  const [ready, setReady] = useState(false);

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
      registerPushToken().catch((err) => console.warn('Push init error:', err));
    }
  }, [fontsReady]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style={statusBar.default} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />

        <Stack.Screen name="onboarding/index" options={{ presentation: 'fullScreenModal' }} />

        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />

        <Stack.Screen
          name="consultant/[id]"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />

        <Stack.Screen name="booking/checkout" options={{ presentation: 'modal' }} />

        <Stack.Screen name="booking/payment" options={{ presentation: 'fullScreenModal' }} />

        <Stack.Screen
          name="call/[bookingId]"
          options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
        />

        <Stack.Screen name="call/rate" options={{ presentation: 'modal' }} />

        <Stack.Screen name="menu/index" options={{ presentation: 'card', animation: 'slide_from_right' }} />

        <Stack.Screen name="webview/index" options={{ presentation: 'card', animation: 'slide_from_right' }} />

        <Stack.Screen name="booking/[id]/review" options={{ presentation: 'modal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RootLayoutInner />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
