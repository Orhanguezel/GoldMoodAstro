import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Send } from 'lucide-react-native';
import { useAppTheme, type AppTheme } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { customerThreadsApi, type CustomerThreadMessage } from '@/lib/api';
import { safeRouterBack } from '@/lib/navigation';
import { logger } from '@/lib/logger';
import { ChatWarningBanner } from '@/components/ChatWarningBanner';
import { ChatBlockButton, ChatTermsGate, useChatSafety } from '@/components/ChatSafetyActions';

function stylesFor(t: AppTheme) {
  const { colors, spacing, font, radius } = t;
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: { minHeight: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
    back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    title: { flex: 1, color: colors.text, fontFamily: font.display, fontSize: 18 },
    list: { padding: spacing.md, flexGrow: 1 },
    messageRow: { flexDirection: 'row', marginVertical: 5 },
    mine: { justifyContent: 'flex-end' },
    theirs: { justifyContent: 'flex-start' },
    bubble: { maxWidth: '85%', padding: spacing.md, borderRadius: radius.lg },
    mineBubble: { backgroundColor: colors.gold, borderBottomRightRadius: radius.xs },
    theirBubble: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineSoft, borderBottomLeftRadius: radius.xs },
    message: { fontFamily: font.sans, fontSize: 15, lineHeight: 22 },
    mineText: { color: colors.ink },
    theirText: { color: colors.text },
    time: { marginTop: 5, fontFamily: font.sans, fontSize: 10, textAlign: 'right' },
    mineTime: { color: colors.ink, opacity: 0.6 },
    theirTime: { color: colors.textMuted },
    composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.md, paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.md, borderTopWidth: 1, borderTopColor: colors.lineSoft, backgroundColor: colors.surface },
    input: { flex: 1, minHeight: 44, maxHeight: 110, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10, backgroundColor: colors.bg, color: colors.text, fontFamily: font.sans, fontSize: 14 },
    send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.gold, justifyContent: 'center', alignItems: 'center' },
    disabled: { opacity: 0.5 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md, padding: spacing.xl },
    centerText: { fontFamily: font.sans, color: colors.textMuted, fontSize: 14, textAlign: 'center' },
    retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.lg, backgroundColor: colors.gold, borderRadius: radius.pill },
    retryText: { fontFamily: font.sansBold, color: colors.ink },
  });
}

