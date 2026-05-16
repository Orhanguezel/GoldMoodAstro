import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Sparkles, UserPlus, Crown } from 'lucide-react-native';
import { useAppTheme, type AppTheme } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/hooks/usePremium';
import { getFunnelConfig, type FunnelFeature } from '@/lib/funnel.config';

type Tier = 'guest' | 'free' | 'premium';
type Intensity = 'heavy' | 'light' | 'none';

type Props = {
  feature: FunnelFeature;
  intensity?: Intensity;
  context?: Record<string, string | number | undefined>;
  tier?: Tier;
};

function buildStyles(t: AppTheme) {
  const { colors, font, radius, spacing } = t;
  return StyleSheet.create({
    lightWrap: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.lineSoft,
      alignItems: 'center',
      gap: 10,
    },
    lightDesc: {
      fontFamily: font.sans,
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
    lightLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    lightLinkText: {
      fontFamily: font.sansBold,
      fontSize: 11,
      color: colors.goldDeep,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    heavyCard: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      marginBottom: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.goldDim,
      backgroundColor: colors.inkDeep,
      gap: spacing.md,
    },
    heavyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
    iconBox: {
      width: 52,
      height: 52,
      borderRadius: radius.lg,
      backgroundColor: 'rgba(201, 169, 97, 0.12)',
      borderWidth: 1,
      borderColor: colors.goldDim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heavyBody: { flex: 1, minWidth: 0 },
    kicker: {
      fontFamily: font.sansBold,
      fontSize: 10,
      color: colors.goldDeep,
      letterSpacing: 2,
      marginBottom: 6,
    },
    headline: {
      fontFamily: font.display,
      fontSize: 20,
      color: colors.text,
      marginBottom: 8,
    },
    description: {
      fontFamily: font.sans,
      fontSize: 13,
      color: colors.textDim,
      lineHeight: 20,
    },
    ctaBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.gold,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: radius.pill,
    },
    ctaBtnText: {
      fontFamily: font.sansBold,
      fontSize: 12,
      color: colors.ink,
      letterSpacing: 1,
    },
  });
}

function detectTier(isAuthenticated: boolean, isPremium: boolean): Tier {
  if (!isAuthenticated) return 'guest';
  return isPremium ? 'premium' : 'free';
}

function navigateFunnel(feature: FunnelFeature, tier: Tier) {
  const connectTarget = {
    pathname: '/(tabs)/connect' as const,
    params: { topic: feature },
  };

  if (tier === 'guest') {
    router.push({
      pathname: '/auth/register',
      params: { next: `/(tabs)/connect?topic=${feature}` },
    } as any);
    return;
  }

  router.push(connectTarget as any);
}

export default function ConsultantFunnelCTA({
  feature,
  intensity = 'heavy',
  context: _context,
  tier,
}: Props) {
  const { i18n } = useTranslation();
  const isTr = i18n.language === 'tr';
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { colors } = theme;
  const { isAuthenticated, authHydrating } = useAuth();
  const { isPremium, loading: premiumLoading } = usePremium();

  if (intensity === 'none' || authHydrating || premiumLoading) return null;

  const resolvedTier = tier ?? detectTier(isAuthenticated, isPremium);
  const cfg = getFunnelConfig(feature);
  const categoryLabel = isTr ? cfg.headlineTr : cfg.headlineEn;

  const headline = (() => {
    if (resolvedTier === 'guest') return isTr ? 'Üye ol — ilk yorum %50 indirimli' : 'Sign up — 50% off first reading';
    if (resolvedTier === 'free') return isTr ? 'Derin analiz ister misin?' : 'Want a deeper analysis?';
    return isTr ? 'Bir uzmanla görüş' : 'Talk to an expert';
  })();

  const description = (() => {
    if (resolvedTier === 'guest') {
      return isTr
        ? `Hesabını aç, ${categoryLabel.toLowerCase()} ile birebir görüş. İlk seansa özel %50 indirim.`
        : 'Create an account and meet our experts one-on-one. 50% off your first session.';
    }
    if (resolvedTier === 'free') {
      return isTr
        ? `Yapay zeka yorumun yeterli mi? Onaylı ${categoryLabel.toLowerCase()} ile sesli veya görüntülü görüş.`
        : `Is the AI reading enough? Connect with verified experts via voice or video.`;
    }
    return isTr
      ? 'Premium üyeliğinle ek seans avantajların var.'
      : 'You have additional session perks with your premium plan.';
  })();

  const ctaLabel = (() => {
    if (resolvedTier === 'guest') return isTr ? 'Üye Ol' : 'Sign Up';
    return isTr ? 'Danışman Seç' : 'Choose a Consultant';
  })();

  const onPress = () => navigateFunnel(feature, resolvedTier);

  if (intensity === 'light') {
    return (
      <View style={styles.lightWrap}>
        <Text style={styles.lightDesc}>{description}</Text>
        <Pressable style={styles.lightLink} onPress={onPress}>
          <Text style={styles.lightLinkText}>{ctaLabel}</Text>
          <ArrowRight size={14} color={colors.goldDeep} />
        </Pressable>
      </View>
    );
  }

  const Icon = resolvedTier === 'guest' ? UserPlus : resolvedTier === 'premium' ? Crown : Sparkles;

  return (
    <View style={styles.heavyCard}>
      <View style={styles.heavyRow}>
        <View style={styles.iconBox}>
          <Icon size={24} color={colors.gold} />
        </View>
        <View style={styles.heavyBody}>
          <Text style={styles.kicker}>{categoryLabel.toUpperCase()}</Text>
          <Text style={styles.headline}>{headline}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
      <Pressable style={styles.ctaBtn} onPress={onPress}>
        <Text style={styles.ctaBtnText}>{ctaLabel}</Text>
        <ArrowRight size={16} color={colors.ink} />
      </Pressable>
    </View>
  );
}
