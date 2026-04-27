import React, { useState, useCallback } from 'react';
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
import { router } from 'expo-router';

import { colors, font, radius, spacing } from '@/theme/tokens';
import { readingsApi } from '@/lib/api';
import { useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');

const MOODS = [
  { id: 'happy', icon: Smile, label: 'Mutlu' },
  { id: 'calm', icon: Heart, label: 'Huzurlu' },
  { id: 'neutral', icon: Meh, label: 'Nötr' },
  { id: 'sad', icon: CloudRain, label: 'Hüzünlü' },
  { id: 'stressed', icon: Frown, label: 'Gergin' },
];

export default function DailyReadingScreen() {
  const [reading, setReading] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const weekDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 3 + i);
    return d;
  });

  const loadReading = useCallback(async () => {
    setLoading(true);
    try {
      // In real app, date param would be used
      const data = await readingsApi.daily();
      setReading(data);
    } catch (err) {
      console.error('Reading load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReading();
    }, [loadReading])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadReading();
  };

  if (loading && !refreshing) {
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
            <View>
              <Text style={styles.headerKicker}>GÜNLÜK REHBER</Text>
              <Text style={styles.headerTitle}>Gök Günlüğü</Text>
            </View>
            <View style={styles.calendarNav}>
              <Pressable style={styles.navBtn}><ChevronLeft size={20} color={colors.gold} /></Pressable>
              <Text style={styles.monthText}>NİSAN</Text>
              <Pressable style={styles.navBtn}><ChevronRight size={20} color={colors.gold} /></Pressable>
            </View>
          </View>

          {/* Date Picker */}
          <View style={styles.weekContainer}>
            {weekDates.map((d, i) => {
              const isSelected = d.toDateString() === currentDate.toDateString();
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <Pressable 
                  key={i} 
                  onPress={() => setCurrentDate(d)}
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
              {reading?.title || 'İçsel dengeni bulmak için sessizliğe odaklan.'}
            </Text>

            <View style={styles.readingBodyWrapper}>
              <Text style={styles.readingBody}>
                {reading?.content || 'Bugün Ay\'ın Boğa burcundaki seyri, seni daha köklü ve güvenli hissetmeye davet ediyor. Maddi konular veya ev hayatınla ilgili yarım kalmış işleri tamamlamak için mükemmel bir zaman.\n\nVenüs\'ün uyumlu açısı, ikili ilişkilerde beklediğin o yumuşak geçişi sağlayabilir. Ancak Merkür\'ün konumu, imza gerektiren işlerde iki kez kontrol etmen gerektiğini hatırlatıyor.'}
              </Text>
            </View>

            <View style={styles.quoteBox}>
              <Text style={styles.quoteText}>
                "Gerçek güç, sakinlikte gizlidir."
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
                      <m.icon size={24} color={selectedMood === m.id ? colors.bgDeep : colors.goldDim} />
                    </View>
                    <Text style={[styles.moodLabel, selectedMood === m.id && styles.moodLabelSelected]}>{m.label}</Text>
                  </Pressable>
                ))}
              </View>
            </LinearGradient>
          </View>

          {/* CTA Section */}
          <View style={styles.ctaArea}>
            <Pressable style={styles.askBtn} onPress={() => router.push('/(tabs)/connect' as any)}>
              <View style={styles.askBtnContent}>
                <MessageSquare size={20} color={colors.bgDeep} />
                <View>
                  <Text style={styles.askBtnTitle}>Detaylı Yorum İster Misin?</Text>
                  <Text style={styles.askBtnSub}>Bu haritayı bir astrologla değerlendir.</Text>
                </View>
              </View>
              <ArrowRight size={20} color={colors.bgDeep} />
            </Pressable>
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
    color: colors.bgDeep,
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
    color: colors.bgDeep,
  },
  askBtnSub: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.bgDeep,
    opacity: 0.8,
  },
});
