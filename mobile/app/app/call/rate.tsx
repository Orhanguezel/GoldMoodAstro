import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Pressable, 
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius } from '@/theme/tokens';
import { reviewsApi, bookingsApi } from '@/lib/api';
import { Star, Sparkles } from 'lucide-react-native';
import { BannerSlider } from '@/components/BannerSlider';

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
      await reviewsApi.create({ booking_id: bookingId, target_id: consultantId, rating, comment });
      router.replace('/(tabs)/bookings' as any);
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Değerlendirme gönderilemedi.');
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
              <Text style={styles.title}>Seans Nasıl Geçti?</Text>
              <Text style={styles.subtitle}>Deneyiminizi paylaşarak topluluğumuza ve danışmanınıza yardımcı olun.</Text>
            </View>

            <BannerSlider placement="mobile_call_end" style={styles.banner} />

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <Pressable key={s} onPress={() => setRating(s)} style={styles.starBtn}>
                  <Star size={44} color={rating >= s ? colors.gold : colors.line} fill={rating >= s ? colors.gold : 'transparent'} />
                </Pressable>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Yorumunuz (Opsiyonel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Görüşlerinizi buraya yazabilirsiniz..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                value={comment}
                onChangeText={setComment}
              />
            </View>

            <Pressable 
              style={[styles.primaryBtn, (loading || rating === 0) && styles.primaryBtnDisabled]} 
              onPress={handleSubmit}
              disabled={loading || rating === 0}
            >
              {loading ? <ActivityIndicator color={colors.bgDeep} /> : <Text style={styles.primaryBtnText}>Değerlendir</Text>}
            </Pressable>

            <Pressable style={styles.skipBtn} onPress={() => router.replace('/(tabs)/bookings' as any)} disabled={loading}>
              <Text style={styles.skipText}>Daha Sonra</Text>
            </Pressable>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  banner: { marginTop: -18, marginBottom: 28 },
  title: { fontFamily: font.display, fontSize: 32, color: colors.text, textAlign: 'center' },
  subtitle: { fontFamily: font.sans, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginTop: 12, paddingHorizontal: 20 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 40 },
  starBtn: { padding: 4 },
  inputGroup: { marginBottom: 30 },
  inputLabel: { fontFamily: font.sansBold, fontSize: 11, color: colors.goldDeep, letterSpacing: 2, marginBottom: 12, marginLeft: 4 },
  input: { backgroundColor: colors.surface, color: colors.text, borderRadius: radius.lg, padding: 16, fontSize: 15, fontFamily: font.sans, borderWidth: 1, borderColor: colors.line, height: 140, textAlignVertical: 'top' },
  primaryBtn: { backgroundColor: colors.gold, paddingVertical: 16, borderRadius: radius.pill, alignItems: 'center' },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontFamily: font.sansBold, fontSize: 16, color: colors.bgDeep },
  skipBtn: { marginTop: 20, alignItems: 'center' },
  skipText: { fontFamily: font.sansMedium, fontSize: 14, color: colors.textMuted },
});
