import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useAppTheme, type AppTheme } from '@/theme';

import { logger } from '@/lib/logger';
function buildScreenStyles(t: AppTheme) {
  const { colors, font, radius, spacing } = t;
  return StyleSheet.create({
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
    gap: spacing.sm,
  },
  headerTitles: { flex: 1, minWidth: 0 },
  headerKicker: {
    fontFamily: font.sansBold,
    fontSize: 10,
    color: colors.gold,
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: font.display,
    fontSize: 28,
    color: colors.text,
  },
  calendarNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  monthText: {
    fontFamily: font.sansBold,
    fontSize: 11,
    color: colors.textDim,
    letterSpacing: 1,
  },
  navBtn: {
    padding: 2,
  },

  // Week Picker
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  dayBox: {
    alignItems: 'center',
    width: (width - 48) / 7,
  },
  dayBoxSelected: {},
  dayName: {
    fontFamily: font.sansMedium,
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  dayNameSelected: {
    color: colors.gold,
    fontFamily: font.sansBold,
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  dayCircleSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  dayCircleToday: {
    borderColor: colors.goldDim,
  },
  dayNumber: {
    fontFamily: font.sansBold,
    fontSize: 14,
    color: colors.textDim,
  },
  dayNumberSelected: {
    color: colors.ink,
  },

  // Content Card
  contentCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.xl,
  },
  readingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  readingKicker: {
    fontFamily: font.sansBold,
    fontSize: 10,
    color: colors.gold,
    letterSpacing: 3,
  },
  readingTitle: {
    fontFamily: font.display,
    fontSize: 26,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 24,
  },
  readingBodyWrapper: {
    // ...
  },
  readingBody: {
    fontFamily: font.serif,
    fontSize: 17,
    color: colors.textDim,
    lineHeight: 28,
  },
  quoteBox: {
    marginTop: 32,
    paddingHorizontal: 20,
    borderLeftWidth: 1,
    borderLeftColor: colors.gold,
  },
  quoteText: {
    fontFamily: font.serif,
    fontStyle: 'italic',
    fontSize: 18,
    color: colors.gold,
    lineHeight: 26,
  },

  // Mood Section
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  moodCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
  },
  moodTitle: {
    fontFamily: font.display,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodItem: {
    alignItems: 'center',
    gap: 8,
  },
  moodCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.inkDeep,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  moodCircleSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  moodLabel: {
    fontFamily: font.sans,
    fontSize: 11,
    color: colors.textMuted,
  },
  moodLabelSelected: {
    fontFamily: font.sansBold,
    color: colors.gold,
  },

  // CTA Area
  ctaArea: {
    paddingHorizontal: spacing.lg,
  },
  askBtn: {
    backgroundColor: colors.gold,
    padding: 16,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  askBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  askBtnTitle: {
    fontFamily: font.sansBold,
    fontSize: 15,
    color: colors.ink,
  },
  askBtnSub: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.ink,
    opacity: 0.8,
  },
  });
}

import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Smile, 
  Heart, 
  Meh, 
  CloudRain, 
  Frown,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { birthChartsApi, readingsApi } from '@/lib/api';
import { MenuHeaderButton } from '@/components/MenuHeaderButton';
import { useAuth } from '@/hooks/useAuth';

const { width } = Dimensions.get('window');

function addCalendarMonths(date: Date, delta: number): Date {
  const d = new Date(date.getTime());
  const day = d.getDate();
  d.setMonth(d.getMonth() + delta);
  if (d.getDate() < day) d.setDate(0);
  return d;
}

const MOODS = [
  { id: 'happy', icon: Smile, labelKey: 'dailyScreen.moodHappy' },
  { id: 'calm', icon: Heart, labelKey: 'dailyScreen.moodCalm' },
  { id: 'neutral', icon: Meh, labelKey: 'dailyScreen.moodNeutral' },
  { id: 'sad', icon: CloudRain, labelKey: 'dailyScreen.moodSad' },
  { id: 'stressed', icon: Frown, labelKey: 'dailyScreen.moodStressed' },
];

const DAY_KEYS = [
  'dailyScreen.dayMon',
  'dailyScreen.dayTue',
  'dailyScreen.dayWed',
  'dailyScreen.dayThu',
  'dailyScreen.dayFri',
  'dailyScreen.daySat',
  'dailyScreen.daySun',
];

