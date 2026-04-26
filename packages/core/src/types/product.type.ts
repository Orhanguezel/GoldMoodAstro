// Backend: products + product_i18n + product_images + product_specs

export interface Product {
  id: string;
  item_type: 'product' | 'sparepart';
  category_id: string | null;
  sub_category_id: string | null;
  price: number | null;
  image_url: string | null;
  storage_asset_id: string | null;
  images: string[] | null;
  is_active: boolean;
  is_featured: boolean;
  order_num: number;
  product_code: string | null;
  stock_quantity: number;
  rating: number;
  review_count: number;
  // i18n (coalesced by backend)
  title: string;
  slug: string;
  description: string | null;
  alt: string | null;
  tags: string[] | null;
  specifications: Record<string, string> | null;
  meta_title: string | null;
  meta_description: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
  // optional relations
  category?: import('./category.type').Category;
  gallery?: ProductImage[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string | null;
  storage_asset_id: string | null;
  display_order: number;
  is_active: boolean;
  // i18n
  title: string | null;
  alt: string | null;
  caption: string | null;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  language?: string;
  category_id?: string;
  category_slug?: string;
  sub_category_id?: string;
  item_type?: 'product' | 'sparepart';
  is_featured?: boolean;
  is_active?: boolean;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
