// FAZ 17 / T17-4 — Mobile review form
// Booking tamamlandıktan sonra modal/sayfa olarak açılır.

import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { reviewsApi } from '@/lib/api';
import { colors, spacing, font, radius } from '@/theme/tokens';

type Props = {
  bookingId: string;
  consultantId: string;
  consultantName?: string;
  onSubmitted?: () => void;
  onCancel?: () => void;
};

export default function ReviewForm({ bookingId, consultantId, consultantName, onSubmitted, onCancel }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (rating < 1) {
      Alert.alert('Puan zorunlu', 'Lütfen 1-5 arası bir yıldız puanı seçin.');
      return;
    }
    if (comment.trim().length < 5) {
      Alert.alert('Yorum kısa', 'Lütfen en az 5 karakter yazın.');
      return;
    }
    setLoading(true);
    try {
      await reviewsApi.create({
        booking_id: bookingId,
        target_id: consultantId,
        rating,
        comment: comment.trim(),
      });
      onSubmitted?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Hata';
      Alert.alert('Yorum gönderilemedi', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Astroloğunu Değerlendir</Text>
      {consultantName ? <Text style={styles.subtitle}>{consultantName}</Text> : null}

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => setRating(n)}
            style={styles.starBtn}
            hitSlop={6}
          >
            <Text style={[styles.star, n <= rating && styles.starOn]}>
              {n <= rating ? '★' : '☆'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Yorumunuz</Text>
      <TextInput
        style={styles.textarea}
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={5}
        placeholder="Görüşme nasıldı? Tahminler net miydi? Genel deneyiminizi anlatın..."
        placeholderTextColor={colors.textMuted}
        editable={!loading}
      />

      <View style={styles.actions}>
        <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={loading}>
          <Text style={styles.cancelBtnText}>Sonra</Text>
        </Pressable>
        <Pressable
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <Text style={styles.submitBtnText}>Gönder</Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.notice}>
        Yorumunuz, görüşmeniz tamamlandığı için "Doğrulanmış görüşme" rozetiyle yayınlanacaktır.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  title: {
    fontFamily: font.display,
    fontSize: 22,
    color: colors.text,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: font.serifItalic,
    fontSize: 14,
    color: colors.gold,
    marginTop: -spacing.xs,
  },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.sm },
  starBtn: { padding: 4 },
  star: { fontSize: 36, color: colors.textMuted, fontFamily: font.display },
  starOn: { color: colors.gold },
  label: {
    fontFamily: font.sansMedium,
    fontSize: 12,
    letterSpacing: 0.8,
    color: colors.textDim,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
  },
  textarea: {
    minHeight: 100,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.text,
    fontFamily: font.serif,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  cancelBtnText: { color: colors.textDim, fontFamily: font.sansMedium, fontSize: 14 },
  submitBtn: {
    flex: 2,
    paddingVertical: spacing.md,
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: colors.bg, fontFamily: font.sansBold, fontSize: 14, letterSpacing: 1 },
  notice: {
    marginTop: spacing.sm,
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
