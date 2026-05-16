import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, HelpCircle, Info, Mail } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme, type AppTheme } from '@/theme';
import { safeRouterBack } from '@/lib/navigation';
import { INFO_CMS_PAGES } from '@/lib/cms';

function buildStyles(t: AppTheme) {
  const { colors, spacing, font } = t;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: 12,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.line,
    },
    title: { flex: 1, fontFamily: font.display, fontSize: 20, color: colors.text },
    intro: {
      fontFamily: font.sans,
      fontSize: 13,
      color: colors.textMuted,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      lineHeight: 20,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.lineSoft,
      gap: 12,
    },
    rowTitle: { flex: 1, fontFamily: font.sansMedium, fontSize: 16, color: colors.text },
  });
}

export default function InfoIndexScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { colors } = theme;
  const { i18n } = useTranslation();
  const locale = i18n.language?.slice(0, 2) ?? 'tr';

  const openCms = (moduleKey: string, title: string) => {
    router.push({
      pathname: '/cms/[moduleKey]' as any,
      params: { moduleKey, title, locale },
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => safeRouterBack()}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Hakkında & Destek</Text>
        </View>
        <Text style={styles.intro}>İçerikler admin panelinden güncellenir.</Text>
        <ScrollView>
          {INFO_CMS_PAGES.map((page) => (
            <Pressable
              key={page.module_key}
              style={styles.row}
              onPress={() => openCms(page.module_key, page.title)}
            >
              {page.module_key === 'faq' ? (
                <HelpCircle size={18} color={colors.gold} />
              ) : (
                <Info size={18} color={colors.gold} />
              )}
              <Text style={styles.rowTitle}>{page.title}</Text>
              <ChevronRight size={18} color={colors.textMuted} />
            </Pressable>
          ))}
          <Pressable style={styles.row} onPress={() => router.push('/contact' as any)}>
            <Mail size={18} color={colors.gold} />
            <Text style={styles.rowTitle}>İletişim</Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
