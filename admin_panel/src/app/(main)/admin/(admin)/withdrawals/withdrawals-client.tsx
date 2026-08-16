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
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

export function WithdrawalsClient() {
  const t = useAdminT('admin.withdrawals');
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
      toast.success(t('toast.approveSuccess', undefined, 'Talep başarıyla onaylandı.'));
      setActionModal(null);
    } catch (err: any) {
      toast.error(err?.data?.message || t('toast.approveError', undefined, 'Onaylama başarısız.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!actionModal) return;
    if (!rejectionReason.trim()) {
      toast.error(t('toast.rejectReasonRequired', undefined, 'Lütfen bir ret sebebi girin.'));
      return;
    }
    setActionLoading(true);
    try {
      await rejectMw({ id: actionModal.id, rejection_reason: rejectionReason }).unwrap();
      toast.success(t('toast.rejectSuccess', undefined, 'Talep reddedildi ve bakiye iade edildi.'));
      setActionModal(null);
      setRejectionReason('');
    } catch (err: any) {
      toast.error(err?.data?.message || t('toast.rejectError', undefined, 'Red işlemi başarısız.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!actionModal) return;
    if (!transferReference.trim()) {
      toast.error(t('toast.transferRefRequired', undefined, 'Lütfen banka transfer referansı girin.'));
      return;
    }
    setActionLoading(true);
    try {
      await markPaidMw({ id: actionModal.id, transfer_reference: transferReference }).unwrap();
      toast.success(t('toast.markPaidSuccess', undefined, 'Talep ödendi olarak işaretlendi.'));
      setActionModal(null);
      setTransferReference('');
    } catch (err: any) {
      toast.error(err?.data?.message || t('toast.markPaidError', undefined, 'Ödeme kaydı başarısız.'));
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
              <SelectValue placeholder={t('filter.placeholder', undefined, 'Durum Seç')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filter.all', undefined, 'Tümü')}</SelectItem>
              <SelectItem value="pending">{t('filter.pending', undefined, 'Bekleyen')}</SelectItem>
              <SelectItem value="approved">{t('filter.approved', undefined, 'Onaylanan (Ödenecek)')}</SelectItem>
              <SelectItem value="paid">{t('filter.paid', undefined, 'Ödenen')}</SelectItem>
              <SelectItem value="rejected">{t('filter.rejected', undefined, 'Reddedilen')}</SelectItem>
              <SelectItem value="cancelled">{t('filter.cancelled', undefined, 'İptal Edilen')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => refetch()}>{t('actions.refresh', undefined, 'Yenile')}</Button>
      </div>

      <Card className="bg-gm-surface p-0 overflow-hidden border-gm-border-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gm-text-primary whitespace-nowrap">
            <thead className="bg-gm-deep/50 text-gm-muted uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">{t('table.date', undefined, 'Tarih')}</th>
                <th className="px-6 py-4 font-medium">{t('table.consultant', undefined, 'Danışman')}</th>
                <th className="px-6 py-4 font-medium">{t('table.amount', undefined, 'Tutar')}</th>
                <th className="px-6 py-4 font-medium">{t('table.bankInfo', undefined, 'Banka Bilgisi')}</th>
                <th className="px-6 py-4 font-medium">{t('table.status', undefined, 'Durum')}</th>
                <th className="px-6 py-4 font-medium text-right">{t('table.action', undefined, 'İşlem')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gm-border-soft">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gm-muted">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    {t('state.loading', undefined, 'Yükleniyor...')}
                  </td>
                </tr>
              ) : data?.items?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gm-muted">
                    {t('state.empty', undefined, 'Kayıt bulunamadı.')}
                  </td>
                </tr>
              ) : (
                data?.items.map((row) => (
                  <tr key={row.id} className="hover:bg-gm-deep/20 transition-colors">
                    <td className="px-6 py-4">{fmtDate(row.requested_at)}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{row.consultant_name || t('table.unknown', undefined, 'Bilinmiyor')}</p>
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
                      {row.status === 'pending' && <Badge variant="secondary" className="bg-amber-500/15 text-amber-600 border-amber-500/30">{t('status.pending', undefined, 'Bekliyor')}</Badge>}
                      {row.status === 'approved' && <Badge variant="secondary" className="bg-sky-500/15 text-sky-600 border-sky-500/30">{t('status.approved', undefined, 'Onaylandı (Bekliyor)')}</Badge>}
                      {row.status === 'paid' && <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">{t('status.paid', undefined, 'Ödendi')}</Badge>}
                      {row.status === 'rejected' && <Badge variant="destructive">{t('status.rejected', undefined, 'Reddedildi')}</Badge>}
                      {row.status === 'cancelled' && <Badge variant="secondary">{t('status.cancelled', undefined, 'İptal')}</Badge>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {row.status === 'pending' && (
                          <>
                            <Button size="sm" variant="default" onClick={() => setActionModal({ type: 'approve', id: row.id, amount: row.amount, iban: row.bank_iban, holder: row.bank_holder })}>
                              {t('actions.approve', undefined, 'Onayla')}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => setActionModal({ type: 'reject', id: row.id })}>
                              {t('actions.reject', undefined, 'Reddet')}
                            </Button>
                          </>
                        )}
                        {row.status === 'approved' && (
                          <Button size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setActionModal({ type: 'mark-paid', id: row.id, amount: row.amount, iban: row.bank_iban, holder: row.bank_holder })}>
                            {t('actions.markPaid', undefined, 'Ödendi İşaretle')}
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
      <Modal open={actionModal?.type === 'approve'} onOpenChange={(o) => !o && setActionModal(null)} title={t('approveModal.title', undefined, 'Talebi Onayla')}>
        <div className="space-y-4 pt-4">
          <p className="text-sm text-gm-muted">{t('approveModal.description', undefined, "Bu para çekme talebini onaylamak istiyor musunuz? Onayladıktan sonra banka transferini gerçekleştirmeniz ve 'Ödendi' olarak işaretlemeniz gerekecektir.")}</p>
          <div className="bg-gm-deep p-4 rounded-xl space-y-2 text-sm border border-gm-border-soft">
            <div className="flex justify-between"><span className="text-gm-muted">{t('detail.amount', undefined, 'Tutar:')}</span> <span className="font-mono text-gm-gold">{actionModal?.amount} TRY</span></div>
            <div className="flex justify-between"><span className="text-gm-muted">{t('detail.accountHolder', undefined, 'Hesap Sahibi:')}</span> <span>{actionModal?.holder}</span></div>
            <div className="flex justify-between"><span className="text-gm-muted">{t('detail.iban', undefined, 'IBAN:')}</span> <span className="font-mono text-gm-text-secondary">{actionModal?.iban}</span></div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setActionModal(null)}>{t('actions.cancel', undefined, 'İptal')}</Button>
            <Button variant="default" onClick={handleApprove} disabled={actionLoading}>
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {t('actions.approve', undefined, 'Onayla')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={actionModal?.type === 'reject'} onOpenChange={(o) => !o && setActionModal(null)} title={t('rejectModal.title', undefined, 'Talebi Reddet')}>
        <div className="space-y-4 pt-4">
          <p className="text-sm text-gm-muted">{t('rejectModal.description', undefined, 'Talebi reddettiğinizde bakiye danışmanın cüzdanına iade edilecektir. Lütfen red sebebi girin (danışmana e-posta ile bildirilecek).')}</p>
          <Textarea
            placeholder={t('rejectModal.reasonPlaceholder', undefined, 'Reddetme sebebi...')}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full"
            rows={3}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setActionModal(null)}>{t('actions.cancel', undefined, 'İptal')}</Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading || !rejectionReason.trim()}>
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {t('actions.reject', undefined, 'Reddet')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={actionModal?.type === 'mark-paid'} onOpenChange={(o) => !o && setActionModal(null)} title={t('markPaidModal.title', undefined, 'Ödendi Olarak İşaretle')}>
        <div className="space-y-4 pt-4">
          <p className="text-sm text-gm-muted">{t('markPaidModal.description', undefined, 'Banka transferini gerçekleştirdikten sonra referans/dekont numarasını girin.')}</p>
          <div className="bg-gm-deep p-4 rounded-xl space-y-2 text-sm border border-gm-border-soft mb-4">
            <div className="flex justify-between"><span className="text-gm-muted">{t('detail.amount', undefined, 'Tutar:')}</span> <span className="font-mono text-gm-gold">{actionModal?.amount} TRY</span></div>
            <div className="flex justify-between"><span className="text-gm-muted">{t('detail.accountHolder', undefined, 'Hesap Sahibi:')}</span> <span>{actionModal?.holder}</span></div>
            <div className="flex justify-between"><span className="text-gm-muted">{t('detail.iban', undefined, 'IBAN:')}</span> <span className="font-mono text-gm-text-secondary">{actionModal?.iban}</span></div>
          </div>
          <div>
            <label className="text-xs text-gm-muted mb-1 block">{t('markPaidModal.refLabel', undefined, 'Transfer Referansı / Açıklama')}</label>
            <Input
              placeholder={t('markPaidModal.refPlaceholder', undefined, 'Dekont No veya Referans (Zorunlu)')}
              value={transferReference}
              onChange={(e) => setTransferReference(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setActionModal(null)}>{t('actions.cancel', undefined, 'İptal')}</Button>
            <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleMarkPaid} disabled={actionLoading || !transferReference.trim()}>
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {t('markPaidModal.confirm', undefined, 'Ödendi Olarak Kaydet')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
