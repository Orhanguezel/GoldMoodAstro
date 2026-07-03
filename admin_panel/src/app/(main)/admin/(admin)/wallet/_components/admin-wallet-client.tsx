'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  Check,
  CircleDollarSign,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Wallet,
  X,
} from 'lucide-react';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import {
  useAdjustWalletAdminMutation,
  useApproveWalletDepositAdminMutation,
  useListWalletDepositsAdminQuery,
  useListWalletsAdminQuery,
  useListWalletTransactionsAdminQuery,
  usePatchWalletStatusAdminMutation,
  useRejectWalletDepositAdminMutation,
} from '@/integrations/hooks';
import type {
  WalletAdminView,
  WalletPaymentMethod,
  WalletPaymentStatus,
  WalletTransactionView,
} from '@/integrations/shared';
import { cn } from '@/lib/utils';

function fmtMoney(v: string | number, currency: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return `${v} ${currency}`;
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency || 'TRY',
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
  return d.toLocaleString('tr-TR');
}

function errMsg(err: unknown, fallback: string) {
  const e = err as any;
  return e?.data?.error || e?.data?.message || e?.error || e?.message || fallback;
}

function walletStatusClass(status: WalletAdminView['status']) {
  if (status === 'active') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600';
  if (status === 'suspended') return 'border-amber-500/30 bg-amber-500/10 text-amber-600';
  return 'border-slate-500/30 bg-slate-500/10 text-slate-500';
}

function paymentStatusClass(status: WalletPaymentStatus) {
  if (status === 'completed') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600';
  if (status === 'failed') return 'border-red-500/30 bg-red-500/10 text-red-600';
  if (status === 'refunded') return 'border-sky-500/30 bg-sky-500/10 text-sky-600';
  return 'border-amber-500/30 bg-amber-500/10 text-amber-600';
}

