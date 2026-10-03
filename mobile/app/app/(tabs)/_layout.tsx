import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Sparkles, MessageSquare, Calendar, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/theme';

import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Web HeaderClient FALLBACK_MENU (tr) ile aynı sıra / isimler: Ana Sayfa → Doğum Haritası → Danışmanlar → Günlük Yorum → Profil */
export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors, font } = useAppTheme();
  const insets = useSafeAreaInsets();
  // Edge-to-edge Android can report zero inset while the gesture bar still
  // overlays the bottom of the tab bar (observed on the API 35 emulator).
  const bottomInset = Platform.OS === 'android' ? Math.max(insets.bottom, 24) : 0;

  return (
    <Tabs
      initialRouteName="today"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.lineSoft,
          height: Platform.OS === 'ios' ? 88 : 64 + bottomInset,
          paddingBottom: Platform.OS === 'ios' ? 30 : 8 + bottomInset,
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
        name="today"
        options={{
          title: t('tabs.today'),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="birth-chart"
        options={{
          title: t('tabs.birthChart'),
          tabBarLabel: t('tabs.birthChartShort'),
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen 
        name="connect"
        options={{
          title: t('tabs.connect'),
          tabBarLabel: t('tabs.connectShort'),
          tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} strokeWidth={2} /> 
        }} 
      />
      <Tabs.Screen
        name="daily"
        options={{
          title: t('tabs.daily'),
          tabBarLabel: t('tabs.dailyShort'),
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen 
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => <User color={color} size={size} strokeWidth={2} /> 
        }} 
      />
      {/* Not shown in tab bar */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="bookings" options={{ href: null }} />
      <Tabs.Screen name="favorites" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="tarot" options={{ href: null }} />
      <Tabs.Screen name="zodiac" options={{ href: null }} />
    </Tabs>
  );
}
