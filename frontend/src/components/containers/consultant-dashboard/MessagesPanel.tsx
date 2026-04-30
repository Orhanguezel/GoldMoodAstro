'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Loader2 } from 'lucide-react';
import ChatWarningBanner from '@/components/common/ChatWarningBanner';
import { toast } from 'sonner';
import {
  type ConsultantSelfThread,
  useListMyConsultantThreadsQuery,
  useGetMyConsultantThreadMessagesQuery,
  useReplyMyConsultantThreadMutation,
} from '@/integrations/rtk/private/consultant_self.endpoints';

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function initialsOf(name: string | null | undefined) {
  return (name || '?').split(/\s+/).map((w) => w[0] || '').join('').slice(0, 2).toUpperCase();
}

export default function MessagesPanel() {
  const { data: threads = [], isLoading: threadsLoading } = useListMyConsultantThreadsQuery();
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: convo, isFetching: convoLoading } = useGetMyConsultantThreadMessagesQuery(activeId || '', {
    skip: !activeId,
  });
  const [reply, { isLoading: replying }] = useReplyMyConsultantThreadMutation();

  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeId && threads.length > 0) setActiveId(threads[0].thread_id);
  }, [threads, activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [convo?.messages?.length]);

  const handleSend = async () => {
    if (!activeId || !draft.trim()) return;
    try {
      await reply({ id: activeId, text: draft.trim() }).unwrap();
      setDraft('');
      toast.success('Cevap gönderildi');
    } catch {
      toast.error('Gönderilemedi');
    }
  };

  if (threadsLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-[var(--gm-muted)]">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <MessageCircle className="w-12 h-12 text-[var(--gm-gold)]/30 mx-auto mb-4" />
        <p className="text-[var(--gm-text-dim)] font-serif italic">
          Henüz mesajınız yok. Müşteriler sayfanızdaki Mesaj Gönder ile size ulaşabilir.
        </p>
      </div>
    );
  }

  const active = threads.find((t) => t.thread_id === activeId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 h-[600px]">
      {/* Thread list */}
      <div className="border border-[var(--gm-border-soft)] rounded-2xl bg-[var(--gm-surface)]/30 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-[var(--gm-border-soft)] flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)]">
            Sohbetler ({threads.length})
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.map((t) => {
            const isActive = activeId === t.thread_id;
            const lastFromMe = t.last_message?.from_consultant;
            return (
              <button
                key={t.thread_id}
                onClick={() => setActiveId(t.thread_id)}
                className={`w-full text-left p-4 border-b border-[var(--gm-border-soft)] flex gap-3 items-start transition-colors ${
                  isActive ? 'bg-[var(--gm-gold)]/10' : 'hover:bg-[var(--gm-surface)]/50'
                }`}
              >
                <span className="relative w-9 h-9 rounded-full bg-[var(--gm-gold)]/15 text-[var(--gm-gold)] flex items-center justify-center font-serif text-sm shrink-0 overflow-hidden">
                  {t.customer?.avatar_url ? (
                    <img src={t.customer.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initialsOf(t.customer?.full_name || t.customer?.email)
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-serif text-sm text-[var(--gm-text)] truncate">
                      {t.customer?.full_name || t.customer?.email || 'Bilinmeyen'}
                    </span>
                    {t.last_message && (
                      <span className="text-[10px] text-[var(--gm-muted)] shrink-0">
                        {formatTime(t.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  {t.last_message && (
                    <div className="text-[12px] text-[var(--gm-text-dim)] truncate">
                      {lastFromMe && <span className="text-[var(--gm-gold-dim)] mr-1">Sen:</span>}
                      {t.last_message.text}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <ThreadTypeBadge thread={t} />
                    {t.unread_count > 0 && (
                      <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                        {t.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active conversation */}
      <div className="border border-[var(--gm-border-soft)] rounded-2xl bg-[var(--gm-surface)]/30 overflow-hidden flex flex-col">
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-[var(--gm-muted)]">
            Bir sohbet seçin
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-3 border-b border-[var(--gm-border-soft)] flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-[var(--gm-gold)]/15 text-[var(--gm-gold)] flex items-center justify-center font-serif text-sm overflow-hidden">
                {active.customer?.avatar_url ? (
                  <img src={active.customer.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  initialsOf(active.customer?.full_name || active.customer?.email)
                )}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-serif text-base text-[var(--gm-text)]">
                    {active.customer?.full_name || 'Bilinmeyen Müşteri'}
                  </span>
                  <ThreadTypeBadge thread={active} />
                </div>
                <div className="text-[11px] text-[var(--gm-muted)]">{active.customer?.email}</div>
              </div>
            </div>

            {/* T29-6: ortak uyarı banner */}
            <div className="m-4 mb-0">
              <ChatWarningBanner compact />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {convoLoading && !convo ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--gm-muted)]" />
                </div>
              ) : (
                convo?.messages.map((m) => {
                  const mine = m.from_consultant;
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                          mine
                            ? 'bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] rounded-br-sm'
                            : 'bg-[var(--gm-bg-deep)] text-[var(--gm-text)] rounded-bl-sm'
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">{m.text}</div>
                        <div
                          className={`text-[10px] mt-1 ${
                            mine ? 'text-[var(--gm-bg-deep)]/60' : 'text-[var(--gm-muted)]'
                          }`}
                        >
                          {formatTime(m.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
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
                placeholder="Cevabını yaz..."
                disabled={replying}
                className="flex-1 bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-xl p-3 text-sm text-[var(--gm-text)] resize-none focus:ring-2 focus:ring-[var(--gm-gold)]/30 focus:border-[var(--gm-gold)]/40 outline-none"
              />
              <button
                onClick={handleSend}
                disabled={replying || !draft.trim()}
                className="h-11 px-4 rounded-xl bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] disabled:opacity-50 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
              >
                {replying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Gönder
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ThreadTypeBadge({ thread }: { thread: Pick<ConsultantSelfThread, 'context_type'> }) {
  const isBooking = thread.context_type === 'booking';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
        isBooking
          ? 'bg-[var(--gm-gold)]/15 text-[var(--gm-gold)]'
          : 'bg-[var(--gm-bg-deep)] text-[var(--gm-muted)]'
      }`}
    >
      {isBooking ? 'Randevu' : 'Ön Mesaj'}
    </span>
  );
}
