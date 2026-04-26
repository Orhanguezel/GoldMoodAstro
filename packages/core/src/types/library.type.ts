export interface LibraryItem {
  id: string;
  type: string;

  category_id: string | null;
  sub_category_id: string | null;

  featured: 0 | 1;
  is_published: 0 | 1;
  is_active: 0 | 1;
  display_order: number;

  featured_image: string | null;
  image_url: string | null;
  image_asset_id: string | null;

  views: number;
  download_count: number;

  published_at: string | null;
  created_at: string;
  updated_at: string;

  // i18n (coalesced from requested locale → default locale)
  slug: string | null;
  name: string | null;
  description: string | null; // plain HTML or null
  image_alt: string | null;

  tags: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;

  locale_resolved: string | null;
}

export interface LibraryImage {
  id: string;
  library_id: string;
  image_asset_id: string | null;
  image_url: string | null;
  is_active: 0 | 1;
  display_order: number;
  created_at: string;
  updated_at: string;

  // i18n
  title: string | null;
  alt: string | null;
  caption: string | null;
  locale_resolved: string | null;
}

export interface LibraryFile {
  id: string;
  library_id: string;
  asset_id: string | null;
  file_url: string | null;
  name: string;
  size_bytes: number | null;
  mime_type: string | null;
  tags_json: string | null;
  is_active: 0 | 1;
  display_order: number;
  created_at: string;
  updated_at: string;

  // storage resolved
  file_bucket: string | null;
  file_path: string | null;
  file_public_url: string | null;
}

export interface LibraryListParams {
  locale?: string;
  default_locale?: string;
  limit?: number;
  offset?: number;
  type?: string;
  category_id?: string;
  sub_category_id?: string;
  featured?: boolean | 0 | 1;
  is_active?: boolean | 0 | 1;
  sort?: 'created_at' | 'updated_at' | 'published_at' | 'display_order' | 'views' | 'download_count';
  order?: 'asc' | 'desc';
  q?: string;
}
