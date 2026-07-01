'use client';

import React, { useState } from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, TrendingUp, Loader2, X, Send, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { extractApiError } from '@/integrations/shared';
import {
  type ConsultantSelfWalletTransaction,
  type MonthlyEarningStat,
  useGetMyConsultantWalletQuery,
  useGetMyConsultantMonthlyStatsQuery,
  useGetMyConsultantProfileQuery,
  useListMyConsultantWithdrawalsQuery,
  useRequestMyConsultantWithdrawalMutation,
} from '@/integrations/rtk/private/consultant_self.endpoints';
import { useListSiteSettingsQuery } from '@/integrations/rtk/public/site_settings.endpoints';
import { useUiSection } from '@/i18n';

function formatMoney(v: string | number | null | undefined, currency = 'TRY') {
  const n = Number(v ?? 0);
  return `${n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function formatDate(iso?: string | null) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function getTooSoonDate(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const data = 'data' in error ? (error as { data?: unknown }).data : null;
  if (!data || typeof data !== 'object') return null;
  const next = 'next_request_at' in data ? (data as { next_request_at?: unknown }).next_request_at : null;
  return typeof next === 'string' && next ? next : null;
}


const PURPOSE_LABEL_KEYS: Record<string, { key: string; fallback: string }> = {
  withdrawal: { key: 'ui_consultantpanel_wallet_purpose_withdrawal', fallback: 'Withdrawal' },
  booking_payout: { key: 'ui_consultantpanel_wallet_purpose_booking_payout', fallback: 'Session income' },
  refund: { key: 'ui_consultantpanel_wallet_purpose_refund', fallback: 'Refund' },
  bonus: { key: 'ui_consultantpanel_wallet_purpose_bonus', fallback: 'Bonus' },
  adjustment: { key: 'ui_consultantpanel_wallet_purpose_adjustment', fallback: 'Adjustment' },
};

const STATUS_LABELS: Record<string, { key: string; fallback: string; cls: string }> = {
  completed: { key: 'ui_consultantpanel_wallet_status_completed', fallback: 'Completed', cls: 'bg-[var(--gm-success)]/15 text-[var(--gm-success)]' },
  pending: { key: 'ui_consultantpanel_wallet_status_pending', fallback: 'Pending', cls: 'bg-[var(--gm-warning)]/15 text-[var(--gm-warning)]' },
  failed: { key: 'ui_consultantpanel_wallet_status_failed', fallback: 'Failed', cls: 'bg-[var(--gm-error)]/15 text-[var(--gm-error)]' },
  refunded: { key: 'ui_consultantpanel_wallet_status_refunded', fallback: 'Refunded', cls: 'bg-[var(--gm-muted)]/15 text-[var(--gm-muted)]' },
};

function labelForPurpose(ui: (key: string, hardFallback?: string) => string, purpose: string) {
  const entry = PURPOSE_LABEL_KEYS[purpose];
  return entry ? ui(entry.key, entry.fallback) : purpose;
}

function labelForStatus(ui: (key: string, hardFallback?: string) => string, status: string) {
  const entry = STATUS_LABELS[status];
  return entry ? ui(entry.key, entry.fallback) : status;
}

export default function WalletPanel() {
  const { ui } = useUiSection('ui_consultantpanel');
  const { data, isLoading, refetch } = useGetMyConsultantWalletQuery();
  const { data: monthlyStats = [] } = useGetMyConsultantMonthlyStatsQuery();
  const { data: profile } = useGetMyConsultantProfileQuery();
  const { data: withdrawals = [] } = useListMyConsultantWithdrawalsQuery();
  const { data: settings = [], isLoading: isLoadingSettings } = useListSiteSettingsQuery({ keys: ['platform_commission_rate', 'payout_cycle'] });
  const commissionRateSetting = settings.find(s => s.key === 'platform_commission_rate');
  const commissionRate = commissionRateSetting ? ((commissionRateSetting.value as { percent?: number } | undefined)?.percent ?? null) : null;
  const payoutCycleSetting = settings.find(s => s.key === 'payout_cycle');
  const payoutCycle = payoutCycleSetting?.value as {
    mode?: string;
    interval_days?: number;
    min_threshold?: number;
    auto_request?: boolean;
    request_day?: number;
  } | undefined;
  
  const [withdraw, { isLoading: isWithdrawing }] = useRequestMyConsultantWithdrawalMutation();

  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ amount?: string }>({});

  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [txType, setTxType] = useState<'all' | 'credit' | 'debit'>('all');

  if (isLoading || isLoadingSettings) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-[var(--gm-gold)] animate-spin" />
      </div>
    );
  }

  const wallet = data?.wallet;
  let transactions: ConsultantSelfWalletTransaction[] = data?.transactions ?? [];

  // D34-12: Date filtering
  if (dateRange.start) {
    const s = new Date(dateRange.start).getTime();
    transactions = transactions.filter(t => new Date(t.created_at).getTime() >= s);
  }
  if (dateRange.end) {
    const e = new Date(dateRange.end).getTime() + 86400000; // include full day
    transactions = transactions.filter(t => new Date(t.created_at).getTime() <= e);
  }
  // C6: Type filtering
  if (txType === 'credit') {
    transactions = transactions.filter(t => t.type === 'credit' || Number(t.amount) > 0);
  } else if (txType === 'debit') {
    transactions = transactions.filter(t => t.type === 'debit' || Number(t.amount) < 0);
  }

  const monthly = data?.this_month ?? { credits: 0, debits: 0, net: 0 };
  const balance = Number(wallet?.balance ?? 0);
  const currency = wallet?.currency || 'TRY';
  const minWithdrawalAmount = Number(payoutCycle?.min_threshold ?? 100);
  const activeWithdrawals = withdrawals.filter((w) => ['approved', 'paid', 'pending'].includes(w.status));
  const lastWithdrawal = activeWithdrawals[0] ?? null;
  const nextWithdrawalAt = lastWithdrawal?.requested_at && payoutCycle?.interval_days
    ? new Date(new Date(lastWithdrawal.requested_at).getTime() + Number(payoutCycle.interval_days) * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const validate = () => {
    const newErrors: { amount?: string } = {};
    const amt = Number(amount);

    if (!amount || isNaN(amt) || amt <= 0) {
      newErrors.amount = ui('ui_consultantpanel_wallet_enterValidAmount', 'Enter a valid amount');
    } else if (amt < minWithdrawalAmount) {
      newErrors.amount = `${ui('ui_consultantpanel_wallet_minWithdrawalLimit', 'Minimum withdrawal limit')} ${formatMoney(minWithdrawalAmount, currency)}.`;
    } else if (amt > balance) {
      newErrors.amount = ui('ui_consultantpanel_wallet_insufficientBalance', 'Insufficient balance');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleWithdraw = async () => {
    if (!validate()) return;
    try {
      await withdraw({
        amount: Number(amount),
        notes: notes.trim() || undefined
      }).unwrap();
      toast.success(ui('ui_consultantpanel_wallet_withdrawalReceived', 'Your withdrawal request has been received'));
      setShowModal(false);
      setAmount(''); setNotes(''); setErrors({});
      refetch();
    } catch (e: unknown) {
      const next = getTooSoonDate(e);
      if (next) {
        toast.error(`${ui('ui_consultantpanel_wallet_alreadyRequestedThisMonth', 'You have already requested a payout this month. Next request opens:')} ${formatDate(next)}`);
        return;
      }
      toast.error(extractApiError(e, ui('ui_consultantpanel_wallet_requestFailed', 'Request could not be created')));
    }
  };

  return (
    <div className="space-y-6">
      {/* Big balance card */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[var(--gm-gold)]/15 via-[var(--gm-gold)]/5 to-transparent border border-[var(--gm-gold)]/30 p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--gm-gold)]/10 blur-[80px] rounded-full -mr-20 -mt-20" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-[var(--gm-gold)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)]">
                {ui('ui_consultantpanel_wallet_currentBalance', 'Current balance')}
              </span>
            </div>
            <div className="font-serif text-5xl text-[var(--gm-gold)] mb-2">{formatMoney(balance, currency)}</div>
            {wallet?.pending_balance && Number(wallet.pending_balance) > 0 && (
              <p className="text-[12px] text-[var(--gm-text-dim)] italic mb-4">
                {ui('ui_consultantpanel_wallet_pendingLabel', 'Pending:')} {formatMoney(wallet.pending_balance, currency)} {ui('ui_consultantpanel_wallet_pendingNote', '(not yet credited)')}
              </p>
            )}
            
            {commissionRate !== null && (
              <div className="mt-6 p-3 rounded-xl bg-[var(--gm-bg-deep)]/50 border border-[var(--gm-border-soft)] max-w-sm">
                <p className="text-[10px] text-[var(--gm-text-dim)] leading-relaxed">
                  <strong className="text-[var(--gm-gold)] uppercase tracking-widest block mb-1">{ui('ui_consultantpanel_wallet_commissionRateLabel', 'Commission rate:')} %{commissionRate}</strong>
                  {ui('ui_consultantpanel_wallet_commissionExplainPre', 'Of the service fee,')} %{commissionRate}{ui('ui_consultantpanel_wallet_commissionExplainPost', ' is deducted by the platform, and the remaining amount is added to your wallet.')}
                </p>
              </div>
            )}

            {payoutCycle?.mode === 'monthly' && (
              <div className="mt-3 p-3 rounded-xl bg-[var(--gm-bg-deep)]/50 border border-[var(--gm-border-soft)] max-w-sm">
                <p className="text-[10px] text-[var(--gm-text-dim)] leading-relaxed">
                  <strong className="text-[var(--gm-gold)] uppercase tracking-widest block mb-1">{ui('ui_consultantpanel_wallet_monthlyPayoutCycle', 'Monthly payout cycle')}</strong>
                  {ui('ui_consultantpanel_wallet_monthlyPayoutHint', 'You can open one withdrawal request per month to access your balance.')}
                  {lastWithdrawal ? <> {ui('ui_consultantpanel_wallet_lastRequestLabel', 'Your last request:')} {formatDate(lastWithdrawal.requested_at)}.</> : <> {ui('ui_consultantpanel_wallet_noRequestYet', 'You have no payout requests yet.')}</>}
                  {nextWithdrawalAt ? <> {ui('ui_consultantpanel_wallet_nextRequestOpens', 'Next request opens:')} {formatDate(nextWithdrawalAt)}.</> : <> {ui('ui_consultantpanel_wallet_requestDayPre', 'Request day: the')} {payoutCycle.request_day || 1}{ui('ui_consultantpanel_wallet_requestDayPost', ' day of each month.')}</>}
                  {typeof payoutCycle.min_threshold === 'number' && (
                    <> {ui('ui_consultantpanel_wallet_minWithdrawalAmountLabel', 'Minimum withdrawal amount:')} {formatMoney(payoutCycle.min_threshold, currency)}.</>
                  )}
                </p>
              </div>
            )}
          </div>
          <div className="relative group flex items-center justify-center">
            <button
              onClick={() => { setShowModal(true); setErrors({}); }}
              disabled={balance < minWithdrawalAmount || profile?.kyc_status !== 'approved'}
              className="px-6 py-3 rounded-full bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 inline-flex items-center gap-2 hover:shadow-[0_0_30px_rgba(201,169,97,0.25)] transition-all"
            >
              <ArrowDownCircle className="w-4 h-4" />
              {ui('ui_consultantpanel_wallet_withdraw', 'Withdraw')}
            </button>
            {profile?.kyc_status !== 'approved' && (
              <div className="absolute bottom-full mb-2 hidden group-hover:block w-[200px] bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] p-2 rounded shadow-lg text-[10px] text-center text-[var(--gm-text)] z-10">
                {ui('ui_consultantpanel_wallet_kycRequired', 'To withdraw funds, complete identity verification (KYC) in the Profile tab.')}
              </div>
            )}
            {profile?.kyc_status === 'approved' && balance < minWithdrawalAmount && (
              <div className="absolute bottom-full mb-2 hidden group-hover:block w-[150px] bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] p-2 rounded shadow-lg text-[10px] text-center text-[var(--gm-text)] z-10">
                {ui('ui_consultantpanel_wallet_minLimitLabel', 'Minimum limit:')} {formatMoney(minWithdrawalAmount, currency)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)]">{ui('ui_consultantpanel_wallet_incomingThisMonth', 'Earned this month')}</span>
            <ArrowUpCircle className="w-4 h-4 text-[var(--gm-success)]" />
          </div>
          <div className="font-serif text-2xl text-[var(--gm-text)]">{formatMoney(monthly.credits, currency)}</div>
        </div>
        <div className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)]">{ui('ui_consultantpanel_wallet_withdrawnThisMonth', 'Withdrawn this month')}</span>
            <ArrowDownCircle className="w-4 h-4 text-[var(--gm-error)]" />
          </div>
          <div className="font-serif text-2xl text-[var(--gm-text)]">{formatMoney(monthly.debits, currency)}</div>
        </div>
        <div className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)]">{ui('ui_consultantpanel_wallet_net30Days', 'Net (30 days)')}</span>
            <TrendingUp className="w-4 h-4 text-[var(--gm-gold)]" />
          </div>
          <div className={`font-serif text-2xl ${monthly.net >= 0 ? 'text-[var(--gm-text)]' : 'text-[var(--gm-error)]'}`}>
            {monthly.net >= 0 ? '+' : ''}{formatMoney(monthly.net, currency)}
          </div>
        </div>
      </div>

      {/* C5: Monthly earnings */}
      {monthlyStats.length > 0 && (
        <MonthlyEarningsChart data={monthlyStats} currency={currency} />
      )}

      {/* Transactions */}
      <div className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30 overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--gm-border-soft)] flex items-center justify-between flex-wrap gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)]">
            {ui('ui_consultantpanel_wallet_recentTransactions', 'Recent transactions')}
          </span>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1 p-0.5 rounded-lg bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)]">
              {(['all', 'credit', 'debit'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTxType(type)}
                  className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
                    txType === type
                      ? type === 'credit'
                        ? 'bg-[var(--gm-success)]/20 text-[var(--gm-success)]'
                        : type === 'debit'
                        ? 'bg-[var(--gm-error)]/20 text-[var(--gm-error)]'
                        : 'bg-[var(--gm-gold)] text-[var(--gm-bg-deep)]'
                      : 'text-[var(--gm-text)] opacity-40 hover:opacity-70'
                  }`}
                >
                  {type === 'all' ? ui('ui_consultantpanel_wallet_filterAll', 'All') : type === 'credit' ? ui('ui_consultantpanel_wallet_filterIncome', 'Income') : ui('ui_consultantpanel_wallet_filterExpense', 'Expense')}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="h-8 bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-lg px-2 text-[10px] text-[var(--gm-text)] outline-none focus:border-[var(--gm-gold)]/40"
              />
              <span className="text-[var(--gm-muted)] text-[10px]">—</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="h-8 bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-lg px-2 text-[10px] text-[var(--gm-text)] outline-none focus:border-[var(--gm-gold)]/40"
              />
              {(dateRange.start || dateRange.end) && (
                <button 
                  onClick={() => setDateRange({ start: '', end: '' })}
                  className="p-1.5 text-[var(--gm-error)] hover:bg-[var(--gm-error)]/10 rounded-full transition-colors"
                  title={ui('ui_consultantpanel_wallet_clearFilter', 'Clear filter')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                const headers = [
                  ui('ui_consultantpanel_wallet_csvDate', 'Date'),
                  ui('ui_consultantpanel_wallet_csvType', 'Type'),
                  ui('ui_consultantpanel_wallet_csvTransaction', 'Transaction'),
                  ui('ui_consultantpanel_wallet_csvAmount', 'Amount'),
                  ui('ui_consultantpanel_wallet_csvCurrency', 'Currency'),
                  ui('ui_consultantpanel_wallet_csvStatus', 'Status'),
                  ui('ui_consultantpanel_wallet_csvDescription', 'Description'),
                ];
                const rows = transactions.map(t => [
                  t.created_at,
                  t.type,
                  labelForPurpose(ui, t.purpose),
                  t.amount,
                  t.currency || currency,
                  labelForStatus(ui, t.payment_status),
                  t.description || ''
                ]);
                const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', `transactions_${new Date().toISOString().slice(0, 10)}.csv`);
                link.click();
              }}
              className="px-3 py-1 rounded-full border border-[var(--gm-border-soft)] text-[9px] font-bold uppercase tracking-widest text-[var(--gm-text-dim)] hover:text-[var(--gm-text)] hover:border-[var(--gm-gold)]/40 transition-all"
            >
              {ui('ui_consultantpanel_wallet_csvDownload', 'Download CSV')}
            </button>
          </div>
        </div>
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-[var(--gm-muted)] font-serif italic">
            {ui('ui_consultantpanel_wallet_noTransactions', 'No transactions yet. Earnings will appear here after your first completed session.')}
          </div>
        ) : (
          <div className="divide-y divide-[var(--gm-border-soft)]">
            {transactions.map((t) => {
              const isCredit = t.type === 'credit';
              const stat = STATUS_LABELS[t.payment_status] || { key: '', fallback: t.payment_status, cls: 'bg-[var(--gm-muted)]/15 text-[var(--gm-muted)]' };
              return (
                <div key={t.id} className="flex items-center gap-4 p-4 hover:bg-[var(--gm-gold)]/5 transition-colors">
                  <span
                    className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      isCredit ? 'bg-[var(--gm-success)]/15 text-[var(--gm-success)]' : 'bg-[var(--gm-error)]/15 text-[var(--gm-error)]'
                    }`}
                  >
                    {isCredit ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-serif text-sm text-[var(--gm-text)] truncate">
                        {labelForPurpose(ui, t.purpose)}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${stat.cls}`}>
                        {stat.key ? ui(stat.key, stat.fallback) : stat.fallback}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--gm-text-dim)]">
                      {formatDate(t.created_at)}
                      {t.description && <span className="ml-2 italic">- {t.description}</span>}
                    </div>
                  </div>
                  <div className={`font-serif text-base shrink-0 ${isCredit ? 'text-[var(--gm-success)]' : 'text-[var(--gm-error)]'}`}>
                    {isCredit ? '+' : '−'}{formatMoney(t.amount, t.currency || currency)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Withdraw modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[var(--gm-bg-deep)]/60 backdrop-blur-sm"
          onClick={() => !isWithdrawing && setShowModal(false)}
        >
          <div
            className="w-full max-w-[var(--gm-w-form)] bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-[var(--gm-border-soft)]">
              <h3 className="font-serif text-lg text-[var(--gm-text)]">{ui('ui_consultantpanel_wallet_withdrawalRequestTitle', 'Withdrawal request')}</h3>
              <button onClick={() => setShowModal(false)} disabled={isWithdrawing} className="p-1 text-[var(--gm-muted)] hover:text-[var(--gm-text)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-[11px] text-[var(--gm-text-dim)] bg-[var(--gm-bg-deep)]/50 rounded-xl p-3">
                {ui('ui_consultantpanel_wallet_currentBalanceLabel', 'Current balance:')} <strong className="text-[var(--gm-gold)]">{formatMoney(balance, currency)}</strong>
              </div>
              <div className="text-[11px] text-[var(--gm-text-dim)] bg-[var(--gm-gold)]/10 border border-[var(--gm-gold)]/20 rounded-xl p-3">
                {ui('ui_consultantpanel_wallet_bankInfoNote', 'Payment will be sent to the bank account saved in your profile. To change your IBAN, update the bank details in the Profile tab.')}
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)] mb-2">{ui('ui_consultantpanel_wallet_amountLabel', 'Amount')} ({currency})</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) setErrors({ ...errors, amount: undefined });
                  }}
                  max={balance}
                  className={`w-full h-11 bg-[var(--gm-bg-deep)] border rounded-xl px-4 text-base text-[var(--gm-text)] transition-colors ${
                    errors.amount ? 'border-[var(--gm-error)]/60 focus:border-[var(--gm-error)]' : 'border-[var(--gm-border-soft)] focus:border-[var(--gm-gold)]/50'
                  }`}
                  placeholder={ui('ui_consultantpanel_wallet_amountPlaceholder', '0,00')}
                />
                {errors.amount && <p className="mt-1.5 text-[10px] font-bold text-[var(--gm-error)] uppercase tracking-widest">{errors.amount}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)] mb-2">{ui('ui_consultantpanel_wallet_noteLabel', 'Note (optional)')}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  maxLength={200}
                  className="w-full bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-xl p-3 text-sm text-[var(--gm-text)] resize-none outline-none focus:border-[var(--gm-gold)]/50"
                  placeholder={ui('ui_consultantpanel_wallet_notePlaceholder', 'Optional note...')}
                />
              </div>
              <p className="text-[10px] text-[var(--gm-muted)] italic">
                {ui('ui_consultantpanel_wallet_adminApprovalNote', '* Your request will be credited after admin approval.')}
              </p>
            </div>
            <div className="px-5 pb-5 flex gap-2 justify-end">
              <button
                onClick={() => setShowModal(false)}
                disabled={isWithdrawing}
                className="px-5 py-2.5 rounded-full border border-[var(--gm-border-soft)] text-[10px] font-bold uppercase tracking-widest"
              >
                {ui('ui_consultantpanel_wallet_cancel', 'Cancel')}
              </button>
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing || !amount}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
              >
                {isWithdrawing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {ui('ui_consultantpanel_wallet_createRequest', 'Create request')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MonthlyEarningsChart({ data, currency }: { data: MonthlyEarningStat[]; currency: string }) {
  const { ui } = useUiSection('ui_consultantpanel');
  const [hovered, setHovered] = useState<number | null>(null);
  // Show last 12 months max for readability
  const shown = data.slice(-12);
  const maxEarnings = Math.max(1, ...shown.map((d) => d.earnings));

  function monthLabel(ym: string) {
    const [y, m] = ym.split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
  }

  return (
    <div className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30 p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-4 h-4 text-[var(--gm-gold)]" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)]">
          {ui('ui_consultantpanel_wallet_monthlyEarnings', 'Monthly earnings')}
        </span>
        <span className="text-[10px] text-[var(--gm-muted)] ml-auto">{ui('ui_consultantpanel_wallet_lastNMonthsPre', 'Last')} {shown.length} {ui('ui_consultantpanel_wallet_lastNMonthsPost', 'months')}</span>
      </div>
      <div className="flex items-end gap-1.5 h-32">
        {shown.map((d, i) => {
          const heightPct = (d.earnings / maxEarnings) * 100;
          const isHov = hovered === i;
          return (
            <div
              key={d.year_month}
              className="flex-1 flex flex-col items-center justify-end gap-1 group cursor-default"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {isHov && (
                <div className="absolute -translate-y-full mb-1 bg-[var(--gm-surface)] border border-[var(--gm-gold)]/30 rounded-xl px-3 py-2 text-[10px] text-[var(--gm-text)] whitespace-nowrap z-10 shadow-lg">
                  <strong className="text-[var(--gm-gold)]">{formatMoney(d.earnings, currency)}</strong>
                  <br />{d.sessions} {ui('ui_consultantpanel_wallet_sessions', 'sessions')}
                </div>
              )}
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: `${Math.max(3, heightPct)}%`,
                  minHeight: 4,
                  background: isHov
                    ? 'var(--gm-gold)'
                    : `color-mix(in srgb, var(--gm-gold) 60%, transparent)`,
                }}
              />
              <span className="text-[8px] text-[var(--gm-muted)] truncate w-full text-center" style={{ fontSize: 7 }}>
                {monthLabel(d.year_month)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
