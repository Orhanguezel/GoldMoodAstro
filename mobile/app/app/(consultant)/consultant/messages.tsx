import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { MessageCircle, Send } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { consultantSelfApi } from '@/lib/api';
import { useAppTheme, type AppTheme } from '@/theme';
import type { ConsultantSelfThread, ConsultantSelfThreadMessage } from '@/types';

import { logger } from '@/lib/logger';
function buildStyles(t: AppTheme) {
  const { colors, font, radius, spacing } = t;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    safe: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
    kicker: { fontFamily: font.sansBold, fontSize: 11, letterSpacing: 2, color: colors.gold },
    title: { fontFamily: font.display, fontSize: 26, color: colors.text, marginTop: 4 },
    body: { flex: 1, paddingHorizontal: spacing.lg, gap: 12 },
    threadStrip: { maxHeight: 118 },
    threadContent: { gap: 10, paddingVertical: 4, paddingRight: spacing.lg },
    threadCard: { width: 220, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 12, gap: 6 },
    threadActive: { borderColor: colors.gold, backgroundColor: 'rgba(201,169,97,0.10)' },
    threadTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    threadName: { flex: 1, fontFamily: font.sansBold, fontSize: 14, color: colors.text },
    badge: { minWidth: 22, height: 22, borderRadius: radius.pill, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
    badgeText: { fontFamily: font.sansBold, fontSize: 10, color: colors.text },
    chip: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.bgDeep },
    chipText: { fontFamily: font.sansBold, fontSize: 9, color: colors.gold, letterSpacing: 0.8 },
    preview: { fontFamily: font.sans, fontSize: 12, color: colors.textMuted },
    conversation: { flex: 1, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, overflow: 'hidden' },
    conversationHeader: { padding: 14, borderBottomWidth: 1, borderBottomColor: colors.lineSoft, gap: 3 },
    conversationTitle: { fontFamily: font.sansBold, fontSize: 15, color: colors.text },
    conversationMeta: { fontFamily: font.sans, fontSize: 12, color: colors.textMuted },
    messages: { flex: 1 },
    messagesContent: { padding: 14, gap: 10 },
    bubbleRow: { flexDirection: 'row' },
    bubbleRowMine: { justifyContent: 'flex-end' },
    bubble: { maxWidth: '82%', borderRadius: radius.lg, paddingHorizontal: 12, paddingVertical: 9, gap: 5 },
    bubbleMine: { backgroundColor: colors.gold, borderBottomRightRadius: 4 },
    bubbleOther: { backgroundColor: colors.bgDeep, borderBottomLeftRadius: 4 },
    bubbleText: { fontFamily: font.sans, fontSize: 14, lineHeight: 20 },
    bubbleTextMine: { color: colors.ink },
    bubbleTextOther: { color: colors.text },
    time: { fontFamily: font.sans, fontSize: 10 },
    timeMine: { color: 'rgba(13,11,30,0.62)' },
    timeOther: { color: colors.textMuted },
    composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderTopWidth: 1, borderTopColor: colors.lineSoft, padding: 10 },
    input: { flex: 1, minHeight: 42, maxHeight: 110, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bgDeep, paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontFamily: font.sans, fontSize: 14 },
    sendBtn: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gold },
    sendDisabled: { opacity: 0.45 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 },
    emptyTitle: { fontFamily: font.sansBold, fontSize: 16, color: colors.text, textAlign: 'center' },
    emptyBody: { fontFamily: font.sans, fontSize: 13, color: colors.textMuted, lineHeight: 20, textAlign: 'center' },
  });
}

