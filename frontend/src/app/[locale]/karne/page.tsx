'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Sparkles,
  Star,
  HelpCircle,
  Calendar,
} from 'lucide-react';

import { useAuthStore } from '@/features/auth/auth.store';
import { localizePath, normalizeError } from '@/integrations/shared';
import {
  useListMyPendingOutcomesQuery,
  useSubmitReviewOutcomeMutation,
  type PendingOutcomeDto,
  type ReviewOutcomeResponse,
} from '@/integrations/rtk/hooks';

const RESPONSE_OPTIONS: Array<{
  value: ReviewOutcomeResponse;
  icon: React.ReactNode;
  labelTr: string;
  labelEn: string;
  color: string;
}> = [
  {
    value: 'happened',
    icon: <CheckCircle2 size={18} />,
    labelTr: 'Evet, gerçekleşti',
    labelEn: 'Yes, it happened',
    color: 'text-emerald-500 border-emerald-500/40 hover:bg-emerald-500/10',
  },
  {
    value: 'partially',
    icon: <Sparkles size={18} />,
    labelTr: 'Kısmen gerçekleşti',
    labelEn: 'Partially happened',
    color: 'text-amber-500 border-amber-500/40 hover:bg-amber-500/10',
  },
  {
    value: 'did_not_happen',
    icon: <XCircle size={18} />,
    labelTr: 'Gerçekleşmedi',
    labelEn: 'Did not happen',
    color: 'text-rose-500 border-rose-500/40 hover:bg-rose-500/10',
  },
  {
    value: 'no_answer',
    icon: <HelpCircle size={18} />,
    labelTr: 'Cevap vermek istemiyorum',
    labelEn: "I'd rather not answer",
    color: 'text-(--gm-muted) border-(--gm-border-soft) hover:bg-(--gm-bg-deep)',
  },
];

