'use client';

import React, { useState } from 'react';
import { X, Send, Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/auth.store';
import ChatWarningBanner from '@/components/common/ChatWarningBanner';
import { getPublicApiBase } from '@/i18n/publicMetaApi';
import { useUiSection } from '@/i18n';

const API_BASE = getPublicApiBase() || '/api';

interface Props {
  open: boolean;
  onClose: () => void;
  consultantId: string;
  consultantName: string;
  locale: string;
}

export default function ConsultantMessageModal({ open, onClose, consultantId, consultantName, locale }: Props) {
  const { ui } = useUiSection('ui_consultantbrowse' as any, locale);
  const { isAuthenticated } = useAuthStore();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error(ui('ui_consultantbrowse_msg_empty', 'Message cannot be empty'));
      return;
    }
    if (!isAuthenticated) {
      toast.error(ui('ui_consultantbrowse_msg_login_required', 'You must sign in to send a message'));
      window.location.href = `/${locale}/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setSending(true);
    try {
      // 1) Create or load thread (consultant_lead context)
      const tRes = await fetch(`${API_BASE}/chat/threads`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context_type: 'consultant_lead', context_id: consultantId }),
      });
      if (!tRes.ok) throw new Error('thread_failed');
      const { thread } = await tRes.json();

      // 2) Send message (backend expects the `text` field)
      const mRes = await fetch(`${API_BASE}/chat/threads/${encodeURIComponent(thread.id)}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message.trim() }),
      });
      if (!mRes.ok) throw new Error('send_failed');

      toast.success(ui('ui_consultantbrowse_msg_sent', 'Your message has been sent'));
      setMessage('');
      onClose();
    } catch (e: any) {
      toast.error(ui('ui_consultantbrowse_msg_failed', 'Message could not be sent'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[var(--gm-bg-deep)]/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 p-5 border-b border-[var(--gm-border-soft)]">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-[var(--gm-gold)]/10 flex items-center justify-center text-[var(--gm-gold)]">
              <MessageCircle className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-serif text-lg text-[var(--gm-text)]">{ui('ui_consultantbrowse_modal_title', 'Message {name}').replace('{name}', consultantName)}</h3>
              <p className="text-[11px] text-[var(--gm-muted)]">{ui('ui_consultantbrowse_modal_subtitle', 'For a short note or question')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--gm-muted)] hover:text-[var(--gm-text)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* T29-6: shared warning banner */}
        <div className="m-5 mb-0">
          <ChatWarningBanner locale={locale as any} />
        </div>

        {/* Body */}
        <div className="p-5 space-y-3">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)]">
            {ui('ui_consultantbrowse_message_label', 'Your message')}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder={ui('ui_consultantbrowse_message_placeholder', 'Hello, I have a quick question...')}
            disabled={sending}
            className="w-full bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-2xl p-4 text-sm text-[var(--gm-text)] focus:ring-2 focus:ring-[var(--gm-gold)]/30 focus:border-[var(--gm-gold)]/40 outline-none resize-none"
            maxLength={500}
          />
          <div className="text-right text-[10px] text-[var(--gm-muted)]">{message.length}/500</div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-5 py-2.5 rounded-full border border-[var(--gm-border-soft)] text-[10px] font-bold uppercase tracking-widest text-[var(--gm-text-dim)] hover:text-[var(--gm-text)]"
          >
            {ui('ui_consultantbrowse_cancel', 'Cancel')}
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 transition-all"
          >
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {sending ? ui('ui_consultantbrowse_sending', 'Sending') : ui('ui_consultantbrowse_send', 'Send')}
          </button>
        </div>
      </div>
    </div>
  );
}
