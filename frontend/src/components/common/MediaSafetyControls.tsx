'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getPublicApiBase } from '@/i18n/publicMetaApi';
import { useUiSection } from '@/i18n';
import { tokenStore } from '@/integrations/rtk/token';

type SafetyState = { blocked_by_me: boolean; blocked_by_peer: boolean; terms_accepted: boolean };
const API_BASE = getPublicApiBase() || '/api';
const headers = () => ({ ...(tokenStore.get() ? { Authorization: `Bearer ${tokenStore.get()}` } : {}), 'Content-Type': 'application/json' });

export function useWebMediaSafety(messageId: string | null, consultantId: string | null, locale: string) {
  const { ui } = useUiSection('ui_account', locale);
  const [state, setState] = useState<SafetyState | null>(null);
  const [loadedPath, setLoadedPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const path = messageId
    ? `/me/media-messages/${encodeURIComponent(messageId)}/safety`
    : consultantId ? `/me/consultants/${encodeURIComponent(consultantId)}/media-safety` : null;
  const currentPathRef = useRef(path);
  currentPathRef.current = path;

  const refresh = useCallback(async () => {
    if (!path) { setState(null); setLoadedPath(null); return; }
    setState(null);
    setLoadedPath(null);
    try {
      const response = await fetch(`${API_BASE}${path}`, { credentials: 'include', headers: headers() });
      if (!response.ok) return;
      const result = await response.json();
      if (currentPathRef.current === path) { setState(result.data as SafetyState); setLoadedPath(path); }
    } catch { /* The send action remains disabled until state loads. */ }
  }, [path]);
  useEffect(() => { void refresh(); }, [refresh]);

  const acceptTerms = async () => {
    setBusy(true);
    try {
      const response = await fetch(`${API_BASE}/chat/terms/accept`, { method: 'POST', credentials: 'include', headers: headers(), body: JSON.stringify({ accepted: true }) });
      if (!response.ok) throw new Error('terms_failed');
      await refresh();
    } catch { toast.error(ui('ui_chat_safety_action_failed', 'Action failed')); }
    finally { setBusy(false); }
  };

  const toggleBlock = async () => {
    if (!messageId || !state || busy) return;
    setBusy(true);
    try {
      const response = await fetch(`${API_BASE}/me/media-messages/${encodeURIComponent(messageId)}/block`, {
        method: state.blocked_by_me ? 'DELETE' : 'POST', credentials: 'include', headers: headers(),
      });
      if (!response.ok) throw new Error('block_failed');
      const result = await response.json();
      setState(result.data as SafetyState);
    } catch { toast.error(ui('ui_chat_safety_action_failed', 'Action failed')); }
    finally { setBusy(false); }
  };

  const report = async (targetId: string) => {
    if (!window.confirm(ui('ui_chat_safety_report_confirm', 'Report this message for review?'))) return;
    setBusy(true);
    try {
      const response = await fetch(`${API_BASE}/me/media-messages/${encodeURIComponent(targetId)}/reports`, {
        method: 'POST', credentials: 'include', headers: headers(), body: JSON.stringify({ reason: 'other' }),
      });
      if (!response.ok) throw new Error('report_failed');
      toast.success(ui('ui_chat_safety_report_done', 'Report received'));
    } catch { toast.error(ui('ui_chat_safety_action_failed', 'Action failed')); }
    finally { setBusy(false); }
  };

  const currentState = loadedPath === path ? state : null;
  return { state: currentState, busy, ready: Boolean(currentState), canBlock: Boolean(messageId), allowed: Boolean(currentState?.terms_accepted && !currentState.blocked_by_me && !currentState.blocked_by_peer), acceptTerms, toggleBlock, report };
}

export function MediaSafetyControls({ safety, locale, reportMessageId }: {
  safety: ReturnType<typeof useWebMediaSafety>; locale: string; reportMessageId?: string | null;
}) {
  const { ui } = useUiSection('ui_account', locale);
  return <div className="flex flex-wrap items-center gap-3 text-xs">
    {safety.canBlock && <button type="button" disabled={!safety.ready || safety.busy} onClick={() => void safety.toggleBlock()}
      className="min-h-11 rounded-lg border border-[var(--gm-border-soft)] px-3 text-[var(--gm-gold)] disabled:opacity-50">
      {safety.state?.blocked_by_me ? ui('ui_chat_safety_unblock', 'Unblock') : ui('ui_chat_safety_block', 'Block')}
    </button>}
    {reportMessageId && <button type="button" disabled={safety.busy} onClick={() => void safety.report(reportMessageId)}
      className="min-h-11 text-[var(--gm-muted)] underline disabled:opacity-50">{ui('ui_chat_safety_report', 'Report')}</button>}
    {(safety.state?.blocked_by_me || safety.state?.blocked_by_peer) && <span className="text-[var(--gm-muted)]">{ui('ui_chat_safety_blocked', 'Messaging is blocked in this conversation.')}</span>}
    {safety.state && !safety.state.terms_accepted && <div className="w-full rounded-lg border border-[var(--gm-border-soft)] p-3 space-y-2">
      <p>{ui('ui_chat_safety_terms_prompt', 'Read and accept the Terms of Use before messaging.')}</p>
      <Link className="underline text-[var(--gm-gold)]" href={`/${locale}/terms`} target="_blank">{ui('ui_chat_safety_read_terms', 'Read Terms')}</Link>
      <button type="button" disabled={safety.busy} onClick={() => void safety.acceptTerms()}
        className="block min-h-11 rounded-lg bg-[var(--gm-gold)] px-3 text-[var(--gm-bg-deep)] disabled:opacity-50">{ui('ui_chat_safety_accept_terms', 'I accept the Terms')}</button>
    </div>}
  </div>;
}

export function MediaMessageSafety({ messageId, reportMessageId, locale }: { messageId: string; reportMessageId?: string | null; locale: string }) {
  const safety = useWebMediaSafety(messageId, null, locale);
  return <MediaSafetyControls safety={safety} locale={locale} reportMessageId={reportMessageId} />;
}
