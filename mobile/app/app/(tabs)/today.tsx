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
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Compass, 
  Sparkles, 
  Moon, 
  Sun, 
  Star, 
  ArrowRight,
  MessageSquareHeart 
} from 'lucide-react-native';

import { birthChartsApi, readingsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { colors, font, radius, spacing, gradients } from '@/theme/tokens';
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

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/auth/login' as any);
      return;
    }
    loadData();
  }, [authLoading, isAuthenticated, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (authLoading || loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  const mainChart = charts[0];
  const sunSign = mainChart?.chart_data?.planets?.sun?.sign_label || 'Aslan'; // Fallback
  const moonSign = mainChart?.chart_data?.planets?.moon?.sign_label || 'Boğa';

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
              <Text style={styles.greetingText}>Merhaba {mainChart?.name || 'Gezgin'}</Text>
            </View>
            <View style={styles.signBadge}>
              <Sun size={14} color={colors.gold} />
              <Text style={styles.signBadgeText}>{sunSign}</Text>
            </View>
          </View>

          {/* Daily Card */}
          <View style={styles.section}>
            <LinearGradient
              colors={gradients.darkSurface}
              style={styles.dailyCard}
            >
              <View style={styles.dailyCardHeader}>
                <Sparkles size={20} color={colors.gold} />
                <Text style={styles.dailyCardLabel}>GÜNLÜK YORUMUNUZ</Text>
              </View>
              
              {reading ? (
                <Text style={styles.readingText}>
                  {reading.reading.content}
                </Text>
              ) : (
                <View style={styles.emptyReading}>
                  <Text style={styles.emptyReadingText}>
                    Haritanıza özel yorumunuz hazırlanıyor...
                  </Text>
                  {!mainChart && (
                    <Pressable 
                      style={styles.miniBtn} 
                      onPress={() => router.push('/birth-chart' as any)}
                    >
                      <Text style={styles.miniBtnText}>Harita Oluştur</Text>
                    </Pressable>
                  )}
                </View>
              )}

              <View style={styles.dailyCardFooter}>
                <View style={styles.moonPhase}>
                  <Moon size={12} color={colors.goldDim} />
                  <Text style={styles.moonPhaseText}>Ay {moonSign} burcunda</Text>
                </View>
                <Pressable 
                  style={styles.shareBtn}
                  onPress={() => {}}
                >
                  <Text style={styles.shareBtnText}>Paylaş</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </View>

          {/* Transit Highlights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>GÖKYÜZÜ HAREKETLERİ</Text>
            <View style={styles.transitList}>
              <View style={styles.transitItem}>
                <View style={styles.transitIcon}>
                  <Star size={16} color={colors.gold} />
                </View>
                <View style={styles.transitBody}>
                  <Text style={styles.transitTitle}>Merkür Gerilemesi</Text>
                  <Text style={styles.transitDesc}>İletişimde aksaklıklara dikkat etmelisin.</Text>
                </View>
              </View>
              <View style={styles.transitItem}>
                <View style={[styles.transitIcon, { backgroundColor: colors.plum }]}>
                  <Compass size={16} color={colors.goldLight} />
                </View>
                <View style={styles.transitBody}>
                  <Text style={styles.transitTitle}>Mars - Jüpiter Üçgeni</Text>
                  <Text style={styles.transitDesc}>Enerjini yeni başlangıçlara yönlendir.</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Featured Content / Advisor CTA */}
          <Pressable 
            style={styles.featuredCard}
            onPress={() => router.push('/connect' as any)}
          >
            <LinearGradient
              colors={[colors.goldDeep, colors.gold]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.featuredGradient}
            >
              <View style={styles.featuredContent}>
                <View style={styles.featuredTextCol}>
                  <Text style={styles.featuredKicker}>ÖZEL DANIŞMANLIK</Text>
                  <Text style={styles.featuredTitle}>Aklındaki soruları{'\n'}bir uzmana sor.</Text>
                  <View style={styles.featuredBadge}>
                    <MessageSquareHeart size={12} color={colors.goldDeep} />
                    <Text style={styles.featuredBadgeText}>Canlı Sesli Görüşme</Text>
                  </View>
                </View>
                <View style={styles.featuredIconWrap}>
                  <ArrowRight size={24} color={colors.inkDeep} />
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
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  dateText: {
    fontFamily: font.sansMedium,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  greetingText: {
    fontFamily: font.display,
    fontSize: 24,
    color: colors.text,
    marginTop: 4,
  },
  signBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 6,
  },
  signBadgeText: {
    fontFamily: font.sansBold,
    fontSize: 12,
    color: colors.gold,
  },

  // Daily Card
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    fontFamily: font.display,
    fontSize: 12,
    color: colors.goldDeep,
    letterSpacing: 3,
    marginBottom: spacing.lg,
  },
  dailyCard: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dailyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.lg,
  },
  dailyCardLabel: {
    fontFamily: font.sansBold,
    fontSize: 11,
    color: colors.gold,
    letterSpacing: 2,
  },
  readingText: {
    fontFamily: font.serif,
    fontSize: 18,
    color: colors.text,
    lineHeight: 28,
    marginBottom: spacing.xl,
  },
  emptyReading: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyReadingText: {
    fontFamily: font.serif,
    fontSize: 16,
    color: colors.textDim,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  miniBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  miniBtnText: {
    fontFamily: font.sansBold,
    fontSize: 12,
    color: colors.gold,
  },
  dailyCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    paddingTop: spacing.lg,
  },
  moonPhase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moonPhaseText: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.textMuted,
  },
  shareBtn: {
    paddingVertical: 4,
  },
  shareBtnText: {
    fontFamily: font.sansBold,
    fontSize: 12,
    color: colors.goldDim,
  },

  // Transit List
  transitList: {
    gap: spacing.md,
  },
  transitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    gap: spacing.md,
  },
  transitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inkSofter,
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
    color: colors.textDim,
    marginTop: 2,
  },

  // Featured Card
  featuredCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  featuredGradient: {
    padding: spacing.xl,
  },
  featuredContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredTextCol: {
    flex: 1,
  },
  featuredKicker: {
    fontFamily: font.sansBold,
    fontSize: 10,
    color: colors.inkDeep,
    letterSpacing: 2,
    opacity: 0.8,
  },
  featuredTitle: {
    fontFamily: font.display,
    fontSize: 20,
    color: colors.inkDeep,
    marginTop: 8,
    marginBottom: 12,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.xs,
    gap: 6,
  },
  featuredBadgeText: {
    fontFamily: font.sansBold,
    fontSize: 10,
    color: colors.inkDeep,
  },
  featuredIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.lg,
  },
});
