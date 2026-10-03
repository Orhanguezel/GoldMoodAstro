import React, { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { BriefcaseBusiness, CalendarDays, Clock3, MessageCircle, Ellipsis } from 'lucide-react-native';
import { ActivityIndicator, AppState, Platform, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme';
import { consultantSelfApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function ConsultantTabsLayout() {
  const { t } = useTranslation();
  const { colors, font } = useAppTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === 'android' ? Math.max(insets.bottom, 24) : 0;
  const { user, authHydrating } = useAuth();
  const hasConsultantRole = user?.role === 'consultant' || user?.roles?.includes('consultant') === true;

  useEffect(() => {
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

    const beat = async () => {
      try {
        const profile = await consultantSelfApi.profile();
        if (AppState.currentState === 'active' && profile.approval_status === 'approved' && Number(profile.is_available) === 1) {
          await consultantSelfApi.heartbeat();
        }
      } catch {
        // The next interval retries; an unknown account state must not mark presence online.
      }
    };
    const start = () => {
      if (heartbeatTimer) return;
      beat();
      heartbeatTimer = setInterval(beat, 60_000);
    };
    const stop = () => {
      if (!heartbeatTimer) return;
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    };

    if (!hasConsultantRole) return;
    if (AppState.currentState === 'active') start();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') start();
      else stop();
    });

    return () => {
      stop();
      sub.remove();
    };
  }, [hasConsultantRole]);

  if (authHydrating) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}><ActivityIndicator color={colors.gold} /></View>;
  if (!hasConsultantRole) return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 24, gap: 16 }}>
      <Text style={{ color: colors.text, fontFamily: font.display, fontSize: 22 }}>{t('consultantPanel.notConsultantTitle', 'Danışman alanı')}</Text>
      <Text style={{ color: colors.textMuted, fontFamily: font.sans }}>{t('consultantPanel.notConsultantBody', 'Bu alan danışman hesapları içindir.')}</Text>
      <Pressable onPress={() => router.replace(user ? '/become-consultant' as any : '/auth/login')} style={{ backgroundColor: colors.gold, padding: 14, borderRadius: 16 }}>
        <Text style={{ color: colors.ink, fontFamily: font.sansBold }}>{user ? t('settings.becomeConsultant', 'Danışman Ol') : t('auth.login', 'Giriş Yap')}</Text>
      </Pressable>
    </View>
  );

  return (
    <Tabs
      initialRouteName="consultant/index"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.lineSoft,
          height: Platform.OS === 'ios' ? 88 : 72 + bottomInset,
          paddingBottom: Platform.OS === 'ios' ? 30 : 16 + bottomInset,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: font.sansBold,
          fontSize: 10,
          letterSpacing: 0.5,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="consultant/index"
        options={{
          title: t('consultantPanel.tabs.overview', 'Özet'),
          tabBarIcon: ({ color, size }) => <BriefcaseBusiness color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="consultant/bookings"
        options={{
          title: t('consultantPanel.tabs.bookings', 'Randevular'),
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="consultant/availability"
        options={{
          title: t('consultantPanel.tabs.availability', 'Müsaitlik'),
          tabBarIcon: ({ color, size }) => <Clock3 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="consultant/messages"
        options={{
          title: t('consultantPanel.tabs.messages', 'Mesajlar'),
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="consultant/more" options={{ title: t('consultantPanel.tabs.more', 'Diğer'), tabBarIcon: ({ color, size }) => <Ellipsis color={color} size={size} /> }} />
      <Tabs.Screen name="consultant/wallet" options={{ href: null }} />
      <Tabs.Screen
        name="consultant/media"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="consultant/reviews"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="consultant/kyc"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="consultant/profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
