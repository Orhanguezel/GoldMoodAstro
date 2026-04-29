import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, CreditCard, Star, Zap, Crown } from 'lucide-react-native';
import { colors, font, radius, spacing, shadows } from '@/theme/tokens';

const PACKAGES = [
  { id: 'p1', title: 'Mini Paket', credits: 250, price: '₺149', desc: '1 Detaylı Analiz' },
  { id: 'p2', title: 'Standart Paket', credits: 1000, price: '₺499', desc: '4 Detaylı Analiz + Hediye', hot: true },
  { id: 'p3', title: 'Premium Paket', credits: 5000, price: '₺1999', desc: 'Sınırsız Deneyim' },
];

export default function PackagesScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color={colors.gold} />
          </Pressable>
          <Text style={styles.headerTitle}>Kredi Paketleri</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.hero}>
             <Zap size={48} color={colors.gold} />
             <Text style={styles.heroTitle}>Kozmik Gücünü Artır</Text>
             <Text style={styles.heroSub}>Analizler, raporlar ve derin sırlar için kredi yükleyin.</Text>
          </View>

          <View style={styles.grid}>
             {PACKAGES.map((pkg) => (
               <Pressable key={pkg.id} style={[styles.card, pkg.hot && styles.hotCard]}>
                  {pkg.hot && <View style={styles.hotBadge}><Text style={styles.hotText}>EN POPÜLER</Text></View>}
                  <Text style={styles.pkgTitle}>{pkg.title}</Text>
                  <View style={styles.creditRow}>
                     <Text style={styles.creditVal}>{pkg.credits}</Text>
                     <Text style={styles.creditLabel}>KREDİ</Text>
                  </View>
                  <Text style={styles.pkgDesc}>{pkg.desc}</Text>
                  <View style={styles.priceBtn}>
                     <Text style={styles.priceText}>{pkg.price}</Text>
                  </View>
               </Pressable>
             ))}
          </View>

          <Pressable style={styles.premiumCard}>
             <View style={styles.premiumIcon}><Crown size={24} color={colors.bgDeep} /></View>
             <View style={{ flex: 1 }}>
                <Text style={styles.premiumTitle}>GoldMood Premium</Text>
                <Text style={styles.premiumSub}>Aylık abonelik ile tüm özelliklere sınırsız erişin.</Text>
             </View>
             <ChevronRight size={20} color={colors.gold} />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDeep },
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
  hotText: { fontFamily: font.sansBold, fontSize: 10, color: colors.bgDeep },
  pkgTitle: { fontFamily: font.sansBold, fontSize: 14, color: colors.textMuted, letterSpacing: 1 },
  creditRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  creditVal: { fontFamily: font.display, fontSize: 42, color: colors.text },
  creditLabel: { fontFamily: font.sansBold, fontSize: 14, color: colors.gold },
  pkgDesc: { fontFamily: font.serif, fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
  priceBtn: { backgroundColor: colors.bgDeep, paddingHorizontal: 32, paddingVertical: 12, borderRadius: radius.pill, marginTop: 8 },
  priceText: { fontFamily: font.display, fontSize: 18, color: colors.gold },
  premiumCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.gold + '15', padding: 20, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.gold + '33', gap: 16 },
  premiumIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  premiumTitle: { fontFamily: font.display, fontSize: 18, color: colors.gold },
  premiumSub: { fontFamily: font.sans, fontSize: 12, color: colors.textMuted },
});

function ChevronRight({ size, color }: { size: number, color: string }) {
  return (
    <View style={{ transform: [{ rotate: '-180deg' }] }}>
      <ChevronLeft size={size} color={color} />
    </View>
  );
}
