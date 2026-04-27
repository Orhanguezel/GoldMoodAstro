import { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, 
  ActivityIndicator, Pressable, Dimensions, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius, shadows } from '@/theme/tokens';
import { consultantsApi, chatApi, reviewsApi } from '@/lib/api';
import type { Consultant, ConsultantSlot } from '@/types';
import type { Review } from '@/types';
import { format, addDays, isSameDay } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import ReviewList from '@/components/ReviewList';

const { width } = Dimensions.get('window');

export default function ConsultantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'tr' ? tr : enUS;

  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [slots, setSlots] = useState<ConsultantSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<ConsultantSlot | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Next 7 days for the date picker
  const dates = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setReviewsLoading(true);

    Promise.all([
      consultantsApi.get(id),
      reviewsApi.forConsultant(id),
    ])
      .then(([consultantData, reviewData]) => {
        setConsultant(consultantData);
        setReviews(reviewData);
      })
      .catch((err) => {
        console.error('Failed to load consultant detail:', err);
      })
      .finally(() => {
        setLoading(false);
        setReviewsLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (id && selectedDate) {
      setSlotsLoading(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      consultantsApi.slots(id, dateStr)
        .then(slots => setSlots(slots))
        .catch(console.error)
        .finally(() => setSlotsLoading(false));
    }
  }, [id, selectedDate]);

  const handleBooking = () => {
    if (!consultant || !selectedSlot) return;
    
    router.push({
      pathname: '/booking/checkout',
      params: {
        consultantId: consultant.id,
        resourceId: selectedSlot.resource_id,
        slotId: selectedSlot.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedSlot.slot_time.substring(0, 5),
        price: consultant.session_price,
        duration: consultant.session_duration,
        name: consultant.full_name,
      }
    });
  };

  if (loading || !consultant) {
    return (
      <View style={[styles.safe, styles.center]}>
        <ActivityIndicator color={colors.amethyst} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.profileRow}>
            {consultant.avatar_url ? (
              <Image source={{ uri: consultant.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {consultant.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{consultant.full_name}</Text>
                <Pressable 
                  style={styles.messageIconBtn} 
                  onPress={async () => {
                    try {
                      const { id: threadId } = await chatApi.createThread(consultant.id);
                      router.push(`/chat/${threadId}`);
                    } catch (err) {
                      console.error('Failed to open chat:', err);
                    }
                  }}
                >
                  <Text style={styles.messageIcon}>💬</Text>
                </Pressable>
              </View>
              <View style={styles.expertiseRow}>
                {consultant.expertise?.map((exp, i) => (
                  <Text key={i} style={styles.expertiseTag}>{t(`home.expertise.${exp}`, exp)}</Text>
                ))}
              </View>
              <View style={styles.ratingRow}>
                <Text style={styles.star}>⭐</Text>
                <Text style={styles.ratingText}>{consultant.rating_avg}</Text>
                <Text style={styles.ratingCount}>({consultant.rating_count} {t('consultant.reviews')})</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('consultant.about')}</Text>
          <Text style={styles.bio}>{consultant.bio || 'Henüz bir biyografi eklenmemiş.'}</Text>
        </View>

        {/* Date Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('consultant.reviews')}</Text>
          <ReviewList reviews={reviews} loading={reviewsLoading} />
        </View>

        <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('booking.selectDate')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesScroll}>
            {dates.map((date, i) => {
              const active = isSameDay(date, selectedDate);
              return (
                <Pressable 
                  key={i} 
                  style={[styles.dateBtn, active && styles.dateBtnActive]}
                  onPress={() => {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                  }}
                >
                  <Text style={[styles.dateDay, active && styles.dateTextActive]}>
                    {format(date, 'EEE', { locale: dateLocale })}
                  </Text>
                  <Text style={[styles.dateNum, active && styles.dateTextActive]}>
                    {format(date, 'd')}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Slots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('booking.selectSlot')}</Text>
          {slotsLoading ? (
            <ActivityIndicator color={colors.amethyst} style={{ marginVertical: spacing.lg }} />
          ) : slots.length === 0 ? (
            <Text style={styles.emptyText}>{t('booking.noSlots')}</Text>
          ) : (
            <View style={styles.slotsGrid}>
              {slots.map(slot => {
                const active = selectedSlot?.id === slot.id;
                const isFull = (slot.reserved_count || 0) >= slot.capacity;
                return (
                  <Pressable 
                    key={slot.id}
                    style={[
                      styles.slotBtn, 
                      active && styles.slotBtnActive,
                      isFull && styles.slotBtnDisabled
                    ]}
                    onPress={() => !isFull && setSelectedSlot(slot)}
                    disabled={isFull}
                  >
                    <Text style={[
                      styles.slotText, 
                      active && styles.slotTextActive,
                      isFull && styles.slotTextDisabled
                    ]}>
                      {slot.slot_time.substring(0, 5)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer / CTA */}
      <View style={styles.footer}>
        <View style={styles.priceInfo}>
          <Text style={styles.priceLabel}>{t('booking.total')}</Text>
          <Text style={styles.priceValue}>₺{Math.round(Number(consultant.session_price))}</Text>
        </View>
        <Pressable 
          style={[styles.bookBtn, !selectedSlot && styles.bookBtnDisabled]}
          onPress={handleBooking}
          disabled={!selectedSlot}
        >
          <Text style={styles.bookBtnText}>{t('consultant.bookNow')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.midnight },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 100 },
  header: { padding: spacing.lg, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.line },
  profileRow: { flexDirection: 'row', gap: spacing.md },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.amethyst, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: colors.stardust, fontSize: 24, fontFamily: font.sansBold },
  profileInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  messageIconBtn: { padding: 4, backgroundColor: colors.surfaceHigh, borderRadius: 12, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  messageIcon: { fontSize: 16 },
  name: { fontSize: 24, fontFamily: font.display, color: colors.stardust, flexShrink: 1 },
  expertiseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  expertiseTag: { fontSize: 10, color: colors.amethystLight, backgroundColor: colors.surfaceHigh, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  star: { fontSize: 14 },
  ratingText: { fontSize: 14, fontFamily: font.sansBold, color: colors.gold },
  ratingCount: { fontSize: 12, color: colors.muted, fontFamily: font.sans },
  section: { padding: spacing.lg, borderBottomWidth: 1, borderColor: colors.lineSoft },
  sectionTitle: { fontSize: 16, fontFamily: font.sansBold, color: colors.stardust, marginBottom: spacing.md },
  bio: { fontSize: 14, color: colors.stardustDim, lineHeight: 22, fontFamily: font.sans },
  datesScroll: { gap: spacing.sm },
  dateBtn: { width: 60, height: 70, borderRadius: radius.sm, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  dateBtnActive: { backgroundColor: colors.amethyst, borderColor: colors.amethyst },
  dateDay: { fontSize: 12, color: colors.muted, fontFamily: font.sansMedium, textTransform: 'uppercase' },
  dateNum: { fontSize: 18, color: colors.stardust, fontFamily: font.sansBold },
  dateTextActive: { color: colors.stardust },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slotBtn: { width: (width - spacing.lg * 2 - spacing.sm * 3) / 4, height: 40, borderRadius: radius.xs, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  slotBtnActive: { backgroundColor: colors.amethyst, borderColor: colors.amethyst },
  slotBtnDisabled: { opacity: 0.3, backgroundColor: colors.deep },
  slotText: { color: colors.stardust, fontSize: 14, fontFamily: font.sansMedium },
  slotTextActive: { color: colors.stardust },
  slotTextDisabled: { color: colors.muted },
  emptyText: { color: colors.muted, fontFamily: font.sans, textAlign: 'center', paddingVertical: spacing.lg },
  footer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    backgroundColor: colors.surface, padding: spacing.lg, 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderColor: colors.line,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg
  },
  priceInfo: { gap: 2 },
  priceLabel: { fontSize: 12, color: colors.muted, fontFamily: font.sans },
  priceValue: { fontSize: 20, fontFamily: font.sansBold, color: colors.gold },
  bookBtn: { backgroundColor: colors.amethyst, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.pill, ...shadows.soft },
  bookBtnDisabled: { opacity: 0.5 },
  bookBtnText: { color: colors.stardust, fontFamily: font.sansBold, fontSize: 16 },
});
