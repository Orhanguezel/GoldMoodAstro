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
import { ChatBlockButton, ChatTermsGate, useChatSafety } from '@/components/ChatSafetyActions';
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
    threadActive: { borderColor: colors.gold, backgroundColor: colors.surfaceHigh },
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
    timeMine: { color: colors.ink },
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
  const [threadsError, setThreadsError] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);

  const unknown = t('consultantPanel.messages.unknownCustomer', 'Danışan');
  const activeThread = threads.find((thread) => thread.thread_id === activeId) ?? null;
  const safety = useChatSafety(activeId);

  const loadMessages = useCallback(async (threadId: string) => {
    setLoadingMessages(true);
    setMessagesError(false);
    try {
      const convo = await consultantSelfApi.threadMessages(threadId);
      setMessages(convo.messages ?? []);
      try {
        await consultantSelfApi.markThreadRead(threadId);
        setThreads((prev) => prev.map((thread) => (thread.thread_id === threadId ? { ...thread, unread_count: 0 } : thread)));
      } catch (err) {
        logger.error('Consultant thread read status update error:', err);
      }
    } catch (err) {
      setMessagesError(true);
      setMessages([]);
      logger.error('Consultant thread messages load error:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const loadThreads = useCallback(async () => {
    try {
      const next = await consultantSelfApi.threads();
      setThreadsError(false);
      setThreads(next);
      const nextActive = activeId && next.some((thread) => thread.thread_id === activeId) ? activeId : (next[0]?.thread_id ?? null);
      setActiveId(nextActive);
      if (nextActive) {
        await loadMessages(nextActive);
      } else {
        setMessages([]);
      }
    } catch (err) {
      setThreadsError(true);
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
    setMessages([]);
    setMessagesError(false);
    loadMessages(id);
  };

  const sendReply = async () => {
    if (!activeId || !draft.trim() || threadsError || messagesError || loadingMessages || !safety.ready || safety.blocked || !safety.termsAccepted) return;
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
        {threadsError && <View style={[styles.empty, { flex: 0, paddingVertical: 12 }]}>
          <Text style={styles.emptyTitle}>{t('consultantPanel.messages.loadError', 'Konuşmalar yüklenemedi.')}</Text>
          <Pressable onPress={() => void loadThreads()} accessibilityRole="button" style={[styles.sendBtn, { width: 'auto', paddingHorizontal: 20 }]}><Text style={styles.bubbleTextMine}>{t('common.retry', 'Tekrar dene')}</Text></Pressable>
        </View>}

        {threads.length === 0 && !threadsError ? (
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
        ) : threads.length > 0 ? (
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
                    <ChatBlockButton blockedByMe={safety.blockedByMe} busy={safety.busy || !safety.ready} onPress={safety.toggleBlock} />
                  </View>
                  <ScrollView style={styles.messages} contentContainerStyle={styles.messagesContent}>
                    {loadingMessages ? (
                      <ActivityIndicator color={colors.gold} />
                    ) : messagesError ? (
                      <View style={styles.empty}>
                        <Text style={styles.emptyBody}>{t('consultantPanel.messages.threadLoadError', 'Mesajlar yüklenemedi.')}</Text>
                        <Pressable onPress={() => void loadMessages(activeThread.thread_id)} accessibilityRole="button"><Text style={styles.conversationTitle}>{t('common.retry', 'Tekrar dene')}</Text></Pressable>
                      </View>
                    ) : (
                      messages.map((message) => {
                        const mine = message.from_consultant;
                        return (
                          <View key={message.id} style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
                            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                              <Text style={[styles.bubbleText, mine ? styles.bubbleTextMine : styles.bubbleTextOther]}>{message.text}</Text>
                              <Text style={[styles.time, mine ? styles.timeMine : styles.timeOther]}>{formatTime(message.created_at)}</Text>
                              {!mine && <Pressable accessibilityRole="button" accessibilityLabel={t('chat.report')} onPress={() => safety.report(message.id)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={styles.timeOther}>{t('chat.report')}</Text></Pressable>}
                            </View>
                          </View>
                        );
                      })
                    )}
                  </ScrollView>
                  {safety.blocked && <Text style={styles.emptyBody}>{t('chat.blockedNotice')}</Text>}
                  <ChatTermsGate accepted={safety.termsAccepted} busy={safety.busy} onAccept={() => void safety.acceptTerms()} />
                  <View style={styles.composer}>
                    <TextInput
                      style={styles.input}
                      value={draft}
                      onChangeText={setDraft}
                      placeholder={t('consultantPanel.messages.placeholder', 'Yanıtınızı yazın...')}
                      placeholderTextColor={colors.textMuted}
                      multiline
                      maxLength={2000}
                      editable={!sending && !messagesError && !loadingMessages && !threadsError && safety.ready && !safety.blocked && safety.termsAccepted}
                    />
                    <Pressable style={[styles.sendBtn, (!draft.trim() || sending || messagesError || loadingMessages || threadsError || !safety.ready || safety.blocked || !safety.termsAccepted) && styles.sendDisabled]} onPress={sendReply} disabled={!draft.trim() || sending || messagesError || loadingMessages || threadsError || !safety.ready || safety.blocked || !safety.termsAccepted}>
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
        ) : null}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
