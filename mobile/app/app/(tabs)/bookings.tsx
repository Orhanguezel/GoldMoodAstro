import { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, 
  Pressable, ActivityIndicator, RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius } from '@/theme/tokens';
import { bookingsApi } from '@/lib/api';
import { BookingCard } from '@/components/BookingCard';
import { useAuth } from '@/hooks/useAuth';
import type { Booking } from '@/types';

export default function BookingsScreen() {
  const { t } = useTranslation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
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
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth/login');
    } else if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated, authLoading]);

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

  if (authLoading || (loading && !refreshing)) {
    return (
      <View style={styles.safe}>
        <View style={styles.loader}>
          <ActivityIndicator color={colors.amethyst} size="large" />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('bookings.title')}</Text>
      </View>

      <View style={styles.tabs}>
        <Pressable 
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            {t('bookings.upcoming')}
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            {t('bookings.past')}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={filteredBookings}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <BookingCard 
            booking={item} 
            onPress={() => router.push(`/booking/${item.id}`)}
            onJoinCall={() => router.push(`/call/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amethyst} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('bookings.empty')}</Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.emptyBtnText}>{t('bookings.emptyCta')}</Text>
            </Pressable>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.midnight },
  header: { padding: spacing.lg },
  title: { fontSize: 24, fontFamily: font.display, color: colors.stardust },
  tabs: { 
    flexDirection: 'row', 
    marginHorizontal: spacing.lg, 
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: colors.surfaceHigh },
  tabText: { color: colors.muted, fontFamily: font.sansMedium, fontSize: 14 },
  tabTextActive: { color: colors.stardust },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { padding: spacing.xxl, alignItems: 'center', gap: spacing.md },
  emptyText: { color: colors.muted, fontFamily: font.sans, fontSize: 15 },
  emptyBtn: { backgroundColor: colors.amethyst, paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.pill },
  emptyBtnText: { color: colors.stardust, fontFamily: font.sansBold, fontSize: 14 },
});
