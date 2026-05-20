'use client';

import React, { useState } from 'react';
import {
  useListWithdrawalsAdminQuery,
  useApproveWithdrawalAdminMutation,
  useRejectWithdrawalAdminMutation,
  useMarkPaidWithdrawalAdminMutation,
} from '@/integrations/endpoints/admin/withdrawals_admin.endpoints';
import { WithdrawalStatus } from '@/integrations/shared';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export function WithdrawalsClient() {
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | 'all'>('pending');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, refetch } = useListWithdrawalsAdminQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit,
    offset: (page - 1) * limit,
  });

  const [approveMw] = useApproveWithdrawalAdminMutation();
  const [rejectMw] = useRejectWithdrawalAdminMutation();
  const [markPaidMw] = useMarkPaidWithdrawalAdminMutation();

  const [actionModal, setActionModal] = useState<{
    type: 'approve' | 'reject' | 'mark-paid';
    id: string;
    amount?: string;
    iban?: string;
    holder?: string;
  } | null>(null);

  const [rejectionReason, setRejectionReason] = useState('');
  const [transferReference, setTransferReference] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleApprove = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      await approveMw(actionModal.id).unwrap();
      toast.success('Talep başarıyla onaylandı.');
      setActionModal(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Onaylama başarısız.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!actionModal) return;
    if (!rejectionReason.trim()) {
      toast.error('Lütfen bir ret sebebi girin.');
      return;
    }
    setActionLoading(true);
    try {
      await rejectMw({ id: actionModal.id, rejection_reason: rejectionReason }).unwrap();
      toast.success('Talep reddedildi ve bakiye iade edildi.');
      setActionModal(null);
      setRejectionReason('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Red işlemi başarısız.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!actionModal) return;
    if (!transferReference.trim()) {
      toast.error('Lütfen banka transfer referansı girin.');
      return;
    }
    setActionLoading(true);
    try {
      await markPaidMw({ id: actionModal.id, transfer_reference: transferReference }).unwrap();
      toast.success('Talep ödendi olarak işaretlendi.');
      setActionModal(null);
      setTransferReference('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Ödeme kaydı başarısız.');
    } finally {
      setActionLoading(false);
    }
  };

  const fmtDate = (d: string) => {
    try {
      return format(new Date(d), 'dd MMM yyyy HH:mm', { locale: tr });
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-[200px]">
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Durum Seç" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="pending">Bekleyen</SelectItem>
              <SelectItem value="approved">Onaylanan (Ödenecek)</SelectItem>
              <SelectItem value="paid">Ödenen</SelectItem>
              <SelectItem value="rejected">Reddedilen</SelectItem>
              <SelectItem value="cancelled">İptal Edilen</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => refetch()}>Yenile</Button>
      </div>

      <Card className="bg-gm-surface p-0 overflow-hidden border-gm-border-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gm-text-primary whitespace-nowrap">
            <thead className="bg-gm-deep/50 text-gm-muted uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Tarih</th>
                <th className="px-6 py-4 font-medium">Danışman</th>
                <th className="px-6 py-4 font-medium">Tutar</th>
                <th className="px-6 py-4 font-medium">Banka Bilgisi</th>
                <th className="px-6 py-4 font-medium">Durum</th>
                <th className="px-6 py-4 font-medium text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gm-border-soft">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gm-muted">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Yükleniyor...
                  </td>
                </tr>
              ) : data?.items?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gm-muted">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                data?.items.map((row) => (
                  <tr key={row.id} className="hover:bg-gm-deep/20 transition-colors">
                    <td className="px-6 py-4">{fmtDate(row.requested_at)}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{row.consultant_name || 'Bilinmiyor'}</p>
                        <p className="text-xs text-gm-muted">{row.consultant_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-medium text-gm-gold">
                        {Number(row.amount).toLocaleString('tr-TR', { style: 'currency', currency: row.currency || 'TRY' })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs max-w-[200px] truncate" title={row.bank_holder}>
                        <p className="font-medium text-gm-text-secondary">{row.bank_holder}</p>
                        <p className="text-gm-muted font-mono">{row.bank_iban}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {row.status === 'pending' && <Badge variant="warning">Bekliyor</Badge>}
                      {row.status === 'approved' && <Badge variant="info">Onaylandı (Bekliyor)</Badge>}
                      {row.status === 'paid' && <Badge variant="success">Ödendi</Badge>}
                      {row.status === 'rejected' && <Badge variant="destructive">Reddedildi</Badge>}
                      {row.status === 'cancelled' && <Badge variant="secondary">İptal</Badge>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {row.status === 'pending' && (
                          <>
                            <Button size="sm" variant="default" onClick={() => setActionModal({ type: 'approve', id: row.id, amount: row.amount, iban: row.bank_iban, holder: row.bank_holder })}>
                              Onayla
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => setActionModal({ type: 'reject', id: row.id })}>
                              Reddet
                            </Button>
                          </>
                        )}
                        {row.status === 'approved' && (
                          <Button size="sm" variant="success" onClick={() => setActionModal({ type: 'mark-paid', id: row.id, amount: row.amount, iban: row.bank_iban, holder: row.bank_holder })}>
                            Ödendi İşaretle
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Action Modals */}
      <Modal open={actionModal?.type === 'approve'} onOpenChange={(o) => !o && setActionModal(null)} title="Talebi Onayla">
        <div className="space-y-4 pt-4">
          <p className="text-sm text-gm-muted">Bu para çekme talebini onaylamak istiyor musunuz? Onayladıktan sonra banka transferini gerçekleştirmeniz ve 'Ödendi' olarak işaretlemeniz gerekecektir.</p>
          <div className="bg-gm-deep p-4 rounded-xl space-y-2 text-sm border border-gm-border-soft">
            <div className="flex justify-between"><span className="text-gm-muted">Tutar:</span> <span className="font-mono text-gm-gold">{actionModal?.amount} TRY</span></div>
            <div className="flex justify-between"><span className="text-gm-muted">Hesap Sahibi:</span> <span>{actionModal?.holder}</span></div>
            <div className="flex justify-between"><span className="text-gm-muted">IBAN:</span> <span className="font-mono text-gm-text-secondary">{actionModal?.iban}</span></div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setActionModal(null)}>İptal</Button>
            <Button variant="default" onClick={handleApprove} disabled={actionLoading}>
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Onayla
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={actionModal?.type === 'reject'} onOpenChange={(o) => !o && setActionModal(null)} title="Talebi Reddet">
        <div className="space-y-4 pt-4">
          <p className="text-sm text-gm-muted">Talebi reddettiğinizde bakiye danışmanın cüzdanına iade edilecektir. Lütfen red sebebi girin (danışmana e-posta ile bildirilecek).</p>
          <Textarea 
            placeholder="Reddetme sebebi..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full"
            rows={3}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setActionModal(null)}>İptal</Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading || !rejectionReason.trim()}>
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Reddet
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={actionModal?.type === 'mark-paid'} onOpenChange={(o) => !o && setActionModal(null)} title="Ödendi Olarak İşaretle">
        <div className="space-y-4 pt-4">
          <p className="text-sm text-gm-muted">Banka transferini gerçekleştirdikten sonra referans/dekont numarasını girin.</p>
          <div className="bg-gm-deep p-4 rounded-xl space-y-2 text-sm border border-gm-border-soft mb-4">
            <div className="flex justify-between"><span className="text-gm-muted">Tutar:</span> <span className="font-mono text-gm-gold">{actionModal?.amount} TRY</span></div>
            <div className="flex justify-between"><span className="text-gm-muted">Hesap Sahibi:</span> <span>{actionModal?.holder}</span></div>
            <div className="flex justify-between"><span className="text-gm-muted">IBAN:</span> <span className="font-mono text-gm-text-secondary">{actionModal?.iban}</span></div>
          </div>
          <div>
            <label className="text-xs text-gm-muted mb-1 block">Transfer Referansı / Açıklama</label>
            <Input 
              placeholder="Dekont No veya Referans (Zorunlu)"
              value={transferReference}
              onChange={(e) => setTransferReference(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setActionModal(null)}>İptal</Button>
            <Button variant="success" onClick={handleMarkPaid} disabled={actionLoading || !transferReference.trim()}>
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Ödendi Olarak Kaydet
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
