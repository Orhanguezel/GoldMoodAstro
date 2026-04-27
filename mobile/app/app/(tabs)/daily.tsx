import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Dimensions, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Calendar as CalendarIcon, 
  Smile, 
  Meh, 
  Frown, 
  Heart, 
  CloudRain,
  ChevronLeft,
  ChevronRight 
} from 'lucide-react-native';

import { colors, font, radius, spacing } from '@/theme/tokens';

const { width } = Dimensions.get('window');

const MOODS = [
  { id: 'happy', icon: Smile, label: 'Mutlu' },
  { id: 'calm', icon: Heart, label: 'Huzurlu' },
  { id: 'neutral', icon: Meh, label: 'Nötr' },
  { id: 'sad', icon: CloudRain, label: 'Hüzünlü' },
  { id: 'stressed', icon: Frown, label: 'Gergin' },
];

export default function DailyReadingScreen() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  
  // Fake calendar dates for the week
  const weekDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 3 + i);
    return d;
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Günlük Yorum</Text>
            <View style={styles.calendarControl}>
              <Pressable style={styles.calNavBtn}>
                <ChevronLeft size={16} color={colors.textDim} />
              </Pressable>
              <Text style={styles.monthText}>Nisan 2026</Text>
              <Pressable style={styles.calNavBtn}>
                <ChevronRight size={16} color={colors.textDim} />
              </Pressable>
            </View>
          </View>

          {/* Week Calendar */}
          <View style={styles.weekCalendar}>
            {weekDates.map((date, i) => {
              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = date.toDateString() === currentDate.toDateString();
              return (
                <Pressable 
                  key={i} 
                  onPress={() => setCurrentDate(date)}
                  style={[styles.dayItem, isSelected && styles.dayItemActive]}
                >
                  <Text style={[styles.dayName, isSelected && styles.dayNameActive]}>{days[i]}</Text>
                  <View style={[styles.dayCircle, isSelected && styles.dayCircleActive, isToday && !isSelected && styles.dayCircleToday]}>
                    <Text style={[styles.dayNumber, isSelected && styles.dayNumberActive]}>{date.getDate()}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Reading Content */}
          <View style={styles.readingSection}>
            <View style={styles.readingHeader}>
              <View style={styles.line} />
              <Text style={styles.readingKicker}>GÜNÜN ENERJİSİ</Text>
              <View style={styles.line} />
            </View>

            <Text style={styles.readingTitle}>
              İçsel dengeni bulmak için{'\n'}sessizliğe odaklan.
            </Text>

            <Text style={styles.readingBody}>
              Bugün Ay'ın Boğa burcundaki seyri, seni daha köklü ve güvenli hissetmeye davet ediyor. Maddi konular veya ev hayatınla ilgili yarım kalmış işleri tamamlamak için mükemmel bir zaman. {'\n\n'}
              Venüs'ün uyumlu açısı, ikili ilişkilerde beklediğin o yumuşak geçişi sağlayabilir. Ancak Merkür'ün konumu, imza gerektiren işlerde iki kez kontrol etmen gerektiğini hatırlatıyor.
            </Text>

            <View style={styles.quoteBox}>
              <Text style={styles.quoteText}>
                "Gerçek güç, sakinlikte gizlidir."
              </Text>
            </View>
          </View>

          {/* Emotional Check-in */}
          <View style={styles.moodSection}>
            <LinearGradient
              colors={[colors.surface, colors.bgDeep]}
              style={styles.moodCard}
            >
              <Text style={styles.moodTitle}>Bugün nasıl hissediyorsun?</Text>
              <Text style={styles.moodSubtitle}>Duygularını takip etmek, haritandaki döngüleri anlamana yardımcı olur.</Text>
              
              <View style={styles.moodList}>
                {MOODS.map(mood => (
                  <Pressable 
                    key={mood.id}
                    onPress={() => setSelectedMood(mood.id)}
                    style={[styles.moodItem, selectedMood === mood.id && styles.moodItemActive]}
                  >
                    <View style={[styles.moodIconCircle, selectedMood === mood.id && styles.moodIconCircleActive]}>
                      <mood.icon size={24} color={selectedMood === mood.id ? colors.bgDeep : colors.goldDim} />
                    </View>
                    <Text style={[styles.moodLabel, selectedMood === mood.id && styles.moodLabelActive]}>
                      {mood.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {selectedMood && (
                <Pressable style={styles.moodSaveBtn}>
                  <Text style={styles.moodSaveBtnText}>Günlüğüme Kaydet</Text>
                </Pressable>
              )}
            </LinearGradient>
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
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: font.display,
    fontSize: 24,
    color: colors.text,
  },
  calendarControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 12,
  },
  calNavBtn: {
    padding: 2,
  },
  monthText: {
    fontFamily: font.sansBold,
    fontSize: 12,
    color: colors.textDim,
  },

  // Week Calendar
  weekCalendar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  dayItem: {
    alignItems: 'center',
    width: (width - 48) / 7,
  },
  dayItemActive: {
    // ...
  },
  dayName: {
    fontFamily: font.sansMedium,
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  dayNameActive: {
    color: colors.gold,
    fontFamily: font.sansBold,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dayCircleActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  dayCircleToday: {
    borderColor: colors.goldDim,
    borderWidth: 1,
  },
  dayNumber: {
    fontFamily: font.sansBold,
    fontSize: 14,
    color: colors.textDim,
  },
  dayNumberActive: {
    color: colors.bgDeep,
  },

  // Reading Section
  readingSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing['3xl'],
  },
  readingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: spacing.xl,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
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
    lineHeight: 36,
    marginBottom: spacing.xl,
  },
  readingBody: {
    fontFamily: font.serif,
    fontSize: 17,
    color: colors.textDim,
    lineHeight: 28,
  },
  quoteBox: {
    marginTop: spacing['2xl'],
    paddingLeft: spacing.lg,
    borderLeftWidth: 2,
    borderLeftColor: colors.goldDim,
  },
  quoteText: {
    fontFamily: font.serifItalic,
    fontSize: 18,
    color: colors.gold,
    fontStyle: 'italic',
  },

  // Mood Section
  moodSection: {
    paddingHorizontal: spacing.lg,
  },
  moodCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
  },
  moodTitle: {
    fontFamily: font.display,
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
  },
  moodSubtitle: {
    fontFamily: font.sans,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: spacing['2xl'],
    lineHeight: 18,
  },
  moodList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodItem: {
    alignItems: 'center',
    gap: 8,
  },
  moodItemActive: {
    // ...
  },
  moodIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.inkDeep,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  moodIconCircleActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  moodLabel: {
    fontFamily: font.sans,
    fontSize: 11,
    color: colors.textMuted,
  },
  moodLabelActive: {
    color: colors.gold,
    fontFamily: font.sansBold,
  },
  moodSaveBtn: {
    marginTop: spacing['2xl'],
    backgroundColor: colors.gold,
    paddingVertical: 14,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  moodSaveBtnText: {
    fontFamily: font.sansBold,
    fontSize: 14,
    color: colors.bgDeep,
  },
});
