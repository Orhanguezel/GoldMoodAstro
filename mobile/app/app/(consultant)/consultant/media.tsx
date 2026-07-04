import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  createAudioPlayer,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, Play, RefreshCcw, Square, Video } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { mediaMessagesApi, storageApi } from '@/lib/api';
import { storage } from '@/lib/storage';
import { useAppTheme, type AppTheme } from '@/theme';
import type { MediaMessage } from '@/types';
import { AuthVideoView } from '@/components/AuthVideoView';

import { logger } from '@/lib/logger';
function buildStyles(t: AppTheme) {
  const { colors, font, radius, spacing } = t;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    safe: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    kicker: { fontFamily: font.sansBold, fontSize: 11, letterSpacing: 2, color: colors.gold },
    title: { fontFamily: font.display, fontSize: 26, color: colors.text, marginTop: 4 },
    refreshBtn: { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
    list: { padding: spacing.lg, gap: 12 },
    card: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 16, gap: 12 },
    top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgDeep, borderWidth: 1, borderColor: colors.lineSoft },
    main: { flex: 1, gap: 4 },
    customer: { fontFamily: font.sansBold, fontSize: 15, color: colors.text },
    meta: { fontFamily: font.sans, fontSize: 12, color: colors.textMuted },
    status: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: 'rgba(201,169,97,0.12)' },
    statusText: { fontFamily: font.sansBold, fontSize: 10, color: colors.gold },
    note: { fontFamily: font.sans, fontSize: 13, color: colors.textDim, lineHeight: 19 },
    playerBtn: { height: 42, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: colors.bgDeep, borderWidth: 1, borderColor: colors.lineSoft },
    playerText: { fontFamily: font.sansBold, fontSize: 13, color: colors.text },
    videoBox: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md, backgroundColor: '#000', overflow: 'hidden' },
    replyBox: { gap: 10, padding: 12, borderRadius: radius.md, backgroundColor: colors.bgDeep, borderWidth: 1, borderColor: colors.lineSoft },
    replyTitle: { fontFamily: font.sansBold, fontSize: 13, color: colors.text },
    input: { minHeight: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontFamily: font.sans, fontSize: 14 },
    actionRow: { flexDirection: 'row', gap: 8 },
    primaryBtn: { flex: 1, minHeight: 44, borderRadius: radius.pill, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 10 },
    primaryText: { fontFamily: font.sansBold, fontSize: 12, color: colors.ink, textAlign: 'center' },
    disabled: { opacity: 0.5 },
    empty: { padding: 48, alignItems: 'center', gap: 14 },
    emptyText: { fontFamily: font.sans, fontSize: 14, color: colors.textMuted, lineHeight: 21, textAlign: 'center' },
  });
}

function statusLabel(item: MediaMessage, t: ReturnType<typeof useTranslation>['t']) {
  if (item.status === 'answered') return t('consultantPanel.media.statusAnswered', 'Yanıtlandı');
  if (item.status === 'expired') return t('consultantPanel.media.statusExpired', 'Süresi doldu');
  if (item.status === 'refunded') return t('consultantPanel.media.statusRefunded', 'İade edildi');
  return t('consultantPanel.media.statusSent', 'Yanıt bekliyor');
}

function mediaLabel(item: MediaMessage, t: ReturnType<typeof useTranslation>['t']) {
  return item.kind === 'video'
    ? t('consultantPanel.media.videoQuestion', 'Görüntülü soru')
    : t('consultantPanel.media.audioQuestion', 'Sesli soru');
}

export default function ConsultantMediaMessagesScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildStyles(theme), [theme]);

  const [items, setItems] = useState<MediaMessage[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recordingStartedAtRef = useRef<number | null>(null);
  const soundRef = useRef<AudioPlayer | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await mediaMessagesApi.listConsultant();
      setItems(data);
    } catch (err) {
      logger.error('Consultant media messages load error:', err);
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
      audioRecorder.stop().catch(() => {});
    };
  }, [audioRecorder, load]);

  const fileSource = useCallback((id: string) => ({
    uri: mediaMessagesApi.fileUrl(id),
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
  }), [authToken]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const playAudio = async (id: string) => {
    try {
      if (soundRef.current) {
        soundRef.current.remove();
        soundRef.current = null;
      }
      setPlayingId(id);
      const token = await storage.getAuthToken();
      const player = createAudioPlayer({
        uri: mediaMessagesApi.fileUrl(id),
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
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
      Alert.alert(t('common.error', 'Hata'), t('consultantPanel.media.playError', 'Ses dosyası oynatılamadı.'));
    }
  };

  const submitReply = async (item: MediaMessage, uri: string, mime: string, durationSeconds?: number) => {
    setWorkingId(item.id);
    try {
      const form = new FormData();
      form.append('file', {
        uri,
        name: `${item.kind}-reply-${Date.now()}.${item.kind === 'video' ? 'mp4' : 'm4a'}`,
        type: mime,
      } as unknown as Blob);
      const upload = await storageApi.upload(form, {
        bucket: 'media_messages',
        path: `${item.consultant_id}/replies/${Date.now()}`,
      });
      if (!upload.path) throw new Error('upload_failed');
      await mediaMessagesApi.reply(item.id, {
        kind: item.kind,
        storage_path: upload.path,
        duration_seconds: durationSeconds,
        note: notes[item.id]?.trim() || null,
      });
      setNotes((prev) => ({ ...prev, [item.id]: '' }));
      await load();
      Alert.alert(t('common.success', 'Başarılı'), t('consultantPanel.media.replySent', 'Yanıt gönderildi.'));
    } catch (err) {
      Alert.alert(t('common.error', 'Hata'), t('consultantPanel.media.replyError', 'Yanıt gönderilemedi.'));
    } finally {
      setWorkingId(null);
    }
  };

  const startAudioReply = async (item: MediaMessage) => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('consultantPanel.media.micPermissionTitle', 'Mikrofon izni gerekli'), t('consultantPanel.media.micPermissionBody', 'Sesli yanıt kaydetmek için mikrofon izni vermelisiniz.'));
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      recordingStartedAtRef.current = Date.now();
      setRecordingId(item.id);
    } catch (err) {
      Alert.alert(t('common.error', 'Hata'), t('consultantPanel.media.recordError', 'Kayıt başlatılamadı.'));
    }
  };

  const stopAudioReply = async (item: MediaMessage) => {
    const startedAt = recordingStartedAtRef.current ?? Date.now();
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      recordingStartedAtRef.current = null;
      setRecordingId(null);
      await setAudioModeAsync({ allowsRecording: false });
      if (!uri) throw new Error('recording_uri_missing');
      await submitReply(item, uri, 'audio/mp4', Math.max(1, Math.round((Date.now() - startedAt) / 1000)));
    } catch (err) {
      recordingStartedAtRef.current = null;
      setRecordingId(null);
      Alert.alert(t('common.error', 'Hata'), t('consultantPanel.media.recordError', 'Kayıt tamamlanamadı.'));
    }
  };

  const recordVideoReply = async (item: MediaMessage) => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('consultantPanel.media.cameraPermissionTitle', 'Kamera izni gerekli'), t('consultantPanel.media.cameraPermissionBody', 'Görüntülü yanıt kaydetmek için kamera izni vermelisiniz.'));
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 180,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const asset = result.assets[0];
      await submitReply(
        item,
        asset.uri,
        asset.mimeType ?? 'video/mp4',
        asset.duration ? Math.max(1, Math.round(asset.duration / 1000)) : undefined,
      );
    } catch (err) {
      Alert.alert(t('common.error', 'Hata'), t('consultantPanel.media.recordError', 'Kayıt tamamlanamadı.'));
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
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.kicker}>{t('consultantPanel.media.kicker', 'MEDYA SORULARI')}</Text>
              <Text style={styles.title}>{t('consultantPanel.media.title', 'Ücretli sorular')}</Text>
            </View>
            <Pressable style={styles.refreshBtn} onPress={onRefresh}>
              <RefreshCcw size={18} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Mic size={36} color={colors.gold} />
              <Text style={styles.emptyText}>{t('consultantPanel.media.empty', 'Henüz yanıt bekleyen medya sorusu yok.')}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isAnswerable = item.status === 'sent';
            const busy = workingId === item.id;
            const recording = recordingId === item.id;
            return (
              <View style={styles.card}>
                <View style={styles.top}>
                  <View style={styles.icon}>
                    {item.kind === 'video' ? <Video size={20} color={colors.gold} /> : <Mic size={20} color={colors.gold} />}
                  </View>
                  <View style={styles.main}>
                    <Text style={styles.customer}>{item.customer_name ?? t('consultantPanel.media.customerFallback', 'Danışan')}</Text>
                    <Text style={styles.meta}>
                      {mediaLabel(item, t)}
                      {' · '}
                      {Number(item.price || 0).toLocaleString('tr-TR')} {item.currency}
                    </Text>
                    {!!item.reply_due_at && <Text style={styles.meta}>{t('consultantPanel.media.dueAt', 'Son yanıt: {{date}}', { date: new Date(item.reply_due_at).toLocaleString() })}</Text>}
                  </View>
                  <View style={styles.status}>
                    <Text style={styles.statusText}>{statusLabel(item, t)}</Text>
                  </View>
                </View>

                {!!item.note && <Text style={styles.note}>{item.note}</Text>}

                {item.kind === 'video' ? (
                  <AuthVideoView source={fileSource(item.id)} style={styles.videoBox} />
                ) : (
                  <Pressable style={styles.playerBtn} onPress={() => playAudio(item.id)} disabled={playingId === item.id}>
                    {playingId === item.id ? <ActivityIndicator color={colors.text} /> : <Play size={16} color={colors.gold} />}
                    <Text style={styles.playerText}>{t('consultantPanel.media.playQuestion', 'Soruyu Dinle')}</Text>
                  </Pressable>
                )}

                {item.reply_id ? (
                  <View style={styles.replyBox}>
                    <Text style={styles.replyTitle}>{t('consultantPanel.media.sentReplyTitle', 'Gönderilen yanıt')}</Text>
                    {!!item.reply_note && <Text style={styles.note}>{item.reply_note}</Text>}
                    {item.reply_kind === 'video' ? (
                      <AuthVideoView source={fileSource(item.reply_id)} style={styles.videoBox} />
                    ) : (
                      <Pressable style={styles.playerBtn} onPress={() => item.reply_id && playAudio(item.reply_id)} disabled={playingId === item.reply_id}>
                        {playingId === item.reply_id ? <ActivityIndicator color={colors.text} /> : <Play size={16} color={colors.gold} />}
                        <Text style={styles.playerText}>{t('consultantPanel.media.playReply', 'Yanıtı Dinle')}</Text>
                      </Pressable>
                    )}
                  </View>
                ) : isAnswerable ? (
                  <View style={styles.replyBox}>
                    <Text style={styles.replyTitle}>{t('consultantPanel.media.replyTitle', 'Yanıt hazırla')}</Text>
                    <TextInput
                      style={styles.input}
                      value={notes[item.id] ?? ''}
                      onChangeText={(value) => setNotes((prev) => ({ ...prev, [item.id]: value }))}
                      placeholder={t('consultantPanel.media.replyNote', 'İsteğe bağlı yanıt notu...')}
                      placeholderTextColor={colors.textMuted}
                      multiline
                      maxLength={1000}
                    />
                    <View style={styles.actionRow}>
                      {item.kind === 'audio' ? (
                        <Pressable
                          style={[styles.primaryBtn, (busy || Boolean(recordingId && !recording)) && styles.disabled]}
                          onPress={() => (recording ? stopAudioReply(item) : startAudioReply(item))}
                          disabled={busy || Boolean(recordingId && !recording)}
                        >
                          {recording ? <Square size={16} color={colors.ink} /> : <Mic size={16} color={colors.ink} />}
                          <Text style={styles.primaryText}>
                            {recording ? t('consultantPanel.media.stopRecording', 'Kaydı Bitir') : t('consultantPanel.media.recordAudioReply', 'Sesli Yanıt Kaydet')}
                          </Text>
                        </Pressable>
                      ) : (
                        <Pressable style={[styles.primaryBtn, busy && styles.disabled]} onPress={() => recordVideoReply(item)} disabled={busy}>
                          {busy ? <ActivityIndicator color={colors.ink} /> : <Video size={16} color={colors.ink} />}
                          <Text style={styles.primaryText}>{t('consultantPanel.media.recordVideoReply', 'Video Yanıt Kaydet')}</Text>
                        </Pressable>
                      )}
                    </View>
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
