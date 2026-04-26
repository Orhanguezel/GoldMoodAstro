import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { colors, radius, spacing, font, shadows } from '@/theme/tokens';

const FEATURES = [
  { tr: 'Sınırsız randevu planlama', en: 'Unlimited appointment booking' },
  { tr: 'Detaylı doğum haritası analizi', en: 'Detailed natal chart analysis' },
  { tr: 'Günlük kişiselleştirilmiş yorumlar', en: 'Daily personalized insights' },
  { tr: 'Öncelikli destek hattı', en: 'Priority support line' },
  { tr: 'Sesli görüşmelerde %20 indirim', en: '20% discount on voice calls' },
  { tr: 'Canlı yayın etkinliklerine erişim', en: 'Access to live stream events' },
];

export function PaywallSheet() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'tr';

  return (
    <View style={styles.wrap}>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.eyebrow}>GOLD PLUS</Text>
        <Text style={styles.title}>{t('paywall.title', 'Gold Plus Avantajları')}</Text>
        <Text style={styles.subtitle}>{t('paywall.subtitle', 'Mistik dünyanızı daha derinlemesine keşfedin.')}</Text>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.tr} style={styles.feature}>
              <Text style={styles.check}>✨</Text>
              <Text style={styles.featureText}>{lang === 'tr' ? f.tr : f.en}</Text>
            </View>
          ))}
        </View>

        <View style={styles.plans}>
          <Pressable style={[styles.plan, styles.planRecommended]}>
            <Text style={styles.planLabel}>{t('paywall.yearly', 'Yıllık Üyelik')}</Text>
            <Text style={styles.planBadge}>BEST VALUE</Text>
          </Pressable>
          <Pressable style={styles.plan}>
            <Text style={styles.planLabel}>{t('paywall.monthly', 'Aylık Üyelik')}</Text>
          </Pressable>
        </View>

        <Pressable style={styles.cta}>
          <Text style={styles.ctaText}>{t('paywall.subscribe', 'Şimdi Abone Ol')}</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.later}>
          <Text style={styles.laterText}>{t('paywall.later', 'Daha sonra')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'rgba(13,11,30,0.85)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.deep,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.card,
  },
  handle: { alignSelf: 'center', width: 48, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: spacing.md },
  eyebrow: { fontSize: 11, fontFamily: font.mono, color: colors.gold, letterSpacing: 2, textTransform: 'uppercase' },
  title: { fontSize: 28, fontFamily: font.display, color: colors.stardust, marginTop: 6, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.stardustDim, marginTop: 6, fontFamily: font.sans },
  features: { marginTop: spacing.lg, marginBottom: spacing.md },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  check: { fontSize: 16, width: 16 },
  featureText: { color: colors.stardust, fontSize: 14, flex: 1, fontFamily: font.sans },
  plans: { gap: spacing.sm, marginTop: spacing.md },
  plan: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planRecommended: { borderColor: colors.gold, borderWidth: 1.5 },
  planLabel: { color: colors.stardust, fontSize: 15, fontFamily: font.sansMedium },
  planBadge: {
    color: colors.midnight,
    backgroundColor: colors.gold,
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontFamily: font.mono,
    letterSpacing: 1,
  },
  cta: {
    marginTop: spacing.lg,
    backgroundColor: colors.amethyst,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.soft,
  },
  ctaText: { color: colors.stardust, fontSize: 16, fontFamily: font.sansBold },
  later: { alignItems: 'center', marginTop: spacing.md },
  laterText: { color: colors.stardustDim, fontSize: 13, fontFamily: font.sans },
});
