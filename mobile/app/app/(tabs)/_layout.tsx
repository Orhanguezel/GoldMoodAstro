import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Compass, Sparkles, MessageCircleHeart, BookOpenText, User } from 'lucide-react-native';
import { colors, font } from '@/theme/tokens';

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgDeep,
          borderTopColor: colors.line,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.sand,
        tabBarLabelStyle: {
          fontFamily: font.sansMedium,
          fontSize: 10,
          letterSpacing: 0.5,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen 
        name="today" 
        options={{ 
          title: 'Bugün',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} /> 
        }} 
      />
      <Tabs.Screen 
        name="birth-chart" 
        options={{ 
          title: 'Harita',
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} /> 
        }} 
      />
      <Tabs.Screen 
        name="connect" 
        options={{ 
          title: 'Astrolog',
          tabBarIcon: ({ color, size }) => <MessageCircleHeart color={color} size={size} /> 
        }} 
      />
      <Tabs.Screen 
        name="daily" 
        options={{ 
          title: 'Yorum',
          tabBarIcon: ({ color, size }) => <BookOpenText color={color} size={size} /> 
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} /> 
        }} 
      />
      
      {/* Hide other tabs if they exist in the file system but shouldn't be in the tab bar */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="bookings" options={{ href: null }} />
      <Tabs.Screen name="favorites" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
