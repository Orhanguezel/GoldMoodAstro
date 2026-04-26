// Backend: references + references_i18n + reference_images + reference_images_i18n

export interface Reference {
  id: string;
  is_published: boolean;
  is_featured: boolean;
  display_order: number;
  featured_image: string | null;
  featured_image_asset_id: string | null;
  website_url: string | null;
  category_id: string | null;
  sub_category_id: string | null;
  // i18n (coalesced by backend)
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  featured_image_alt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
  // optional relations (gallery returned by by-slug/by-id endpoints)
  gallery?: ReferenceImage[];
}

export interface ReferenceImage {
  id: string;
  reference_id: string;
  storage_asset_id: string | null;
  image_url: string | null;
  display_order: number;
  is_published: boolean;
  is_featured: boolean;
  // i18n
  alt: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferenceListParams {
  language?: string;
  is_featured?: boolean;
  is_published?: boolean;
  category_id?: string;
  page?: number;
  limit?: number;
}
