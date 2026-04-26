import { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Pressable, 
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius, shadows } from '@/theme/tokens';
import { reviewsApi, bookingsApi } from '@/lib/api';

export default function RateScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { t } = useTranslation();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [consultantId, setConsultantId] = useState<string | null>(null);

  useEffect(() => {
    if (bookingId) {
      bookingsApi.get(bookingId).then(b => setConsultantId(b.consultant_id));
    }
  }, [bookingId]);

  const handleSubmit = async () => {
    if (rating === 0 || !consultantId || !bookingId) return;

    setLoading(true);
    try {
      await reviewsApi.create({
        booking_id: bookingId,
        target_id: consultantId,
        rating,
        comment
      });
      router.replace('/(tabs)/bookings');
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || 'Değerlendirme gönderilemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('call.rateTitle')}</Text>
            <Text style={styles.subtitle}>Görüşmeniz nasıl geçti? Deneyiminizi paylaşarak diğer kullanıcılara yardımcı olun.</Text>
          </View>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(s => (
              <Pressable key={s} onPress={() => setRating(s)}>
                <Text style={[styles.star, rating >= s ? styles.starActive : styles.starInactive]}>
                  ★
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Yorumunuzu buraya yazabilirsiniz (opsiyonel)..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
            />
          </View>

          <Pressable 
            style={[styles.btn, (loading || rating === 0) && styles.btnDisabled]} 
            onPress={handleSubmit}
            disabled={loading || rating === 0}
          >
            {loading ? (
              <ActivityIndicator color={colors.stardust} />
            ) : (
              <Text style={styles.btnText}>{t('call.rateBtn')}</Text>
            )}
          </Pressable>

          <Pressable 
            style={styles.skipBtn} 
            onPress={() => router.replace('/(tabs)/bookings')}
            disabled={loading}
          >
            <Text style={styles.skipText}>{t('call.rateLater')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.midnight },
  scroll: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.xxl, gap: spacing.sm },
  title: { fontSize: 28, fontFamily: font.display, color: colors.stardust, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.stardustDim, fontFamily: font.sans, textAlign: 'center', lineHeight: 20 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  star: { fontSize: 48 },
  starActive: { color: colors.gold },
  starInactive: { color: colors.surfaceHigh },
  inputGroup: { marginBottom: spacing.xl },
  input: {
    backgroundColor: colors.surface,
    color: colors.stardust,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: 14,
    fontFamily: font.sans,
    borderWidth: 1,
    borderColor: colors.line,
    height: 120,
    textAlignVertical: 'top',
  },
  btn: {
    backgroundColor: colors.amethyst,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    ...shadows.soft,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: colors.stardust, fontFamily: font.sansBold, fontSize: 16 },
  skipBtn: { marginTop: spacing.lg, alignItems: 'center' },
  skipText: { color: colors.muted, fontFamily: font.sans, fontSize: 14 },
});
