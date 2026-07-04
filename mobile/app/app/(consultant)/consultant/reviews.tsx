import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { MessageSquare, Send, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { consultantSelfApi } from '@/lib/api';
import { useAppTheme, type AppTheme } from '@/theme';
import type { ConsultantSelfReview } from '@/types';

import { logger } from '@/lib/logger';
type FilterKey = 'all' | 'unreplied' | 'low' | 'high';

function buildStyles(t: AppTheme) {
  const { colors, font, radius, spacing } = t;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    safe: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.bg },
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
    kicker: { fontFamily: font.sansBold, fontSize: 11, letterSpacing: 2, color: colors.gold },
    title: { fontFamily: font.display, fontSize: 26, color: colors.text, marginTop: 4 },
    filters: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    filterBtn: { flex: 1, minHeight: 38, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
    filterBtnActive: { backgroundColor: colors.gold, borderColor: colors.gold },
    filterText: { fontFamily: font.sansBold, fontSize: 11, color: colors.textMuted, textAlign: 'center' },
    filterTextActive: { color: colors.ink },
    list: { padding: spacing.lg, gap: 12, paddingBottom: 48 },
    card: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 16, gap: 12 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    author: { flex: 1, fontFamily: font.sansBold, fontSize: 15, color: colors.text },
    meta: { fontFamily: font.sans, fontSize: 12, color: colors.textMuted },
    stars: { flexDirection: 'row', gap: 2 },
    comment: { fontFamily: font.sans, fontSize: 14, lineHeight: 21, color: colors.textDim },
    replyBox: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.lineSoft, backgroundColor: colors.bgDeep, padding: 12, gap: 8 },
    replyLabel: { fontFamily: font.sansBold, fontSize: 11, color: colors.gold, letterSpacing: 1 },
    input: { minHeight: 74, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontFamily: font.sans, fontSize: 14, textAlignVertical: 'top' },
    sendBtn: { height: 40, borderRadius: radius.pill, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    sendText: { fontFamily: font.sansBold, fontSize: 12, color: colors.ink },
    emptyTitle: { fontFamily: font.display, fontSize: 22, color: colors.text, textAlign: 'center', marginTop: 12 },
    emptyBody: { fontFamily: font.sans, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginTop: 8 },
  });
}

function filterReview(filter: FilterKey, review: ConsultantSelfReview) {
  const rating = Number(review.rating ?? 0);
  if (filter === 'unreplied') return !review.consultant_reply;
  if (filter === 'low') return rating <= 2;
  if (filter === 'high') return rating >= 4;
  return true;
}

export default function ConsultantReviewsScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildStyles(theme), [theme]);

  const [items, setItems] = useState<ConsultantSelfReview[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<FilterKey>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await consultantSelfApi.reviews());
    } catch (err) {
      logger.error('Consultant reviews load error:', err);
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

  const filtered = useMemo(() => items.filter((item) => filterReview(filter, item)), [filter, items]);

  const sendReply = async (review: ConsultantSelfReview) => {
    const text = (drafts[review.id] ?? '').trim();
    if (!text) return;
    setBusyId(review.id);
    try {
      await consultantSelfApi.replyReview(review.id, text);
      setDrafts((prev) => ({ ...prev, [review.id]: '' }));
      await load();
      Alert.alert(t('common.success', 'Başarılı'), t('consultantPanel.reviews.replySent', 'Yanıt gönderildi.'));
    } catch (err) {
      Alert.alert(t('common.error', 'Hata'), t('consultantPanel.reviews.replyError', 'Yanıt gönderilemedi.'));
    } finally {
      setBusyId(null);
    }
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
          <Text style={styles.kicker}>{t('consultantPanel.reviews.kicker', 'YORUMLAR')}</Text>
          <Text style={styles.title}>{t('consultantPanel.reviews.title', 'Danışan yorumları')}</Text>
        </View>

        <View style={styles.filters}>
          {(['all', 'unreplied', 'low', 'high'] as FilterKey[]).map((key) => {
            const active = filter === key;
            return (
              <Pressable key={key} style={[styles.filterBtn, active && styles.filterBtnActive]} onPress={() => setFilter(key)}>
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{t(`consultantPanel.reviews.filters.${key}`, key)}</Text>
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
              <MessageSquare size={38} color={colors.gold} />
              <Text style={styles.emptyTitle}>{t('consultantPanel.reviews.emptyTitle', 'Yorum yok')}</Text>
              <Text style={styles.emptyBody}>{t('consultantPanel.reviews.emptyBody', 'Bu filtrede görüntülenecek yorum bulunmuyor.')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.author}>{item.name || item.email || t('consultantPanel.reviews.customerFallback', 'Danışan')}</Text>
                  <Text style={styles.meta}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={styles.stars}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={14} color={index < Number(item.rating ?? 0) ? colors.gold : colors.textMuted} fill={index < Number(item.rating ?? 0) ? colors.gold : 'transparent'} />
                  ))}
                </View>
              </View>

              {!!item.comment && <Text style={styles.comment}>{item.comment}</Text>}

              {item.consultant_reply ? (
                <View style={styles.replyBox}>
                  <Text style={styles.replyLabel}>{t('consultantPanel.reviews.replyLabel', 'DANIŞMAN YANITI')}</Text>
                  <Text style={styles.comment}>{item.consultant_reply}</Text>
                </View>
              ) : (
                <View style={styles.replyBox}>
                  <Text style={styles.replyLabel}>{t('consultantPanel.reviews.replyLabel', 'DANIŞMAN YANITI')}</Text>
                  <TextInput
                    style={styles.input}
                    value={drafts[item.id] ?? ''}
                    onChangeText={(value) => setDrafts((prev) => ({ ...prev, [item.id]: value }))}
                    placeholder={t('consultantPanel.reviews.replyPlaceholder', 'Yanıtınızı yazın...')}
                    placeholderTextColor={colors.textMuted}
                    multiline
                    maxLength={2000}
                  />
                  <Pressable style={styles.sendBtn} onPress={() => sendReply(item)} disabled={busyId === item.id || !(drafts[item.id] ?? '').trim()}>
                    {busyId === item.id ? <ActivityIndicator color={colors.ink} /> : <Send size={15} color={colors.ink} />}
                    <Text style={styles.sendText}>{t('consultantPanel.reviews.sendReply', 'Yanıtla')}</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        />
      </SafeAreaView>
    </View>
  );
}
