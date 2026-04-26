import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius } from '@/theme/tokens';
import { storage } from '@/lib/storage';

const { width } = Dimensions.get('window');

export default function Onboarding() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const total = 3;
  const key = `title${step + 1}` as 'title1' | 'title2' | 'title3';
  const body = `body${step + 1}` as 'body1' | 'body2' | 'body3';

  async function done() {
    await storage.markOnboarded();
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.dots}>
          {Array.from({ length: total }).map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        <Text style={styles.title}>{t(`onboarding.${key}`)}</Text>
        <Text style={styles.body}>{t(`onboarding.${body}`)}</Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={() => (step < total - 1 ? setStep(step + 1) : done())}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>
            {step < total - 1 ? t('onboarding.next') : t('onboarding.finish')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.midnight, padding: spacing.lg },
  content: { flex: 1, justifyContent: 'center', maxWidth: width - 48 },
  dots: { flexDirection: 'row', gap: 8, marginBottom: spacing.lg },
  dot: { width: 28, height: 4, borderRadius: 2, backgroundColor: colors.line },
  dotActive: { backgroundColor: colors.amethyst },
  title: { fontSize: 36, fontFamily: font.display, color: colors.stardust, letterSpacing: -1, lineHeight: 40 },
  body: { fontSize: 16, color: colors.stardustDim, marginTop: spacing.md, lineHeight: 24, fontFamily: font.sans },
  footer: { paddingBottom: spacing.lg },
  cta: {
    backgroundColor: colors.amethyst,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  ctaText: { color: colors.stardust, fontFamily: font.sansBold, fontSize: 16 },
});
