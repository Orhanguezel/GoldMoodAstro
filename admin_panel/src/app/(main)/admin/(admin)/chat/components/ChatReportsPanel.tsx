'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useListChatReportsAdminQuery, useReviewChatReportAdminMutation } from '@/integrations/endpoints/admin/chat_admin.endpoints';

export default function ChatReportsPanel() {
  const [status, setStatus] = useState<'open' | 'reviewed' | 'dismissed'>('open');
  const { data, isLoading, isError, refetch } = useListChatReportsAdminQuery(status);
  const [review, { isLoading: saving }] = useReviewChatReportAdminMutation();

  async function update(id: string, next: 'reviewed' | 'dismissed') {
    try { await review({ id, status: next }).unwrap(); toast.success('Bildirim güncellendi'); }
    catch { toast.error('Bildirim güncellenemedi'); }
  }

  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2">
      {(['open', 'reviewed', 'dismissed'] as const).map((item) => <Button key={item} variant={status === item ? 'default' : 'outline'} onClick={() => setStatus(item)}>{item === 'open' ? 'Açık' : item === 'reviewed' ? 'İncelendi' : 'Reddedildi'}</Button>)}
    </div>
    {isLoading ? <p>Bildirimler yükleniyor...</p> : isError ? <Button onClick={() => void refetch()}>Yeniden dene</Button> : !data?.items.length ? <p className="text-gm-muted">Bu durumda bildirim yok.</p> :
      <div className="space-y-3">{data.items.map((row) => <div key={row.id} className="rounded-xl border border-gm-border bg-gm-surface p-4 space-y-2">
        <div className="flex justify-between gap-3"><strong>{row.reason}</strong><time className="text-xs text-gm-muted">{new Date(row.created_at).toLocaleString('tr-TR')}</time></div>
        <p className="whitespace-pre-wrap break-words">{row.message_text ?? 'Mesaj silinmiş'}</p>
        <p className="text-xs text-gm-muted">Konuşma: {row.thread_id} · Bildiren: {row.reporter_user_id} · Gönderen: {row.reported_user_id}</p>
        {row.details && <p className="text-sm">{row.details}</p>}
        {status === 'open' && <div className="flex gap-2"><Button disabled={saving} onClick={() => void update(row.id, 'reviewed')}>İncelendi</Button><Button variant="outline" disabled={saving} onClick={() => void update(row.id, 'dismissed')}>Reddet</Button></div>}
      </div>)}</div>}
  </div>;
}
