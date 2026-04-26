import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { birthChartsApi, readingsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { colors, font, radius, spacing } from '@/theme/tokens';
import type { BirthChart, DailyReadingResponse } from '@/types';

export default function TodayScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [charts, setCharts] = useState<BirthChart[]>([]);
  const [reading, setReading] = useState<DailyReadingResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const rows = await birthChartsApi.list();
      setCharts(rows);
      if (rows[0]) {
        const daily = await readingsApi.daily(rows[0].id);
        setReading(daily);
      }
    } catch (error) {
      console.error('Daily reading failed:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    load();
  }, [authLoading, isAuthenticated, load]);

  if (authLoading || loading) {
    return (
      <View style={styles.safe}>
        <View style={styles.loader}>
          <ActivityIndicator color={colors.gold} size="large" />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>Bugünün Yorumu</Text>
        <Text style={styles.title}>Gökyüzü bugün ne söylüyor?</Text>

        {charts.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Doğum haritanız gerekli</Text>
            <Text style={styles.body}>
              Günlük yorum, natal haritanız ve bugünün transitleri birlikte okunarak hazırlanır.
            </Text>
            <Pressable style={styles.primaryBtn} onPress={() => router.push('/(tabs)/birth-chart' as never)}>
              <Text style={styles.primaryText}>Harita Oluştur</Text>
            </Pressable>
          </View>
        ) : reading ? (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.dateText}>{String(reading.reading.reading_date).slice(0, 10)}</Text>
              <Text style={styles.readingText}>{reading.reading.content}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Transit Özeti</Text>
              <Text style={styles.body}>
                Yorumunuz doğum haritanızın bugünkü transitleriyle karşılaştırılarak üretildi.
              </Text>
              <Text style={styles.meta}>
                Model: {reading.reading.model_used || 'local'} · Benzerlik: {Math.round(reading.similarity_max * 100)}%
              </Text>
            </View>

            <Pressable style={styles.primaryBtn} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.primaryText}>Astrologa Sor</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Yorum hazırlanamadı</Text>
            <Text style={styles.body}>Biraz sonra tekrar deneyin.</Text>
            <Pressable style={styles.primaryBtn} onPress={load}>
              <Text style={styles.primaryText}>Tekrar Dene</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  kicker: { color: colors.gold, fontFamily: font.sansBold, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { color: colors.text, fontFamily: font.display, fontSize: 28, lineHeight: 36, marginTop: spacing.sm, marginBottom: spacing.xl },
  heroCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.lg },
  dateText: { color: colors.gold, fontFamily: font.sansBold, fontSize: 12, marginBottom: spacing.md },
  readingText: { color: colors.text, fontFamily: font.serif, fontSize: 18, lineHeight: 30 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.lg },
  cardTitle: { color: colors.text, fontFamily: font.display, fontSize: 20, marginBottom: spacing.sm },
  body: { color: colors.textDim, fontFamily: font.sans, fontSize: 14, lineHeight: 22 },
  meta: { color: colors.textMuted, fontFamily: font.sans, fontSize: 12, marginTop: spacing.md },
  primaryBtn: { backgroundColor: colors.gold, borderRadius: radius.pill, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  primaryText: { color: colors.bgDeep, fontFamily: font.sansBold, fontSize: 15 },
});
