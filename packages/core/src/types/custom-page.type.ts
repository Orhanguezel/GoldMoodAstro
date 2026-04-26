// Backend: custom_pages + custom_pages_i18n
// Used for: news (module_key='news'), blog (module_key='blog'), custom content

export interface CustomPage {
  id: string;
  module_key: string; // 'news' | 'blog' | 'solutions' | etc.
  is_published: number; // 1 | 0
  featured: number;     // 1 | 0
  featured_image: string | null;
  featured_image_asset_id: string | null;
  display_order: number;
  order_num: number;
  image_url: string | null;
  storage_asset_id: string | null;
  images: string[];          // array of image URLs
  storage_image_ids: string[];
  category_id: string | null;
  sub_category_id: string | null;
  category_name: string | null;
  category_slug: string | null;
  sub_category_name: string | null;
  sub_category_slug: string | null;
  created_at: string;
  updated_at: string;
  // i18n fields (coalesced by backend)
  title: string;
  slug: string;
  content: string | null; // JSON string: {"html": "..."} or plain HTML
  summary: string | null;
  featured_image_alt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  tags: string | null; // comma-separated
  locale_resolved: string;
}

export interface CustomPageListParams {
  module_key?: string;
  language?: string;
  is_published?: boolean;
  featured?: boolean;
  category_id?: string;
  limit?: number;
  offset?: number;
  sort?: 'created_at' | 'updated_at' | 'display_order' | 'order_num';
  order?: 'asc' | 'desc';
  q?: string;
}

