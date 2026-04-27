import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  ActivityIndicator, 
  Pressable, 
  Dimensions, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { 
  ChevronLeft, 
  Star, 
  MessageSquare, 
  Calendar, 
  Clock, 
  ShieldCheck,
  Info
} from 'lucide-react-native';
import { format, addDays, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';

import { colors, spacing, font, radius } from '@/theme/tokens';
import { consultantsApi, chatApi } from '@/lib/api';
import type { Consultant, ConsultantSlot } from '@/types';

const { width } = Dimensions.get('window');

export default function ConsultantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [slots, setSlots] = useState<ConsultantSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<ConsultantSlot | null>(null);

  // Next 7 days for the date picker
  const dates = Array.from({ length: 14 }).map((_, i) => addDays(new Date(), i));

  useEffect(() => {
    if (id) {
      consultantsApi.get(id)
        .then(setConsultant)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
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
      pathname: '/booking/checkout' as any,
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

  const handleOpenChat = async () => {
    if (!consultant) return;
    try {
      const { id: threadId } = await chatApi.createThread(consultant.id);
      router.push(`/chat/${threadId}` as any);
    } catch (err) {
      console.error('Failed to open chat:', err);
    }
  };

  if (loading || !consultant) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        
        {/* Custom Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Danışman Profili</Text>
          <Pressable onPress={handleOpenChat} style={styles.headerBtn}>
            <MessageSquare size={20} color={colors.gold} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarWrap}>
              {consultant.avatar_url ? (
                <Image source={{ uri: consultant.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{consultant.full_name?.[0]}</Text>
                </View>
              )}
              <View style={[styles.statusDot, consultant.is_available ? styles.online : styles.offline]} />
            </View>

            <View style={styles.nameRow}>
              <Text style={styles.name}>{consultant.full_name}</Text>
              <ShieldCheck size={18} color={colors.gold} />
            </View>
            
            <View style={styles.expertiseContainer}>
              {consultant.expertise.map(exp => (
                <View key={exp} style={styles.expBadge}>
                  <Text style={styles.expText}>{exp.toUpperCase()}</Text>
                </View>
              ))}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Star size={14} color={colors.gold} fill={colors.gold} />
                <Text style={styles.statVal}>{consultant.rating_avg}</Text>
                <Text style={styles.statLabel}>({consultant.rating_count} yorum)</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Clock size={14} color={colors.textMuted} />
                <Text style={styles.statVal}>{consultant.session_duration} dk</Text>
                <Text style={styles.statLabel}>seans</Text>
              </View>
            </View>
          </View>

          {/* Bio Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Info size={16} color={colors.goldDim} />
              <Text style={styles.sectionTitle}>HAKKINDA</Text>
            </View>
            <Text style={styles.bioText}>
              {consultant.bio || 'Bu danışman henüz bir biyografi eklememiş.'}
            </Text>
          </View>

          {/* Date Picker Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calendar size={16} color={colors.goldDim} />
              <Text style={styles.sectionTitle}>TARİH SEÇİN</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
              <View style={styles.datesContainer}>
                {dates.map((date, i) => {
                  const isSelected = isSameDay(date, selectedDate);
                  return (
                    <Pressable 
                      key={i} 
                      onPress={() => {
                        setSelectedDate(date);
                        setSelectedSlot(null);
                      }}
                      style={[styles.dateBtn, isSelected && styles.dateBtnActive]}
                    >
                      <Text style={[styles.dateDay, isSelected && styles.dateDayActive]}>
                        {format(date, 'EEE', { locale: tr })}
                      </Text>
                      <Text style={[styles.dateNum, isSelected && styles.dateNumActive]}>
                        {format(date, 'd')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Slots Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={16} color={colors.goldDim} />
              <Text style={styles.sectionTitle}>SAAT SEÇİN</Text>
            </View>
            
            {slotsLoading ? (
              <ActivityIndicator color={colors.gold} style={{ marginVertical: 20 }} />
            ) : slots.length === 0 ? (
              <View style={styles.emptySlots}>
                <Text style={styles.emptySlotsText}>Bu tarihte müsait seans bulunmuyor.</Text>
              </View>
            ) : (
              <View style={styles.slotsGrid}>
                {slots.map(slot => {
                  const isSelected = selectedSlot?.id === slot.id;
                  const isFull = (slot.reserved_count || 0) >= slot.capacity;
                  return (
                    <Pressable 
                      key={slot.id}
                      onPress={() => !isFull && setSelectedSlot(slot)}
                      disabled={isFull}
                      style={[
                        styles.slotBtn, 
                        isSelected && styles.slotBtnActive,
                        isFull && styles.slotBtnFull
                      ]}
                    >
                      <Text style={[
                        styles.slotText, 
                        isSelected && styles.slotTextActive,
                        isFull && styles.slotTextFull
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

        {/* Floating Bottom Bar */}
        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>TOPLAM TUTAR</Text>
            <Text style={styles.priceValue}>₺{Math.round(Number(consultant.session_price))}</Text>
          </View>
          <Pressable 
            onPress={handleBooking}
            disabled={!selectedSlot}
            style={[styles.bookBtn, !selectedSlot && styles.bookBtnDisabled]}
          >
            <Text style={styles.bookBtnText}>Randevu Al</Text>
          </Pressable>
        </View>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  headerTitle: {
    fontFamily: font.display,
    fontSize: 16,
    color: colors.text,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Profile
  profileSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.inkDeep,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gold,
  },
  avatarInitials: {
    fontFamily: font.display,
    fontSize: 40,
    color: colors.gold,
  },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: colors.bg,
  },
  online: { backgroundColor: colors.success },
  offline: { backgroundColor: colors.textMuted },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontFamily: font.display,
    fontSize: 24,
    color: colors.text,
  },
  expertiseContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.lg,
  },
  expBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  expText: {
    fontFamily: font.mono,
    fontSize: 10,
    color: colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statVal: {
    fontFamily: font.sansBold,
    fontSize: 14,
    color: colors.text,
  },
  statLabel: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.textMuted,
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.line,
  },

  // Sections
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: font.sansBold,
    fontSize: 11,
    color: colors.goldDeep,
    letterSpacing: 2,
  },
  bioText: {
    fontFamily: font.serif,
    fontSize: 15,
    color: colors.textDim,
    lineHeight: 24,
  },

  // Dates
  datesScroll: {
    marginHorizontal: -spacing.lg,
  },
  datesContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: 10,
  },
  dateBtn: {
    width: 60,
    height: 70,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  dateBtnActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  dateDay: {
    fontFamily: font.sansMedium,
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  dateDayActive: { color: colors.bgDeep },
  dateNum: {
    fontFamily: font.display,
    fontSize: 20,
    color: colors.text,
    marginTop: 4,
  },
  dateNumActive: { color: colors.bgDeep },

  // Slots
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotBtn: {
    width: (width - 48 - 30) / 4,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  slotBtnActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  slotBtnFull: {
    opacity: 0.3,
    backgroundColor: colors.inkDeep,
  },
  slotText: {
    fontFamily: font.sansMedium,
    fontSize: 14,
    color: colors.text,
  },
  slotTextActive: {
    color: colors.bgDeep,
    fontFamily: font.sansBold,
  },
  slotTextFull: {
    color: colors.textMuted,
  },
  emptySlots: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  emptySlotsText: {
    fontFamily: font.sans,
    fontSize: 13,
    color: colors.textMuted,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bgDeep,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: colors.line,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontFamily: font.sansBold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  priceValue: {
    fontFamily: font.display,
    fontSize: 22,
    color: colors.gold,
    marginTop: 4,
  },
  bookBtn: {
    backgroundColor: colors.gold,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: radius.pill,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  bookBtnDisabled: {
    backgroundColor: colors.surface,
    shadowOpacity: 0,
    elevation: 0,
  },
  bookBtnText: {
    fontFamily: font.sansBold,
    fontSize: 16,
    color: colors.bgDeep,
  },
});
