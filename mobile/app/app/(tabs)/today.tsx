import React, { useCallback, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  ActivityIndicator, 
  Dimensions, 
  RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Sparkles, 
  Moon, 
  Sun, 
  Star, 
  ArrowRight,
  MessageSquare,
  Compass,
  Calendar,
  LayoutGrid
} from 'lucide-react-native';

import { birthChartsApi, readingsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { colors, font, radius, spacing } from '@/theme/tokens';
import type { BirthChart, DailyReadingResponse } from '@/types';

const { width } = Dimensions.get('window');

export default function TodayScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [charts, setCharts] = useState<BirthChart[]>([]);
  const [reading, setReading] = useState<DailyReadingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const rows = await birthChartsApi.list();
      setCharts(rows);
      if (rows[0]) {
        const daily = await readingsApi.daily(rows[0].id);
        setReading(daily);
      }
    } catch (error) {
      console.error('TodayScreen load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (authLoading || (loading && !refreshing)) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  const mainChart = charts[0];
  const sunSign = mainChart?.chart_data?.planets?.sun?.sign_label || 'Aslan';
  const moonSign = mainChart?.chart_data?.planets?.moon?.sign_label || 'Boğa';

  const QUICK_ACTIONS = [
    { id: 'birth', label: 'Doğum Haritası', icon: Compass, route: '/(tabs)/birth-chart', color: colors.gold },
    { id: 'daily', label: 'Günlük Yorum', icon: Calendar, route: '/(tabs)/daily', color: colors.goldDim },
    { id: 'connect', label: 'Astrologa Sor', icon: MessageSquare, route: '/(tabs)/connect', color: colors.goldDeep },
    { id: 'all', label: 'Tüm Servisler', icon: LayoutGrid, route: '/(tabs)/connect', color: colors.textMuted },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.gold} />}
        >
          
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
              <Text style={styles.greetingText}>Hoş Geldin, {mainChart?.name?.split(' ')[0] || 'Gezgin'}</Text>
            </View>
            <View style={styles.sunBadge}>
              <Sun size={14} color={colors.gold} />
              <Text style={styles.sunBadgeText}>{sunSign}</Text>
            </View>
          </View>

          {/* Daily Reading Hero */}
          <View style={styles.section}>
            <LinearGradient colors={[colors.inkDeep, colors.surface]} style={styles.readingCard}>
              <View style={styles.cardHeader}>
                <Sparkles size={18} color={colors.gold} />
                <Text style={styles.cardKicker}>BUGÜNÜN REHBERİ</Text>
              </View>

              {reading ? (
                <Text style={styles.readingText} numberOfLines={4}>
                  {reading.reading.content}
                </Text>
              ) : (
                <View style={styles.emptyReading}>
                  <Text style={styles.emptyReadingText}>Haritanıza özel yorumunuz hazırlanıyor...</Text>
                </View>
              )}

              <Pressable style={styles.readMoreBtn} onPress={() => router.push('/(tabs)/daily' as any)}>
                <Text style={styles.readMoreText}>Devamını Oku</Text>
                <ArrowRight size={14} color={colors.gold} />
              </Pressable>

              <View style={styles.cardDivider} />

              <View style={styles.cardFooter}>
                <View style={styles.moonRow}>
                  <Moon size={12} color={colors.goldDim} />
                  <Text style={styles.moonText}>Ay {moonSign} burcunda ilerliyor</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Quick Actions Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>KEŞFET</Text>
            <View style={styles.grid}>
              {QUICK_ACTIONS.map(action => (
                <Pressable 
                  key={action.id} 
                  style={styles.gridItem}
                  onPress={() => router.push(action.route as any)}
                >
                  <View style={[styles.gridIcon, { borderColor: action.color + '33' }]}>
                    <action.icon size={22} color={action.color} />
                  </View>
                  <Text style={styles.gridLabel}>{action.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Transits / Highlights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>GÖKYÜZÜ HAREKETLERİ</Text>
            <View style={styles.transitList}>
              <View style={styles.transitItem}>
                <View style={styles.transitIconWrap}>
                  <Star size={16} color={colors.gold} />
                </View>
                <View style={styles.transitBody}>
                  <Text style={styles.transitTitle}>Merkür Gerilemesi</Text>
                  <Text style={styles.transitDesc}>İletişimde aksaklıklara ve geçmişten gelen haberlere dikkat.</Text>
                </View>
              </View>
              <View style={styles.transitItem}>
                <View style={styles.transitIconWrap}>
                  <Star size={16} color={colors.goldDim} />
                </View>
                <View style={styles.transitBody}>
                  <Text style={styles.transitTitle}>Güneş - Jüpiter Üçgeni</Text>
                  <Text style={styles.transitDesc}>Şans ve bolluk kapılarını aralayan güçlü bir enerji hakim.</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Advisor CTA */}
          <Pressable style={styles.advisorCta} onPress={() => router.push('/(tabs)/connect' as any)}>
            <LinearGradient 
              colors={[colors.goldDeep, colors.gold]} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <View style={styles.ctaContent}>
                <View style={styles.ctaTextCol}>
                  <Text style={styles.ctaKicker}>DANIŞMANLIK</Text>
                  <Text style={styles.ctaTitle}>Kaderini bir uzmana sor.</Text>
                  <View style={styles.ctaBadge}>
                    <Text style={styles.ctaBadgeText}>CANLI SESLİ GÖRÜŞME</Text>
                  </View>
                </View>
                <View style={styles.ctaCircle}>
                  <ArrowRight size={24} color={colors.bgDeep} />
                </View>
              </View>
            </LinearGradient>
          </Pressable>

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
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  dateText: {
    fontFamily: font.sansMedium,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  greetingText: {
    fontFamily: font.display,
    fontSize: 26,
    color: colors.text,
    marginTop: 4,
  },
  sunBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sunBadgeText: {
    fontFamily: font.sansBold,
    fontSize: 12,
    color: colors.gold,
  },

  // Section
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    fontFamily: font.sansBold,
    fontSize: 10,
    color: colors.goldDeep,
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },

  // Reading Card
  readingCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardKicker: {
    fontFamily: font.sansBold,
    fontSize: 10,
    color: colors.gold,
    letterSpacing: 2,
  },
  readingText: {
    fontFamily: font.serif,
    fontSize: 17,
    color: colors.text,
    lineHeight: 26,
    marginBottom: 20,
  },
  emptyReading: {
    paddingVertical: 20,
  },
  emptyReadingText: {
    fontFamily: font.serif,
    fontSize: 15,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readMoreText: {
    fontFamily: font.sansBold,
    fontSize: 12,
    color: colors.gold,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.lineSoft,
    marginVertical: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moonText: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.textMuted,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: (width - 40 - 12) / 2,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    alignItems: 'center',
    gap: 12,
  },
  gridIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.inkDeep,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  gridLabel: {
    fontFamily: font.sansBold,
    fontSize: 12,
    color: colors.textDim,
  },

  // Transits
  transitList: {
    gap: 12,
  },
  transitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radius.md,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  transitIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.inkDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transitBody: {
    flex: 1,
  },
  transitTitle: {
    fontFamily: font.sansBold,
    fontSize: 14,
    color: colors.text,
  },
  transitDesc: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Advisor CTA
  advisorCta: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  ctaGradient: {
    padding: spacing.xl,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaTextCol: {
    flex: 1,
  },
  ctaKicker: {
    fontFamily: font.sansBold,
    fontSize: 10,
    color: colors.bgDeep,
    letterSpacing: 2,
    opacity: 0.8,
  },
  ctaTitle: {
    fontFamily: font.display,
    fontSize: 22,
    color: colors.bgDeep,
    marginTop: 8,
    marginBottom: 12,
  },
  ctaBadge: {
    backgroundColor: 'rgba(26, 23, 21, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.xs,
    alignSelf: 'flex-start',
  },
  ctaBadgeText: {
    fontFamily: font.sansBold,
    fontSize: 9,
    color: colors.bgDeep,
  },
  ctaCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(26, 23, 21, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 20,
  },
});
