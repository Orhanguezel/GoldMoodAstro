'use client';

import React, { useState } from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, TrendingUp, Loader2, X, Send } from 'lucide-react';
import { toast } from 'sonner';
import { extractApiError } from '@/integrations/shared';
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
  const [errors, setErrors] = useState<{ amount?: string; iban?: string }>({});

  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  if (isLoading) {
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

  const monthly = data?.this_month ?? { credits: 0, debits: 0, net: 0 };
  const balance = Number(wallet?.balance ?? 0);
  const currency = wallet?.currency || 'TRY';

  const validate = () => {
    const newErrors: { amount?: string; iban?: string } = {};
    const amt = Number(amount);

    if (!amount || isNaN(amt) || amt <= 0) {
      newErrors.amount = 'Geçerli bir tutar girin';
    } else if (amt > balance) {
      newErrors.amount = 'Yetersiz bakiye';
    }

    const cleanIban = iban.replace(/\s/g, '').toUpperCase();
    if (cleanIban && !/^TR\d{24}$/.test(cleanIban)) {
      newErrors.iban = 'Geçerli bir TR IBAN girin (26 hane)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleWithdraw = async () => {
    if (!validate()) return;
    try {
      await withdraw({
        amount: Number(amount),
        iban: iban.replace(/\s/g, '').toUpperCase() || undefined,
        notes: notes.trim() || undefined
      }).unwrap();
      toast.success('Para çekme talebiniz alındı');
      setShowModal(false);
      setAmount(''); setIban(''); setNotes(''); setErrors({});
      refetch();
    } catch (e: unknown) {
      toast.error(extractApiError(e, 'Talep oluşturulamadı'));
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
            onClick={() => { setShowModal(true); setErrors({}); }}
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
        <div className="px-5 py-3 border-b border-[var(--gm-border-soft)] flex items-center justify-between flex-wrap gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)]">
            Son İşlemler
          </span>
          <div className="flex items-center gap-3">
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
                  className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors"
                  title="Filtreyi Temizle"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                const headers = ['Tarih', 'Tür', 'İşlem', 'Tutar', 'Para Birimi', 'Durum', 'Açıklama'];
                const rows = transactions.map(t => [
                  t.created_at,
                  t.type,
                  PURPOSE_LABELS[t.purpose] || t.purpose,
                  t.amount,
                  t.currency || currency,
                  STATUS_LABELS[t.payment_status]?.label || t.payment_status,
                  t.description || ''
                ]);
                const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', `islemler_${new Date().toISOString().slice(0, 10)}.csv`);
                link.click();
              }}
              className="px-3 py-1 rounded-full border border-[var(--gm-border-soft)] text-[9px] font-bold uppercase tracking-widest text-[var(--gm-text-dim)] hover:text-[var(--gm-text)] hover:border-[var(--gm-gold)]/40 transition-all"
            >
              CSV İndir
            </button>
          </div>
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
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) setErrors({ ...errors, amount: undefined });
                  }}
                  max={balance}
                  className={`w-full h-11 bg-[var(--gm-bg-deep)] border rounded-xl px-4 text-base text-[var(--gm-text)] transition-colors ${
                    errors.amount ? 'border-rose-500/60 focus:border-rose-500' : 'border-[var(--gm-border-soft)] focus:border-[var(--gm-gold)]/50'
                  }`}
                  placeholder="0,00"
                />
                {errors.amount && <p className="mt-1.5 text-[10px] font-bold text-rose-400 uppercase tracking-widest">{errors.amount}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)] mb-2">IBAN</label>
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\s/g, '').toUpperCase();
                    // TR + 24 digits (total 26 chars)
                    if (raw.length > 26) return;
                    
                    // Add spaces every 4 characters for UX
                    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
                    setIban(formatted);
                    if (errors.iban) setErrors({ ...errors, iban: undefined });
                  }}
                  className={`w-full h-11 bg-[var(--gm-bg-deep)] border rounded-xl px-4 text-sm font-mono text-[var(--gm-text)] transition-all ${
                    errors.iban ? 'border-rose-500/60 focus:border-rose-500' : 'border-[var(--gm-border-soft)] focus:border-[var(--gm-gold)]/50'
                  }`}
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                />
                {errors.iban && <p className="mt-1.5 text-[10px] font-bold text-rose-400 uppercase tracking-widest">{errors.iban}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)] mb-2">Not (opsiyonel)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  maxLength={200}
                  className="w-full bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-xl p-3 text-sm text-[var(--gm-text)] resize-none outline-none focus:border-[var(--gm-gold)]/50"
                  placeholder="Opsiyonel not..."
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
