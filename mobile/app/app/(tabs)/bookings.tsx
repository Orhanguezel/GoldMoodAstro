import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Pressable, 
  ActivityIndicator, 
  RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, CalendarDays, History, ChevronRight } from 'lucide-react-native';

import { colors, spacing, font, radius } from '@/theme/tokens';
import { bookingsApi } from '@/lib/api';
import { BookingCard } from '@/components/BookingCard';
import { useAuth } from '@/hooks/useAuth';
import type { Booking } from '@/types';

export default function BookingsScreen() {
  const { isAuthenticated, authHydrating } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await bookingsApi.list();
      setBookings(res?.items || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (authHydrating) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchBookings();
  }, [isAuthenticated, authHydrating]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings();
  }, [isAuthenticated]);

  const filteredBookings = (bookings || []).filter(b => {
    const isPast = ['completed', 'cancelled', 'no_show'].includes(b.status);
    return activeTab === 'past' ? isPast : !isPast;
  }).sort((a, b) => {
    return activeTab === 'upcoming' 
      ? new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
      : new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime();
  });

  if (authHydrating) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.headerBtn}>
              <ChevronLeft size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Randevularım</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.guestBody}>
            <View style={styles.guestIconWrap}>
              <CalendarDays size={32} color={colors.bgDeep} />
            </View>
            <Text style={styles.guestTitle}>Randevularınız</Text>
            <Text style={styles.guestSubtitle}>
              Yaklaşan ve geçmiş randevularınızı listelemek, ödeme ve görüşme için giriş yapın.
            </Text>
            <Pressable style={styles.guestPrimaryWrap} onPress={() => router.push('/auth/login' as any)}>
              <LinearGradient colors={[colors.goldDeep, colors.gold]} style={styles.guestPrimaryBtn}>
                <Text style={styles.guestPrimaryLabel}>GİRİŞ YAP</Text>
                <ChevronRight size={18} color={colors.bgDeep} />
              </LinearGradient>
            </Pressable>
            <Pressable style={styles.guestSecondary} onPress={() => router.push('/auth/register' as any)}>
              <Text style={styles.guestSecondaryLabel}>Hesap oluştur</Text>
            </Pressable>
            <Pressable style={styles.guestTertiary} onPress={() => router.push('/(tabs)/connect' as any)}>
              <Text style={styles.guestTertiaryText}>Önce danışmanlara göz at →</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

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
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Randevularım</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <View style={styles.tabSwitcher}>
            <Pressable 
              style={[styles.tabBtn, activeTab === 'upcoming' && styles.tabBtnActive]}
              onPress={() => setActiveTab('upcoming')}
            >
              <CalendarDays size={16} color={activeTab === 'upcoming' ? colors.bgDeep : colors.textMuted} />
              <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
                Yaklaşan
              </Text>
            </Pressable>
            <Pressable 
              style={[styles.tabBtn, activeTab === 'past' && styles.tabBtnActive]}
              onPress={() => setActiveTab('past')}
            >
              <History size={16} color={activeTab === 'past' ? colors.bgDeep : colors.textMuted} />
              <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
                Geçmiş
              </Text>
            </Pressable>
          </View>
        </View>

        <FlatList
          data={filteredBookings}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <BookingCard 
              booking={item} 
              onPress={() => router.push(`/booking/${item.id}` as any)}
              onJoinCall={() => router.push(`/call/${item.id}` as any)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Henüz bir randevunuz bulunmuyor.</Text>
              <Pressable style={styles.emptyBtn} onPress={() => router.push('/connect' as any)}>
                <Text style={styles.emptyBtnText}>Danışmanları İncele</Text>
              </Pressable>
            </View>
          }
        />

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
    fontSize: 18,
    color: colors.text,
  },
  tabContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  tabBtnActive: {
    backgroundColor: colors.gold,
  },
  tabText: {
    fontFamily: font.sansBold,
    fontSize: 13,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.bgDeep,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  emptyBtnText: {
    fontFamily: font.sansBold,
    fontSize: 14,
    color: colors.gold,
  },
  guestBody: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    alignItems: 'center',
  },
  guestIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  guestTitle: {
    fontFamily: font.display,
    fontSize: 26,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  guestSubtitle: {
    fontFamily: font.sans,
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing['2xl'],
  },
  guestPrimaryWrap: { alignSelf: 'stretch', borderRadius: radius.pill, overflow: 'hidden', marginBottom: 12 },
  guestPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  guestPrimaryLabel: { fontFamily: font.sansBold, fontSize: 14, color: colors.bgDeep, letterSpacing: 1 },
  guestSecondary: { paddingVertical: 14, alignItems: 'center' },
  guestSecondaryLabel: { fontFamily: font.sansBold, fontSize: 14, color: colors.gold },
  guestTertiary: { marginTop: spacing.xl, paddingVertical: 12 },
  guestTertiaryText: { fontFamily: font.sansMedium, fontSize: 14, color: colors.textMuted },
});
