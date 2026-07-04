import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme, type AppTheme } from '@/theme';
import { safeRouterBack } from '@/lib/navigation';
import {
  CELEBRITY_ZODIAC,
  SIGN_LABELS,
  type ZodiacSignId,
} from '@/lib/zodiac/celebrities';

const ALL_SIGNS = Object.keys(SIGN_LABELS) as ZodiacSignId[];

function buildStyles(t: AppTheme) {
  const { colors, spacing, font, radius } = t;
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
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
    },
    chipActive: { borderColor: colors.gold, backgroundColor: colors.inkDeep },
    chipText: { fontFamily: font.sansMedium, fontSize: 12, color: colors.textMuted },
    chipTextActive: { color: colors.gold },
    scroll: { padding: spacing.lg, paddingBottom: 40, gap: 12 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.lineSoft,
    },
    name: { fontFamily: font.sansBold, fontSize: 16, color: colors.text },
    meta: { fontFamily: font.sans, fontSize: 12, color: colors.gold, marginTop: 4 },
    note: { fontFamily: font.sans, fontSize: 13, color: colors.textMuted, marginTop: 8, lineHeight: 20 },
  });
}

export default function CelebritiesScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { colors } = theme;
  const [filter, setFilter] = useState<ZodiacSignId | 'all'>('all');

  const list = useMemo(() => {
    if (filter === 'all') return CELEBRITY_ZODIAC;
    return CELEBRITY_ZODIAC.filter((c) => c.sign === filter);
  }, [filter]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => safeRouterBack('/(tabs)/zodiac' as any)}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>{t('menu.celebrities')}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Pressable
            style={[styles.chip, filter === 'all' && styles.chipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.chipText, filter === 'all' && styles.chipTextActive]}>
              {t('readings.filterAll')}
            </Text>
          </Pressable>
          {ALL_SIGNS.map((sign) => (
            <Pressable
              key={sign}
              style={[styles.chip, filter === sign && styles.chipActive]}
              onPress={() => setFilter(sign)}
            >
              <Text style={[styles.chipText, filter === sign && styles.chipTextActive]}>
                {SIGN_LABELS[sign]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView contentContainerStyle={styles.scroll}>
          {list.map((c) => (
            <Pressable
              key={c.name}
              style={styles.card}
              onPress={() => router.push(`/zodiac/${c.sign}` as any)}
            >
              <Text style={styles.name}>{c.name}</Text>
              <Text style={styles.meta}>
                {SIGN_LABELS[c.sign]} · {c.birthday} · {c.field}
              </Text>
              <Text style={styles.note}>{c.note}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
