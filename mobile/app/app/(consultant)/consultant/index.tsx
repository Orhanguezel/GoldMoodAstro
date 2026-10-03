import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { CalendarDays, CheckCircle2, MessageSquare, Radio } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useAppTheme, type AppTheme } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { consultantSelfApi } from '@/lib/api';
import type { ConsultantSelfProfile, ConsultantSelfStats } from '@/types';

import { logger } from '@/lib/logger';
function buildStyles(t: AppTheme) {
  const { colors, font, radius, spacing } = t;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    safe: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.bg },
    scroll: { padding: spacing.lg, paddingBottom: 40, gap: 14 },
    kicker: { fontFamily: font.sansBold, fontSize: 11, letterSpacing: 2, color: colors.gold },
    title: { fontFamily: font.display, fontSize: 28, color: colors.text, marginTop: 6 },
    subtitle: { fontFamily: font.sans, fontSize: 14, lineHeight: 22, color: colors.textMuted, marginTop: 8 },
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 10 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statCard: { width: '48%', minHeight: 104, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 14, justifyContent: 'space-between' },
    statLabel: { fontFamily: font.sansBold, fontSize: 10, letterSpacing: 1.2, color: colors.textMuted },
    statValue: { fontFamily: font.display, fontSize: 24, color: colors.text },
    statDelta: { fontFamily: font.sansBold, fontSize: 11, color: colors.gold },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    cardTitle: { fontFamily: font.sansBold, fontSize: 15, color: colors.text },
    cardText: { fontFamily: font.sans, fontSize: 13, lineHeight: 20, color: colors.textDim },
    btn: { marginTop: 4, height: 42, borderRadius: radius.pill, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontFamily: font.sansBold, fontSize: 13, color: colors.ink },
    ghostBtn: { marginTop: 8, height: 42, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
    ghostBtnText: { fontFamily: font.sansBold, fontSize: 13, color: colors.gold },
    progressTrack: { height: 8, borderRadius: radius.pill, backgroundColor: colors.bgDeep, overflow: 'hidden' },
    progressFill: { height: 8, borderRadius: radius.pill, backgroundColor: colors.gold },
    missingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 38 },
    missingLabel: { flex: 1, fontFamily: font.sans, fontSize: 13, color: colors.textDim },
  });
}

type Completion = Awaited<ReturnType<typeof consultantSelfApi.profileCompletion>>;
const PUBLISH_MISSING = ['approval', 'hidden', 'price', 'photo', 'slug'] as const;

function completionRoute(tab: string) {
  if (tab === 'availability') return '/consultant/availability';
  if (tab === 'reviews') return '/consultant/reviews';
  return '/consultant/profile';
}

