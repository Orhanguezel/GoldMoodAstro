'use client';

import React, { useState } from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, TrendingUp, Loader2, X, Send } from 'lucide-react';
import { toast } from 'sonner';
import {
  type ConsultantSelfWalletTransaction,
  useGetMyConsultantWalletQuery,
  useRequestMyConsultantWithdrawalMutation,
} from '@/integrations/rtk/private/consultant_self.endpoints';

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

function getErrorMessage(error: unknown) {
  if (typeof error !== 'object' || error === null) return 'Talep oluşturulamadı';
  const data = 'data' in error ? (error as { data?: unknown }).data : undefined;
  if (typeof data !== 'object' || data === null) return 'Talep oluşturulamadı';
  const apiError = 'error' in data ? (data as { error?: unknown }).error : undefined;
  if (typeof apiError === 'object' && apiError !== null && 'message' in apiError) {
    const message = (apiError as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return 'Talep oluşturulamadı';
}

const PURPOSE_LABELS: Record<string, string> = {
  withdrawal: 'Para Çekme',
  booking_payout: 'Seans Geliri',
  refund: 'İade',
  bonus: 'Bonus',
  adjustment: 'Düzeltme',
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  completed: { label: 'Tamamlandı', cls: 'bg-[var(--gm-success)]/15 text-[var(--gm-success)]' },
  pending: { label: 'Bekliyor', cls: 'bg-amber-500/15 text-amber-400' },
  failed: { label: 'Başarısız', cls: 'bg-rose-500/15 text-rose-400' },
  refunded: { label: 'İade', cls: 'bg-[var(--gm-muted)]/15 text-[var(--gm-muted)]' },
};

export default function WalletPanel() {
  const { data, isLoading, refetch } = useGetMyConsultantWalletQuery();
  const [withdraw, { isLoading: isWithdrawing }] = useRequestMyConsultantWithdrawalMutation();

  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [iban, setIban] = useState('');
  const [notes, setNotes] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-[var(--gm-gold)] animate-spin" />
      </div>
    );
  }

  const wallet = data?.wallet;
  const transactions: ConsultantSelfWalletTransaction[] = data?.transactions ?? [];
  const monthly = data?.this_month ?? { credits: 0, debits: 0, net: 0 };
  const balance = Number(wallet?.balance ?? 0);
  const currency = wallet?.currency || 'TRY';

  const handleWithdraw = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error('Geçerli bir tutar girin');
      return;
    }
    if (amt > balance) {
      toast.error('Yetersiz bakiye');
      return;
    }
    try {
      await withdraw({ amount: amt, iban: iban.trim() || undefined, notes: notes.trim() || undefined }).unwrap();
      toast.success('Para çekme talebiniz alındı');
      setShowModal(false);
      setAmount(''); setIban(''); setNotes('');
      refetch();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e));
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
                Mevcut Bakiye
              </span>
            </div>
            <div className="font-serif text-5xl text-[var(--gm-gold)] mb-2">{formatMoney(balance, currency)}</div>
            {wallet?.pending_balance && Number(wallet.pending_balance) > 0 && (
              <p className="text-[12px] text-[var(--gm-text-dim)] italic">
                Bekleyen: {formatMoney(wallet.pending_balance, currency)} (henüz hesaba geçmedi)
              </p>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            disabled={balance <= 0}
            className="px-6 py-3 rounded-full bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 inline-flex items-center gap-2 hover:shadow-[0_0_30px_rgba(201,169,97,0.25)] transition-all"
          >
            <ArrowDownCircle className="w-4 h-4" />
            Para Çek
          </button>
        </div>
      </div>

      {/* Monthly stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)]">Bu Ay Gelen</span>
            <ArrowUpCircle className="w-4 h-4 text-[var(--gm-success)]" />
          </div>
          <div className="font-serif text-2xl text-[var(--gm-text)]">{formatMoney(monthly.credits, currency)}</div>
        </div>
        <div className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)]">Bu Ay Çekilen</span>
            <ArrowDownCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="font-serif text-2xl text-[var(--gm-text)]">{formatMoney(monthly.debits, currency)}</div>
        </div>
        <div className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)]">Net (30 gün)</span>
            <TrendingUp className="w-4 h-4 text-[var(--gm-gold)]" />
          </div>
          <div className={`font-serif text-2xl ${monthly.net >= 0 ? 'text-[var(--gm-text)]' : 'text-rose-400'}`}>
            {monthly.net >= 0 ? '+' : ''}{formatMoney(monthly.net, currency)}
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30 overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--gm-border-soft)]">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)]">
            Son İşlemler
          </span>
        </div>
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-[var(--gm-muted)] font-serif italic">
            Henüz işlem yok. İlk seansınızı tamamladığınızda kazanç burada görünecek.
          </div>
        ) : (
          <div className="divide-y divide-[var(--gm-border-soft)]">
            {transactions.map((t) => {
              const isCredit = t.type === 'credit';
              const stat = STATUS_LABELS[t.payment_status] || { label: t.payment_status, cls: 'bg-[var(--gm-muted)]/15 text-[var(--gm-muted)]' };
              return (
                <div key={t.id} className="flex items-center gap-4 p-4 hover:bg-[var(--gm-gold)]/5 transition-colors">
                  <span
                    className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      isCredit ? 'bg-[var(--gm-success)]/15 text-[var(--gm-success)]' : 'bg-rose-500/15 text-rose-400'
                    }`}
                  >
                    {isCredit ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-serif text-sm text-[var(--gm-text)] truncate">
                        {PURPOSE_LABELS[t.purpose] || t.purpose}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${stat.cls}`}>
                        {stat.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--gm-text-dim)]">
                      {formatDate(t.created_at)}
                      {t.description && <span className="ml-2 italic">- {t.description}</span>}
                    </div>
                  </div>
                  <div className={`font-serif text-base shrink-0 ${isCredit ? 'text-[var(--gm-success)]' : 'text-rose-400'}`}>
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
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => !isWithdrawing && setShowModal(false)}
        >
          <div
            className="w-full max-w-md bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-[var(--gm-border-soft)]">
              <h3 className="font-serif text-lg text-[var(--gm-text)]">Para Çekme Talebi</h3>
              <button onClick={() => setShowModal(false)} disabled={isWithdrawing} className="p-1 text-[var(--gm-muted)] hover:text-[var(--gm-text)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-[11px] text-[var(--gm-text-dim)] bg-[var(--gm-bg-deep)]/50 rounded-xl p-3">
                Mevcut bakiye: <strong className="text-[var(--gm-gold)]">{formatMoney(balance, currency)}</strong>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)] mb-2">Tutar ({currency})</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  max={balance}
                  className="w-full h-11 bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-xl px-4 text-base text-[var(--gm-text)]"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)] mb-2">IBAN (opsiyonel)</label>
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value.toUpperCase())}
                  className="w-full h-11 bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-xl px-4 text-sm font-mono text-[var(--gm-text)]"
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)] mb-2">Not (opsiyonel)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-xl p-3 text-sm text-[var(--gm-text)] resize-none"
                />
              </div>
              <p className="text-[10px] text-[var(--gm-muted)] italic">
                * Talebiniz admin onayından geçtikten sonra hesabınıza geçecektir.
              </p>
            </div>
            <div className="px-5 pb-5 flex gap-2 justify-end">
              <button
                onClick={() => setShowModal(false)}
                disabled={isWithdrawing}
                className="px-5 py-2.5 rounded-full border border-[var(--gm-border-soft)] text-[10px] font-bold uppercase tracking-widest"
              >
                Vazgeç
              </button>
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing || !amount}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
              >
                {isWithdrawing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Talep Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
