// Backend: faqs + faqs_i18n

export interface Faq {
  id: string;
  is_active: boolean;
  display_order: number;
  category_id: string | null;
  sub_category_id: string | null;
  // i18n (coalesced by backend)
  question: string;
  answer: string;
  slug: string;
  locale: string;
  created_at: string;
  updated_at: string;
}

export interface FaqListParams {
  language?: string;
  is_active?: boolean;
  category_id?: string;
  sub_category_id?: string;
}
