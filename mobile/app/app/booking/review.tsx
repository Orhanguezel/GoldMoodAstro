// FAZ 17 / T17-4 — Mobile booking review sayfası
// Booking tamamlandığında bookings listesinden veya push notification'dan yönlendirilir.
// Query: ?booking_id=...&consultant_id=...&consultant_name=...

import { useEffect } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, font } from '@/theme/tokens';

export default function BookingReviewScreen() {
  const params = useLocalSearchParams<{
    booking_id?: string;
    consultant_id?: string;
    consultant_name?: string;
  }>();

  const bookingId = String(params.booking_id || '');
  const consultantId = String(params.consultant_id || '');
  const consultantName = params.consultant_name ? String(params.consultant_name) : undefined;

  useEffect(() => {
    if (!bookingId) return;
    if (!consultantId) return;

    router.replace({
      pathname: '/booking/[id]/review' as any,
      params: {
        id: bookingId,
        consultant_id: consultantId,
        consultant_name: consultantName,
      },
    });
  }, [bookingId, consultantId, consultantName]);

  if (!bookingId || !consultantId) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Eksik bilgi</Text>
          <Text style={styles.emptyText}>Booking veya astrolog bilgisi bulunamadı.</Text>
          <Pressable style={styles.backBtn} onPress={() => router.replace('/(tabs)/bookings')}>
            <Text style={styles.backBtnText}>Randevularıma dön</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
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
});
