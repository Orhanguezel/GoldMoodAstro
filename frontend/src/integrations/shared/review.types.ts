// =============================================================
// FILE: src/integrations/types/review.types.ts
// Public Reviews
// =============================================================

import type { BoolLike } from '@/integrations/shared';

export type ReviewDto = {
  id: string;

  target_type: string;
  target_id: string;

  name: string;
  email: string;
  rating: number;

  is_active: boolean;
  is_approved: boolean;
  display_order: number;

  likes_count: number;
  dislikes_count: number;
  helpful_count: number;

  /** Kaydın gönderildiği dil */
  submitted_locale: string;

  created_at: string;
  updated_at: string;

  // i18n alanları (coalesced)
  title: string | null;
  comment: string | null;
  admin_reply: string | null;
  locale_resolved: string | null;

  /**
   * Geriye dönük uyumluluk (bazı eski FE kodları review.locale bekliyor olabilir).
   * Tercih edilen: locale_resolved (display) veya submitted_locale (source).
   */
  locale?: string | null;
};

export type ReviewListQueryParams = {
  search?: string;
  approved?: BoolLike;
  active?: BoolLike;
  minRating?: number;
  maxRating?: number;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'updated_at' | 'display_order' | 'rating' | 'name';
  order?: 'asc' | 'desc';

  // Listeleme locale override
  locale?: string;

  // Target filtreleri
  target_type?: string;
  target_id?: string;
};

export type ReviewCreatePayload = {
  target_type: string;
  target_id: string;

  locale?: string; // yoksa server req.locale/DEFAULT_LOCALE kullanır

  name: string;
  email: string;
  rating: number;
  comment: string;

  is_active?: boolean;
  is_approved?: boolean;
  display_order?: number;
};

export type ReviewUpdatePayload = Partial<ReviewCreatePayload>;

export type ReviewReactionPayload = {
  type: 'like' | 'dislike';
};
