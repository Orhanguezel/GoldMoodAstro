// Backend: footer_sections + footer_sections_i18n

export interface FooterSection {
  id: string;
  is_active: boolean;
  display_order: number;
  // i18n (coalesced by backend)
  title: string;
  slug: string;
  description: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
}

export interface FooterListParams {
  language?: string;
  is_active?: boolean;
}
