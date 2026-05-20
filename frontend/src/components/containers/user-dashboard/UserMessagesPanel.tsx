'use client';

// Kullanıcı (danışan) mesaj kutusu — danışmandan gelen cevapları görür ve cevap gönderir.
// Backend: /me/customer/threads*  (mirrors consultant'ın MessagesPanel'ini).

import React, { useEffect, useRef, useState } from 'react';
import { Send, MessageCircle, Loader2, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

import {
  useListMyCustomerThreadsQuery,
  useGetMyCustomerThreadMessagesQuery,
  useReplyMyCustomerThreadMutation,
  useMarkCustomerThreadAsReadMutation,
  type CustomerThread,
} from '@/integrations/rtk/private/consultant_self.endpoints';
import { extractApiError } from '@/integrations/shared';
import ChatWarningBanner from '@/components/common/ChatWarningBanner';

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

function threadTitle(t: CustomerThread, isTr: boolean): string {
  const fallback = isTr ? 'Danışman' : 'Consultant';
  return t.consultant?.display_name || t.consultant?.full_name || fallback;
}

interface Props {
  isTr: boolean;
}

export default function UserMessagesPanel({ isTr }: Props) {
  const { data: threads = [], isLoading: threadsLoading } = useListMyCustomerThreadsQuery();
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: convo, isFetching: convoLoading } = useGetMyCustomerThreadMessagesQuery(activeId || '', {
    skip: !activeId,
  });
  const [reply, { isLoading: replying }] = useReplyMyCustomerThreadMutation();
  const [markAsRead] = useMarkCustomerThreadAsReadMutation();

  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeId && threads.length > 0) setActiveId(threads[0].thread_id);
  }, [threads, activeId]);

  useEffect(() => {
    if (activeId) {
      const active = threads.find((t) => t.thread_id === activeId);
      if (active && active.unread_count > 0) {
        markAsRead(activeId);
      }
    }
  }, [activeId, threads, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [convo?.messages?.length]);

  const handleSend = async () => {
    if (!activeId || !draft.trim()) return;
    try {
      await reply({ id: activeId, text: draft.trim() }).unwrap();
      setDraft('');
    } catch (e) {
      toast.error(extractApiError(e, isTr ? 'Gönderilemedi' : 'Send failed'));
    }
  };

  if (threadsLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-(--gm-muted)">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <MessageCircle className="w-12 h-12 text-(--gm-gold)/30 mx-auto mb-4" />
        <p className="text-(--gm-text-dim) font-serif italic">
          {isTr
            ? 'Henüz mesajınız yok. Bir danışmana mesaj gönderdiğinizde sohbet burada görünür.'
            : 'No messages yet. Conversations appear here after you message a consultant.'}
        </p>
      </div>
    );
  }

  const active = threads.find((t) => t.thread_id === activeId);
  const messages = convo?.messages ?? [];
  const myUserId = active?.last_message?.sender_user_id && active.last_message.from_self
    ? active.last_message.sender_user_id
    : undefined;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 h-[600px]">
      {/* Thread list */}
      <div className="border border-(--gm-border-soft) rounded-2xl bg-(--gm-surface)/30 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-(--gm-border-soft) flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-(--gm-gold-dim)">
            {isTr ? `Sohbetler (${threads.length})` : `Chats (${threads.length})`}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.map((t) => {
            const isActive = t.thread_id === activeId;
            const title = threadTitle(t, isTr);
            return (
              <button
                key={t.thread_id}
                type="button"
                onClick={() => setActiveId(t.thread_id)}
                className={`w-full text-left px-4 py-3 border-b border-(--gm-border-soft)/40 flex items-start gap-3 transition-colors ${
                  isActive
                    ? 'bg-(--gm-gold)/10'
                    : 'hover:bg-(--gm-surface)/60'
                }`}
              >
                <div className="w-10 h-10 shrink-0 rounded-full bg-(--gm-gold)/15 border border-(--gm-gold)/30 flex items-center justify-center text-(--gm-gold-deep) text-xs font-bold overflow-hidden">
                  {t.consultant?.avatar_url ? (
                    <img src={t.consultant.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    initialsOf(title)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-(--gm-text)">{title}</span>
                    {t.unread_count > 0 && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-(--gm-gold) text-[10px] text-(--gm-bg-deep) font-bold">
                        {t.unread_count}
                      </span>
                    )}
                  </div>
                  {t.last_message ? (
                    <p className="mt-0.5 text-xs text-(--gm-text-dim) truncate">
                      {t.last_message.from_self ? (isTr ? 'Sen: ' : 'You: ') : ''}
                      {t.last_message.text}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-(--gm-text-dim) italic">
                      {isTr ? 'Henüz mesaj yok' : 'No messages yet'}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation */}
      <div className="border border-(--gm-border-soft) rounded-2xl bg-(--gm-surface)/30 flex flex-col overflow-hidden">
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-(--gm-text-dim) text-sm">
            {isTr ? 'Bir sohbet seçin' : 'Select a chat'}
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-(--gm-border-soft) flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-(--gm-gold)/15 border border-(--gm-gold)/30 flex items-center justify-center text-(--gm-gold-deep) overflow-hidden">
                {active.consultant?.avatar_url ? (
                  <img src={active.consultant.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-(--gm-text) font-serif text-base leading-tight">{threadTitle(active, isTr)}</h3>
                <p className="text-[10px] text-(--gm-text-dim) uppercase tracking-widest">
                  {active.context_type === 'booking'
                    ? (isTr ? 'Randevu sohbeti' : 'Booking chat')
                    : active.context_type === 'consultant_lead'
                    ? (isTr ? 'Genel mesaj' : 'General')
                    : active.context_type}
                </p>
              </div>
            </div>

            <div className="m-3 mb-0">
              <ChatWarningBanner compact />
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {convoLoading ? (
                <div className="flex items-center justify-center py-6 text-(--gm-text-dim)">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-(--gm-text-dim) font-serif italic py-6">
                  {isTr ? 'Henüz mesaj yok. İlk mesajı yaz.' : 'No messages yet. Start the conversation.'}
                </p>
              ) : (
                messages.map((m) => {
                  // Eğer aktif user'ın id'sini bilirsek mine sınıfı veririz; yoksa sender_user_id eşleşmesi yeterli.
                  // active.last_message.from_self bilgisi son mesaj için doğru; tek tek mesajlar için sender_user_id karşılaştırmak en sağlıklısı.
                  // Backend her mesaj için from_self göndermiyor → fallback: aktif son mesajdaki sender match ile bizim user_id'mizi bulup eşitleriz.
                  const mine = myUserId ? m.sender_user_id === myUserId : false;
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                          mine
                            ? 'bg-(--gm-gold) text-(--gm-bg-deep) rounded-br-sm'
                            : 'bg-(--gm-bg-deep) text-(--gm-text) rounded-bl-sm'
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">{m.text}</div>
                        <div className={`text-[10px] mt-1 ${mine ? 'text-(--gm-bg-deep)/60' : 'text-(--gm-text-dim)'}`}>
                          {formatTime(m.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-(--gm-border-soft) p-3 flex items-end gap-2">
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
                placeholder={isTr ? 'Mesajını yaz…' : 'Type your message…'}
                disabled={replying}
                className="flex-1 bg-(--gm-bg-deep) border border-(--gm-border-soft) rounded-xl p-3 text-sm text-(--gm-text) resize-none focus:ring-2 focus:ring-(--gm-gold)/30 focus:border-(--gm-gold)/40 outline-none"
              />
              <button
                onClick={handleSend}
                disabled={replying || !draft.trim()}
                className="h-11 px-4 rounded-xl bg-(--gm-gold) text-(--gm-bg-deep) disabled:opacity-50 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
              >
                {replying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isTr ? 'Gönder' : 'Send'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
