import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { ChevronLeft, Wallet, Gift, ArrowUpRight, ArrowDownLeft, Zap } from 'lucide-react-native';

import { colors, spacing, font, radius } from '@/theme/tokens';
import { useAuth } from '@/hooks/useAuth';
import { creditsApi } from '@/lib/api';
import type { CreditMe, CreditPackage, CreditTransaction } from '@/types';

const { width } = Dimensions.get('window');

function formatMoneyMinor(value: number, currency: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `0 ${currency}`;
  return `${(amount / 100).toFixed(0)} ${currency}`;
}

export default function CreditsScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [creditMe, setCreditMe] = useState<CreditMe | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

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
      console.error('Credits load error:', err);
      setCreditMe(null);
      setPackages([]);
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

  const onPurchase = async (pkg: CreditPackage) => {
    setPurchasingId(pkg.id);
    try {
      const result = await creditsApi.purchase(pkg.id, 'iyzipay');
      const data = (result as any).data || result;
      const checkout = data?.checkout_url;

      if (checkout) {
        await Linking.openURL(checkout);
      } else {
        await load();
        Alert.alert('İşlem Başlatıldı', 'Ödeme akışını tamamlamak için yönlendirileceksiniz.');
      }
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Kredi paketi alınamadı.');
    } finally {
      setPurchasingId(null);
    }
  };

  const transactions = creditMe?.recent_transactions || [];

  if (authLoading || (loading && !refreshing)) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Kredi & Cüzdan</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
        >
          
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Wallet size={20} color={colors.gold} />
              <Text style={styles.balanceLabel}>MEVCUT BAKİYE</Text>
            </View>
            <Text style={styles.balanceValue}>
              {creditMe?.balance || 0} <Text style={styles.currency}>KREDİ</Text>
            </Text>
            <View style={styles.balanceFooter}>
              <Zap size={14} color={colors.success} />
              <Text style={styles.balanceInfo}>Anında kullanılabilir bakiyeniz.</Text>
            </View>
          </View>

          {/* Packages Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>KREDİ YÜKLE</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pkgScroll}>
              <View style={styles.pkgContainer}>
                {packages.map((pkg) => (
                  <View key={pkg.id} style={styles.pkgCard}>
                    <View style={styles.pkgTop}>
                      <Text style={styles.pkgCredits}>{pkg.credits}</Text>
                      <Text style={styles.pkgCreditsLabel}>KREDİ</Text>
                    </View>
                    {pkg.bonus_credits > 0 && (
                      <View style={styles.bonusBadge}>
                        <Gift size={10} color={colors.bgDeep} />
                        <Text style={styles.bonusText}>+{pkg.bonus_credits} BONUS</Text>
                      </View>
                    )}
                    <Text style={styles.pkgPrice}>{formatMoneyMinor(pkg.price_minor, pkg.currency)}</Text>
                    <Pressable
                      style={[styles.buyBtn, purchasingId === pkg.id && styles.btnDisabled]}
                      onPress={() => onPurchase(pkg)}
                      disabled={purchasingId === pkg.id}
                    >
                      {purchasingId === pkg.id ? <ActivityIndicator size="small" color={colors.bgDeep} /> : <Text style={styles.buyBtnText}>Satın Al</Text>}
                    </Pressable>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Transactions Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>SON İŞLEMLER</Text>
            </View>
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <View key={tx.id} style={styles.txItem}>
                  <View style={styles.txIcon}>
                    {tx.amount > 0 ? <ArrowDownLeft size={16} color={colors.success} /> : <ArrowUpRight size={16} color={colors.danger} />}
                  </View>
                  <View style={styles.txBody}>
                    <Text style={styles.txTitle}>{tx.description || (tx.amount > 0 ? 'Kredi Yükleme' : 'Kredi Harcaması')}</Text>
                    <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString('tr-TR')}</Text>
                  </View>
                  <Text style={[styles.txAmount, tx.amount > 0 ? styles.txPlus : styles.txMinus]}>
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Henüz bir işlem bulunmuyor.</Text>
              </View>
            )}
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

  // Balance Card
  balanceCard: {
    backgroundColor: colors.inkDeep,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  balanceLabel: {
    fontFamily: font.sansBold,
    fontSize: 11,
    color: colors.gold,
    letterSpacing: 2,
  },
  balanceValue: {
    fontFamily: font.display,
    fontSize: 40,
    color: colors.text,
  },
  currency: {
    fontSize: 16,
    color: colors.goldDim,
  },
  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  balanceInfo: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.textMuted,
  },

  // Sections
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionHeader: {
    marginBottom: spacing.md,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontFamily: font.sansBold,
    fontSize: 11,
    color: colors.goldDeep,
    letterSpacing: 2,
  },

  // Packages
  pkgScroll: {
    marginHorizontal: -spacing.lg,
  },
  pkgContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  pkgCard: {
    width: 140,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  pkgTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  pkgCredits: {
    fontFamily: font.display,
    fontSize: 24,
    color: colors.text,
  },
  pkgCreditsLabel: {
    fontFamily: font.sansBold,
    fontSize: 10,
    color: colors.gold,
  },
  bonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 12,
  },
  bonusText: {
    fontFamily: font.sansBold,
    fontSize: 9,
    color: colors.bgDeep,
  },
  pkgPrice: {
    fontFamily: font.sansBold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  buyBtn: {
    backgroundColor: colors.gold,
    width: '100%',
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  buyBtnText: {
    fontFamily: font.sansBold,
    fontSize: 12,
    color: colors.bgDeep,
  },

  // Transactions
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
    gap: 12,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  txBody: {
    flex: 1,
    gap: 2,
  },
  txTitle: {
    fontFamily: font.sansMedium,
    fontSize: 14,
    color: colors.text,
  },
  txDate: {
    fontFamily: font.mono,
    fontSize: 10,
    color: colors.textMuted,
  },
  txAmount: {
    fontFamily: font.sansBold,
    fontSize: 16,
  },
  txPlus: { color: colors.success },
  txMinus: { color: colors.danger },

  emptyBox: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyText: {
    fontFamily: font.sans,
    fontSize: 13,
    color: colors.textMuted,
  },
});
