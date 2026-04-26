// Backend: services + services_i18n + service_images + service_images_i18n

export interface Service {
  id: string;
  type: string;
  category_id: string | null;
  sub_category_id: string | null;
  featured: boolean;
  is_active: boolean;
  display_order: number;
  image_url: string | null;
  image_asset_id: string | null;
  // i18n (coalesced by backend)
  slug: string;
  name: string;
  description: string | null;
  material: string | null;
  price: string | null;
  includes: string | null;
  warranty: string | null;
  image_alt: string | null;
  tags: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
  // optional relations
  images?: ServiceImage[];
}

export interface ServiceImage {
  id: string;
  service_id: string;
  image_asset_id: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  // i18n
  title: string | null;
  alt: string | null;
  caption: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceListParams {
  language?: string;
  category_id?: string;
  sub_category_id?: string;
  featured?: boolean;
  is_active?: boolean;
}
