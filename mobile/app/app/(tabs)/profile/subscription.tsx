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
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius, shadows } from '@/theme/tokens';
import { useAuth } from '@/hooks/useAuth';
import { subscriptionsApi } from '@/lib/api';
import { getIapProvider, purchaseSubscriptionPlan } from '@/lib/iap';
import type { Subscription, SubscriptionPlan } from '@/types';

function formatCurrencyMinor(value: number | string, currency = 'TRY'): string {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return `0 ${currency}`;
  return `${(number / 100).toFixed(2)} ${currency}`;
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function planName(plan: SubscriptionPlan | undefined, locale: 'tr' | 'en'): string {
  if (!plan) return '';
  return locale === 'en' ? plan.name_en : plan.name_tr;
}

export default function SubscriptionScreen() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [active, setActive] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionPlanId, setActionPlanId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const locale: 'tr' | 'en' = i18n.language === 'en' ? 'en' : 'tr';

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [planList, me] = await Promise.all([subscriptionsApi.plans(), subscriptionsApi.me()]);
      setPlans(planList);
      setActive(me);
    } catch (err: any) {
      console.error('Failed to load subscription data:', err);
      Alert.alert(t('common.error'), err?.message || t('profile.subscriptionLoadError', 'Veriler yüklenemedi'));
      setPlans([]);
      setActive(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, t]);

  useFocusEffect(
    useCallback(() => {
      if (authLoading) return;
      if (!isAuthenticated) {
        router.replace('/auth/login');
        return;
      }
      load();
    }, [authLoading, isAuthenticated, load]),
  );

  useEffect(() => {
    if (!authLoading && isAuthenticated === false) {
      router.replace('/auth/login');
    }
  }, [authLoading, isAuthenticated]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const startPlan = async (planId: string) => {
    setActionPlanId(planId);
    try {
      const plan = plans.find((item) => item.id === planId);
      if (!plan) {
        throw new Error('Plan bulunamadı.');
      }

      if (plan.price_minor <= 0) {
        const freeResult = await subscriptionsApi.start(planId, 'iyzipay');
        const data = (freeResult as { data: Record<string, unknown> }).data || freeResult;
        await load();
        if (data && data.paid !== true) {
          Alert.alert(
            t('profile.subscriptionStartedTitle', 'Abonelik aktif'),
            t('profile.subscriptionStartedMessage', 'Aboneliğiniz başarıyla aktif edildi.'),
          );
        }
        return;
      }

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const provider = getIapProvider();
        if (!provider) {
          throw new Error('Bu cihaz için IAP desteklenmiyor.');
        }

        const purchase = await purchaseSubscriptionPlan(plan);
        const verify = await subscriptionsApi.verifyReceipt({
          plan_id: plan.id,
          platform: provider,
          receipt: purchase.receipt,
          transaction_id: purchase.transactionId,
          purchase_token: purchase.purchaseToken,
          product_id: purchase.productId,
        });

        if (!verify?.data?.valid) {
          throw new Error(verify?.data?.message || 'Ödeme doğrulanamadı.');
        }

        await load();
        Alert.alert(
          t('profile.subscriptionStartedTitle', 'Abonelik aktif'),
          t('profile.subscriptionStartedMessage', 'Aboneliğiniz başarıyla aktif edildi.'),
        );
        return;
      }

      const result = await subscriptionsApi.start(planId, 'iyzipay');
      const data = (result as { data: Record<string, unknown> }).data || result;
      const checkout = typeof data?.checkout_url === 'string' ? data.checkout_url : '';

      if (checkout) {
        await Linking.openURL(checkout);
        return;
      }

      await load();
      Alert.alert(
        t('profile.subscriptionStartedTitle', 'Abonelik aktif'),
        t('profile.subscriptionStartedMessage', 'Aboneliğiniz başarıyla aktif edildi.'),
      );
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.message || t('profile.subscriptionStartError', 'Abonelik başlatılamadı'));
    } finally {
      setActionPlanId(null);
    }
  };

  const cancelNow = async () => {
    if (!active) return;
    setIsCancelling(true);
    try {
      await subscriptionsApi.cancel();
      await load();
      Alert.alert(
        t('profile.subscriptionCanceledTitle', 'Abonelik iptal edildi'),
        t('profile.subscriptionCanceledBody', 'İptal talebiniz işlendi, dönem sonuna kadar erişiminiz devam eder.'),
      );
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.message || t('profile.subscriptionCancelError', 'İptal edilemedi'));
    } finally {
      setIsCancelling(false);
    }
  };

  if (authLoading || (loading && !refreshing)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.amethyst} />
      </View>
    );
  }

  const activePlan = plans.find((plan) => plan.id === active?.plan_id);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.amethyst} />}
      >
        <Text style={styles.title}>{t('profile.subscriptionDetailTitle')}</Text>
        <Text style={styles.subtitle}>{t('profile.subscriptionDetailSubtitle')}</Text>

        {active ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('profile.currentPlan')}</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('profile.currentPlanLabel')}</Text>
              <Text style={styles.rowValue}>
                {activePlan ? planName(activePlan, locale) : active.plan_id}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('profile.status')}</Text>
              <Text style={styles.rowValue}>{t(`profile.status_${active.status}`)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('profile.subscriptionStartedLabel')}</Text>
              <Text style={styles.rowValue}>{formatDate(active.started_at)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('profile.subscriptionExpiresLabel')}</Text>
              <Text style={styles.rowValue}>{formatDate(active.ends_at)}</Text>
            </View>
            {['active', 'grace_period', 'pending'].includes(active.status) ? (
              <Pressable
                style={styles.cancelButton}
                onPress={cancelNow}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator color={colors.stardust} />
                ) : (
                  <Text style={styles.cancelButtonText}>{t('profile.subscriptionCancel')}</Text>
                )}
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>{t('profile.choosePlanTitle')}</Text>
        {plans.map((plan) => {
          const isActivePlan = active?.plan_id === plan.id && ['active', 'grace_period'].includes(active?.status || '');
          return (
            <View key={plan.id} style={[styles.card, isActivePlan ? styles.activeCard : undefined]}>
              <View style={styles.row}>
                <Text style={styles.rowLabelStrong}>{planName(plan, locale)}</Text>
                <Text style={styles.rowValue}>{formatCurrencyMinor(plan.price_minor, plan.currency)}</Text>
              </View>

              <Text style={styles.planDescription}>
                {locale === 'en'
                  ? (plan.description_en || '')
                  : (plan.description_tr || '')}
              </Text>

              <Pressable
                style={isActivePlan ? styles.disabledButton : styles.primaryButton}
                onPress={() => startPlan(plan.id)}
                disabled={actionPlanId === plan.id || isActivePlan}
              >
                {actionPlanId === plan.id ? (
                  <ActivityIndicator color={colors.stardust} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {isActivePlan ? t('profile.currentPlanBadge') : t('profile.startPlan')}
                  </Text>
                )}
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.midnight },
  scroll: { padding: spacing.lg },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.midnight,
  },
  title: {
    color: colors.stardust,
    fontFamily: font.display,
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.muted,
    marginBottom: spacing.lg,
    fontFamily: font.sans,
    fontSize: 14,
  },
  sectionTitle: {
    color: colors.gold,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontFamily: font.sansMedium,
    fontSize: 14,
    textTransform: 'uppercase',
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
    ...shadows.soft,
  },
  activeCard: {
    borderColor: colors.amethyst,
    borderWidth: 1.5,
  },
  cardTitle: {
    color: colors.stardust,
    fontFamily: font.sansMedium,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowLabel: {
    color: colors.muted,
    fontFamily: font.sans,
    fontSize: 13,
  },
  rowLabelStrong: {
    color: colors.stardust,
    fontFamily: font.sansBold,
    fontSize: 16,
  },
  rowValue: {
    color: colors.stardust,
    fontFamily: font.sansMedium,
    fontSize: 13,
    maxWidth: '65%',
    textAlign: 'right',
  },
  planDescription: {
    color: colors.muted,
    fontFamily: font.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  primaryButton: {
    borderRadius: radius.pill,
    backgroundColor: colors.amethyst,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  disabledButton: {
    borderRadius: radius.pill,
    backgroundColor: colors.plumSoft,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.sm,
    opacity: 0.9,
  },
  primaryButtonText: {
    color: colors.stardust,
    fontFamily: font.sansBold,
  },
  cancelButton: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.danger + '55',
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  cancelButtonText: {
    color: colors.danger,
    fontFamily: font.sansBold,
    fontSize: 14,
  },
  currentPlanBadge: {
    color: colors.gold,
    fontFamily: font.sansBold,
    textAlign: 'right',
  },
});
