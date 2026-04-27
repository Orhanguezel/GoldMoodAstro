import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import ReviewForm from '@/components/ReviewForm';
import { bookingsApi } from '@/lib/api';
import { colors, spacing, font } from '@/theme/tokens';

function normalizeParam(value: string | string[] | undefined): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0] ?? '';
  return '';
}

export default function BookingReviewScreen() {
  const params = useLocalSearchParams<{
    id: string | string[];
    consultant_id?: string | string[];
    consultant_name?: string | string[];
  }>();

  const bookingId = normalizeParam(params.id);
  const [consultantId, setConsultantId] = useState(normalizeParam(params.consultant_id));
  const [consultantName, setConsultantName] = useState(normalizeParam(params.consultant_name));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bookingId || consultantId) return;

    setLoading(true);
    bookingsApi.get(bookingId)
      .then((booking) => {
        setConsultantId(booking.consultant_id);
        setConsultantName(booking.consultant?.full_name ?? '');
      })
      .catch((err) => {
        console.error('[booking-review] cannot resolve consultant from booking', err);
      })
      .finally(() => setLoading(false));
  }, [bookingId, consultantId]);

  if (!bookingId) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Eksik bilgi</Text>
          <Text style={styles.emptyText}>Randevu bilgisi bulunamadı.</Text>
          <Pressable style={styles.backBtn} onPress={() => router.replace('/(tabs)/bookings')}>
            <Text style={styles.backBtnText}>Randevularıma dön</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!consultantId || loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loader}>
          <Text style={styles.emptyText}>Hazırlanıyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ReviewForm
          bookingId={bookingId}
          consultantId={consultantId}
          consultantName={consultantName}
          onSubmitted={() => router.replace('/(tabs)/bookings')}
          onCancel={() => router.back()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  emptyTitle: { fontFamily: font.display, fontSize: 18, color: colors.text },
  emptyText: { fontFamily: font.serif, fontSize: 14, color: colors.textDim, textAlign: 'center' },
  backBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 999,
  },
  backBtnText: { color: colors.gold, fontFamily: font.sansMedium, fontSize: 13, letterSpacing: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
});
