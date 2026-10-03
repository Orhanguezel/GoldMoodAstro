'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getPublicApiBase } from '@/i18n/publicMetaApi';
import { useUiSection } from '@/i18n';
import { tokenStore } from '@/integrations/rtk/token';

const API_BASE = getPublicApiBase() || '/api';
const authHeaders = () => ({ ...(tokenStore.get() ? { Authorization: `Bearer ${tokenStore.get()}` } : {}), 'Content-Type': 'application/json' });

type State = { blocked_by_me: boolean; blocked_by_peer: boolean; terms_accepted: boolean };

export function useWebChatSafety(threadId: string | null, locale: string) {
  const { ui } = useUiSection('ui_account', locale);
  const [state, setState] = useState<State | null>(null);
  const [loadedThreadId, setLoadedThreadId] = useState<string | null>(null);
  const currentThreadRef = useRef(threadId);
  currentThreadRef.current = threadId;
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!threadId) { setState(null); setLoadedThreadId(null); return; }
    try {
      const response = await fetch(`${API_BASE}/chat/threads/${encodeURIComponent(threadId)}/block`, { credentials: 'include', headers: authHeaders() });
      if (response.ok) {
        const next = await response.json() as State;
        if (currentThreadRef.current === threadId) { setState(next); setLoadedThreadId(threadId); }
      }
    } catch { /* The conversation request surfaces access errors. */ }
  }, [threadId]);
  useEffect(() => { void refresh(); }, [refresh]);

  const toggleBlock = async () => {
    if (!threadId || loadedThreadId !== threadId || !state || busy) return;
    const endpoint = `${API_BASE}/chat/threads/${encodeURIComponent(threadId)}/block`;
    setBusy(true);
    try {
      const response = await fetch(endpoint, { method: state.blocked_by_me ? 'DELETE' : 'POST', credentials: 'include', headers: authHeaders(), body: state.blocked_by_me ? undefined : '{}' });
      if (!response.ok) throw new Error('block_failed');
      setState(await response.json() as State);
    } catch { toast.error(ui('ui_chat_safety_action_failed', 'Action failed')); }
    finally { setBusy(false); }
  };

  const acceptTerms = async () => {
    setBusy(true);
    try {
      const response = await fetch(`${API_BASE}/chat/terms/accept`, { method: 'POST', credentials: 'include', headers: authHeaders(), body: JSON.stringify({ accepted: true }) });
      if (!response.ok) throw new Error('terms_failed');
      await refresh();
    } catch { toast.error(ui('ui_chat_safety_action_failed', 'Action failed')); }
    finally { setBusy(false); }
  };

  const report = async (messageId: string) => {
    if (!threadId || !window.confirm(ui('ui_chat_safety_report_confirm', 'Report this message for review?'))) return;
    try {
      const response = await fetch(`${API_BASE}/chat/threads/${encodeURIComponent(threadId)}/reports`, { method: 'POST', credentials: 'include', headers: authHeaders(), body: JSON.stringify({ message_id: messageId, reason: 'other' }) });
      if (!response.ok) throw new Error('report_failed');
      toast.success(ui('ui_chat_safety_report_done', 'Report received'));
    } catch { toast.error(ui('ui_chat_safety_action_failed', 'Action failed')); }
  };

  const ready = Boolean(threadId && loadedThreadId === threadId && state);
  return { state: ready ? state : null, ready, busy, blocked: ready && Boolean(state?.blocked_by_me || state?.blocked_by_peer), termsAccepted: ready ? Boolean(state?.terms_accepted) : true, toggleBlock, acceptTerms, report };
}

export function ChatSafetyControls({ safety, locale }: { safety: ReturnType<typeof useWebChatSafety>; locale: string }) {
  const { ui } = useUiSection('ui_account', locale);
  return <div className="space-y-2 text-xs">
    <button type="button" disabled={safety.busy || !safety.state} onClick={() => void safety.toggleBlock()} className="min-h-11 rounded-lg border border-[var(--gm-border-soft)] px-3 text-[var(--gm-gold)] disabled:opacity-50">
      {safety.state?.blocked_by_me ? ui('ui_chat_safety_unblock', 'Unblock') : ui('ui_chat_safety_block', 'Block')}
    </button>
    {safety.blocked && <p className="text-[var(--gm-muted)]">{ui('ui_chat_safety_blocked', 'Messaging is blocked in this conversation.')}</p>}
    {!safety.termsAccepted && <div className="rounded-lg border border-[var(--gm-border-soft)] p-3 space-y-2">
      <p>{ui('ui_chat_safety_terms_prompt', 'Read and accept the Terms of Use before messaging.')}</p>
      <Link className="underline text-[var(--gm-gold)]" href={`/${locale}/terms`} target="_blank">{ui('ui_chat_safety_read_terms', 'Read Terms')}</Link>
      <button type="button" disabled={safety.busy} onClick={() => void safety.acceptTerms()} className="block min-h-11 rounded-lg bg-[var(--gm-gold)] px-3 text-[var(--gm-bg-deep)] disabled:opacity-50">{ui('ui_chat_safety_accept_terms', 'I accept the Terms')}</button>
    </div>}
  </div>;
}

export function ChatReportButton({ messageId, safety, locale }: { messageId: string; safety: ReturnType<typeof useWebChatSafety>; locale: string }) {
  const { ui } = useUiSection('ui_account', locale);
  return <button type="button" onClick={() => void safety.report(messageId)} className="min-h-11 text-[var(--gm-muted)] underline">{ui('ui_chat_safety_report', 'Report')}</button>;
}
