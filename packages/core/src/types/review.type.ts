// Backend: reviews + review_i18n (polymorphic target)

export interface Review {
  id: string;
  target_type: string; // 'product' | 'service' | 'general' etc.
  target_id: string;
  name: string;
  email: string;
  rating: number; // 1-5
  is_active: boolean;
  is_approved: boolean;
  display_order: number;
  likes_count: number;
  dislikes_count: number;
  helpful_count: number;
  submitted_locale: string;
  // i18n (coalesced by backend)
  title: string | null;
  comment: string;
  admin_reply: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReviewRequest {
  target_type: string;
  target_id: string;
  name: string;
  email: string;
  rating: number;
  title?: string;
  comment: string;
}

export type ReactionType = 'like' | 'dislike' | 'helpful';

export interface ReviewListParams {
  language?: string;
  target_type?: string;
  target_id?: string;
  is_active?: boolean;
  is_approved?: boolean;
  page?: number;
  limit?: number;
}
