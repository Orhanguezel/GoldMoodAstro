import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { BriefcaseBusiness, CalendarDays, Clock3, MessageCircle, Mic, ShieldCheck, Star, UserCog, Wallet } from 'lucide-react-native';
import { AppState, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@/theme';
import { consultantSelfApi } from '@/lib/api';

export default function ConsultantTabsLayout() {
  const { t } = useTranslation();
  const { colors, font } = useAppTheme();

  useEffect(() => {
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

    const beat = () => {
      consultantSelfApi.heartbeat().catch(() => undefined);
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

    if (AppState.currentState === 'active') start();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') start();
      else stop();
    });

    return () => {
      stop();
      sub.remove();
    };
  }, []);

  return (
    <Tabs
      initialRouteName="consultant/index"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.lineSoft,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 30 : 8,
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
        name="consultant/wallet"
        options={{
          title: t('consultantPanel.tabs.wallet', 'Cüzdan'),
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="consultant/messages"
        options={{
          title: t('consultantPanel.tabs.messages', 'Mesajlar'),
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="consultant/media"
        options={{
          title: t('consultantPanel.tabs.media', 'Medya'),
          tabBarIcon: ({ color, size }) => <Mic color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="consultant/reviews"
        options={{
          title: t('consultantPanel.tabs.reviews', 'Yorumlar'),
          tabBarIcon: ({ color, size }) => <Star color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="consultant/kyc"
        options={{
          title: t('consultantPanel.tabs.kyc', 'KYC'),
          tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="consultant/profile"
        options={{
          title: t('consultantPanel.tabs.profile', 'Profil'),
          tabBarIcon: ({ color, size }) => <UserCog color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