export default function ConsultantOverviewScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { colors } = theme;
  const { user, authHydrating } = useAuth();
  const [stats, setStats] = useState<ConsultantSelfStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [profile, setProfile] = useState<ConsultantSelfProfile | null>(null);
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const hasConsultantRole = user?.role === 'consultant' || user?.roles?.includes('consultant') === true;

  const loadStats = useCallback(async () => {
    if (!hasConsultantRole) return;
    setStatsLoading(true);
    try {
      setStats(await consultantSelfApi.stats());
    } catch (err) {
      setStats(null);
      logger.error('Consultant stats load error:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [hasConsultantRole]);

  const loadAccount = useCallback(async () => {
    if (!hasConsultantRole) return;
    setAccountLoading(true);
    const results = await Promise.allSettled([consultantSelfApi.profile(), consultantSelfApi.profileCompletion()]);
    if (results[0].status === 'fulfilled') setProfile(results[0].value);
    else { setProfile(null); logger.error('Consultant publication status load error:', results[0].reason); }
    if (results[1].status === 'fulfilled') setCompletion(results[1].value);
    else { setCompletion(null); logger.error('Consultant profile completion load error:', results[1].reason); }
    setAccountLoading(false);
  }, [hasConsultantRole]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
      loadAccount();
    }, [loadStats, loadAccount]),
  );

  const formatTry = (value: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value);

  if (authHydrating) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  if (!hasConsultantRole) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>{t('consultantPanel.notConsultantTitle', 'Danışman alanı')}</Text>
        <Text style={[styles.subtitle, { textAlign: 'center' }]}>
          {t('consultantPanel.notConsultantBody', 'Bu alan onaylı danışman hesapları içindir. Danışman olmak için başvuru yapabilirsiniz.')}
        </Text>
        <Pressable style={styles.btn} onPress={() => router.replace('/become-consultant' as any)}>
          <Text style={styles.btnText}>{t('settings.becomeConsultant', 'Danışman Ol')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View>
            <Text style={styles.kicker}>{t('consultantPanel.kicker', 'DANIŞMAN PANELİ')}</Text>
            <Text style={styles.title}>{t('consultantPanel.title', 'Bugünkü çalışma alanınız')}</Text>
            <Text style={styles.subtitle}>
              {t('consultantPanel.subtitle', 'Aylık performans, randevu ve mesaj uyarılarınızı buradan takip edin.')}
            </Text>
          </View>

          {accountLoading && !profile && !completion && <ActivityIndicator color={colors.gold} />}
          {!accountLoading && !profile?.publication_status && <View style={styles.card}>
            <Text style={styles.cardText}>{t('consultantPanel.accountUnavailable', 'Profil bilgileri şu anda yüklenemiyor.')}</Text>
            <Pressable style={styles.ghostBtn} onPress={loadAccount}><Text style={styles.ghostBtnText}>{t('common.retry', 'Tekrar dene')}</Text></Pressable>
          </View>}
          {profile?.publication_status && <View style={styles.card}>
            <View style={styles.row}>
              <CheckCircle2 size={20} color={profile.publication_status.is_published ? colors.success : colors.warning} />
              <Text style={styles.cardTitle}>{profile.publication_status.is_published
                ? t('consultantPanel.publication.live', 'Profiliniz yayında')
                : t('consultantPanel.publication.notLive', 'Profiliniz henüz yayında değil')}</Text>
            </View>
            {!profile.publication_status.is_published && <>
              <Text style={styles.cardText}>{t('consultantPanel.publication.hint', 'Eksikler tamamlandığında profiliniz otomatik yayımlanır.')}</Text>
              {PUBLISH_MISSING.filter((key) => profile.publication_status?.missing.includes(key)).map((key) => <Text key={key} style={styles.cardText}>• {t(`consultantPanel.publication.missing.${key}`, key)}</Text>)}
              <Pressable style={styles.ghostBtn} onPress={() => router.push('/consultant/profile' as any)}><Text style={styles.ghostBtnText}>{t('consultantPanel.publication.openProfile', 'Profili Aç')}</Text></Pressable>
            </>}
          </View>}

          {completion && <View style={styles.card}>
            <View style={styles.row}><Text style={styles.cardTitle}>{t('consultantPanel.completion.title', 'Profil tamamlama')}</Text><Text style={styles.statValue}>%{completion.score}</Text></View>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, completion.score))}%` }]} /></View>
            {completion.items.filter((item) => !item.done).map((item) => <Pressable key={item.id} style={styles.missingRow} onPress={() => router.push(completionRoute(item.tab) as any)} accessibilityRole="button">
              <Text style={styles.missingLabel}>{t(`consultantPanel.completion.items.${item.id}`, item.label)}</Text>
              <Text style={styles.statDelta}>+{item.weight}%</Text>
            </Pressable>)}
          </View>}
          {!accountLoading && !completion && <View style={styles.card}>
            <Text style={styles.cardText}>{t('consultantPanel.completionUnavailable', 'Profil tamamlama bilgisi şu anda yüklenemiyor.')}</Text>
            <Pressable style={styles.ghostBtn} onPress={loadAccount}><Text style={styles.ghostBtnText}>{t('common.retry', 'Tekrar dene')}</Text></Pressable>
          </View>}

          {statsLoading && !stats ? (
            <View style={styles.card}>
              <ActivityIndicator color={colors.gold} />
            </View>
          ) : stats ? (
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{t('consultantPanel.stats.monthSessions', 'BU AY SEANS')}</Text>
                <Text style={styles.statValue}>{stats?.this_month_session_count ?? 0}</Text>
                <Text style={styles.statDelta}>{t('consultantPanel.stats.delta', '{{value}}%', { value: stats?.session_delta_pct ?? 0 })}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{t('consultantPanel.stats.monthEarnings', 'BU AY KAZANÇ')}</Text>
                <Text style={styles.statValue}>{formatTry(stats?.this_month_earnings ?? 0)}</Text>
                <Text style={styles.statDelta}>{t('consultantPanel.stats.delta', '{{value}}%', { value: stats?.earnings_delta_pct ?? 0 })}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{t('consultantPanel.stats.rating', 'PUAN')}</Text>
                <Text style={styles.statValue}>{Number(stats.rating_avg ?? 0).toFixed(1)}</Text>
                <Text style={styles.statDelta}>{t('consultantPanel.stats.reviewCount', '{{count}} yorum', { count: stats?.rating_count ?? 0 })}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{t('consultantPanel.stats.favorites', 'FAVORİ')}</Text>
                <Text style={styles.statValue}>{stats?.favorite_count ?? 0}</Text>
                <Text style={styles.statDelta}>{t('consultantPanel.stats.totalSessions', '{{count}} toplam seans', { count: stats?.total_sessions ?? 0 })}</Text>
              </View>
            </View>
          ) : <View style={styles.card}>
            <Text style={styles.cardText}>{t('consultantPanel.statsUnavailable', 'Performans verileri şu anda yüklenemiyor.')}</Text>
            <Pressable style={styles.ghostBtn} onPress={loadStats}><Text style={styles.ghostBtnText}>{t('common.retry', 'Tekrar dene')}</Text></Pressable>
          </View>}

          {stats && <><View style={styles.card}>
            <View style={styles.row}>
              <CalendarDays size={20} color={colors.gold} />
              <Text style={styles.cardTitle}>{t('consultantPanel.cards.bookingsTitle', 'Randevular')}</Text>
            </View>
            <Text style={styles.cardText}>
              {t('consultantPanel.cards.bookingsBody', '{{pending}} bekleyen randevu, {{instant}} anlık görüşme talebi var.', {
                pending: stats?.pending_bookings ?? 0,
                instant: stats?.requested_now_count ?? 0,
              })}
            </Text>
            <Pressable style={styles.btn} onPress={() => router.push('/consultant/bookings' as any)}>
              <Text style={styles.btnText}>{t('consultantPanel.cards.openBookings', 'Randevuları Aç')}</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <MessageSquare size={20} color={colors.gold} />
              <Text style={styles.cardTitle}>{t('consultantPanel.cards.messagesTitle', 'Mesajlar ve medya soruları')}</Text>
            </View>
            <Text style={styles.cardText}>
              {t('consultantPanel.cards.messagesBody', '{{count}} bekleyen mesaj. Ortalama yanıt süresi: {{minutes}} dk.', {
                count: stats?.pending_messages ?? 0,
                minutes: stats?.avg_response_minutes ?? 0,
              })}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <Radio size={20} color={stats?.is_available ? colors.success : colors.textMuted} />
              <Text style={styles.cardTitle}>{t('consultantPanel.cards.presenceTitle', 'Canlı durum')}</Text>
            </View>
            <Text style={styles.cardText}>
              {stats?.is_available
                ? t('consultantPanel.cards.presenceOnline', 'Profiliniz müsait görünüyor.')
                : t('consultantPanel.cards.presenceOffline', 'Profiliniz şu anda müsait değil görünüyor.')}
            </Text>
          </View>
          </>}

          <Pressable style={styles.ghostBtn} onPress={() => router.push('/(tabs)/profile' as any)}>
            <Text style={styles.ghostBtnText}>{t('consultantPanel.customerProfile', 'Üye Profiline Dön')}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
