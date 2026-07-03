'use client';

// T29-5 - booking-linked messaging.
// Booking detail/list button opens a chat thread (context_type='booking').
// Customer and consultant can exchange async notes before or after a session.

import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ChatWarningBanner from './ChatWarningBanner';
import { getPublicApiBase } from '@/i18n/publicMetaApi';
import { useUiSection } from '@/i18n';

const API_BASE = getPublicApiBase() || '/api';

interface Message {
  id: string;
  thread_id: string;
  sender_user_id: string;
  text: string;
  created_at: string;
}

async function readErrorMessage(res: Response) {
  const payload = await res.json().catch(() => null);
  return (
    payload?.error?.message ||
    payload?.message ||
    (typeof payload === 'string' ? payload : '') ||
    `HTTP ${res.status}`
  );
}

interface Props {
  bookingId: string;
  /** Button text (default: "Message") */
  label?: string;
  /** Compact icon-only button */
  iconOnly?: boolean;
  /** Button style: 'primary' (gold) or 'secondary' (outline) */
  variant?: 'primary' | 'secondary';
  className?: string;
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default function BookingMessageButton({ bookingId, label, iconOnly, variant = 'secondary', className = '' }: Props) {
  const params = useParams();
  const locale = ((params?.locale as string) || 'tr') as 'tr' | 'en' | 'de';
  const { ui } = useUiSection('ui_account', locale);
  const resolvedLabel = label ?? ui('ui_account_msg_button_label', 'Message');
  const [open, setOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [meId, setMeId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const openModal = async () => {
    setOpen(true);
    setLoading(true);
    try {
      // 1) Me — sender_user_id eşleştirme için
      const meRes = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
      if (meRes.ok) {
        const meJson = await meRes.json();
        setMeId(meJson?.user?.id ?? null);
      }
      // 2) Thread oluştur/getir
      const tRes = await fetch(`${API_BASE}/chat/threads`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context_type: 'booking', context_id: bookingId }),
      });
      if (!tRes.ok) {
        const err = await tRes.json().catch(() => ({}));
        if (tRes.status === 401) {
          toast.error(ui('ui_account_msg_login_required', 'You need to sign in'));
          setOpen(false);
          return;
        }
        throw new Error(err?.message || 'thread_failed');
      }
      const { thread } = await tRes.json();
      setThreadId(thread.id);

      // 3) Load messages
      const mRes = await fetch(`${API_BASE}/chat/threads/${encodeURIComponent(thread.id)}/messages?limit=100`, {
        credentials: 'include',
      });
      if (mRes.ok) {
        const mJson = await mRes.json();
        setMessages(mJson?.items ?? []);
      }
    } catch (e: any) {
      toast.error(e?.message || ui('ui_account_msg_load_failed', 'Messages could not be loaded'));
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!threadId || !draft.trim()) return;
    setSending(true);
    try {
      const text = draft.trim();
      const res = await fetch(`${API_BASE}/chat/threads/${encodeURIComponent(threadId)}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      let message: Message | null = null;

      if (res.ok) {
        const payload = await res.json();
        message = payload?.message ?? null;
      } else {
        let lastError = await readErrorMessage(res);
        for (const path of [
          `/me/customer/threads/${encodeURIComponent(threadId)}/reply`,
          `/me/consultant/threads/${encodeURIComponent(threadId)}/reply`,
        ]) {
          const fallbackRes = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
          });
          if (fallbackRes.ok) {
            const payload = await fallbackRes.json();
            message = payload?.data ?? null;
            break;
          }
          lastError = await readErrorMessage(fallbackRes);
        }
        if (!message) throw new Error(lastError || 'send_failed');
      }

      if (!message) throw new Error('send_failed');
      setMessages((prev) => [...prev, message]);
      setDraft('');
    } catch (error) {
      console.error('[BookingMessageButton] send failed', error);
      toast.error(ui('ui_account_msg_send_failed', 'Could not send'));
    } finally {
      setSending(false);
    }
  };

  const buttonCls = variant === 'primary'
    ? 'bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] hover:bg-[var(--gm-gold-light)]'
    : 'border border-[var(--gm-gold)]/40 text-[var(--gm-gold)] hover:border-[var(--gm-gold)] hover:bg-[var(--gm-gold)]/10';

  return (
    <>
      <button
        onClick={openModal}
        className={`inline-flex items-center justify-center gap-1.5 ${iconOnly ? 'w-9 h-9 rounded-full' : 'px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest'} ${buttonCls} transition-all ${className}`}
        title={ui('ui_account_msg_button_title', 'Send a message for this booking')}
        aria-label={ui('ui_account_msg_button_label', 'Message')}
      >
        <MessageCircle className={iconOnly ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        {!iconOnly && resolvedLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[var(--gm-bg-deep)]/60 backdrop-blur-sm"
          onClick={() => !sending && setOpen(false)}
        >
          <div
            className="w-full max-w-lg max-h-[85vh] flex flex-col bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-4 p-5 border-b border-[var(--gm-border-soft)]">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-[var(--gm-gold)]/10 flex items-center justify-center text-[var(--gm-gold)]">
                  <MessageCircle className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-serif text-lg text-[var(--gm-text)]">{ui('ui_account_msg_modal_title', 'Booking Messages')}</h3>
                  <p className="text-[11px] text-[var(--gm-muted)]">{ui('ui_account_msg_booking_ref', 'Booking')} #{bookingId.slice(0, 8)}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} disabled={sending} className="p-2 text-[var(--gm-muted)] hover:text-[var(--gm-text)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning */}
            <div className="m-4 mb-0">
              <ChatWarningBanner compact locale={locale} />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--gm-muted)]" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-[var(--gm-muted)] font-serif italic text-sm">
                  {ui('ui_account_msg_empty', 'No messages yet. Write the first message.')}
                </div>
              ) : (
                messages.map((m) => {
                  const mine = meId && m.sender_user_id === meId;
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                          mine
                            ? 'bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] rounded-br-sm'
                            : 'bg-[var(--gm-bg-deep)] text-[var(--gm-text)] rounded-bl-sm'
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">{m.text}</div>
                        <div className={`text-[10px] mt-1 ${mine ? 'text-[var(--gm-bg-deep)]/60' : 'text-[var(--gm-muted)]'}`}>
                          {formatTime(m.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            {/* Reply input */}
            <div className="border-t border-[var(--gm-border-soft)] p-3 flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={2}
                placeholder={ui('ui_account_msg_input_placeholder', 'Write your message...')}
                disabled={sending}
                className="flex-1 bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-xl p-3 text-sm text-[var(--gm-text)] resize-none focus:ring-2 focus:ring-[var(--gm-gold)]/30 focus:border-[var(--gm-gold)]/40 outline-none"
              />
              <button
                onClick={handleSend}
                disabled={sending || !draft.trim()}
                className="h-11 px-4 rounded-xl bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] disabled:opacity-50 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {ui('ui_account_msg_send_button', 'Send')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