function initials(name?: string | null) {
  return (name || '?')
    .split(/\s+/)
    .map((part) => part[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function displayName(thread: ConsultantSelfThread, fallback: string) {
  return thread.customer?.full_name || thread.customer?.email || fallback;
}

function formatTime(iso?: string | null) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default function ConsultantMessagesScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildStyles(theme), [theme]);

  const [threads, setThreads] = useState<ConsultantSelfThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConsultantSelfThreadMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);

  const unknown = t('consultantPanel.messages.unknownCustomer', 'Danışan');
  const activeThread = threads.find((thread) => thread.thread_id === activeId) ?? null;

  const loadMessages = useCallback(async (threadId: string) => {
    setLoadingMessages(true);
    try {
      const convo = await consultantSelfApi.threadMessages(threadId);
      setMessages(convo.messages ?? []);
      await consultantSelfApi.markThreadRead(threadId).catch(() => undefined);
      setThreads((prev) => prev.map((thread) => (thread.thread_id === threadId ? { ...thread, unread_count: 0 } : thread)));
    } catch (err) {
      logger.error('Consultant thread messages load error:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const loadThreads = useCallback(async () => {
    try {
      const next = await consultantSelfApi.threads();
      setThreads(next);
      const nextActive = activeId && next.some((thread) => thread.thread_id === activeId) ? activeId : (next[0]?.thread_id ?? null);
      setActiveId(nextActive);
      if (nextActive) {
        await loadMessages(nextActive);
      } else {
        setMessages([]);
      }
    } catch (err) {
      logger.error('Consultant threads load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeId, loadMessages]);

  useFocusEffect(
    useCallback(() => {
      loadThreads();
    }, [loadThreads]),
  );

  const selectThread = (id: string) => {
    if (id === activeId) return;
    setActiveId(id);
    setDraft('');
    loadMessages(id);
  };

  const sendReply = async () => {
    if (!activeId || !draft.trim()) return;
    setSending(true);
    try {
      const sent = await consultantSelfApi.replyThread(activeId, draft.trim());
      setDraft('');
      setMessages((prev) => [...prev, sent]);
      await loadThreads();
    } catch (err) {
      Alert.alert(t('common.error', 'Hata'), t('consultantPanel.messages.sendError', 'Yanıt gönderilemedi.'));
    } finally {
      setSending(false);
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.kicker}>{t('consultantPanel.messages.kicker', 'MESAJLAR')}</Text>
          <Text style={styles.title}>{t('consultantPanel.messages.title', 'Danışan mesajları')}</Text>
        </View>

        {threads.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.empty}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadThreads(); }} tintColor={colors.gold} />}
          >
            <MessageCircle size={36} color={colors.gold} />
            <Text style={styles.emptyTitle}>{t('consultantPanel.messages.emptyTitle', 'Henüz mesaj yok')}</Text>
            <Text style={styles.emptyBody}>
              {t('consultantPanel.messages.emptyBody', 'Danışanlar profilinizdeki mesaj butonundan size ulaştığında konuşmalar burada görünür.')}
            </Text>
          </ScrollView>
        ) : (
          <View style={styles.body}>
            <ScrollView horizontal style={styles.threadStrip} contentContainerStyle={styles.threadContent} showsHorizontalScrollIndicator={false}>
              {threads.map((thread) => {
                const active = thread.thread_id === activeId;
                return (
                  <Pressable key={thread.thread_id} style={[styles.threadCard, active && styles.threadActive]} onPress={() => selectThread(thread.thread_id)}>
                    <View style={styles.threadTop}>
                      <Text style={styles.threadName} numberOfLines={1}>{displayName(thread, unknown)}</Text>
                      {thread.unread_count > 0 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{thread.unread_count}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>
                        {thread.context_type === 'booking'
                          ? t('consultantPanel.messages.bookingBadge', 'Randevu')
                          : t('consultantPanel.messages.preMessageBadge', 'Ön mesaj')}
                      </Text>
                    </View>
                    <Text style={styles.preview} numberOfLines={2}>
                      {thread.last_message?.from_consultant ? `${t('consultantPanel.messages.youPrefix', 'Siz:')} ` : ''}
                      {thread.last_message?.text ?? initials(displayName(thread, unknown))}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.conversation}>
              {activeThread ? (
                <>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.conversationTitle}>{displayName(activeThread, unknown)}</Text>
                    <Text style={styles.conversationMeta}>{activeThread.customer?.email ?? formatTime(activeThread.updated_at)}</Text>
                  </View>
                  <ScrollView style={styles.messages} contentContainerStyle={styles.messagesContent}>
                    {loadingMessages ? (
                      <ActivityIndicator color={colors.gold} />
                    ) : (
                      messages.map((message) => {
                        const mine = message.from_consultant;
                        return (
                          <View key={message.id} style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
                            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                              <Text style={[styles.bubbleText, mine ? styles.bubbleTextMine : styles.bubbleTextOther]}>{message.text}</Text>
                              <Text style={[styles.time, mine ? styles.timeMine : styles.timeOther]}>{formatTime(message.created_at)}</Text>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </ScrollView>
                  <View style={styles.composer}>
                    <TextInput
                      style={styles.input}
                      value={draft}
                      onChangeText={setDraft}
                      placeholder={t('consultantPanel.messages.placeholder', 'Yanıtınızı yazın...')}
                      placeholderTextColor={colors.textMuted}
                      multiline
                      maxLength={2000}
                      editable={!sending}
                    />
                    <Pressable style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendDisabled]} onPress={sendReply} disabled={!draft.trim() || sending}>
                      {sending ? <ActivityIndicator color={colors.ink} /> : <Send size={18} color={colors.ink} />}
                    </Pressable>
                  </View>
                </>
              ) : (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>{t('consultantPanel.messages.selectThread', 'Bir konuşma seçin')}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
