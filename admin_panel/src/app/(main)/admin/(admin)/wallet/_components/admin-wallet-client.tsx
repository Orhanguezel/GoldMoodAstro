'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Check, Plus, RefreshCcw, Search, Wallet, X } from 'lucide-react';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type {
  WalletAdminView,
  WalletPaymentMethod,
  WalletPaymentStatus,
  WalletTransactionView,
} from '@/integrations/shared';
import {
  useAdjustWalletAdminMutation,
  useApproveWalletDepositAdminMutation,
  useListWalletDepositsAdminQuery,
  useListWalletsAdminQuery,
  useListWalletTransactionsAdminQuery,
  usePatchWalletStatusAdminMutation,
  useRejectWalletDepositAdminMutation,
} from '@/integrations/hooks';
import { Textarea } from '@/components/ui/textarea';

function fmtMoney(v: string | number, currency: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return `${v} ${currency}`;
  try {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency || 'EUR',
      minimumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

function fmtDate(v: string | null | undefined) {
  if (!v) return '-';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString('de-DE');
}

function errMsg(err: unknown, fallback: string) {
  const e = err as any;
  return e?.data?.error || e?.data?.message || e?.error || e?.message || fallback;
}

export default function AdminWalletClient() {
  const t = useAdminT('admin.wallet');

  const [walletPage, setWalletPage] = React.useState(1);
  const [walletLimit] = React.useState(20);

  const [depositPage, setDepositPage] = React.useState(1);
  const [depositLimit] = React.useState(20);
  const [depositStatus, setDepositStatus] = React.useState<WalletPaymentStatus | 'all'>('pending');
  const [depositMethod, setDepositMethod] = React.useState<WalletPaymentMethod | 'all'>('all');
  const [searchUserId, setSearchUserId] = React.useState('');

  const walletsQ = useListWalletsAdminQuery({ page: walletPage, limit: walletLimit });
  const depositsQ = useListWalletDepositsAdminQuery({
    page: depositPage,
    limit: depositLimit,
    payment_status: depositStatus === 'all' ? undefined : depositStatus,
    payment_method: depositMethod === 'all' ? undefined : depositMethod,
    user_id: searchUserId.trim() || undefined,
  });

  const [patchWalletStatus, patchWalletStatusState] = usePatchWalletStatusAdminMutation();
  const [approveDeposit, approveDepositState] = useApproveWalletDepositAdminMutation();
  const [rejectDeposit, rejectDepositState] = useRejectWalletDepositAdminMutation();
  const [adjustWallet, adjustWalletState] = useAdjustWalletAdminMutation();

  const [txOpen, setTxOpen] = React.useState(false);
  const [selectedWallet, setSelectedWallet] = React.useState<WalletAdminView | null>(null);

  const [adjustOpen, setAdjustOpen] = React.useState(false);
  const [adjustUserId, setAdjustUserId] = React.useState('');
  const [adjustType, setAdjustType] = React.useState<'credit' | 'debit'>('credit');
  const [adjustAmount, setAdjustAmount] = React.useState('');
  const [adjustPurpose, setAdjustPurpose] = React.useState('');
  const [adjustDesc, setAdjustDesc] = React.useState('');

  const txQ = useListWalletTransactionsAdminQuery(
    { walletId: selectedWallet?.id || '', page: 1, limit: 50 },
    { skip: !selectedWallet?.id || !txOpen },
  );

  const busy =
    walletsQ.isFetching ||
    depositsQ.isFetching ||
    patchWalletStatusState.isLoading ||
    approveDepositState.isLoading ||
    rejectDepositState.isLoading ||
    adjustWalletState.isLoading;

  const wallets = walletsQ.data?.data ?? [];
  const deposits = depositsQ.data?.data ?? [];

  async function onWalletStatusChange(row: WalletAdminView, next: WalletAdminView['status']) {
    try {
      await patchWalletStatus({ id: row.id, body: { status: next } }).unwrap();
      toast.success(t('messages.walletStatusUpdated', {}, 'Cüzdan durumu güncellendi'));
      walletsQ.refetch();
    } catch (e) {
      toast.error(errMsg(e, t('messages.operationFailed', {}, 'İşlem başarısız')));
    }
  }

  async function onApproveDeposit(tx: WalletTransactionView) {
    try {
      await approveDeposit({ id: tx.id }).unwrap();
      toast.success(t('messages.depositApproved', {}, 'Yatırım onaylandı'));
      depositsQ.refetch();
      walletsQ.refetch();
      if (selectedWallet?.id === tx.wallet_id) txQ.refetch();
    } catch (e) {
      toast.error(errMsg(e, t('messages.operationFailed', {}, 'İşlem başarısız')));
    }
  }

  async function onRejectDeposit(tx: WalletTransactionView) {
    const reason = window.prompt(t('messages.rejectPrompt', {}, 'Red nedeni (opsiyonel):')) || undefined;
    try {
      await rejectDeposit({ id: tx.id, body: reason ? { reason } : {} }).unwrap();
      toast.success(t('messages.depositRejected', {}, 'Yatırım reddedildi'));
      depositsQ.refetch();
      if (selectedWallet?.id === tx.wallet_id) txQ.refetch();
    } catch (e) {
      toast.error(errMsg(e, t('messages.operationFailed', {}, 'İşlem başarısız')));
    }
  }

  function openAdjustForUser(row: WalletAdminView) {
    setAdjustUserId(row.user_id);
    setAdjustType('credit');
    setAdjustAmount('');
    setAdjustPurpose('');
    setAdjustDesc('');
    setAdjustOpen(true);
  }

  async function onAdjustSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(adjustAmount);
    if (!amount || amount <= 0) {
      toast.error('Geçerli bir tutar girin');
      return;
    }
    if (!adjustPurpose.trim()) {
      toast.error('Amaç alanı zorunlu');
      return;
    }
    try {
      await adjustWallet({
        user_id: adjustUserId,
        type: adjustType,
        amount,
        purpose: adjustPurpose.trim(),
        description: adjustDesc.trim() || undefined,
        payment_status: 'completed',
      }).unwrap();
      toast.success(t('messages.adjustSuccess', {}, 'Bakiye ayarlandı'));
      setAdjustOpen(false);
      walletsQ.refetch();
    } catch (e) {
      toast.error(errMsg(e, t('messages.operationFailed', {}, 'İşlem başarısız')));
    }
  }

  function openWalletTx(row: WalletAdminView) {
    setSelectedWallet(row);
    setTxOpen(true);
  }

  const walletHasPrev = walletPage > 1;
  const walletHasNext = (walletsQ.data?.data?.length ?? 0) >= walletLimit;

  const depositsHasPrev = depositPage > 1;
  const depositsHasNext = (depositsQ.data?.data?.length ?? 0) >= depositLimit;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">{t('title', {}, 'Wallet & Ödemeler')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('description', {}, 'Wallet bakiyeleri, yatırım talepleri ve ödeme onay süreçleri')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('wallets.title', {}, 'Cüzdanlar')}</CardTitle>
          <CardDescription>
            {t('wallets.desc', {}, 'Kullanıcı bakiyeleri ve durum yönetimi')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => {
                walletsQ.refetch();
                depositsQ.refetch();
                if (txOpen) txQ.refetch();
              }}
            >
              <RefreshCcw className="mr-2 size-4" />
              {t('actions.refresh', {}, 'Yenile')}
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('wallets.table.user', {}, 'Kullanıcı')}</TableHead>
                  <TableHead>{t('wallets.table.balance', {}, 'Bakiye')}</TableHead>
                  <TableHead>{t('wallets.table.earnings', {}, 'Toplam Giriş')}</TableHead>
                  <TableHead>{t('wallets.table.withdrawn', {}, 'Toplam Çıkış')}</TableHead>
                  <TableHead>{t('wallets.table.status', {}, 'Durum')}</TableHead>
                  <TableHead className="text-right">{t('wallets.table.actions', {}, 'Aksiyon')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!walletsQ.isFetching && wallets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      {t('wallets.empty', {}, 'Kayıt bulunamadı')}
                    </TableCell>
                  </TableRow>
                ) : null}

                {wallets.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium">{row.full_name || '-'}</p>
                        <p className="text-xs text-muted-foreground">{row.email || row.user_id}</p>
                      </div>
                    </TableCell>
                    <TableCell>{fmtMoney(row.balance, row.currency)}</TableCell>
                    <TableCell>{fmtMoney(row.total_earnings, row.currency)}</TableCell>
                    <TableCell>{fmtMoney(row.total_withdrawn, row.currency)}</TableCell>
                    <TableCell>
                      <Select
                        value={row.status}
                        onValueChange={(v) => onWalletStatusChange(row, v as WalletAdminView['status'])}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">active</SelectItem>
                          <SelectItem value="suspended">suspended</SelectItem>
                          <SelectItem value="closed">closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openWalletTx(row)}>
                          <Wallet className="mr-2 size-4" />
                          {t('wallets.actions.transactions', {}, 'İşlemler')}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openAdjustForUser(row)}>
                          <Plus className="mr-2 size-4" />
                          {t('wallets.actions.adjust', {}, 'Bakiye Ayarla')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!walletHasPrev || busy}
              onClick={() => setWalletPage((p) => Math.max(1, p - 1))}
            >
              {t('actions.prev', {}, 'Önceki')}
            </Button>
            <Badge variant="outline">{t('labels.page', { page: walletPage }, `Sayfa ${walletPage}`)}</Badge>
            <Button
              variant="outline"
              size="sm"
              disabled={!walletHasNext || busy}
              onClick={() => setWalletPage((p) => p + 1)}
            >
              {t('actions.next', {}, 'Sonraki')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('deposits.title', {}, 'Yatırım Talepleri')}</CardTitle>
          <CardDescription>
            {t('deposits.desc', {}, 'PayPal ve banka havalesi taleplerini onaylayın veya reddedin')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <Label>{t('deposits.filters.status', {}, 'Durum')}</Label>
              <Select
                value={depositStatus}
                onValueChange={(v) => {
                  setDepositStatus(v as WalletPaymentStatus | 'all');
                  setDepositPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">all</SelectItem>
                  <SelectItem value="pending">pending</SelectItem>
                  <SelectItem value="completed">completed</SelectItem>
                  <SelectItem value="failed">failed</SelectItem>
                  <SelectItem value="refunded">refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('deposits.filters.method', {}, 'Yöntem')}</Label>
              <Select
                value={depositMethod}
                onValueChange={(v) => {
                  setDepositMethod(v as WalletPaymentMethod | 'all');
                  setDepositPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">all</SelectItem>
                  <SelectItem value="paypal">paypal</SelectItem>
                  <SelectItem value="bank_transfer">bank_transfer</SelectItem>
                  <SelectItem value="admin_manual">admin_manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{t('deposits.filters.userId', {}, 'User ID')}</Label>
              <div className="flex gap-2">
                <Input
                  value={searchUserId}
                  onChange={(e) => setSearchUserId(e.target.value)}
                  placeholder={t('deposits.filters.userIdPh', {}, 'UUID ile filtrele')}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    setDepositPage(1);
                    depositsQ.refetch();
                  }}
                >
                  <Search className="mr-2 size-4" />
                  {t('actions.search', {}, 'Ara')}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('deposits.table.user', {}, 'Kullanıcı')}</TableHead>
                  <TableHead>{t('deposits.table.amount', {}, 'Tutar')}</TableHead>
                  <TableHead>{t('deposits.table.method', {}, 'Yöntem')}</TableHead>
                  <TableHead>{t('deposits.table.status', {}, 'Durum')}</TableHead>
                  <TableHead>{t('deposits.table.createdAt', {}, 'Tarih')}</TableHead>
                  <TableHead className="text-right">{t('deposits.table.actions', {}, 'Aksiyon')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!depositsQ.isFetching && deposits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      {t('deposits.empty', {}, 'Kayıt bulunamadı')}
                    </TableCell>
                  </TableRow>
                ) : null}

                {deposits.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium">{tx.user_full_name || '-'}</p>
                        <p className="text-xs text-muted-foreground">{tx.user_email || tx.user_id}</p>
                      </div>
                    </TableCell>
                    <TableCell>{fmtMoney(tx.amount, tx.currency)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{tx.payment_method}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tx.payment_status === 'completed'
                            ? 'secondary'
                            : tx.payment_status === 'failed'
                              ? 'destructive'
                              : 'outline'
                        }
                      >
                        {tx.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{fmtDate(tx.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy || tx.payment_status !== 'pending'}
                          onClick={() => onApproveDeposit(tx)}
                        >
                          <Check className="mr-2 size-4" />
                          {t('deposits.actions.approve', {}, 'Onayla')}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busy || tx.payment_status !== 'pending'}
                          onClick={() => onRejectDeposit(tx)}
                        >
                          <X className="mr-2 size-4" />
                          {t('deposits.actions.reject', {}, 'Reddet')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!depositsHasPrev || busy}
              onClick={() => setDepositPage((p) => Math.max(1, p - 1))}
            >
              {t('actions.prev', {}, 'Önceki')}
            </Button>
            <Badge variant="outline">{t('labels.page', { page: depositPage }, `Sayfa ${depositPage}`)}</Badge>
            <Button
              variant="outline"
              size="sm"
              disabled={!depositsHasNext || busy}
              onClick={() => setDepositPage((p) => p + 1)}
            >
              {t('actions.next', {}, 'Sonraki')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('adjust.title', {}, 'Manuel Bakiye Ayarla')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onAdjustSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('adjust.type', {}, 'İşlem Tipi')}</Label>
              <Select value={adjustType} onValueChange={(v) => setAdjustType(v as 'credit' | 'debit')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit (+)</SelectItem>
                  <SelectItem value="debit">Debit (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('adjust.amount', {}, 'Tutar')}</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('adjust.purpose', {}, 'Amaç')}</Label>
              <Input
                value={adjustPurpose}
                onChange={(e) => setAdjustPurpose(e.target.value)}
                placeholder="z.B. manual_topup, correction"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('adjust.description', {}, 'Açıklama (Opsiyonel)')}</Label>
              <Textarea
                value={adjustDesc}
                onChange={(e) => setAdjustDesc(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAdjustOpen(false)}>
                {t('actions.cancel', {}, 'İptal')}
              </Button>
              <Button type="submit" disabled={adjustWalletState.isLoading}>
                {t('actions.save', {}, 'Kaydet')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={txOpen} onOpenChange={setTxOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {t('transactions.title', {}, 'Cüzdan İşlemleri')} {selectedWallet ? `#${selectedWallet.id}` : ''}
            </DialogTitle>
          </DialogHeader>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('transactions.table.type', {}, 'Tip')}</TableHead>
                  <TableHead>{t('transactions.table.amount', {}, 'Tutar')}</TableHead>
                  <TableHead>{t('transactions.table.method', {}, 'Yöntem')}</TableHead>
                  <TableHead>{t('transactions.table.status', {}, 'Durum')}</TableHead>
                  <TableHead>{t('transactions.table.purpose', {}, 'Amaç')}</TableHead>
                  <TableHead>{t('transactions.table.createdAt', {}, 'Tarih')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!txQ.isFetching && (txQ.data?.data?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      {t('transactions.empty', {}, 'Kayıt bulunamadı')}
                    </TableCell>
                  </TableRow>
                ) : null}

                {(txQ.data?.data ?? []).map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.type}</TableCell>
                    <TableCell>{fmtMoney(tx.amount, tx.currency)}</TableCell>
                    <TableCell>{tx.payment_method}</TableCell>
                    <TableCell>{tx.payment_status}</TableCell>
                    <TableCell>{tx.purpose || '-'}</TableCell>
                    <TableCell>{fmtDate(tx.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
