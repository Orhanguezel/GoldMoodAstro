import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Crown, ArrowRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme, type AppTheme } from '@/theme';
import { usePremium } from '@/hooks/usePremium';

function buildStyles(t: AppTheme) {
  const { colors, font, radius, spacing } = t;
  return StyleSheet.create({
    card: {
      marginHorizontal: spacing.lg,
      marginVertical: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.goldDim,
      backgroundColor: colors.inkDeep,
      gap: spacing.sm,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: 'rgba(201, 169, 97, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: { flex: 1 },
    title: { fontFamily: font.display, fontSize: 16, color: colors.text },
    desc: {
      fontFamily: font.sans,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
      lineHeight: 18,
    },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 8,
      backgroundColor: colors.gold,
      paddingVertical: 12,
      borderRadius: radius.pill,
    },
    ctaText: { fontFamily: font.sansBold, fontSize: 12, color: colors.ink, letterSpacing: 0.5 },
  });
}

/** FAZ 41 T41-4 — Free kullanıcıya reklamsız deneyim upsell (house-promo tamamlayıcı) */
export function BannerUpsell() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { colors } = theme;
  const { isPremium, loading } = usePremium();

  if (loading || isPremium) return null;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Crown size={22} color={colors.gold} />
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>
            {t('banner.adFreeTitle')}
          </Text>
          <Text style={styles.desc}>
            {t('banner.adFreeDesc')}
          </Text>
        </View>
      </View>
      <Pressable
        style={styles.cta}
        onPress={() => router.push('/(tabs)/profile/subscription' as any)}
      >
        <Text style={styles.ctaText}>{t('banner.goPremium')}</Text>
        <ArrowRight size={16} color={colors.ink} />
      </Pressable>
    </View>
  );
}
