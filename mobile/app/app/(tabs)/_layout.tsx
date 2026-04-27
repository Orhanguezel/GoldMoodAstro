import React from 'react';
import { Tabs } from 'expo-router';
import { Compass, Sparkles, MessageSquare, Calendar, User } from 'lucide-react-native';
import { colors, font } from '@/theme/tokens';
import { Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgDeep, // or inkDeep
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
          title: 'Bugün',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} strokeWidth={2} /> 
        }} 
      />
      <Tabs.Screen 
        name="birth-chart" 
        options={{ 
          title: 'Harita',
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} strokeWidth={2} /> 
        }} 
      />
      <Tabs.Screen 
        name="connect" 
        options={{ 
          title: 'Astrolog',
          tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} strokeWidth={2} /> 
        }} 
      />
      <Tabs.Screen 
        name="daily" 
        options={{ 
          title: 'Yorum',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} strokeWidth={2} /> 
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} strokeWidth={2} /> 
        }} 
      />
      
      {/* Hidden screens */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="bookings" options={{ href: null }} />
      <Tabs.Screen name="favorites" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
