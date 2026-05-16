import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Sparkles, MessageSquare, Calendar, User } from 'lucide-react-native';
import { useAppTheme } from '@/theme';

import { Platform } from 'react-native';

/** Web HeaderClient FALLBACK_MENU (tr) ile aynı sıra / isimler: Ana Sayfa → Doğum Haritası → Danışmanlar → Günlük Yorum → Profil */
export default function TabsLayout() {
  const { colors, font } = useAppTheme();

  return (
    <Tabs
      initialRouteName="today"
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
        name="today"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="birth-chart"
        options={{
          title: 'Doğum Haritası',
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen 
        name="connect" 
        options={{ 
          title: 'Danışmanlar',
          tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} strokeWidth={2} /> 
        }} 
      />
      <Tabs.Screen
        name="daily"
        options={{
          title: 'Günlük Yorum',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profil',
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
