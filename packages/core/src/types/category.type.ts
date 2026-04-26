// Backend: categories + category_i18n

export interface Category {
  id: string;
  module_key: string;
  image_url: string | null;
  storage_asset_id: string | null;
  alt: string | null;
  icon: string | null;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  // i18n (coalesced by backend)
  name: string;
  slug: string;
  description: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
  // optional relations
  subcategories?: SubCategory[];
}

export interface SubCategory {
  id: string;
  category_id: string;
  image_url: string | null;
  storage_asset_id: string | null;
  alt: string | null;
  icon: string | null;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  // i18n (coalesced by backend)
  name: string;
  slug: string;
  description: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryListParams {
  language?: string;
  module_key?: string;
  is_active?: boolean;
  is_featured?: boolean;
}
