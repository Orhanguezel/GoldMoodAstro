// =============================================================
// FILE: src/components/common/ReviewList.tsx
// Ortak yorum listesi (public) + reaction/like butonu
// i18n: site_settings.ui_feedback (list_* ve reaction_* key'leri)
// - ✅ Bootstrap/inline style yok
// - ✅ review.scss class'ları kullanılır
// =============================================================

'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { toast } from 'sonner';

import {
  useListReviewsPublicQuery,
  useAddReviewReactionPublicMutation,
} from '@/integrations/rtk/hooks';
import type { ReviewDto } from '@/integrations/shared';

import { useResolvedLocale, useUiSection } from '@/i18n';

type ReviewListProps = {
  targetType: string;
  targetId: string;
  locale?: string;
  className?: string;
  showHeader?: boolean;

  /** Optional overrides (e.g. when used as blog comments) */
  titleOverride?: string;
  emptyTextOverride?: string;

  /** Display mode */
  variant?: 'reviews' | 'comments';
};

function clampRating(v: number) {
  const n = Number.isFinite(v) ? v : 0;
  return Math.max(0, Math.min(5, n));
}

function starsArray(rating: number) {
  const full = Math.round(clampRating(rating));
  return Array.from({ length: 5 }).map((_, idx) => idx < full);
}

const ReviewList: React.FC<ReviewListProps> = ({
  targetType,
  targetId,
  locale: localeProp,
  className,
  showHeader = true,
  titleOverride,
  emptyTextOverride,
  variant = 'reviews',
}) => {
  const resolvedLocale = useResolvedLocale();
  const locale = (localeProp || resolvedLocale || 'de').split('-')[0];

  const { ui } = useUiSection('ui_feedback', locale as any);

  const title = useMemo(() => {
    const t = String(titleOverride || '').trim();
    return t || ui('ui_feedback_list_title', 'Customer Reviews');
  }, [titleOverride, ui]);

  const noReviewsText = useMemo(() => {
    const t = String(emptyTextOverride || '').trim();
    return t || ui('ui_feedback_list_no_reviews', 'There are no reviews for this item yet.');
  }, [emptyTextOverride, ui]);
  const avgRatingLabel = ui('ui_feedback_list_avg_rating', 'Average Rating');
  const reviewsSuffix = ui('ui_feedback_list_reviews_suffix', 'reviews');

  const helpfulLabel = ui('ui_feedback_list_helpful', 'Helpful');
  const likedLabel = ui('ui_feedback_list_liked', 'Thanks');

  const errorText = ui(
    'ui_feedback_list_error',
    'An error occurred while processing your request.',
  );
  const loadingText = ui('ui_feedback_list_loading', 'Loading reviews...');

  const { data, isLoading, isError } = useListReviewsPublicQuery({
    target_type: targetType,
    target_id: targetId,
    locale,
    approved: true,
    active: true,
    orderBy: 'created_at',
    order: 'desc',
    limit: 100,
  } as any);

  const [addReaction, { isLoading: isReacting }] = useAddReviewReactionPublicMutation();
  const [reactionReviewId, setReactionReviewId] = useState<string | null>(null);

  const reviews: ReviewDto[] = useMemo(() => data ?? [], [data]);

  const stats = useMemo(() => {
    if (!reviews.length) return { avg: 0, count: 0 };
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    const avg = sum / reviews.length;
    return { avg, count: reviews.length };
  }, [reviews]);

  const formatDate = useCallback(
    (iso: any) => {
      try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleDateString(locale);
      } catch {
        return '';
      }
    },
    [locale],
  );

  const handleLike = async (review: ReviewDto) => {
    try {
      setReactionReviewId(review.id);
      await addReaction({ id: review.id } as any).unwrap();
      toast.success(likedLabel);
    } catch (err) {
      console.error('addReaction error', err);
      toast.error(errorText);
    } finally {
      setReactionReviewId(null);
    }
  };

  return (
    <section className={['reviewList', className].filter(Boolean).join(' ')}>
      {showHeader && (
        <header className="reviewList__head">
          <h3 className="reviewList__title">{title}</h3>

          {variant === 'reviews' && stats.count > 0 && (
            <div className="reviewList__stats">
              <div className="reviewList__avg">
                <strong>
                  {avgRatingLabel}: {stats.avg.toFixed(1)}/5
                </strong>
              </div>

              <div className="reviewList__meta">
                <span
                  className="reviewList__stars"
                  aria-label={`rating ${stats.avg.toFixed(1)} of 5`}
                >
                  {starsArray(stats.avg).map((on, idx) => (
                    <span key={idx} className={on ? 'is-on' : ''} aria-hidden="true">
                      ★
                    </span>
                  ))}
                </span>
                <span className="reviewList__count">
                  {stats.count} {reviewsSuffix}
                </span>
              </div>
            </div>
          )}
        </header>
      )}

      {isLoading && <p className="reviewList__state">{loadingText}</p>}
      {isError && <p className="reviewList__state reviewList__state--error">{errorText}</p>}

      {!isLoading && !isError && reviews.length === 0 && (
        <p className="reviewList__state reviewList__state--empty">{noReviewsText}</p>
      )}

      {!isLoading && !isError && reviews.length > 0 && (
        <div className="reviewList__items">
          {reviews.map((r) => (
            <article key={r.id} className="reviewCard">
              <div className="reviewCard__top">
                <div className="reviewCard__who">
                  <strong className="reviewCard__name">{r.name}</strong>
                  {variant === 'reviews' && (
                    <div className="reviewCard__rating">
                      <span className="reviewCard__stars" aria-hidden="true">
                        {starsArray(Number(r.rating)).map((on, idx) => (
                          <span key={idx} className={on ? 'is-on' : ''}>
                            ★
                          </span>
                        ))}
                      </span>
                      <span className="reviewCard__score">
                        {clampRating(Number(r.rating)).toFixed(1)}/5
                      </span>
                    </div>
                  )}
                </div>

                <time className="reviewCard__date" dateTime={String((r as any).created_at || '')}>
                  {formatDate((r as any).created_at)}
                </time>
              </div>

              {r.comment ? <p className="reviewCard__text">{r.comment}</p> : null}

              <div className="reviewCard__actions">
                <button
                  type="button"
                  className="reviewCard__btn"
                  disabled={isReacting && reactionReviewId === r.id}
                  onClick={() => handleLike(r)}
                >
                  <span className="reviewCard__btnIcon" aria-hidden="true">
                    👍
                  </span>
                  <span className="reviewCard__btnText">
                    {helpfulLabel}{' '}
                    <span className="reviewCard__btnCount">({(r as any).helpful_count ?? 0})</span>
                  </span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default ReviewList;
