import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  Zap, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Award,
  ShieldCheck
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, font, radius, spacing } from '@/theme/tokens';
import { creditsApi } from '@/lib/api';

const { width } = Dimensions.get('window');

export default function CreditsScreen() {
  const [balance, setBalance] = useState(0);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);

  const loadData = async () => {
    try {
      const [b, p] = await Promise.all([
        creditsApi.getBalance(),
        creditsApi.listPackages()
      ]);
      setBalance(b.balance);
      setPackages(p);
    } catch (e) {
      console.error('Credits load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBuy = async (packageId: string) => {
    setBuyLoading(true);
    try {
      const res = await creditsApi.buy({ package_id: packageId, locale: 'tr' });
      if (res.checkout_url) {
        router.push({
          pathname: '/webview/index',
          params: { url: res.checkout_url, title: 'Kredi Yükle' }
        } as any);
      }
    } catch (e) {
      Alert.alert('Hata', 'Ödeme başlatılamadı.');
    } finally {
      setBuyLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.navHeader}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color={colors.gold} />
          </Pressable>
          <Text style={styles.navTitle}>Kredi Yükle</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.gold} />}
        >
          {/* Balance Card */}
          <LinearGradient colors={[colors.surface, colors.inkDeep]} style={styles.balanceCard}>
             <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>MEVCUT BAKİYE</Text>
                <View style={styles.balanceRow}>
                   <Zap size={20} color={colors.gold} fill={colors.gold} />
                   <Text style={styles.balanceValue}>{balance.toLocaleString()}</Text>
                   <Text style={styles.balanceUnit}>KR</Text>
                </View>
             </View>
             <TrendingUp size={40} color={colors.gold + '15'} style={styles.balanceIcon} />
          </LinearGradient>

          <Text style={styles.sectionTitle}>Paket Seçin</Text>

          {loading && !refreshing ? (
            <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.packagesGrid}>
              {packages.map((pkg) => (
                <Pressable 
                  key={pkg.id} 
                  style={[styles.pkgCard, pkg.isFeatured && styles.featuredCard]}
                  onPress={() => handleBuy(pkg.id)}
                  disabled={buyLoading}
                >
                  {pkg.isFeatured && (
                    <View style={styles.featuredBadge}>
                       <Award size={10} color={colors.bgDeep} />
                       <Text style={styles.featuredText}>POPÜLER</Text>
                    </View>
                  )}
                  
                  <Text style={styles.pkgName}>{pkg.nameTr}</Text>
                  <View style={styles.pkgValueRow}>
                    <Text style={styles.pkgCredits}>{(pkg.credits + pkg.bonusCredits).toLocaleString()}</Text>
                    <Text style={styles.pkgUnit}>KR</Text>
                  </View>

                  <View style={styles.pkgFooter}>
                    <Text style={styles.pkgPrice}>{(pkg.priceMinor / 100).toLocaleString()} ₺</Text>
                    <ChevronRight size={14} color={colors.gold} />
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.footerInfo}>
             <ShieldCheck size={16} color={colors.textMuted} />
             <Text style={styles.footerText}>Ödemeleriniz iyzico güvencesiyle korunmaktadır.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  navHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontFamily: font.display, fontSize: 20, color: colors.text },
  scrollContent: { padding: spacing.lg },
  balanceCard: { padding: 24, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.gold + '22', marginBottom: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden' },
  balanceInfo: { gap: 4 },
  balanceLabel: { fontFamily: font.sansBold, fontSize: 10, color: colors.gold, letterSpacing: 1 },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  balanceValue: { fontFamily: font.display, fontSize: 40, color: colors.text },
  balanceUnit: { fontFamily: font.sansBold, fontSize: 14, color: colors.textMuted },
  balanceIcon: { position: 'absolute', right: -10, bottom: -10 },
  sectionTitle: { fontFamily: font.display, fontSize: 18, color: colors.text, marginBottom: 16 },
  packagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  pkgCard: { width: (width - 40 - 12) / 2, backgroundColor: colors.surface, borderRadius: radius.xl, padding: 20, borderWidth: 1, borderColor: colors.lineSoft, gap: 12 },
  featuredCard: { borderColor: colors.gold + '66', backgroundColor: colors.gold + '05' },
  featuredBadge: { position: 'absolute', top: -10, left: 20, backgroundColor: colors.gold, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: 4 },
  featuredText: { fontFamily: font.sansBold, fontSize: 9, color: colors.bgDeep },
  pkgName: { fontFamily: font.sansBold, fontSize: 12, color: colors.textMuted, letterSpacing: 0.5 },
  pkgValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  pkgCredits: { fontFamily: font.display, fontSize: 24, color: colors.text },
  pkgUnit: { fontFamily: font.sansBold, fontSize: 10, color: colors.textMuted },
  pkgFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.lineSoft },
  pkgPrice: { fontFamily: font.sansBold, fontSize: 14, color: colors.gold },
  footerInfo: { marginTop: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  footerText: { fontFamily: font.sans, fontSize: 11, color: colors.textMuted },
});