function methodLabel(method: WalletPaymentMethod) {
  if (method === 'bank_transfer') return 'Bank Transfer';
  if (method === 'admin_manual') return 'Admin Manual';
  return 'PayPal';
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
  const walletTotal = walletsQ.data?.total ?? wallets.length;
  const pendingDeposits = deposits.filter((tx) => tx.payment_status === 'pending').length;
  const totalBalance = wallets.reduce((sum, row) => sum + Number(row.balance || 0), 0);
  const totalEarnings = wallets.reduce((sum, row) => sum + Number(row.total_earnings || 0), 0);
  const displayCurrency = wallets[0]?.currency || deposits[0]?.currency || 'TRY';

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
      toast.error(t('adjust.errors.amount', {}, 'Geçerli bir tutar girin'));
      return;
    }
    if (!adjustPurpose.trim()) {
      toast.error(t('adjust.errors.purpose', {}, 'Amaç alanı zorunlu'));
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
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">
              {t('header.badge', {}, 'Finans Yönetimi')}
            </span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">
            {t('title', {}, 'Wallet & Ödemeler')}
          </h1>
          <p className="max-w-2xl font-serif text-sm italic text-gm-muted opacity-70">
            {t('description', {}, 'Wallet bakiyeleri, yatırım talepleri ve ödeme onay süreçleri')}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => {
            walletsQ.refetch();
            depositsQ.refetch();
            if (txOpen) txQ.refetch();
          }}
          className="h-12 rounded-full border-gm-border-soft px-8 text-[10px] font-bold uppercase tracking-widest hover:bg-gm-surface"
        >
          <RefreshCcw className={cn('mr-2 size-4', busy && 'animate-spin')} />
          {t('actions.refresh', {}, 'Yenile')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="overflow-hidden rounded-[28px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
                {t('summary.wallets', {}, 'Cüzdan')}
              </p>
              <p className="mt-2 font-serif text-3xl text-gm-text">{walletTotal}</p>
            </div>
            <span className="flex size-12 items-center justify-center rounded-full border border-gm-gold/20 bg-gm-gold/10 text-gm-gold">
              <Wallet size={20} />
            </span>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[28px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
                {t('summary.balance', {}, 'Toplam Bakiye')}
              </p>
              <p className="mt-2 font-serif text-2xl text-gm-gold">{fmtMoney(totalBalance, displayCurrency)}</p>
            </div>
            <span className="flex size-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
              <CircleDollarSign size={20} />
            </span>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[28px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
                {t('summary.earnings', {}, 'Toplam Giriş')}
              </p>
              <p className="mt-2 font-serif text-2xl text-gm-text">{fmtMoney(totalEarnings, displayCurrency)}</p>
            </div>
            <span className="flex size-12 items-center justify-center rounded-full border border-sky-500/20 bg-sky-500/10 text-sky-600">
              <ArrowUpCircle size={20} />
            </span>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[28px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
                {t('summary.pendingDeposits', {}, 'Bekleyen Talep')}
              </p>
              <p className="mt-2 font-serif text-3xl text-gm-text">{pendingDeposits}</p>
            </div>
            <span className="flex size-12 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-600">
              <Banknote size={20} />
            </span>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col gap-2 border-b border-gm-border-soft bg-gm-surface/30 px-8 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-serif text-2xl text-gm-text">{t('wallets.title', {}, 'Cüzdanlar')}</h2>
            <p className="mt-1 text-sm text-gm-muted">
              {t('wallets.desc', {}, 'Kullanıcı bakiyeleri ve durum yönetimi')}
            </p>
          </div>
          <Badge variant="outline" className="w-fit rounded-full border-gm-border-soft px-4 py-2 text-gm-muted">
            {t('labels.page', { page: walletPage }, `Sayfa ${walletPage}`)}
          </Badge>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gm-surface/40">
                <TableRow className="border-gm-border-soft hover:bg-transparent">
                  <TableHead className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    {t('wallets.table.user', {}, 'Kullanıcı')}
                  </TableHead>
                  <TableHead className="py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    {t('wallets.table.balance', {}, 'Bakiye')}
                  </TableHead>
                  <TableHead className="py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    {t('wallets.table.earnings', {}, 'Toplam Giriş')}
                  </TableHead>
                  <TableHead className="py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    {t('wallets.table.withdrawn', {}, 'Toplam Çıkış')}
                  </TableHead>
                  <TableHead className="py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    {t('wallets.table.status', {}, 'Durum')}
                  </TableHead>
                  <TableHead className="px-8 py-5 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    {t('wallets.table.actions', {}, 'Aksiyon')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {walletsQ.isFetching && wallets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-16 text-center text-gm-muted">
                      <Loader2 className="mx-auto mb-3 size-6 animate-spin text-gm-gold" />
                      {t('state.loading', {}, 'Yükleniyor...')}
                    </TableCell>
                  </TableRow>
                ) : wallets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-20 text-center font-serif italic text-gm-muted">
                      {t('wallets.empty', {}, 'Kayıt bulunamadı')}
                    </TableCell>
                  </TableRow>
                ) : (
                  wallets.map((row) => (
                    <TableRow key={row.id} className="border-gm-border-soft transition-colors hover:bg-gm-primary/[0.03]">
                      <TableCell className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-gm-gold/20 bg-gm-gold/10 font-serif text-sm text-gm-gold">
                            {(row.full_name || row.email || row.user_id || '?').slice(0, 1).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gm-text">{row.full_name || '-'}</p>
                            <p className="truncate text-xs text-gm-muted">{row.email || row.user_id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 font-serif text-lg text-gm-gold">
                        {fmtMoney(row.balance, row.currency)}
                      </TableCell>
                      <TableCell className="py-5 font-medium text-gm-text">
                        {fmtMoney(row.total_earnings, row.currency)}
                      </TableCell>
                      <TableCell className="py-5 text-gm-muted">
                        {fmtMoney(row.total_withdrawn, row.currency)}
                      </TableCell>
                      <TableCell className="py-5">
                        <Select
                          value={row.status}
                          onValueChange={(v) => onWalletStatusChange(row, v as WalletAdminView['status'])}
                        >
                          <SelectTrigger className={cn('h-10 w-[140px] rounded-full border px-4 text-xs font-bold uppercase tracking-wider', walletStatusClass(row.status))}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-gm-border-soft bg-gm-bg-deep">
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="px-8 py-5 text-right">
                        <div className="inline-flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openWalletTx(row)}
                            className="rounded-full border-gm-border-soft"
                          >
                            <Wallet className="mr-2 size-4" />
                            {t('wallets.actions.transactions', {}, 'İşlemler')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAdjustForUser(row)}
                            className="rounded-full border-gm-border-soft"
                          >
                            <Plus className="mr-2 size-4" />
                            {t('wallets.actions.adjust', {}, 'Bakiye Ayarla')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-gm-border-soft px-8 py-5">
            <Button
              variant="outline"
              size="sm"
              disabled={!walletHasPrev || busy}
              onClick={() => setWalletPage((p) => Math.max(1, p - 1))}
              className="rounded-full border-gm-border-soft"
            >
              {t('actions.prev', {}, 'Önceki')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!walletHasNext || busy}
              onClick={() => setWalletPage((p) => p + 1)}
              className="rounded-full border-gm-border-soft"
            >
              {t('actions.next', {}, 'Sonraki')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
        <div className="border-b border-gm-border-soft bg-gm-surface/30 px-8 py-6">
          <h2 className="font-serif text-2xl text-gm-text">{t('deposits.title', {}, 'Yatırım Talepleri')}</h2>
          <p className="mt-1 text-sm text-gm-muted">
            {t('deposits.desc', {}, 'PayPal ve banka havalesi taleplerini onaylayın veya reddedin')}
          </p>
        </div>

        <CardContent className="space-y-8 p-8">
          <div className="grid gap-5 md:grid-cols-4">
            <div className="space-y-3">
              <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
                {t('deposits.filters.status', {}, 'Durum')}
              </Label>
              <Select
                value={depositStatus}
                onValueChange={(v) => {
                  setDepositStatus(v as WalletPaymentStatus | 'all');
                  setDepositPage(1);
                }}
              >
                <SelectTrigger className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-gm-border-soft bg-gm-bg-deep">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
                {t('deposits.filters.method', {}, 'Yöntem')}
              </Label>
              <Select
                value={depositMethod}
                onValueChange={(v) => {
                  setDepositMethod(v as WalletPaymentMethod | 'all');
                  setDepositPage(1);
                }}
              >
                <SelectTrigger className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-gm-border-soft bg-gm-bg-deep">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="admin_manual">Admin Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
                {t('deposits.filters.userId', {}, 'User ID')}
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gm-muted/50" />
                  <Input
                    value={searchUserId}
                    onChange={(e) => setSearchUserId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setDepositPage(1);
                        depositsQ.refetch();
                      }
                    }}
                    placeholder={t('deposits.filters.userIdPh', {}, 'UUID ile filtrele')}
                    className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 pl-12"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDepositPage(1);
                    depositsQ.refetch();
                  }}
                  className="h-12 rounded-2xl border-gm-border-soft px-6"
                >
                  {t('actions.search', {}, 'Ara')}
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-gm-border-soft">
            <Table>
              <TableHeader className="bg-gm-surface/40">
                <TableRow className="border-gm-border-soft hover:bg-transparent">
                  <TableHead className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    {t('deposits.table.user', {}, 'Kullanıcı')}
                  </TableHead>
                  <TableHead className="py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    {t('deposits.table.amount', {}, 'Tutar')}
                  </TableHead>
                  <TableHead className="py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    {t('deposits.table.method', {}, 'Yöntem')}
                  </TableHead>
                  <TableHead className="py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    {t('deposits.table.status', {}, 'Durum')}
                  </TableHead>
                  <TableHead className="py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    {t('deposits.table.createdAt', {}, 'Tarih')}
                  </TableHead>
                  <TableHead className="px-6 py-5 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    {t('deposits.table.actions', {}, 'Aksiyon')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {depositsQ.isFetching && deposits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-16 text-center text-gm-muted">
                      <Loader2 className="mx-auto mb-3 size-6 animate-spin text-gm-gold" />
                      {t('state.loading', {}, 'Yükleniyor...')}
                    </TableCell>
                  </TableRow>
                ) : deposits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-20 text-center font-serif italic text-gm-muted">
                      {t('deposits.empty', {}, 'Kayıt bulunamadı')}
                    </TableCell>
                  </TableRow>
                ) : (
                  deposits.map((tx) => (
                    <TableRow key={tx.id} className="border-gm-border-soft transition-colors hover:bg-gm-primary/[0.03]">
                      <TableCell className="px-6 py-5">
                        <div className="space-y-0.5">
                          <p className="font-medium text-gm-text">{tx.user_full_name || '-'}</p>
                          <p className="text-xs text-gm-muted">{tx.user_email || tx.user_id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 font-serif text-lg text-gm-gold">
                        {fmtMoney(tx.amount, tx.currency)}
                      </TableCell>
                      <TableCell className="py-5">
                        <Badge variant="outline" className="rounded-full border-gm-border-soft px-3 py-1 text-gm-muted">
                          {methodLabel(tx.payment_method)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5">
                        <Badge variant="outline" className={cn('rounded-full px-3 py-1 font-bold uppercase tracking-wider', paymentStatusClass(tx.payment_status))}>
                          {tx.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5 text-sm text-gm-muted">{fmtDate(tx.created_at)}</TableCell>
                      <TableCell className="px-6 py-5 text-right">
                        <div className="inline-flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy || tx.payment_status !== 'pending'}
                            onClick={() => onApproveDeposit(tx)}
                            className="rounded-full border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                          >
                            <Check className="mr-2 size-4" />
                            {t('deposits.actions.approve', {}, 'Onayla')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy || tx.payment_status !== 'pending'}
                            onClick={() => onRejectDeposit(tx)}
                            className="rounded-full border-red-500/30 text-red-600 hover:bg-red-500/10"
                          >
                            <X className="mr-2 size-4" />
                            {t('deposits.actions.reject', {}, 'Reddet')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!depositsHasPrev || busy}
              onClick={() => setDepositPage((p) => Math.max(1, p - 1))}
              className="rounded-full border-gm-border-soft"
            >
              {t('actions.prev', {}, 'Önceki')}
            </Button>
            <Badge variant="outline" className="rounded-full border-gm-border-soft px-4 py-2 text-gm-muted">
              {t('labels.page', { page: depositPage }, `Sayfa ${depositPage}`)}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              disabled={!depositsHasNext || busy}
              onClick={() => setDepositPage((p) => p + 1)}
              className="rounded-full border-gm-border-soft"
            >
              {t('actions.next', {}, 'Sonraki')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="max-w-md rounded-[28px] border-gm-border-soft bg-gm-bg-deep">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-gm-text">
              {t('adjust.title', {}, 'Manuel Bakiye Ayarla')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onAdjustSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
                {t('adjust.type', {}, 'İşlem Tipi')}
              </Label>
              <Select value={adjustType} onValueChange={(v) => setAdjustType(v as 'credit' | 'debit')}>
                <SelectTrigger className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-gm-border-soft bg-gm-bg-deep">
                  <SelectItem value="credit">Credit (+)</SelectItem>
                  <SelectItem value="debit">Debit (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
                {t('adjust.amount', {}, 'Tutar')}
              </Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                required
                className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
                {t('adjust.purpose', {}, 'Amaç')}
              </Label>
              <Input
                value={adjustPurpose}
                onChange={(e) => setAdjustPurpose(e.target.value)}
                placeholder="manual_topup, correction"
                required
                className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
                {t('adjust.description', {}, 'Açıklama (Opsiyonel)')}
              </Label>
              <Textarea
                value={adjustDesc}
                onChange={(e) => setAdjustDesc(e.target.value)}
                rows={3}
                className="rounded-2xl border-gm-border-soft bg-gm-surface/40"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAdjustOpen(false)} className="rounded-full border-gm-border-soft">
                {t('actions.cancel', {}, 'İptal')}
              </Button>
              <Button type="submit" disabled={adjustWalletState.isLoading} className="rounded-full px-6">
                {t('actions.save', {}, 'Kaydet')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={txOpen} onOpenChange={setTxOpen}>
        <DialogContent className="max-w-5xl rounded-[28px] border-gm-border-soft bg-gm-bg-deep">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-gm-text">
              {t('transactions.title', {}, 'Cüzdan İşlemleri')}
            </DialogTitle>
            {selectedWallet ? (
              <p className="text-xs text-gm-muted">{selectedWallet.full_name || selectedWallet.email || selectedWallet.id}</p>
            ) : null}
          </DialogHeader>

          <div className="overflow-hidden rounded-[24px] border border-gm-border-soft">
            <Table>
              <TableHeader className="bg-gm-surface/40">
                <TableRow className="border-gm-border-soft hover:bg-transparent">
                  <TableHead className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    {t('transactions.table.type', {}, 'Tip')}
                  </TableHead>
                  <TableHead className="py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    {t('transactions.table.amount', {}, 'Tutar')}
                  </TableHead>
                  <TableHead className="py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    {t('transactions.table.method', {}, 'Yöntem')}
                  </TableHead>
                  <TableHead className="py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    {t('transactions.table.status', {}, 'Durum')}
                  </TableHead>
                  <TableHead className="py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    {t('transactions.table.purpose', {}, 'Amaç')}
                  </TableHead>
                  <TableHead className="py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    {t('transactions.table.createdAt', {}, 'Tarih')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txQ.isFetching && (txQ.data?.data?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-16 text-center text-gm-muted">
                      <Loader2 className="mx-auto mb-3 size-6 animate-spin text-gm-gold" />
                      {t('state.loading', {}, 'Yükleniyor...')}
                    </TableCell>
                  </TableRow>
                ) : (txQ.data?.data?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-20 text-center font-serif italic text-gm-muted">
                      {t('transactions.empty', {}, 'Kayıt bulunamadı')}
                    </TableCell>
                  </TableRow>
                ) : (
                  (txQ.data?.data ?? []).map((tx) => (
                    <TableRow key={tx.id} className="border-gm-border-soft hover:bg-gm-primary/[0.03]">
                      <TableCell className="px-6 py-5">
                        <Badge variant="outline" className={cn('rounded-full px-3 py-1', tx.type === 'credit' ? 'border-emerald-500/30 text-emerald-600' : 'border-red-500/30 text-red-600')}>
                          {tx.type === 'credit' ? <ArrowUpCircle className="mr-1 inline size-3" /> : <ArrowDownCircle className="mr-1 inline size-3" />}
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5 font-serif text-lg text-gm-gold">{fmtMoney(tx.amount, tx.currency)}</TableCell>
                      <TableCell className="py-5 text-sm text-gm-muted">{methodLabel(tx.payment_method)}</TableCell>
                      <TableCell className="py-5">
                        <Badge variant="outline" className={cn('rounded-full px-3 py-1 font-bold uppercase tracking-wider', paymentStatusClass(tx.payment_status))}>
                          {tx.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5 text-sm text-gm-text">{tx.purpose || '-'}</TableCell>
                      <TableCell className="py-5 text-sm text-gm-muted">{fmtDate(tx.created_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
