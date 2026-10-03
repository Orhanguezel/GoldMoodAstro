import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { ShieldAlert } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { chatApi } from '@/lib/api';
import { useAppTheme } from '@/theme';

export function useChatSafety(threadId: string | null | undefined) {
  const { t } = useTranslation();
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [blockedByPeer, setBlockedByPeer] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [loadedThreadId, setLoadedThreadId] = useState<string | null>(null);
  const currentThreadRef = useRef(threadId);
  currentThreadRef.current = threadId;
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    if (!threadId) return;
    try {
      const state = await chatApi.blockState(threadId);
      if (currentThreadRef.current !== threadId) return;
      setBlockedByMe(state.blocked_by_me);
      setBlockedByPeer(state.blocked_by_peer);
      setTermsAccepted(state.terms_accepted);
      setLoadedThreadId(threadId);
    } catch { /* The conversation request will surface access errors. */ }
  }, [threadId]);
  useEffect(() => { setLoadedThreadId(null); void refresh(); }, [refresh]);

  const toggleBlock = useCallback(() => {
    if (!threadId || busy) return;
    Alert.alert(
      blockedByMe ? t('chat.unblockTitle') : t('chat.blockTitle'),
      blockedByMe ? t('chat.unblockConfirm') : t('chat.blockConfirm'),
      [{ text: t('chat.cancel'), style: 'cancel' }, { text: blockedByMe ? t('chat.unblock') : t('chat.block'), style: 'destructive', onPress: async () => {
        setBusy(true);
        try {
          const state = blockedByMe ? await chatApi.unblockPeer(threadId) : await chatApi.blockPeer(threadId);
          setBlockedByMe(state.blocked_by_me);
          setBlockedByPeer(state.blocked_by_peer);
        } catch { Alert.alert(t('common.error'), t('chat.actionFailed')); }
        finally { setBusy(false); }
      } }],
    );
  }, [threadId, busy, blockedByMe, t]);

  const report = useCallback((messageId: string) => {
    if (!threadId) return;
    Alert.alert(t('chat.reportTitle'), t('chat.reportPrompt'), [
      { text: t('chat.cancel'), style: 'cancel' },
      { text: t('chat.report'), style: 'destructive', onPress: async () => {
        try {
          await chatApi.reportMessage(threadId, messageId, 'other');
          Alert.alert(t('chat.reportDoneTitle'), t('chat.reportDoneBody'));
        } catch { Alert.alert(t('common.error'), t('chat.actionFailed')); }
      } },
    ]);
  }, [threadId, t]);

  const acceptTerms = useCallback(async () => {
    setBusy(true);
    try { await chatApi.acceptTerms(); setTermsAccepted(true); }
    catch { Alert.alert(t('common.error'), t('chat.actionFailed')); }
    finally { setBusy(false); }
  }, [t]);

  const ready = Boolean(threadId && loadedThreadId === threadId);
  return { ready, blocked: ready && (blockedByMe || blockedByPeer), blockedByMe: ready && blockedByMe, blockedByPeer: ready && blockedByPeer, termsAccepted: !ready || termsAccepted, busy, toggleBlock, report, refresh, acceptTerms };
}

export function ChatTermsGate({ accepted, busy, onAccept }: { accepted: boolean; busy: boolean; onAccept: () => void }) {
  const { t } = useTranslation();
  const { colors, font, spacing } = useAppTheme();
  if (accepted) return null;
  return <View style={{ padding: spacing.md, backgroundColor: colors.surface, gap: spacing.sm }}>
    <Text style={{ color: colors.text, fontFamily: font.sans }}>{t('chat.termsPrompt')}</Text>
    <Pressable onPress={() => router.push('/legal')} accessibilityRole="link" accessibilityLabel={t('chat.readTerms')} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: colors.gold, fontFamily: font.sansBold }}>{t('chat.readTerms')}</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={t('chat.acceptTerms')} disabled={busy} onPress={onAccept} style={{ minHeight: 44, justifyContent: 'center' }}>
      <Text style={{ color: colors.gold, fontFamily: font.sansBold }}>{t('chat.acceptTerms')}</Text>
    </Pressable>
  </View>;
}

export function ChatBlockButton({ blockedByMe, busy, onPress }: { blockedByMe: boolean; busy: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  const { colors, font, spacing } = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={blockedByMe ? t('chat.unblock') : t('chat.block')} onPress={onPress} disabled={busy}
    style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.sm }}>
    <ShieldAlert size={18} color={colors.gold} />
    <Text style={{ color: colors.gold, fontFamily: font.sansBold, fontSize: 12 }}>{blockedByMe ? t('chat.unblock') : t('chat.block')}</Text>
  </Pressable>;
}
