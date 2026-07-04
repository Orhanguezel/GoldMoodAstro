import { useEffect, useMemo, useState } from 'react';
import { Redirect } from 'expo-router';
import Constants from 'expo-constants';
import { View, ActivityIndicator, StyleSheet, Text, Pressable, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { storage } from '@/lib/storage';
import { siteSettingsApi } from '@/lib/api';

import { useAppTheme, type AppTheme } from '@/theme';

function buildScreenStyles(t: AppTheme) {
  const { colors, font, spacing, radius } = t;
  return StyleSheet.create({
    wrap: {
      flex: 1,
      backgroundColor: colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    updateCard: {
      margin: spacing.xl,
      padding: spacing.xl,
      borderRadius: radius.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      gap: spacing.md,
      alignItems: 'center',
    },
    updateTitle: {
      fontFamily: font.display,
      fontSize: 24,
      color: colors.text,
      textAlign: 'center',
    },
    updateText: {
      fontFamily: font.sans,
      fontSize: 14,
      lineHeight: 21,
      color: colors.textDim,
      textAlign: 'center',
    },
    updateBtn: {
      marginTop: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: colors.gold,
    },
    updateBtnText: {
      fontFamily: font.sansBold,
      fontSize: 14,
      color: colors.ink,
    },
  });
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((part) => Number(part) || 0);
  const pb = b.split('.').map((part) => Number(part) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Kök giriş: onboarded → (tabs) değilse → onboarding.
 */
export default function Index() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => buildScreenStyles(theme), [theme]);

  const [target, setTarget] = useState<string | null>(null);
  const [forceUpdateUrl, setForceUpdateUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const currentVersion = Constants.expoConfig?.version ?? '0.0.0';
      const policy = await siteSettingsApi.getMobileVersionPolicy().catch(() => null);
      if (policy?.minVersion && compareVersions(currentVersion, policy.minVersion) < 0) {
        setForceUpdateUrl(policy.updateUrl ?? (Constants.expoConfig?.extra as { publicUrl?: string } | undefined)?.publicUrl ?? null);
        return;
      }

      const onboarded = await storage.isOnboarded();
      setTarget(onboarded ? '/(tabs)/today' : '/onboarding');
    })();
  }, []);

  if (forceUpdateUrl) {
    return (
      <View style={styles.wrap}>
        <View style={styles.updateCard}>
          <Text style={styles.updateTitle}>{t('forceUpdate.title', 'Güncelleme gerekli')}</Text>
          <Text style={styles.updateText}>
            {t('forceUpdate.body', "GoldMoodAstro'nun bu sürümü artık desteklenmiyor. Devam etmek için uygulamayı güncelleyin.")}
          </Text>
          <Pressable style={styles.updateBtn} onPress={() => Linking.openURL(forceUpdateUrl).catch(() => {})}>
            <Text style={styles.updateBtnText}>{t('forceUpdate.cta', 'Güncelle')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!target) {
    return (
      <View style={styles.wrap}>
        <ActivityIndicator color={theme.colors.gold} />
      </View>
    );
  }
  return <Redirect href={target as '/(tabs)/today' | '/onboarding'} />;
}
