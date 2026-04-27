import { useCallback, useEffect, useMemo, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius, shadows } from '@/theme/tokens';
import { useAuth } from '@/hooks/useAuth';
import { creditsApi } from '@/lib/api';
import type { CreditMe, CreditPackage, CreditTransaction } from '@/types';

function formatMoneyMinor(value: number, currency: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `0 ${currency}`;
  return `${(amount / 100).toFixed(2)} ${currency}`;
}

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

function txTypeLabel(type: CreditTransaction['type'], t: (key: string, fallback: string) => string): string {
  switch (type) {
    case 'purchase':
      return t('profile.creditTxPurchase', 'Kredi Yükleme');
    case 'consumption':
      return t('profile.creditTxConsumption', 'Kredi Tüketimi');
    case 'refund':
      return t('profile.creditTxRefund', 'İade');
    case 'bonus':
      return t('profile.creditTxBonus', 'Bonus');
    case 'adjustment':
      return t('profile.creditTxAdjustment', 'Düzeltme');
    default:
      return t('profile.creditTxOther', 'Diğer');
  }
}

export default function CreditsScreen() {
  const { t } = useTranslation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [creditMe, setCreditMe] = useState<CreditMe | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [purchasingPackageId, setPurchasingPackageId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);

    try {
      const [me, pkgList] = await Promise.all([
        creditsApi.me(),
        creditsApi.packages(),
      ]);
      setCreditMe(me);
      setPackages(pkgList);
    } catch (err: any) {
      console.error('Failed to load credit data:', err);
      Alert.alert(t('common.error'), err?.message || t('profile.creditLoadError', 'Veriler yüklenemedi.'));
      setCreditMe(null);
      setPackages([]);
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const transactionItems = useMemo<CreditTransaction[]>(() => creditMe?.recent_transactions ?? [], [creditMe]);

  const onPurchase = async (pkg: CreditPackage) => {
    setPurchasingPackageId(pkg.id);
    try {
      const result = await creditsApi.purchase(pkg.id, 'iyzipay');
      const data = (result as { data: Record<string, unknown> }).data || result;
      const checkout = typeof data?.checkout_url === 'string' ? data.checkout_url : '';

      if (checkout) {
        await Linking.openURL(checkout);
        return;
      }

      await load();
      Alert.alert(
        t('profile.creditPurchaseInitiatedTitle', 'İşlem başlatıldı'),
        t('profile.creditPurchaseInitiatedMessage', 'Kredi paketi oluşturuldu, ödeme akışını tamamlayın.'),
      );
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.message || t('profile.creditPurchaseError', 'Kredi paketi açılamadı.'));
    } finally {
      setPurchasingPackageId(null);
    }
  };

  if (authLoading || (loading && !refreshing)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.amethyst} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amethyst} />}
      >
        <Text style={styles.title}>{t('profile.creditsTitle')}</Text>
        <Text style={styles.subtitle}>{t('profile.creditsDescription')}</Text>

        <View style={styles.balanceCard}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('profile.creditsBalance')}</Text>
            <Text style={styles.rowValue}>
              {creditMe ? `${creditMe.balance} ${creditMe.currency}` : '-'}
            </Text>
          </View>
          <View style={styles.divider} />
          <Pressable style={styles.primaryButton} onPress={() => router.push('/bookings')}>
            <Text style={styles.primaryButtonText}>{t('profile.goToBookings', 'Randevularıma Git')}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>{t('profile.creditsPackagesTitle')}</Text>
        {packages.length > 0 ? (
          packages.map((pkg) => (
            <View key={pkg.id} style={styles.packageCard}>
              <View style={styles.row}>
                <Text style={styles.packageName}>{pkg.name_tr}</Text>
                <Text style={styles.packagePrice}>
                  {formatMoneyMinor(pkg.price_minor, pkg.currency)}
                </Text>
              </View>
              <Text style={styles.packageDescription}>
                {pkg.description_tr || `${pkg.credits} kredi + ${pkg.bonus_credits} bonus`}
              </Text>
              <View style={styles.packageMetaRow}>
                <Text style={styles.packageMeta}>
                  {t('profile.creditsTotal', { count: pkg.credits + (pkg.bonus_credits || 0) })}
                </Text>
                <Text style={styles.packageMeta}>
                  {pkg.bonus_credits > 0 ? t('profile.creditsBonus', { count: pkg.bonus_credits }) : ''}
                </Text>
              </View>
              <Pressable
                style={styles.packageButton}
                onPress={() => onPurchase(pkg)}
                disabled={purchasingPackageId === pkg.id}
              >
                {purchasingPackageId === pkg.id ? (
                  <ActivityIndicator color={colors.stardust} />
                ) : (
                  <Text style={styles.packageButtonText}>{t('profile.creditsBuyNow')}</Text>
                )}
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{t('profile.creditsNoPackages')}</Text>
        )}

        <Text style={styles.sectionTitle}>{t('profile.creditsTransactions')}</Text>
        {transactionItems.length > 0 ? (
          transactionItems.map((tx) => (
            <View key={tx.id} style={styles.transactionCard}>
              <View style={styles.transactionRow}>
                <Text style={styles.transactionType}>{txTypeLabel(tx.type, t)}</Text>
                <Text style={[styles.transactionAmount, tx.amount < 0 ? styles.debit : styles.credit]}>
                  {tx.amount > 0 ? `+${tx.amount}` : `${tx.amount}`} {t('profile.creditsUnit')}
                </Text>
              </View>
              <Text style={styles.transactionDescription}>{tx.description || tx.type}</Text>
              <View style={styles.transactionMeta}>
                <Text style={styles.transactionDate}>{formatDate(tx.created_at)}</Text>
                <Text style={styles.transactionBalance}>{t('profile.creditsBalanceAfter', { count: tx.balance_after })}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{t('profile.creditsNoTransactions')}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.midnight,
  },
  scroll: {
    padding: spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.midnight,
  },
  title: {
    color: colors.stardust,
    fontFamily: font.display,
    fontSize: 28,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.muted,
    marginBottom: spacing.lg,
    fontFamily: font.sans,
    fontSize: 13,
  },
  sectionTitle: {
    color: colors.gold,
    fontFamily: font.sansBold,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontSize: 12,
  },
  balanceCard: {
    padding: spacing.lg,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    gap: spacing.sm,
    ...shadows.soft,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    color: colors.muted,
    fontFamily: font.sans,
    fontSize: 14,
  },
  rowValue: {
    color: colors.stardust,
    fontFamily: font.sansBold,
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lineSoft,
    marginVertical: spacing.sm,
  },
  primaryButton: {
    borderRadius: radius.pill,
    backgroundColor: colors.plumSoft,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.stardust,
    fontFamily: font.sansBold,
    fontSize: 13,
  },
  packageCard: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  packageName: {
    color: colors.stardust,
    fontFamily: font.sansBold,
    fontSize: 16,
  },
  packagePrice: {
    color: colors.gold,
    fontFamily: font.sansMedium,
    fontSize: 14,
  },
  packageDescription: {
    color: colors.muted,
    fontFamily: font.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  packageMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  packageMeta: {
    color: colors.mutedSoft,
    fontFamily: font.sans,
    fontSize: 12,
  },
  packageButton: {
    marginTop: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.amethyst,
    paddingVertical: 11,
    alignItems: 'center',
  },
  packageButtonText: {
    color: colors.stardust,
    fontFamily: font.sansBold,
    fontSize: 14,
  },
  transactionCard: {
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    gap: spacing.xs,
    ...shadows.soft,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionType: {
    color: colors.stardust,
    fontFamily: font.sansMedium,
    fontSize: 14,
  },
  transactionAmount: {
    fontFamily: font.sansBold,
    fontSize: 14,
  },
  credit: { color: colors.success },
  debit: { color: colors.danger },
  transactionDescription: {
    color: colors.muted,
    fontFamily: font.sans,
    fontSize: 12,
  },
  transactionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionDate: {
    color: colors.mutedSoft,
    fontFamily: font.sans,
    fontSize: 11,
  },
  transactionBalance: {
    color: colors.gold,
    fontFamily: font.sansMedium,
    fontSize: 11,
  },
  emptyText: {
    color: colors.muted,
    fontFamily: font.sans,
    fontSize: 13,
    paddingVertical: spacing.md,
  },
});