export default function DailyReadingScreen() {
  const theme = useAppTheme();
  const { colors } = theme;  const styles = useMemo(() => buildScreenStyles(theme), [theme]);
  const { t } = useTranslation();

  const { isAuthenticated, loading: authLoading } = useAuth();
  const [reading, setReading] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const days = DAY_KEYS.map((k) => t(k));

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('tr-TR', { month: 'long' })
        .format(currentDate)
        .toLocaleUpperCase('tr-TR'),
    [currentDate]
  );

  const weekDates = useMemo(() => {
    const base = new Date(currentDate.getTime());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base.getTime());
      d.setDate(base.getDate() - 3 + i);
      return d;
    });
  }, [currentDate]);

  const loadReading = useCallback(async () => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setReading(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setLoading(true);
    try {
      const charts = await birthChartsApi.list();
      if (charts[0]) {
        const data = await readingsApi.daily(charts[0].id);
        setReading(data);
      } else {
        setReading(null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg !== 'no_token' && !msg.includes('401')) {
        logger.error('Reading load error:', err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, authLoading]);

  useFocusEffect(
    useCallback(() => {
      setCurrentDate(new Date());
      loadReading();
    }, [loadReading])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadReading();
  };

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
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
        >
          
          {/* Header */}
          <View style={styles.header}>
            <MenuHeaderButton />
            <View style={styles.headerTitles}>
              <Text style={styles.headerKicker}>GÜNLÜK REHBER</Text>
              <Text style={styles.headerTitle}>Gök Günlüğü</Text>
            </View>
            <View style={styles.calendarNav}>
              <Pressable
                style={styles.navBtn}
                accessibilityRole="button"
                accessibilityLabel={t('dailyScreen.prevMonth')}
                onPress={() => setCurrentDate((d) => addCalendarMonths(d, -1))}
              >
                <ChevronLeft size={20} color={colors.gold} />
              </Pressable>
              <Text style={styles.monthText}>{monthLabel}</Text>
              <Pressable
                style={styles.navBtn}
                accessibilityRole="button"
                accessibilityLabel={t('dailyScreen.nextMonth')}
                onPress={() => setCurrentDate((d) => addCalendarMonths(d, 1))}
              >
                <ChevronRight size={20} color={colors.gold} />
              </Pressable>
            </View>
          </View>

          {/* Date Picker */}
          <View style={styles.weekContainer}>
            {weekDates.map((d) => {
              const isSelected = d.toDateString() === currentDate.toDateString();
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <Pressable 
                  key={d.toISOString().slice(0, 10)} 
                  onPress={() => setCurrentDate(new Date(d.getTime()))}
                  style={[styles.dayBox, isSelected && styles.dayBoxSelected]}
                >
                  <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>{days[d.getDay() === 0 ? 6 : d.getDay() - 1]}</Text>
                  <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected, isToday && !isSelected && styles.dayCircleToday]}>
                    <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>{d.getDate()}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Main Content */}
          <View style={styles.contentCard}>
            <View style={styles.readingHeader}>
              <Sparkles size={20} color={colors.gold} />
              <Text style={styles.readingKicker}>YILDIZLARIN MESAJI</Text>
              <Sparkles size={20} color={colors.gold} />
            </View>

            <Text style={styles.readingTitle}>
              {reading?.title || t('dailyScreen.fallbackTitle')}
            </Text>

            <View style={styles.readingBodyWrapper}>
              <Text style={styles.readingBody}>
                {reading?.content || t('dailyScreen.fallbackContent')}
              </Text>
            </View>

            <View style={styles.quoteBox}>
              <Text style={styles.quoteText}>
                {t('dailyScreen.fallbackQuote')}
              </Text>
            </View>
          </View>

          {/* Mood Check-in */}
          <View style={styles.section}>
            <LinearGradient colors={[colors.surface, colors.inkDeep]} style={styles.moodCard}>
              <Text style={styles.moodTitle}>Bugün nasıl hissediyorsun?</Text>
              <View style={styles.moodRow}>
                {MOODS.map(m => (
                  <Pressable 
                    key={m.id} 
                    onPress={() => setSelectedMood(m.id)}
                    style={styles.moodItem}
                  >
                    <View style={[styles.moodCircle, selectedMood === m.id && styles.moodCircleSelected]}>
                      <m.icon size={24} color={selectedMood === m.id ? colors.ink : colors.goldDim} />
                    </View>
                    <Text style={[styles.moodLabel, selectedMood === m.id && styles.moodLabelSelected]}>{t(m.labelKey)}</Text>
                  </Pressable>
                ))}
              </View>
            </LinearGradient>
          </View>

          {/* CTA Section */}
          <View style={styles.ctaArea}>
            <Pressable
              style={styles.askBtn}
              onPress={() => router.push({
                pathname: '/(tabs)/connect',
                params: reading?.id ? { topic: `daily_reading_${reading.id}` } : undefined,
              } as any)}
            >
              <View style={styles.askBtnContent}>
                <MessageSquare size={20} color={colors.ink} />
                <View>
                  <Text style={styles.askBtnTitle}>Detaylı Yorum İster Misin?</Text>
                  <Text style={styles.askBtnSub}>Bu haritayı bir astrologla değerlendir.</Text>
                </View>
              </View>
              <ArrowRight size={20} color={colors.ink} />
            </Pressable>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