export default function CustomerConversationScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();
  const styles = useMemo(() => stylesFor(theme), [theme]);
  const { colors } = theme;
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const accountRef = useRef(userId);
  accountRef.current = userId;
  const listRef = useRef<FlatList<CustomerThreadMessage>>(null);
  const [result, setResult] = useState<{ userId: string; threadId: string; messages: CustomerThreadMessage[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const messages = result && result.userId === userId && result.threadId === id ? result.messages : [];
  const safety = useChatSafety(id);
  const dateLocale = i18n.language.startsWith('de') ? 'de-DE' : i18n.language.startsWith('en') ? 'en-US' : 'tr-TR';

  const load = useCallback(async () => {
    if (!id || !userId) return;
    setLoading(true);
    setError(false);
    try {
      // The canonical customer endpoint checks membership and marks the thread read.
      const rows = await customerThreadsApi.messages(id);
      if (accountRef.current === userId) setResult({ userId, threadId: id, messages: rows });
    } catch (err) {
      logger.error('Customer conversation load failed:', err);
      if (accountRef.current === userId) setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, userId]);

  useFocusEffect(useCallback(() => {
    void load();
    const timer = setInterval(() => { void load(); }, 12_000);
    return () => clearInterval(timer);
  }, [load]));

  const send = async () => {
    const text = draft.trim();
    if (!id || !userId || !text || sending) return;
    if (!safety.ready || safety.blocked || !safety.termsAccepted) return;
    setSending(true);
    try {
      const message = await customerThreadsApi.reply(id, text);
      if (accountRef.current !== userId) return;
      setResult((previous) => previous?.userId === userId && previous.threadId === id
        ? { ...previous, messages: [...previous.messages, message] }
        : { userId, threadId: id, messages: [message] });
      setDraft('');
    } catch (err) {
      logger.error('Customer message send failed:', err);
      Alert.alert(t('common.error', 'Hata'), t('inbox.sendError', 'Mesaj gönderilemedi. Lütfen tekrar deneyin.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => safeRouterBack('/messages' as Href)} accessibilityRole="button" accessibilityLabel={t('common.back', 'Geri')}><ChevronLeft size={24} color={colors.gold} /></Pressable>
        <Text style={styles.title} numberOfLines={1}>{name || t('inbox.consultantFallback', 'Danışman')}</Text>
        <ChatBlockButton blockedByMe={safety.blockedByMe} busy={safety.busy || !safety.ready} onPress={safety.toggleBlock} />
      </View>
      {authLoading || (loading && !result) ? <View style={styles.center}><ActivityIndicator color={colors.gold} /></View>
        : !user ? <View style={styles.center}><Text style={styles.centerText}>{t('inbox.loginRequired', 'Mesajlarınızı görmek için giriş yapın.')}</Text><Pressable style={styles.retry} onPress={() => router.replace('/auth/login')}><Text style={styles.retryText}>{t('auth.loginShort', 'Giriş yap')}</Text></Pressable></View>
        : error && !result ? <View style={styles.center}><Text style={styles.centerText}>{t('inbox.loadError', 'Mesajlar yüklenemedi.')}</Text><Pressable style={styles.retry} onPress={() => void load()}><Text style={styles.retryText}>{t('inbox.retry', 'Tekrar dene')}</Text></Pressable></View>
        : <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ChatWarningBanner compact style={{ marginHorizontal: 16, marginTop: 8 }} />
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.gold} />}
            ListEmptyComponent={<View style={styles.center}><Text style={styles.centerText}>{t('inbox.noMessage', 'Henüz mesaj yok')}</Text></View>}
            renderItem={({ item }) => {
              const mine = item.from_self === true || item.sender_user_id === userId;
              const date = new Date(item.created_at);
              return <View style={[styles.messageRow, mine ? styles.mine : styles.theirs]}><View style={[styles.bubble, mine ? styles.mineBubble : styles.theirBubble]}><Text style={[styles.message, mine ? styles.mineText : styles.theirText]}>{item.text}</Text><Text style={[styles.time, mine ? styles.mineTime : styles.theirTime]}>{Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}</Text>{!mine && <Pressable accessibilityRole="button" accessibilityLabel={t('chat.report')} onPress={() => safety.report(item.id)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={[styles.time, styles.theirTime]}>{t('chat.report')}</Text></Pressable>}</View></View>;
            }}
          />
          {safety.blocked && <Text style={styles.centerText}>{t('chat.blockedNotice')}</Text>}
          <ChatTermsGate accepted={safety.termsAccepted} busy={safety.busy} onAccept={() => void safety.acceptTerms()} />
          <View style={styles.composer}>
            <TextInput style={styles.input} value={draft} onChangeText={setDraft} maxLength={2000} multiline editable={safety.ready && !safety.blocked && safety.termsAccepted} placeholder={t('chat.inputPlaceholder', 'Mesajınızı yazın...')} placeholderTextColor={colors.textMuted} accessibilityLabel={t('chat.inputPlaceholder', 'Mesajınızı yazın...')} />
            <Pressable style={[styles.send, (!draft.trim() || sending || !safety.ready || safety.blocked || !safety.termsAccepted) && styles.disabled]} onPress={() => void send()} disabled={!draft.trim() || sending || !safety.ready || safety.blocked || !safety.termsAccepted} accessibilityRole="button" accessibilityLabel={t('inbox.send', 'Gönder')}>
              {sending ? <ActivityIndicator color={colors.ink} /> : <Send size={20} color={colors.ink} />}
            </Pressable>
          </View>
        </KeyboardAvoidingView>}
    </SafeAreaView>
  );
}
