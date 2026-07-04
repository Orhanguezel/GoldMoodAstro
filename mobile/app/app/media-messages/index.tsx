import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { createAudioPlayer } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Mic, Play, RefreshCcw, Video } from 'lucide-react-native';

import { useAppTheme, type AppTheme } from '@/theme';
import { safeRouterBack } from '@/lib/navigation';
import { mediaMessagesApi } from '@/lib/api';
import { storage } from '@/lib/storage';
import type { MediaMessage } from '@/types';
import { AuthVideoView } from '@/components/AuthVideoView';

import { logger } from '@/lib/logger';
function buildStyles(t: AppTheme) {
  const { colors, spacing, font, radius } = t;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    safe: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    headerBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
    },
    headerTitle: { fontFamily: font.display, fontSize: 18, color: colors.text },
    listContent: { padding: spacing.lg, gap: 12 },
    card: {
      borderRadius: radius.lg,
      padding: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      gap: 12,
    },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.inkDeep,
      borderWidth: 1,
      borderColor: colors.line,
    },
    cardBody: { flex: 1, gap: 4 },
    consultant: { fontFamily: font.sansBold, fontSize: 15, color: colors.text },
    meta: { fontFamily: font.sans, fontSize: 12, color: colors.textMuted },
    status: {
      alignSelf: 'flex-start',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(201,169,97,0.12)',
    },
    statusText: { fontFamily: font.sansBold, fontSize: 10, color: colors.gold },
    note: { fontFamily: font.sans, fontSize: 13, lineHeight: 19, color: colors.textDim },
    replyBox: {
      padding: 12,
      borderRadius: radius.md,
      backgroundColor: colors.bgDeep,
      borderWidth: 1,
      borderColor: colors.lineSoft,
      gap: 8,
    },
    replyTitle: { fontFamily: font.sansBold, fontSize: 12, color: colors.text },
    replyText: { fontFamily: font.sans, fontSize: 13, lineHeight: 19, color: colors.textDim },
    playBtn: {
      height: 40,
      borderRadius: radius.pill,
      backgroundColor: colors.gold,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    playBtnText: { fontFamily: font.sansBold, fontSize: 13, color: colors.ink },
    videoReply: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md, backgroundColor: '#000', overflow: 'hidden' },
    empty: { padding: 48, alignItems: 'center', gap: 14 },
    emptyText: { fontFamily: font.sans, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
  });
}

function statusLabel(item: MediaMessage, t: ReturnType<typeof useTranslation>['t']) {
  if (item.status === 'answered') return t('mediaMessages.statusAnswered', 'Yanıtlandı');
  if (item.status === 'expired') return t('mediaMessages.statusExpired', 'Süresi doldu');
  if (item.status === 'refunded') return t('mediaMessages.statusRefunded', 'İade edildi');
  return t('mediaMessages.statusSent', 'Yanıt bekliyor');
}

export default function MediaMessagesScreen() {
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();

  const [items, setItems] = useState<MediaMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const soundRef = useRef<AudioPlayer | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await mediaMessagesApi.listMine();
      setItems(data);
    } catch (err) {
      logger.error('Media messages load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    storage.getAuthToken().then(setAuthToken).catch(() => setAuthToken(null));
    return () => {
      soundRef.current?.remove();
      soundRef.current = null;
    };
  }, [load]);

  const fileSource = useCallback((messageId: string, token: string | null) => ({
    uri: mediaMessagesApi.fileUrl(messageId),
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }), []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const playReply = async (item: MediaMessage) => {
    if (!item.reply_id) return;

    try {
      if (soundRef.current) {
        soundRef.current.remove();
        soundRef.current = null;
      }

      setPlayingId(item.id);
      const token = await storage.getAuthToken();
      const player = createAudioPlayer(fileSource(item.reply_id, token));
      soundRef.current = player;
      player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          setPlayingId(null);
          player.remove();
          if (soundRef.current === player) soundRef.current = null;
        }
      });
      player.play();
    } catch (err) {
      setPlayingId(null);
      logger.error('Media reply playback error:', err);
      Alert.alert(
        t('common.error', 'Hata'),
        t('mediaMessages.playError', 'Yanıt oynatılamadı. Lütfen tekrar deneyin.'),
      );
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
          <Pressable onPress={() => safeRouterBack()} style={styles.headerBtn}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('mediaMessages.title', 'Medya Sorularım')}</Text>
          <Pressable onPress={onRefresh} style={styles.headerBtn}>
            <RefreshCcw size={18} color={colors.text} />
          </Pressable>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Mic size={36} color={colors.gold} />
              <Text style={styles.emptyText}>
                {t('mediaMessages.empty', 'Henüz ücretli medya sorunuz yok. Danışman profilinden sesli veya görüntülü soru gönderebilirsiniz.')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.iconWrap}>
                  {item.kind === 'video' ? <Video size={20} color={colors.gold} /> : <Mic size={20} color={colors.gold} />}
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.consultant}>{item.consultant_name ?? t('mediaMessages.consultantFallback', 'Danışman')}</Text>
                  <Text style={styles.meta}>
                    {item.kind === 'video' ? t('mediaMessages.video', 'Görüntülü soru') : t('mediaMessages.audio', 'Sesli soru')}
                    {' · '}
                    {Number(item.price || 0).toLocaleString('tr-TR')} {item.currency}
                  </Text>
                </View>
                <View style={styles.status}>
                  <Text style={styles.statusText}>{statusLabel(item, t)}</Text>
                </View>
              </View>

              {!!item.note && <Text style={styles.note}>{item.note}</Text>}

              {item.reply_id ? (
                <View style={styles.replyBox}>
                  <Text style={styles.replyTitle}>{t('mediaMessages.replyTitle', 'Danışman yanıtı')}</Text>
                  {!!item.reply_note && <Text style={styles.replyText}>{item.reply_note}</Text>}
                  {item.reply_kind === 'video' ? (
                    <AuthVideoView
                      source={fileSource(item.reply_id, authToken)}
                      style={styles.videoReply}
                    />
                  ) : (
                    <Pressable style={styles.playBtn} onPress={() => playReply(item)} disabled={playingId === item.id}>
                      {playingId === item.id ? (
                        <ActivityIndicator color={colors.ink} size="small" />
                      ) : (
                        <Play size={16} color={colors.ink} />
                      )}
                      <Text style={styles.playBtnText}>{t('mediaMessages.playAudio', 'Sesli Yanıtı Dinle')}</Text>
                    </Pressable>
                  )}
                </View>
              ) : (
                <Text style={styles.note}>
                  {item.reply_due_at
                    ? t('mediaMessages.dueAt', 'Yanıt süresi: {{date}}', { date: new Date(item.reply_due_at).toLocaleString() })
                    : t('mediaMessages.waiting', 'Danışman yanıtı bekleniyor.')}
                </Text>
              )}
            </View>
          )}
        />
      </SafeAreaView>
    </View>
  );
}
