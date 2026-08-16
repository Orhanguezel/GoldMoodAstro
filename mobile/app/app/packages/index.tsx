import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeRouterBack } from '@/lib/navigation';
import { ChevronLeft, Zap, Crown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useAppTheme, type AppTheme } from '@/theme';
import { creditsApi, subscriptionsApi } from '@/lib/api';
import { finishCreditPurchase, getIapProvider, purchaseCreditPackage } from '@/lib/iap';
import type { CreditPackage, SubscriptionPlan } from '@/types';

function buildScreenStyles(t: AppTheme) {
  const { colors, font, radius, spacing, shadows } = t;
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: font.display, fontSize: 18, color: colors.text },
  scroll: { padding: 24, gap: 32 },
  hero: { alignItems: 'center', gap: 12 },
  heroTitle: { fontFamily: font.display, fontSize: 28, color: colors.text, textAlign: 'center' },
  heroSub: { fontFamily: font.serif, fontSize: 16, color: colors.textMuted, textAlign: 'center', lineHeight: 24 },
  grid: { gap: 16 },
  card: { backgroundColor: colors.surface, padding: 24, borderRadius: radius.xl * 1.5, borderWidth: 1, borderColor: colors.lineSoft, alignItems: 'center', gap: 12 },
  hotCard: { borderColor: colors.gold, borderWidth: 2, ...shadows.gold },
  hotBadge: { backgroundColor: colors.gold, paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill, position: 'absolute', top: -12 },
  hotText: { fontFamily: font.sansBold, fontSize: 10, color: colors.ink },
  pkgTitle: { fontFamily: font.sansBold, fontSize: 14, color: colors.textMuted, letterSpacing: 1 },
  creditRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  creditVal: { fontFamily: font.display, fontSize: 42, color: colors.text },
  creditLabel: { fontFamily: font.sansBold, fontSize: 14, color: colors.gold },
  pkgDesc: { fontFamily: font.serif, fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
  priceBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: radius.pill, marginTop: 8 },
  priceText: { fontFamily: font.display, fontSize: 18, color: colors.gold },
  premiumCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.gold + '15', padding: 20, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.gold + '33', gap: 16 },
  premiumIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  premiumTitle: { fontFamily: font.display, fontSize: 18, color: colors.gold },
  premiumSub: { fontFamily: font.sans, fontSize: 12, color: colors.textMuted },
});
}



function formatMoney(priceMinor: number, currency: string) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency || 'TRY',
    maximumFractionDigits: 0,
  }).format((priceMinor || 0) / 100);
}

