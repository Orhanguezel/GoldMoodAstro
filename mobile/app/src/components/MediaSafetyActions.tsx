import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { chatApi, mediaMessagesApi } from '@/lib/api';
import { useAppTheme } from '@/theme';
import { ChatTermsGate } from './ChatSafetyActions';

type State = { blocked_by_me: boolean; blocked_by_peer: boolean; terms_accepted: boolean };

export function MediaSafetyActions({ messageId, reportId, onState }: { messageId: string; reportId?: string | null; onState?: (state: State | null) => void }) {
  const { t } = useTranslation();
  const { colors, font } = useAppTheme();
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const onStateRef = useRef(onState);
  onStateRef.current = onState;
  useEffect(() => {
    let active = true;
    setState(null);
    onStateRef.current?.(null);
    mediaMessagesApi.safety(messageId).then((next) => { if (active) { setState(next); onStateRef.current?.(next); } })
      .catch(() => { if (active) { setState(null); onStateRef.current?.(null); } });
    return () => { active = false; };
  }, [messageId]);
  const update = (next: State) => { setState(next); onState?.(next); };
  const toggleBlock = () => {
    if (!state || busy) return;
    Alert.alert(state.blocked_by_me ? t('chat.unblockTitle') : t('chat.blockTitle'), state.blocked_by_me ? t('chat.unblockConfirm') : t('chat.blockConfirm'), [
      { text: t('chat.cancel'), style: 'cancel' },
      { text: state.blocked_by_me ? t('chat.unblock') : t('chat.block'), style: 'destructive', onPress: async () => {
        setBusy(true);
        try { update(state.blocked_by_me ? await mediaMessagesApi.unblock(messageId) : await mediaMessagesApi.block(messageId)); }
        catch { Alert.alert(t('common.error'), t('chat.actionFailed')); }
        finally { setBusy(false); }
      } },
    ]);
  };
  const report = () => {
    if (!reportId) return;
    Alert.alert(t('chat.reportTitle'), t('chat.reportPrompt'), [
      { text: t('chat.cancel'), style: 'cancel' },
      { text: t('chat.report'), style: 'destructive', onPress: async () => {
        try { await mediaMessagesApi.report(reportId); Alert.alert(t('chat.reportDoneTitle'), t('chat.reportDoneBody')); }
        catch { Alert.alert(t('common.error'), t('chat.actionFailed')); }
      } },
    ]);
  };
  return <View style={{ gap: 8 }}>
    {state && !state.terms_accepted && <ChatTermsGate accepted={false} busy={busy} onAccept={async () => {
      setBusy(true);
      try { await chatApi.acceptTerms(); update({ ...state, terms_accepted: true }); }
      catch { Alert.alert(t('common.error'), t('chat.actionFailed')); }
      finally { setBusy(false); }
    }} />}
    {state && (state.blocked_by_me || state.blocked_by_peer) && <Text style={{ color: colors.textMuted, fontFamily: font.sans }}>{t('chat.blockedNotice')}</Text>}
    <View style={{ flexDirection: 'row', gap: 16 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={state?.blocked_by_me ? t('chat.unblock') : t('chat.block')} onPress={toggleBlock} disabled={!state || busy} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ color: colors.gold, fontFamily: font.sansBold }}>{state?.blocked_by_me ? t('chat.unblock') : t('chat.block')}</Text>
      </Pressable>
      {reportId && <Pressable accessibilityRole="button" accessibilityLabel={t('chat.report')} onPress={report} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ color: colors.gold, fontFamily: font.sansBold }}>{t('chat.report')}</Text>
      </Pressable>}
    </View>
  </View>;
}
