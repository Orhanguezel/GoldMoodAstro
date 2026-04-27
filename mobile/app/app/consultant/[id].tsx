import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, 
  ActivityIndicator, Pressable, Dimensions, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius } from '@/theme/tokens';
import { consultantsApi, chatApi, reviewsApi } from '@/lib/api';
import type { Consultant, ConsultantSlot, Review } from '@/types';
import { format, addDays, isSameDay } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import ReviewList from '@/components/ReviewList';
import { 
  ChevronLeft, 
  MessageSquare, 
  Star, 
  ShieldCheck, 
  Clock, 
  Globe,
  Calendar,
  Zap
} from 'lucide-react-native';

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
      .catch(console.error)
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
        .then(setSlots)
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
      <View style={styles.centerLoader}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Header Hero */}
        <View style={styles.hero}>
          <View style={styles.heroOverlay} />
          {consultant.avatar_url && (
            <Image source={{ uri: consultant.avatar_url }} style={styles.heroBg} blurRadius={10} />
          )}
          
          <SafeAreaView edges={['top']}>
            <View style={styles.topNav}>
              <Pressable style={styles.backBtn} onPress={() => router.back()}>
                <ChevronLeft size={24} color={colors.text} />
              </Pressable>
              <Pressable 
                style={styles.chatBtn} 
                onPress={async () => {
                  const { id: tid } = await chatApi.createThread(consultant.id);
                  router.push(`/chat/${tid}`);
                }}
              >
                <MessageSquare size={22} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.profileArea}>
              <View style={styles.avatarContainer}>
                {consultant.avatar_url ? (
                  <Image source={{ uri: consultant.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}><Text style={styles.avatarInitial}>{consultant.full_name?.[0]}</Text></View>
                )}
                {consultant.is_available && <View style={styles.onlineDot} />}
              </View>

              <View style={styles.nameRow}>
                <Text style={styles.name}>{consultant.full_name}</Text>
                <ShieldCheck size={18} color={colors.gold} />
              </View>
              
              <Text style={styles.expertise}>{consultant.expertise.join(' · ')}</Text>

              <View style={styles.metrics}>
                <View style={styles.metric}>
                  <Star size={14} color={colors.gold} fill={colors.gold} />
                  <Text style={styles.metricVal}>{consultant.rating_avg}</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metric}>
                  <Clock size={14} color={colors.textMuted} />
                  <Text style={styles.metricVal}>{consultant.session_duration} dk</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metric}>
                  <Globe size={14} color={colors.textMuted} />
                  <Text style={styles.metricVal}>{consultant.languages.map(l => l.toUpperCase()).join('/')}</Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hakkında</Text>
          <Text style={styles.bio}>{consultant.bio || 'Bu danışman henüz bir açıklama eklememiş.'}</Text>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={18} color={colors.gold} />
            <Text style={styles.sectionTitle}>Randevu Tarihi</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesScroll}>
            {dates.map((date, i) => {
              const active = isSameDay(date, selectedDate);
              return (
                <Pressable 
                  key={i} 
                  style={[styles.dateBtn, active && styles.dateBtnActive]}
                  onPress={() => { setSelectedDate(date); setSelectedSlot(null); }}
                >
                  <Text style={[styles.dateDay, active && styles.dateTextActive]}>{format(date, 'EEE', { locale: dateLocale })}</Text>
                  <Text style={[styles.dateNum, active && styles.dateTextActive]}>{format(date, 'd')}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Slots Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={18} color={colors.gold} />
            <Text style={styles.sectionTitle}>Müsait Saatler</Text>
          </View>
          {slotsLoading ? (
            <ActivityIndicator color={colors.gold} style={{ marginVertical: 20 }} />
          ) : slots.length === 0 ? (
            <View style={styles.emptySlots}>
              <Text style={styles.emptySlotsText}>Bu tarih için müsait randevu bulunmuyor.</Text>
            </View>
          ) : (
            <View style={styles.slotsGrid}>
              {slots.map(slot => {
                const active = selectedSlot?.id === slot.id;
                const isFull = (slot.reserved_count || 0) >= slot.capacity;
                return (
                  <Pressable 
                    key={slot.id}
                    style={[styles.slotBtn, active && styles.slotBtnActive, isFull && styles.slotBtnFull]}
                    onPress={() => !isFull && setSelectedSlot(slot)}
                    disabled={isFull}
                  >
                    <Text style={[styles.slotText, active && styles.slotTextActive, isFull && styles.slotTextFull]}>
                      {slot.slot_time.substring(0, 5)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Değerlendirmeler</Text>
          <ReviewList reviews={reviews} loading={reviewsLoading} />
        </View>

      </ScrollView>

      {/* Floating Footer */}
      <View style={styles.footer}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>Seans Ücreti</Text>
          <Text style={styles.footerPriceVal}>₺{Math.round(Number(consultant.session_price))}</Text>
        </View>
        <Pressable 
          style={[styles.bookBtn, !selectedSlot && styles.bookBtnDisabled]}
          onPress={handleBooking}
          disabled={!selectedSlot}
        >
          <Zap size={18} color={colors.bgDeep} />
          <Text style={styles.bookBtnText}>Randevu Al</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  scroll: { paddingBottom: 120 },
  
  // Hero
  hero: { backgroundColor: colors.inkDeep, overflow: 'hidden', paddingBottom: 30 },
  heroBg: { ...StyleSheet.absoluteFillObject, opacity: 0.3 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(26, 23, 21, 0.6)' },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  chatBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  profileArea: { alignItems: 'center', marginTop: 10 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: colors.gold },
  avatarFallback: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.goldDim, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.gold },
  avatarInitial: { fontFamily: font.display, fontSize: 40, color: colors.bgDeep },
  onlineDot: { position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.success, borderWidth: 3, borderColor: colors.inkDeep },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: font.display, fontSize: 26, color: colors.text },
  expertise: { fontFamily: font.sansMedium, fontSize: 14, color: colors.goldDim, marginTop: 4 },
  metrics: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 20 },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricVal: { fontFamily: font.sansBold, fontSize: 13, color: colors.text },
  metricDivider: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Sections
  section: { padding: spacing.lg, borderBottomWidth: 1, borderColor: colors.lineSoft },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionTitle: { fontFamily: font.sansBold, fontSize: 15, color: colors.text, marginBottom: 12 },
  bio: { fontFamily: font.sans, fontSize: 14, color: colors.textDim, lineHeight: 22 },
  datesScroll: { gap: 10 },
  dateBtn: { width: 64, height: 74, borderRadius: radius.lg, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  dateBtnActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  dateDay: { fontFamily: font.sansMedium, fontSize: 11, color: colors.textMuted, textTransform: 'uppercase' },
  dateNum: { fontFamily: font.sansBold, fontSize: 18, color: colors.text, marginTop: 2 },
  dateTextActive: { color: colors.bgDeep },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotBtn: { width: (width - 40 - 30) / 4, height: 44, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  slotBtnActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  slotBtnFull: { opacity: 0.2 },
  slotText: { fontFamily: font.sansBold, fontSize: 14, color: colors.text },
  slotTextActive: { color: colors.bgDeep },
  slotTextFull: { color: colors.textMuted },
  emptySlots: { paddingVertical: 20, alignItems: 'center' },
  emptySlotsText: { fontFamily: font.sans, fontSize: 13, color: colors.textMuted },

  // Footer
  footer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    backgroundColor: colors.surface, padding: spacing.lg, 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderColor: colors.line,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg
  },
  footerPrice: { gap: 2 },
  footerPriceLabel: { fontFamily: font.sans, fontSize: 12, color: colors.textMuted },
  footerPriceVal: { fontFamily: font.display, fontSize: 24, color: colors.gold },
  bookBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.gold, 
    paddingHorizontal: 24, 
    paddingVertical: 14, 
    borderRadius: radius.pill,
  },
  bookBtnDisabled: { opacity: 0.5 },
  bookBtnText: { fontFamily: font.sansBold, fontSize: 16, color: colors.bgDeep },
});