function fmtDate(v: string | null, locale: string) {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function PendingCard({
  outcome,
  locale,
  onSubmitted,
}: {
  outcome: PendingOutcomeDto;
  locale: string;
  onSubmitted: () => void;
}) {
  const isTr = locale === 'tr';
  const [selected, setSelected] = useState<ReviewOutcomeResponse | null>(null);
  const [notes, setNotes] = useState('');
  const [submit, { isLoading }] = useSubmitReviewOutcomeMutation();

  async function handleSubmit() {
    if (!selected) {
      toast.error(isTr ? 'Lütfen bir cevap seçin' : 'Please select a response');
      return;
    }
    try {
      await submit({
        reviewId: outcome.review_id,
        user_response: selected,
        notes: notes.trim() || undefined,
      }).unwrap();
      toast.success(isTr ? 'Cevabınız kaydedildi. Teşekkürler!' : 'Response saved. Thanks!');
      onSubmitted();
    } catch (err) {
      toast.error(normalizeError(err).message || (isTr ? 'Kaydedilemedi' : 'Failed to save'));
    }
  }

  const consultantName = outcome.consultant_name || (isTr ? 'Astrolog' : 'Consultant');
  const consultantHref = outcome.consultant_slug
    ? localizePath(locale, `/consultants/${outcome.consultant_slug}`)
    : localizePath(locale, '/consultants');

  return (
    <article className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-8 space-y-6">
      <header className="flex items-start gap-5">
        {outcome.consultant_avatar ? (
          <img
            src={outcome.consultant_avatar}
            alt={consultantName}
            className="w-16 h-16 rounded-full object-cover border border-(--gm-gold)/30"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-(--gm-gold)/10 border border-(--gm-gold)/30 flex items-center justify-center text-(--gm-gold-deep) font-display text-lg">
            {consultantName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <div className="font-display text-[10px] tracking-[0.32em] text-(--gm-gold-deep) uppercase mb-1">
            {isTr ? '6 ay önce yorum aldın' : 'Reading received 6 months ago'}
          </div>
          <h3 className="font-serif text-xl text-(--gm-text)">
            <Link href={consultantHref} className="hover:text-(--gm-gold) transition-colors">
              {consultantName}
            </Link>
          </h3>
          <div className="flex items-center gap-4 mt-2 text-xs text-(--gm-text-dim)">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={12} />
              {fmtDate(outcome.review_created_at, locale)}
            </span>
            {typeof outcome.review_rating === 'number' && (
              <span className="inline-flex items-center gap-1">
                <Star size={12} className="fill-(--gm-gold) text-(--gm-gold)" />
                {outcome.review_rating}/5
              </span>
            )}
          </div>
        </div>
      </header>

      <div>
        <p className="font-serif text-lg text-(--gm-text) leading-relaxed">
          {isTr
            ? `${consultantName} sana yaptığı yorumda öngörülerde bulundu. Aradan 6 ay geçti — bu öngörüler ne kadar doğru çıktı?`
            : `${consultantName} shared predictions with you. 6 months have passed — how accurate did they turn out?`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {RESPONSE_OPTIONS.map((opt) => {
          const active = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              className={`flex items-center gap-3 rounded-xl border-2 px-5 py-4 text-sm transition-all ${opt.color} ${
                active
                  ? 'bg-(--gm-bg-deep) shadow-card'
                  : 'border-(--gm-border-soft) text-(--gm-text-dim)'
              }`}
            >
              {opt.icon}
              <span className="font-medium">{isTr ? opt.labelTr : opt.labelEn}</span>
            </button>
          );
        })}
      </div>

      {selected && selected !== 'no_answer' && (
        <div>
          <label className="block text-[10px] font-bold text-(--gm-gold-deep) tracking-[0.2em] uppercase mb-2">
            {isTr ? 'Notların (opsiyonel)' : 'Notes (optional)'}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full bg-(--gm-bg-deep) border border-(--gm-border-soft) rounded-xl px-5 py-3.5 text-sm text-(--gm-text) placeholder:text-(--gm-muted) focus:border-(--gm-gold)/50 outline-none resize-y"
            placeholder={
              isTr
                ? 'Detaylar geri besleme için bizim için değerli (gizli kalacak)…'
                : 'Details help us improve (kept private)…'
            }
          />
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selected || isLoading}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-(--gm-gold) text-(--gm-bg) text-sm font-bold uppercase tracking-[0.18em] disabled:opacity-50 hover:bg-(--gm-gold-light) transition-colors"
        >
          {isLoading ? (isTr ? 'Kaydediliyor…' : 'Saving…') : isTr ? 'Cevapla' : 'Submit'}
        </button>
      </div>
    </article>
  );
}

export default function KarnePage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'tr';
  const isTr = locale === 'tr';

  const { isAuthenticated, isReady } = useAuthStore();
  const { data: pending, isLoading, refetch } = useListMyPendingOutcomesQuery(undefined, {
    skip: !isAuthenticated,
  });

  React.useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace(`/${locale}/login?next=/${locale}/karne`);
    }
  }, [isReady, isAuthenticated, locale, router]);

  if (!isReady || !isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-(--gm-bg)">
        <p className="text-(--gm-muted) text-sm">{isTr ? 'Yükleniyor…' : 'Loading…'}</p>
      </main>
    );
  }

  const items = pending ?? [];

  return (
    <main className="min-h-screen bg-(--gm-bg) pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-6 pt-12">
        <Link
          href={localizePath(locale, '/dashboard')}
          className="inline-flex items-center gap-2 text-xs text-(--gm-text-dim) hover:text-(--gm-gold) tracking-[0.18em] uppercase mb-8"
        >
          <ArrowLeft size={14} />
          {isTr ? 'Panele dön' : 'Back to dashboard'}
        </Link>

        <header className="mb-12">
          <div className="font-display text-[11px] tracking-[0.32em] text-(--gm-gold-deep) uppercase mb-3">
            {isTr ? 'Astrolog Karnesi' : 'Astrologer Report Card'}
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-(--gm-text) leading-tight mb-4">
            {isTr ? 'Yorumların gerçekleşti mi?' : 'Did the predictions come true?'}
          </h1>
          <p className="text-(--gm-text-dim) leading-relaxed font-light">
            {isTr
              ? 'Aldığın yorumlardan 6 ay sonra geri besleme topluyoruz. Cevapların astrologların karnesini şekillendiriyor — başka kullanıcılar onları seçerken bu skorları görüyor.'
              : 'We collect feedback 6 months after each reading. Your responses build the astrologer report card — visible to others when they choose a consultant.'}
          </p>
        </header>

        {isLoading ? (
          <div className="text-center py-16 text-(--gm-muted) text-sm">
            {isTr ? 'Yükleniyor…' : 'Loading…'}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-12 text-center">
            <Sparkles className="mx-auto text-(--gm-gold-deep) mb-4" size={32} strokeWidth={1.4} />
            <h2 className="font-serif text-2xl text-(--gm-text) mb-3">
              {isTr ? 'Şimdilik bekleyen bir karne yok' : 'No pending feedback right now'}
            </h2>
            <p className="text-(--gm-text-dim) text-sm leading-relaxed max-w-md mx-auto">
              {isTr
                ? 'Bir astrologdan yorum aldıktan 6 ay sonra burada karne sorularını görürsün. Cevapların hem astrologlara hem de diğer kullanıcılara yardımcı olur.'
                : 'Six months after a reading, you will see report card questions here. Your answers help both consultants and other users.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((o) => (
              <PendingCard key={o.id} outcome={o} locale={locale} onSubmitted={refetch} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
