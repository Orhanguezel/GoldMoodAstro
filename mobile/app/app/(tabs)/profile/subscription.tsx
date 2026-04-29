import React, { useCallback, useEffect, useState } from 'react';
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
import { ChevronLeft, Crown, Check, AlertCircle, Calendar } from 'lucide-react-native';

import { colors, spacing, font, radius } from '@/theme/tokens';
import { useAuth } from '@/hooks/useAuth';
import { subscriptionsApi } from '@/lib/api';
import { getIapProvider, purchaseSubscriptionPlan } from '@/lib/iap';
import type { Subscription, SubscriptionPlan } from '@/types';

function formatCurrencyMinor(value: number | string, currency = 'TRY'): string {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return `0 ${currency}`;
  return `${(number / 100).toFixed(0)} ${currency}`;
}

export default function SubscriptionScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [active, setActive] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [planList, me] = await Promise.all([
        subscriptionsApi.plans(), 
        subscriptionsApi.me()
      ]);
      setPlans(planList);
      setActive(me);
    } catch (err: any) {
      console.error('Subscription load error:', err);
      setPlans([]);
      setActive(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      if (authLoading) return;
      if (!isAuthenticated) {
        router.replace('/auth/login' as any);
        return;
      }
      load();
    }, [authLoading, isAuthenticated, load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const startPlan = async (plan: SubscriptionPlan) => {
    setActionId(plan.id);
    try {
      if (plan.price_minor <= 0) {
        await subscriptionsApi.start(plan.id, 'iyzipay');
        await load();
        Alert.alert('Başarılı', 'Aboneliğiniz aktif edildi.');
        return;
      }

      // IAP logic if mobile
      if (Platform.OS !== 'web') {
        const provider = getIapProvider();
        if (provider) {
          const purchase = await purchaseSubscriptionPlan(plan);
          await subscriptionsApi.verifyReceipt({
            plan_id: plan.id,
            platform: provider,
            receipt: purchase.receipt ?? '',
            transaction_id: purchase.transactionId,
            purchase_token: purchase.purchaseToken,
            product_id: purchase.productId,
          });
          await load();
          Alert.alert('Başarılı', 'Premium üyeliğiniz hayırlı olsun!');
          return;
        }
      }

      // Fallback to web checkout
      const res = await subscriptionsApi.start(plan.id, 'iyzipay');
      const checkout = (res as any).data?.checkout_url || (res as any).checkout_url;
      if (checkout) {
        await Linking.openURL(checkout);
      } else {
        await load();
      }
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'İşlem başarısız.');
    } finally {
      setActionId(null);
    }
  };

  const onCancel = async () => {
    Alert.alert(
      'Aboneliği İptal Et',
      'Premium avantajlarını kaybetmek istediğinize emin misiniz? Dönem sonuna kadar erişiminiz devam eder.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            try {
              await subscriptionsApi.cancel();
              await load();
              Alert.alert('İptal Edildi', 'Abonelik yenilemesi durduruldu.');
            } catch (err: any) {
              Alert.alert('Hata', err.message || 'İşlem başarısız.');
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (authLoading || (loading && !refreshing)) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  const activePlan = plans.find(p => p.id === active?.plan_id);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Premium Üyelik</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
        >
          
          {/* Active Status */}
          {active && (active.status === 'active' || active.status === 'grace_period') ? (
            <View style={styles.activePlanCard}>
              <View style={styles.activeHeader}>
                <View style={styles.crownCircle}>
                  <Crown size={24} color={colors.bgDeep} />
                </View>
                <View>
                  <Text style={styles.activeTitle}>{activePlan?.name_tr || 'Premium Plan'}</Text>
                  <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Abonelik Aktif</Text>
                  </View>
                </View>
              </View>

              <View style={styles.activeDivider} />

              <View style={styles.expiryRow}>
                <Calendar size={14} color={colors.textMuted} />
                <Text style={styles.expiryText}>
                  Yenileme Tarihi: <Text style={styles.bold}>{active.ends_at ? new Date(active.ends_at).toLocaleDateString('tr-TR') : 'Belirlenmedi'}</Text>
                </Text>
              </View>

              <Pressable style={styles.cancelLink} onPress={onCancel} disabled={isCancelling}>
                {isCancelling ? <ActivityIndicator size="small" color={colors.textMuted} /> : <Text style={styles.cancelLinkText}>Aboneliği Yönet veya İptal Et</Text>}
              </Pressable>
            </View>
          ) : (
            <View style={styles.promoArea}>
              <Text style={styles.promoKicker}>GOLDMOOD PREMIUM</Text>
              <Text style={styles.promoTitle}>Yıldızların rehberliğini{'\n'}kesintisiz deneyimleyin.</Text>
              <View style={styles.benefitsList}>
                {[
                  'Günlük detaylı astroloji analizleri',
                  'Doğum haritası transit etkileri',
                  'Seanslarda %10 kredi indirimi',
                  'Öncelikli destek hattı',
                ].map((b, i) => (
                  <View key={i} style={styles.benefitItem}>
                    <Check size={16} color={colors.gold} />
                    <Text style={styles.benefitText}>{b}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Plans Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PLAN SEÇİN</Text>
            {plans.map((plan) => {
              const isCurrent = active?.plan_id === plan.id;
              return (
                <View key={plan.id} style={[styles.planCard, isCurrent && styles.planCardActive]}>
                  <View style={styles.planHeader}>
                    <View>
                      <Text style={styles.planName}>{plan.name_tr}</Text>
                      <Text style={styles.planInterval}>Aylık ödeme</Text>
                    </View>
                    <View style={styles.planPriceArea}>
                      <Text style={styles.planPrice}>{formatCurrencyMinor(plan.price_minor, plan.currency)}</Text>
                      <Text style={styles.planPriceLabel}>/ay</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.planDesc}>{plan.description_tr}</Text>

                  <Pressable
                    style={[styles.planBtn, isCurrent && styles.planBtnCurrent, actionId === plan.id && styles.btnDisabled]}
                    onPress={() => startPlan(plan)}
                    disabled={isCurrent || actionId === plan.id}
                  >
                    {actionId === plan.id ? (
                      <ActivityIndicator size="small" color={colors.bgDeep} />
                    ) : (
                      <Text style={[styles.planBtnText, isCurrent && styles.planBtnTextCurrent]}>
                        {isCurrent ? 'Mevcut Planınız' : 'Hemen Başlat'}
                      </Text>
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>

          <View style={styles.infoBox}>
            <AlertCircle size={14} color={colors.textMuted} />
            <Text style={styles.infoBoxText}>
              Abonelikler otomatik olarak yenilenir. İstediğiniz zaman iptal edebilirsiniz.
            </Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safe: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  headerTitle: {
    fontFamily: font.display,
    fontSize: 18,
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },

  // Active Plan Card
  activePlanCard: {
    backgroundColor: colors.inkDeep,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  crownCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTitle: {
    fontFamily: font.display,
    fontSize: 20,
    color: colors.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  statusText: {
    fontFamily: font.sansBold,
    fontSize: 10,
    color: colors.success,
    letterSpacing: 1,
  },
  activeDivider: {
    height: 1,
    backgroundColor: 'rgba(201, 169, 97, 0.2)',
    marginVertical: 20,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  expiryText: {
    fontFamily: font.sans,
    fontSize: 13,
    color: colors.textDim,
  },
  bold: {
    fontFamily: font.sansBold,
    color: colors.text,
  },
  cancelLink: {
    alignSelf: 'center',
  },
  cancelLinkText: {
    fontFamily: font.sansBold,
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },

  // Promo Area
  promoArea: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
  },
  promoKicker: {
    fontFamily: font.sansBold,
    fontSize: 11,
    color: colors.gold,
    letterSpacing: 3,
    marginBottom: 12,
  },
  promoTitle: {
    fontFamily: font.display,
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 24,
  },
  benefitsList: {
    width: '100%',
    paddingHorizontal: 10,
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontFamily: font.sans,
    fontSize: 15,
    color: colors.textDim,
  },

  // Section
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontFamily: font.sansBold,
    fontSize: 11,
    color: colors.goldDeep,
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },

  // Plan Card
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.md,
  },
  planCardActive: {
    borderColor: colors.gold,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planName: {
    fontFamily: font.display,
    fontSize: 18,
    color: colors.text,
  },
  planInterval: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.textMuted,
  },
  planPriceArea: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontFamily: font.display,
    fontSize: 24,
    color: colors.gold,
  },
  planPriceLabel: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.textMuted,
  },
  planDesc: {
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.textDim,
    lineHeight: 20,
    marginBottom: 20,
  },
  planBtn: {
    backgroundColor: colors.gold,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBtnCurrent: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  planBtnText: {
    fontFamily: font.sansBold,
    fontSize: 14,
    color: colors.bgDeep,
  },
  planBtnTextCurrent: {
    color: colors.gold,
  },
  btnDisabled: {
    opacity: 0.6,
  },

  // Info
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: spacing.xl,
    paddingHorizontal: 10,
  },
  infoBoxText: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
    flex: 1,
  },
});
