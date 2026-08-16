import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { CalendarDays, Check, Clock, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useAppTheme, type AppTheme } from '@/theme';
import { consultantSelfApi } from '@/lib/api';
import type { ConsultantSelfBooking } from '@/types';

import { logger } from '@/lib/logger';
type FilterKey = 'incoming' | 'today' | 'all';

const ACTIONABLE_STATUSES = new Set(['pending', 'requested_now']);

function localYmd(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildStyles(t: AppTheme) {
  const { colors, font, radius, spacing } = t;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    safe: { flex: 1 },
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
    kicker: { fontFamily: font.sansBold, fontSize: 11, letterSpacing: 2, color: colors.gold },
    title: { fontFamily: font.display, fontSize: 26, color: colors.text, marginTop: 4 },
    filters: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    filterBtn: { flex: 1, height: 38, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
    filterBtnActive: { backgroundColor: colors.gold, borderColor: colors.gold },
    filterText: { fontFamily: font.sansBold, fontSize: 12, color: colors.textMuted },
    filterTextActive: { color: colors.ink },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    list: { padding: spacing.lg, gap: 12, paddingBottom: 40 },
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 12 },
    topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    customer: { fontFamily: font.sansBold, fontSize: 15, color: colors.text, flex: 1 },
    badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: 'rgba(201,169,97,0.12)' },
    badgeText: { fontFamily: font.sansBold, fontSize: 10, color: colors.gold },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    meta: { fontFamily: font.sans, fontSize: 13, color: colors.textDim },
    note: { fontFamily: font.sans, fontSize: 13, lineHeight: 20, color: colors.textMuted },
    actions: { flexDirection: 'row', gap: 10 },
    actionBtn: { flex: 1, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
    approveBtn: { backgroundColor: colors.success },
    rejectBtn: { backgroundColor: colors.danger },
    actionText: { fontFamily: font.sansBold, fontSize: 12, color: colors.ink },
    emptyTitle: { fontFamily: font.display, fontSize: 22, color: colors.text, textAlign: 'center' },
    emptyBody: { fontFamily: font.sans, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginTop: 8 },
  });
}

function statusLabel(status: string, t: ReturnType<typeof useTranslation>['t']) {
  const key = `consultantPanel.bookings.status.${status}`;
  return t(key, status);
}

export default function ConsultantBookingsScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildStyles(theme), [theme]);

  const [filter, setFilter] = useState<FilterKey>('incoming');
  const [items, setItems] = useState<ConsultantSelfBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await consultantSelfApi.bookings();
      setItems(data);
    } catch (err) {
      logger.error('Consultant bookings load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    const today = localYmd();
    if (filter === 'incoming') return items.filter((item) => ACTIONABLE_STATUSES.has(item.status));
    if (filter === 'today') return items.filter((item) => item.appointment_date === today);
    return items;
  }, [filter, items]);

  const updateItemStatus = (id: string, status: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const approve = (item: ConsultantSelfBooking) => {
    Alert.alert(
      t('consultantPanel.bookings.approveTitle', 'Randevuyu kabul et'),
      t('consultantPanel.bookings.approveBody', '{{name}} için randevuyu onaylamak istiyor musunuz?', { name: item.name ?? item.email ?? '' }),
      [
        { text: t('common.cancel', 'Vazgeç'), style: 'cancel' },
        {
          text: t('consultantPanel.bookings.approve', 'Kabul Et'),
          onPress: async () => {
            setBusyId(item.id);
            try {
              const res = await consultantSelfApi.approveBooking(item.id);
              updateItemStatus(item.id, res.status);
              if (item.status === 'requested_now') {
                router.push(`/call/${item.id}` as any);
              }
            } catch (err) {
              Alert.alert(t('common.error', 'Hata'), t('consultantPanel.bookings.actionError', 'İşlem tamamlanamadı.'));
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
    );
  };

  const reject = (item: ConsultantSelfBooking) => {
    Alert.alert(
      t('consultantPanel.bookings.rejectTitle', 'Randevuyu reddet'),
      t('consultantPanel.bookings.rejectBody', 'Bu randevuyu reddetmek istiyor musunuz?'),
      [
        { text: t('common.cancel', 'Vazgeç'), style: 'cancel' },
        {
          text: t('consultantPanel.bookings.reject', 'Reddet'),
          style: 'destructive',
          onPress: async () => {
            setBusyId(item.id);
            try {
              const res = await consultantSelfApi.rejectBooking(item.id);
              updateItemStatus(item.id, res.status);
            } catch (err) {
              Alert.alert(t('common.error', 'Hata'), t('consultantPanel.bookings.actionError', 'İşlem tamamlanamadı.'));
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.kicker}>{t('consultantPanel.bookings.kicker', 'DANIŞMAN TAKVİMİ')}</Text>
          <Text style={styles.title}>{t('consultantPanel.bookings.title', 'Danışman randevuları')}</Text>
        </View>

        <View style={styles.filters}>
          {(['incoming', 'today', 'all'] as FilterKey[]).map((key) => {
            const active = filter === key;
            return (
              <Pressable key={key} style={[styles.filterBtn, active && styles.filterBtnActive]} onPress={() => setFilter(key)}>
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {t(`consultantPanel.bookings.filters.${key}`, key)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <CalendarDays size={38} color={colors.gold} />
              <Text style={styles.emptyTitle}>{t('consultantPanel.bookings.emptyTitle', 'Randevu yok')}</Text>
              <Text style={styles.emptyBody}>{t('consultantPanel.bookings.emptyBody', 'Bu filtrede görüntülenecek danışman randevusu bulunmuyor.')}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const actionable = ACTIONABLE_STATUSES.has(item.status);
            return (
              <View style={styles.card}>
                <View style={styles.topRow}>
                  <Text style={styles.customer}>{item.name ?? item.email ?? t('consultantPanel.bookings.customerFallback', 'Danışan')}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{statusLabel(item.status, t)}</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Clock size={15} color={colors.gold} />
                  <Text style={styles.meta}>
                    {item.appointment_date} · {(item.appointment_time ?? '').slice(0, 5) || '--:--'} · {item.session_duration} dk
                  </Text>
                </View>

                <Text style={styles.meta}>
                  {item.service_title ?? t('consultantPanel.bookings.session', 'Seans')} · {item.media_type} · ₺{Math.round(Number(item.session_price ?? 0))}
                </Text>

                {!!item.customer_message && <Text style={styles.note}>{item.customer_message}</Text>}

                {actionable ? (
                  <View style={styles.actions}>
                    <Pressable style={[styles.actionBtn, styles.approveBtn]} onPress={() => approve(item)} disabled={busyId === item.id}>
                      {busyId === item.id ? <ActivityIndicator color={colors.ink} /> : <Check size={16} color={colors.ink} />}
                      <Text style={styles.actionText}>{t('consultantPanel.bookings.approve', 'Kabul Et')}</Text>
                    </Pressable>
                    <Pressable style={[styles.actionBtn, styles.rejectBtn]} onPress={() => reject(item)} disabled={busyId === item.id}>
                      <X size={16} color={colors.ink} />
                      <Text style={styles.actionText}>{t('consultantPanel.bookings.reject', 'Reddet')}</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      </SafeAreaView>
    </View>
  );
}
