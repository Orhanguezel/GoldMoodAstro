'use client';

import React, { useMemo, useState } from 'react';
import { Filter, Loader2, MessageSquare, Send, Sparkles, Star, Quote } from 'lucide-react';
import { toast } from 'sonner';
import {
  type ConsultantSelfReview,
  useListMyConsultantReviewsQuery,
  useReplyToMyConsultantReviewMutation,
} from '@/integrations/rtk/private/consultant_self.endpoints';
import { cn } from '@/lib/utils';
import { extractApiError } from '@/integrations/shared';
import { useUiSection, useLocaleShort } from '@/i18n';

type ReviewFilter = 'all' | 'unreplied' | 'low' | 'high';

// Filter labels will be rendered dynamically via ui() calls — see ReviewsPanel component
const FILTER_KEYS: Array<{ key: ReviewFilter; predicate: (review: ConsultantSelfReview) => boolean }> = [
  { key: 'all', predicate: () => true },
  { key: 'unreplied', predicate: (review) => !review.consultant_reply },
  { key: 'low', predicate: (review) => Number(review.rating) <= 2 },
  { key: 'high', predicate: (review) => Number(review.rating) >= 4 },
];

export default function ReviewsPanel() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_reviews', locale);
  const [activeFilter, setActiveFilter] = useState<ReviewFilter>('all');

  const FILTERS = FILTER_KEYS.map((f) => ({
    ...f,
    label:
      f.key === 'all' ? ui('ui_reviews_filter_all', 'All') :
      f.key === 'unreplied' ? ui('ui_reviews_filter_unreplied', 'Unanswered') :
      f.key === 'low' ? ui('ui_reviews_filter_low', '1-2 stars') :
      ui('ui_reviews_filter_high', '4-5 stars'),
  }));

  // Her zaman filtresiz çek (≤200 kayıt) → sayaçlar ve filtreleme tutarlı; server-side
  // status filtresi sayaçları bozuyordu (daraltılmış listeden hesap).
  const { data: reviews = [], isLoading, isError } = useListMyConsultantReviewsQuery(undefined);

  const counts = useMemo(
    () =>
      FILTERS.reduce<Record<ReviewFilter, number>>(
        (acc, filter) => {
          acc[filter.key] = reviews.filter(filter.predicate).length;
          return acc;
        },
        { all: 0, unreplied: 0, low: 0, high: 0 },
      ),
    [reviews],
  );

  const filteredReviews = useMemo(() => {
    const filter = FILTERS.find((item) => item.key === activeFilter) ?? FILTERS[0];
    return reviews.filter(filter.predicate);
  }, [activeFilter, reviews]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--gm-gold)] opacity-40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Star className="h-4 w-4 text-[var(--gm-gold)] animate-pulse" />
          </div>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--gm-gold-dim)]">{ui('ui_reviews_loading', 'Loading feedback')}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-[2rem] border border-[var(--gm-error)]/10 bg-[var(--gm-error)]/5 p-12 text-center backdrop-blur-sm">
        <p className="font-serif italic text-[var(--gm-error)]">{ui('ui_reviews_error', 'An error occurred while loading reviews. Please try again later.')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--gm-border-soft)] pb-6">
        <div className="flex items-center gap-2 mr-4 text-[var(--gm-gold-dim)] opacity-60">
          <Filter className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">{ui('ui_reviews_filter_label', 'Filter')}</span>
        </div>
        {FILTERS.map((filter) => (
          <FilterChip
            key={filter.key}
            label={filter.label}
            active={activeFilter === filter.key}
            count={counts[filter.key]}
            onClick={() => setActiveFilter(filter.key)}
          />
        ))}
      </div>

      {filteredReviews.length === 0 ? (
        <div className="rounded-[3rem] border border-dashed border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/10 p-24 text-center backdrop-blur-sm">
          <div className="relative mx-auto mb-6 h-16 w-16">
            <MessageSquare className="absolute inset-0 h-full w-full text-[var(--gm-gold)] opacity-10" />
            <Star className="absolute top-0 right-0 h-6 w-6 text-[var(--gm-gold)] opacity-20 animate-pulse" />
          </div>
          <p className="font-serif italic text-xl text-[var(--gm-text-dim)]">{ui('ui_reviews_empty', 'There are no reviews in this category yet.')}</p>
          <p className="text-[11px] text-[var(--gm-muted)] mt-2 uppercase tracking-widest">{ui('ui_reviews_empty_hint', 'New reviews will appear here when they arrive.')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredReviews.map((review) => (
            <ReviewItem key={review.id} review={review} ui={ui} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex items-center gap-2.5 rounded-full border px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300",
        active
          ? "border-[var(--gm-gold)] bg-[var(--gm-gold)]/10 text-[var(--gm-gold)] shadow-lg shadow-[var(--gm-gold)]/5"
          : "border-[var(--gm-border-soft)] text-[var(--gm-text-dim)] hover:border-[var(--gm-gold)]/40 hover:text-[var(--gm-gold)] hover:bg-[var(--gm-gold)]/5"
      )}
    >
      {label}
      {count > 0 && (
        <span className={cn(
          "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[9px] transition-colors",
          active ? "bg-[var(--gm-gold)] text-[var(--gm-bg-deep)]" : "bg-[var(--gm-border-soft)] text-[var(--gm-muted)] group-hover:bg-[var(--gm-gold)]/20 group-hover:text-[var(--gm-gold)]"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

function customerName(review: ConsultantSelfReview) {
  return review.customer_name || review.user?.full_name || review.name || '';
}

function formatDate(iso: string | null | undefined, locale: string, noDate: string) {
  if (!iso) return noDate;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return noDate;
  const loc = locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : 'en-US';
  return date.toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' });
}

function ReviewItem({ review, ui, locale }: { review: ConsultantSelfReview; ui: (k: string, f?: string) => string; locale: string }) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState(review.consultant_reply || '');
  const [replyMutation, { isLoading: isSending }] = useReplyToMyConsultantReviewMutation();

  const rating = Math.max(0, Math.min(5, Number(review.rating) || 0));
  const hasReply = Boolean(review.consultant_reply);

  async function handleReply() {
    const reply = replyText.trim();
    if (!reply) return;

    try {
      await replyMutation({ id: review.id, reply }).unwrap();
      toast.success(ui('ui_reviews_reply_saved', 'Your reply was saved successfully'));
      setIsReplying(false);
    } catch (e) {
      toast.error(extractApiError(e, ui('ui_reviews_reply_failed', 'Reply could not be sent. Please try again')));
    }
  }

  function applySuggestion() {
    const suggestion = Number(review.rating) <= 2
      ? ui('ui_reviews_suggestion_low', 'Thank you for your feedback. I would like to understand your experience better and meet your expectations more accurately in the next session.')
      : ui('ui_reviews_suggestion_high', 'Thank you for your thoughtful review. I am very glad the session was helpful for you.');
    setReplyText(suggestion);
    setIsReplying(true);
    toast.info(ui('ui_reviews_draft_ready', 'Draft reply is ready'));
  }

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[2.5rem] border p-8 transition-all duration-500",
        hasReply
          ? "border-[var(--gm-gold)]/20 bg-[var(--gm-gold)]/[0.03] hover:bg-[var(--gm-gold)]/[0.06]"
          : "border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/40 hover:border-[var(--gm-gold)]/30"
      )}
    >
      {/* Decorative background glow */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--gm-gold)]/5 blur-[80px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="relative z-10 mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--gm-gold)]/10 border border-[var(--gm-gold)]/20 font-serif text-[var(--gm-gold)]">
            {customerName(review).charAt(0)}
          </div>
          <div>
            <div className="mb-1 flex items-center gap-3">
              <span className="font-serif text-xl tracking-tight text-[var(--gm-text)]">{customerName(review)}</span>
              <div className="flex gap-0.5" aria-label={`${rating} stars`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={`star-${review.id}-${i}`}
                    className={cn(
                      "h-3 w-3 transition-transform duration-300",
                      i < rating ? "fill-[var(--gm-gold)] text-[var(--gm-gold)] scale-110" : "text-[var(--gm-muted)] opacity-30"
                    )}
                  />
                ))}
              </div>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gm-muted)]">
              {formatDate(review.created_at, locale, ui('ui_reviews_no_date', 'No date'))}
            </p>
          </div>
        </div>

        {rating <= 2 && !hasReply && (
          <button
            type="button"
            onClick={applySuggestion}
            className="flex items-center gap-2 rounded-xl border border-[var(--gm-primary)]/20 bg-[var(--gm-primary)]/10 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--gm-primary)] transition-all hover:bg-[var(--gm-primary)]/20 hover:scale-105 active:scale-95"
          >
            <Sparkles className="h-3 w-3" />
            {ui('ui_reviews_draft_suggestion', 'Draft Suggestion')}
          </button>
        )}
      </div>

      <div className="relative mb-10 pl-8">
        <Quote className="absolute left-0 top-0 h-6 w-6 text-[var(--gm-gold)] opacity-10" />
        <p className="font-serif text-[17px] italic leading-relaxed text-[var(--gm-text-dim)]">
          {review.comment || ui('ui_reviews_no_comment', 'The client did not leave a comment, only a rating.')}
        </p>
      </div>

      {hasReply ? (
        <div className="relative overflow-hidden rounded-[2rem] border border-[var(--gm-gold)]/20 bg-[var(--gm-gold)]/5 p-6 animate-in slide-in-from-left-4 duration-500">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--gm-gold)] text-[var(--gm-bg-deep)]">
                <MessageSquare className="h-3 w-3" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--gm-gold)]">{ui('ui_reviews_consultant_reply_label', 'Consultant Reply')}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsReplying((value) => !value)}
              className="text-[9px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)] hover:text-[var(--gm-gold)] transition-colors underline underline-offset-4"
            >
              {ui('ui_reviews_edit_reply', 'Edit')}
            </button>
          </div>
          <p className="font-serif text-[15px] leading-relaxed text-[var(--gm-text)] italic opacity-90">
            {review.consultant_reply}
          </p>
        </div>
      ) : (
        !isReplying && (
          <button
            type="button"
            onClick={() => setIsReplying(true)}
            className="group/btn flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--gm-gold-dim)] transition-all hover:text-[var(--gm-gold)]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--gm-gold-dim)]/20 group-hover/btn:border-[var(--gm-gold)]/40 transition-colors">
              <MessageSquare className="h-4 w-4" />
            </div>
            {ui('ui_reviews_write_reply', 'Write Reply')}
          </button>
        )
      )}

      {isReplying && (
        <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="relative group/area">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              maxLength={2000}
              placeholder={ui('ui_reviews_reply_placeholder', 'Leave a professional and sincere reply for your client...')}
              className="min-h-[140px] w-full rounded-[2rem] border border-[var(--gm-border-soft)] bg-[var(--gm-bg-deep)]/50 p-6 font-serif text-[15px] italic text-[var(--gm-text)] outline-none transition-all focus:border-[var(--gm-gold)]/40 focus:ring-4 focus:ring-[var(--gm-gold)]/[0.05] placeholder:opacity-30"
            />
            <button
              type="button"
              onClick={applySuggestion}
              title="Get a draft suggestion"
              className="absolute right-5 top-5 rounded-xl border border-[var(--gm-primary)]/20 bg-[var(--gm-primary)]/10 p-2 text-[var(--gm-primary)] transition-all hover:bg-[var(--gm-primary)]/20 hover:rotate-12"
            >
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => {
                setIsReplying(false);
                if (!hasReply) setReplyText('');
              }}
              className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-muted)] hover:text-[var(--gm-text)] transition-colors"
            >
              {ui('ui_reviews_cancel', 'Cancel')}
            </button>
            <button
              type="button"
              onClick={handleReply}
              disabled={isSending || !replyText.trim()}
              className="flex items-center gap-3 rounded-full bg-[var(--gm-gold)] px-8 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gm-bg-deep)] shadow-2xl shadow-[var(--gm-gold)]/20 transition-all hover:-translate-y-1 hover:shadow-[var(--gm-gold)]/40 active:translate-y-0 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
            >
              {isSending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {hasReply ? ui('ui_reviews_update', 'Update Reply') : ui('ui_reviews_publish', 'Publish Review')}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