export default function PackagesScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildScreenStyles(theme), [theme]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([creditsApi.packages(), subscriptionsApi.plans()])
      .then(([creditPackages, subscriptionPlans]) => {
        if (!alive) return;
        setPackages(creditPackages.filter((pkg) => Number(pkg.is_active) === 1));
        setPlans(subscriptionPlans.filter((plan) => Number(plan.is_active) === 1));
      })
      .catch((err) => {
        Alert.alert(t('common.error', 'Bir hata oluştu'), err instanceof Error ? err.message : t('common.genericError', 'Bir hata oluştu. Lütfen tekrar deneyin.'));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [t]);

  const popularPlan = plans.find((plan) => plan.period === 'monthly') ?? plans[0] ?? null;

  const buyPackage = async (pkg: CreditPackage) => {
    setPurchasingId(pkg.id);
    try {
      if (Platform.OS !== 'web') {
        const provider = getIapProvider();
        if (!provider) {
          Alert.alert(t('common.error', 'Bir hata oluştu'), t('credits.iapUnsupported', 'Bu platformda mağaza satın alımı desteklenmiyor.'));
          return;
        }

        const purchase = await purchaseCreditPackage(pkg);
        const hasReceiptPayload = provider === 'apple_iap'
          ? Boolean(purchase.receipt)
          : Boolean(purchase.purchaseToken && purchase.productId);
        if (!purchase.ok || !hasReceiptPayload) {
          Alert.alert(t('common.error', 'Bir hata oluştu'), purchase.message || t('credits.purchaseError', 'Kredi paketi satın alınamadı.'));
          return;
        }

        await creditsApi.verifyReceipt({
          package_id: pkg.id,
          platform: provider,
          receipt: purchase.receipt ?? '',
          transaction_id: purchase.transactionId,
          purchase_token: purchase.purchaseToken,
          product_id: purchase.productId,
        });
        await finishCreditPurchase(purchase);
        Alert.alert(t('common.success', 'Başarılı'), t('credits.iapSuccessBody', 'Krediler hesabınıza eklendi.'));
        return;
      }

      const result = await creditsApi.buy({ package_id: pkg.id, locale: 'tr' });
      if (result.checkout_url) {
        await Linking.openURL(result.checkout_url);
      } else {
        Alert.alert(t('common.success', 'Başarılı'), t('credits.purchaseStartedBody', 'Ödeme işlemini tamamlamak için yönlendirileceksiniz.'));
      }
    } catch (err) {
      Alert.alert(t('common.error', 'Bir hata oluştu'), err instanceof Error ? err.message : t('credits.purchaseError', 'Kredi paketi satın alınamadı.'));
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => safeRouterBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={colors.gold} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('packages.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.hero}>
             <Zap size={48} color={colors.gold} />
             <Text style={styles.heroTitle}>{t('packages.heroTitle')}</Text>
             <Text style={styles.heroSub}>{t('packages.heroSub')}</Text>
          </View>

          <View style={styles.grid}>
             {loading ? (
               <ActivityIndicator color={colors.gold} />
             ) : packages.length === 0 ? (
               <Text style={styles.pkgDesc}>{t('profile.creditsNoPackages', 'Aktif kredi paketi bulunamadı.')}</Text>
             ) : packages.map((pkg) => (
               <Pressable
                 key={pkg.id}
                 style={[styles.card, Number(pkg.is_featured) === 1 && styles.hotCard]}
                 onPress={() => buyPackage(pkg)}
                 disabled={purchasingId === pkg.id}
               >
                  {Number(pkg.is_featured) === 1 && <View style={styles.hotBadge}><Text style={styles.hotText}>{t('packages.mostPopular')}</Text></View>}
                  <Text style={styles.pkgTitle}>{pkg.name_tr || pkg.name_en || pkg.code}</Text>
                  <View style={styles.creditRow}>
                     <Text style={styles.creditVal}>{pkg.credits + (pkg.bonus_credits || 0)}</Text>
                     <Text style={styles.creditLabel}>{t('packages.creditUnit')}</Text>
                  </View>
                  <Text style={styles.pkgDesc}>{pkg.description_tr || pkg.description_en || t('profile.creditsTotal', 'Toplam: {{count}} kredi', { count: pkg.credits })}</Text>
                  <View style={styles.priceBtn}>
                     {purchasingId === pkg.id ? (
                       <ActivityIndicator color={colors.gold} />
                     ) : (
                       <Text style={styles.priceText}>{formatMoney(pkg.price_minor, pkg.currency)}</Text>
                     )}
                  </View>
               </Pressable>
             ))}
          </View>

          <Pressable style={styles.premiumCard} onPress={() => router.push('/profile/subscription' as any)}>
             <View style={styles.premiumIcon}><Crown size={24} color={colors.ink} /></View>
             <View style={{ flex: 1 }}>
                <Text style={styles.premiumTitle}>GoldMood Premium</Text>
                <Text style={styles.premiumSub}>
                  {popularPlan
                    ? `${popularPlan.name_tr || popularPlan.name_en} · ${formatMoney(popularPlan.price_minor, popularPlan.currency)}`
                    : t('packages.premiumBannerSub')}
                </Text>
             </View>
             <ChevronRight size={20} color={colors.gold} />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ChevronRight({ size, color }: { size: number, color: string }) {
  return (
    <View style={{ transform: [{ rotate: '-180deg' }] }}>
      <ChevronLeft size={size} color={color} />
    </View>
  );
}
