import '@/polyfills';
import { useEffect } from 'react';
import { Stack, useRouter, type Href } from 'expo-router';
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
import { Gabriela_400Regular } from '@expo-google-fonts/gabriela';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';

import { initI18n } from '@/lib/i18n';
import { routeFromNotificationData } from '@/lib/notificationRoutes';
import { ThemeProvider, useAppTheme } from '@/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';

initI18n();
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutInner() {
  const { statusBar } = useAppTheme();
  const router = useRouter();
  const lastNotification = Notifications.useLastNotificationResponse();

  const [fontsReady, fontError] = useFonts({
    Cinzel_400Regular,
    Cinzel_500Medium,
    Cinzel_700Bold,
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_700Bold,
    Fraunces_400Regular_Italic,
    Gabriela_400Regular,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_700Bold,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_700Bold,
  });
  const ready = fontsReady || !!fontError;

  useEffect(() => {
    if (!lastNotification || !ready) return;
    const data = lastNotification.notification.request.content.data as Record<string, unknown>;
    const target = routeFromNotificationData(data);
    if (target) router.push(target as Href);
  }, [lastNotification, ready, router]);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style={statusBar.default} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(consultant)" />

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
        <Stack.Screen name="legal/index" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="cms/[moduleKey]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="blog/index" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="blog/[slug]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="become-consultant/index" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="karne/index" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="unluler/index" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="info/index" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="contact/index" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="media-messages/index" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="messages/index" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="messages/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />

        <Stack.Screen name="booking/[id]/review" options={{ presentation: 'modal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ThemeProvider>
          <RootLayoutInner />
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
