import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Star, Sparkles } from 'lucide-react-native';
import { useAppTheme, type AppTheme } from '@/theme';
import { reviewsApi, bookingsApi } from '@/lib/api';
import { PromoBannerSection } from '@/components/PromoBannerSection';

function buildScreenStyles(t: AppTheme) {
  const { colors, spacing, font, radius } = t;
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  banner: { marginTop: -18, marginBottom: 28 },
  title: { fontFamily: font.display, fontSize: 32, color: colors.text, textAlign: 'center' },
  subtitle: { fontFamily: font.sans, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginTop: 12, paddingHorizontal: 20 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 40 },
  starBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  inputGroup: { marginBottom: 30 },
  inputLabel: { fontFamily: font.sansBold, fontSize: 11, color: colors.goldDeep, letterSpacing: 2, marginBottom: 12, marginLeft: 4 },
  input: { backgroundColor: colors.surface, color: colors.text, borderRadius: radius.lg, padding: 16, fontSize: 15, fontFamily: font.sans, borderWidth: 1, borderColor: colors.line, height: 140, textAlignVertical: 'top' },
  primaryBtn: { backgroundColor: colors.gold, paddingVertical: 16, borderRadius: radius.pill, alignItems: 'center' },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontFamily: font.sansBold, fontSize: 16, color: colors.ink },
  skipBtn: { marginTop: 20, alignItems: 'center' },
  skipText: { fontFamily: font.sansMedium, fontSize: 14, color: colors.textMuted },
});
}

export default function RateScreen() {
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildScreenStyles(theme), [theme]);

  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { t } = useTranslation();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [consultantId, setConsultantId] = useState<string | null>(null);

  useEffect(() => {
    if (bookingId) {
      bookingsApi.get(bookingId)
        .then(b => setConsultantId(b.consultant_id))
        .catch(() => Alert.alert(t('common.error'), t('common.genericError')));
    }
  }, [bookingId, t]);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert(t('review.ratingRequiredTitle'), t('review.ratingRequiredBody'));
      return;
    }
    if (comment.trim().length < 5) {
      Alert.alert(t('review.commentShortTitle'), t('review.commentShortBody'));
      return;
    }
    if (!consultantId || !bookingId) return;
    setLoading(true);
    try {
      await reviewsApi.create({ booking_id: bookingId, target_id: consultantId, rating, comment: comment.trim() });
      router.replace('/(tabs)/bookings');
    } catch (err: unknown) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('rate.submitFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll}>
            
            <View style={styles.header}>
              <Sparkles size={40} color={colors.gold} style={{ marginBottom: 20 }} />
              <Text style={styles.title}>{t('rate.title', 'Seans Nasıl Geçti?')}</Text>
              <Text style={styles.subtitle}>{t('rate.subtitle', 'Deneyiminizi paylaşarak topluluğumuza ve danışmanınıza yardımcı olun.')}</Text>
            </View>

            <PromoBannerSection placement="mobile_call_end" style={styles.banner} />

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <Pressable
                  key={s}
                  onPress={() => setRating(s)}
                  style={styles.starBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`${s} / 5`}
                  accessibilityState={{ selected: rating === s }}
                >
                  <Star size={44} color={rating >= s ? colors.gold : colors.line} fill={rating >= s ? colors.gold : 'transparent'} />
                </Pressable>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('review.commentLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('rate.commentPlaceholder', 'Görüşlerinizi buraya yazabilirsiniz...')}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                value={comment}
                onChangeText={setComment}
                accessibilityLabel={t('review.commentLabel')}
              />
            </View>

            <Pressable 
              style={[styles.primaryBtn, (loading || rating === 0 || !consultantId) && styles.primaryBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading || rating === 0 || !consultantId}
              accessibilityRole="button"
              accessibilityLabel={t('review.submit')}
              accessibilityState={{ disabled: loading || rating === 0 || !consultantId, busy: loading }}
            >
              {loading ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.primaryBtnText}>{t('booking.review', 'Değerlendir')}</Text>}
            </Pressable>

            <Pressable
              style={styles.skipBtn}
              onPress={() => router.replace('/(tabs)/bookings')}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={t('call.rateLater')}
            >
              <Text style={styles.skipText}>{t('call.rateLater')}</Text>
            </Pressable>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
