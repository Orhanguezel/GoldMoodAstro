import React, { useMemo } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Mic, ShieldCheck, Star, UserCog, Wallet } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/theme';

const links = [
  { path: '/consultant/wallet', key: 'wallet', Icon: Wallet },
  { path: '/consultant/media', key: 'media', Icon: Mic },
  { path: '/consultant/reviews', key: 'reviews', Icon: Star },
  { path: '/consultant/kyc', key: 'kyc', Icon: ShieldCheck },
  { path: '/consultant/profile', key: 'profile', Icon: UserCog },
] as const;

export default function ConsultantMoreScreen() {
  const { t } = useTranslation();
  const { colors, font, spacing, radius } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg, gap: 12, paddingBottom: 40 },
    title: { fontFamily: font.display, fontSize: 27, color: colors.text, marginBottom: 10 },
    row: { minHeight: 58, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16 },
    label: { flex: 1, fontFamily: font.sansBold, fontSize: 15, color: colors.text },
  }), [colors, font, spacing, radius]);
  return <View style={styles.screen}><SafeAreaView style={styles.screen} edges={['top']}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>{t('consultantPanel.tabs.more', 'Diğer')}</Text>
    {links.map(({ path, key, Icon }) => <Pressable key={key} style={styles.row} onPress={() => router.push(path as any)} accessibilityRole="button">
      <Icon color={colors.gold} size={20} /><Text style={styles.label}>{t(`consultantPanel.tabs.${key}`, key)}</Text><ChevronRight color={colors.textMuted} size={18} />
    </Pressable>)}
  </ScrollView></SafeAreaView></View>;
}
