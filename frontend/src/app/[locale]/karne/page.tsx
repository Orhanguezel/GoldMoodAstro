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
import { useUiSection } from '@/i18n';
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
    labelTr: 'Yes, it happened',
    labelEn: 'Yes, it happened',
    color: 'text-[var(--gm-success)] border-[var(--gm-success)]/40 hover:bg-[var(--gm-success)]/10',
  },
  {
    value: 'partially',
    icon: <Sparkles size={18} />,
    labelTr: 'Partially happened',
    labelEn: 'Partially happened',
    color: 'text-[var(--gm-warning)] border-[var(--gm-warning)]/40 hover:bg-[var(--gm-warning)]/10',
  },
  {
    value: 'did_not_happen',
    icon: <XCircle size={18} />,
    labelTr: 'Did not happen',
    labelEn: 'Did not happen',
    color: 'text-[var(--gm-error)] border-[var(--gm-error)]/40 hover:bg-[var(--gm-error)]/10',
  },
  {
    value: 'no_answer',
    icon: <HelpCircle size={18} />,
    labelTr: "I'd rather not answer",
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
  const { ui } = useUiSection('ui_extra' as any, locale as any);
  const [selected, setSelected] = useState<ReviewOutcomeResponse | null>(null);
  const [notes, setNotes] = useState('');
  const [submit, { isLoading }] = useSubmitReviewOutcomeMutation();

  async function handleSubmit() {
    if (!selected) {
      toast.error(ui('ui_extra_b1_select_response', 'Please select a response'));
      return;
    }
    try {
      await submit({
        reviewId: outcome.review_id,
        user_response: selected,
        notes: notes.trim() || undefined,
      }).unwrap();
      toast.success(ui('ui_extra_b1_response_saved', 'Your response has been saved. Thank you!'));
      onSubmitted();
    } catch (err) {
      toast.error(normalizeError(err).message || ui('ui_extra_b1_save_failed', 'Could not save'));
    }
  }

  const consultantName = outcome.consultant_name || ui('ui_extra_b1_astrologer', 'Astrologer');
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
            {ui('ui_extra_b1_reading_received_6mo', 'You received a reading 6 months ago')}
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
          {consultantName}{' '}
          {ui('ui_extra_b1_prediction_followup', 'made predictions in your reading. Six months have passed. How accurate were those predictions?')}
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
            {ui('ui_extra_b1_notes_optional', 'Your notes (optional)')}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full bg-(--gm-bg-deep) border border-(--gm-border-soft) rounded-xl px-5 py-3.5 text-sm text-(--gm-text) placeholder:text-(--gm-muted) focus:border-(--gm-gold)/50 outline-none resize-y"
            placeholder={ui('ui_extra_b1_notes_placeholder', 'Details are valuable for feedback and will stay private...')}
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
          {isLoading ? ui('ui_extra_b1_saving_dots', 'Saving...') : ui('ui_extra_b1_reply', 'Reply')}
        </button>
      </div>
    </article>
  );
}

import PageContainer from '@/components/common/PageContainer';

export default function KarnePage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'tr';
  const isTr = locale === 'tr';
  const { ui } = useUiSection('ui_extra' as any, locale as any);

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
      <PageContainer center className="bg-(--gm-bg) min-h-screen">
        <p className="text-(--gm-muted) text-sm">{ui('ui_extra_b1_loading_dots', 'Loading...')}</p>
      </PageContainer>
    );
  }

  const items = pending ?? [];

  return (
    <PageContainer width="narrow" className="bg-(--gm-bg) pt-32 pb-24">
      <div className="max-w-[var(--gm-w-narrow)] mx-auto pt-12">
        <Link
          href={localizePath(locale, '/dashboard')}
          className="inline-flex items-center gap-2 text-xs text-(--gm-text-dim) hover:text-(--gm-gold) tracking-[0.18em] uppercase mb-8"
        >
          <ArrowLeft size={14} />
          {ui('ui_extra_b1_back_to_dashboard', 'Back to dashboard')}
        </Link>

        <header className="mb-12">
          <div className="font-display text-[11px] tracking-[0.32em] text-(--gm-gold-deep) uppercase mb-3">
            {ui('ui_extra_b1_astrologer_report_card', 'Astrologer Report Card')}
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-(--gm-text) leading-tight mb-4">
            {ui('ui_extra_b1_did_predictions_come_true', 'Did your readings come true?')}
          </h1>
          <p className="text-(--gm-text-dim) leading-relaxed font-light">
            {ui('ui_extra_b1_report_card_lead', 'We collect feedback 6 months after your readings. Your answers shape astrologer report cards and help other users choose.')}
          </p>
        </header>

        {isLoading ? (
          <div className="text-center py-16 text-(--gm-muted) text-sm">
            {ui('ui_extra_b1_loading_dots', 'Loading...')}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-12 text-center shadow-(--gm-shadow-soft)">
            <Sparkles className="mx-auto text-(--gm-gold-deep) mb-4" size={32} strokeWidth={1.4} />
            <h2 className="font-serif text-2xl text-(--gm-text) mb-3">
              {ui('ui_extra_b1_no_pending_feedback', 'No pending report card for now')}
            </h2>
            <p className="text-(--gm-text-dim) text-sm leading-relaxed max-w-[var(--gm-w-form)] mx-auto">
              {ui('ui_extra_b1_no_pending_feedback_body', 'Six months after receiving a reading from an astrologer, report card questions will appear here. Your answers help both astrologers and other users.')}
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
    </PageContainer>
  );
}
