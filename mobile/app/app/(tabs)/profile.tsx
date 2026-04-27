import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius, shadows } from '@/theme/tokens';
import { useAuth } from '@/hooks/useAuth';
import { subscriptionsApi, creditsApi } from '@/lib/api';
import type { CreditMe, Subscription } from '@/types';

type TicketLike = {
  label: string;
  value: string;
  muted?: boolean;
};

function formatDate(value?: string | null): string {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isActive(status?: string | null): boolean {
  return status === 'active' || status === 'grace_period';
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [credits, setCredits] = useState<CreditMe | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [subscriptionData, creditsData] = await Promise.all([
        subscriptionsApi.me(),
        creditsApi.me(),
      ]);
      setSubscription(subscriptionData);
      setCredits(creditsData);
    } catch (err) {
      console.error('Profile data fetch failed:', err);
      setSubscription(null);
      setCredits(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      if (authLoading) return;
      if (!isAuthenticated) {
        router.replace('/auth/login');
        return;
      }
      loadData();
    }, [authLoading, isAuthenticated, loadData]),
  );

  useEffect(() => {
    if (!authLoading && isAuthenticated === false) {
      router.replace('/auth/login');
    }
  }, [authLoading, isAuthenticated]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    setCancelLoading(true);
    try {
      const response = await subscriptionsApi.cancel();
      const next = response.data;
      setSubscription(next ?? null);
      Alert.alert(
        t('profile.subscriptionCanceledTitle', 'Abonelik iptal edildi'),
        t('profile.subscriptionCanceledBody', 'İptal talebiniz işlendi, dönüm süresi bitene kadar erişiminiz devam eder.'),
      );
      await loadData();
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.message || t('profile.subscriptionCancelError', 'İptal yapılamadı'));
    } finally {
      setCancelLoading(false);
    }
  };

  if (authLoading || (loading && !refreshing)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.amethyst} />
      </View>
    );
  }

  const status = subscription?.status || 'inactive';
  const creditLabel = credits ? `${credits.balance} ${credits.currency}` : '-';

  const subscriptionStatusLabel = (() => {
    if (!subscription) {
      return t('profile.subscriptionStatusInactive', 'YOK');
    }
    if (isActive(status)) return t('profile.subscriptionStatusActive', 'Aktif');
    if (status === 'pending') return t('profile.subscriptionStatusPending', 'Hazırlanıyor');
    if (status === 'cancelled') return t('profile.subscriptionStatusCancelled', 'İptal Edildi');
    if (status === 'expired') return t('profile.subscriptionStatusExpired', 'Süresi Doldu');
    return t('profile.subscriptionStatusUnknown', 'Durum Belirsiz');
  })();

  const subscriptionBadges: TicketLike[] = [
    { label: t('profile.subscriptionLabel'), value: subscription?.plan_id ? t('profile.subscriptionActivePlan', 'Aktif Plan') : t('profile.subscriptionNoPlan', 'Abonelik Yok') },
    { label: t('profile.subscriptionExpiresLabel', 'Bitiş'), value: formatDate(subscription?.ends_at) },
    { label: t('profile.subscriptionStatusLabel', 'Durum'), value: subscriptionStatusLabel, muted: !isActive(status) },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold} />}
      >
        <Text style={styles.title}>{t('profile.title')}</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.full_name || t('profile.noName', 'Misafir')}</Text>
            <Text style={styles.email}>{user?.email || ''}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('profile.subscriptionCardTitle', 'Abonelik')}</Text>
            <Text style={styles.cardPrice}>{status === 'active' ? t('profile.subscriptionActive', 'Aktif') : t('profile.subscriptionInactive', 'Pasif')}</Text>
          </View>

          {subscriptionBadges.map((row) => (
            <View key={row.label} style={styles.badgeRow}>
              <Text style={styles.badgeLabel}>{row.label}</Text>
              <Text style={[styles.badgeValue, row.muted ? styles.muted : undefined]}>{row.value}</Text>
            </View>
          ))}

          <View style={styles.actions}>
            <Pressable style={styles.primaryButton} onPress={() => router.push('/profile/subscription')}>
              <Text style={styles.primaryButtonText}>{t('profile.subscriptionManage', 'Aboneliği Yönet')}</Text>
            </Pressable>
            {isActive(status) ? (
              <Pressable
                style={[styles.dangerButton, cancelLoading ? styles.disabledButton : undefined]}
                onPress={handleCancelSubscription}
                disabled={cancelLoading}
              >
                {cancelLoading ? (
                  <ActivityIndicator color={colors.stardust} />
                ) : (
                  <Text style={styles.dangerButtonText}>{t('profile.subscriptionCancel', 'İptal Et')}</Text>
                )}
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('profile.creditsTitle', 'Kredi')}</Text>
            <Text style={styles.cardPrice}>{creditLabel}</Text>
          </View>

          <Text style={styles.cardDesc}>
            {t('profile.creditsDescription', 'Seans almak için kredinizi bu ekrandan takip edebilirsiniz.')}
          </Text>

          <Pressable style={styles.primaryButton} onPress={() => router.push('/profile/credits')}>
            <Text style={styles.primaryButtonText}>{t('profile.creditsTopUp', 'Kredi Yükle')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.midnight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safe: {
    flex: 1,
    backgroundColor: colors.midnight,
  },
  scroll: {
    padding: spacing.lg,
  },
  title: {
    color: colors.stardust,
    fontFamily: font.display,
    fontSize: 30,
    marginBottom: spacing.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.card,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.amethyst,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.stardust,
    fontFamily: font.sansBold,
    fontSize: 18,
  },
  profileInfo: { flex: 1, gap: 4 },
  name: {
    color: colors.stardust,
    fontFamily: font.display,
    fontSize: 20,
  },
  email: {
    color: colors.muted,
    fontFamily: font.sans,
    fontSize: 13,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    ...shadows.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  cardTitle: {
    color: colors.stardust,
    fontFamily: font.sansBold,
    fontSize: 18,
  },
  cardPrice: {
    color: colors.amethyst,
    fontFamily: font.sansMedium,
    fontSize: 16,
  },
  cardDesc: {
    color: colors.muted,
    fontFamily: font.sans,
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: spacing.xs,
  },
  badgeLabel: {
    color: colors.muted,
    fontFamily: font.sans,
    fontSize: 13,
  },
  badgeValue: {
    color: colors.stardust,
    fontFamily: font.sansMedium,
    fontSize: 13,
  },
  muted: {
    color: colors.mutedSoft,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.amethyst,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.stardust,
    fontFamily: font.sansBold,
    fontSize: 14,
  },
  dangerButton: {
    flex: 1,
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: colors.stardust,
    fontFamily: font.sansBold,
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
