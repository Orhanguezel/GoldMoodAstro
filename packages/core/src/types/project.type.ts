// Backend: projects + projects_i18n + project_images + project_images_i18n

import type { PaginationParams } from './common.type';

export interface Project {
  id: string;
  is_published: boolean;
  is_featured: boolean;
  display_order: number;

  // main visual
  featured_image: string | null;
  featured_image_asset_id: string | null;

  // Ensotek industrial fields
  category: string | null;             // "Su Soğutma Kulesi", "HVAC", "Proses Soğutma"
  product_type: string | null;         // "CTP Kaportalı Açık Tip", "Kapalı Tip"
  location: string | null;             // "İstanbul", "Kahramanmaraş"
  client_name: string | null;
  unit_count: number | null;           // kaç adet kule
  fan_count: number | null;            // kaç fanlı
  start_date: string | null;           // YYYY-MM-DD
  complete_date: string | null;        // YYYY-MM-DD
  completion_time_label: string | null;
  services: string | null;             // JSON-encoded string[] — sunulan hizmetler/özellikler
  website_url: string | null;
  youtube_url: string | null;
  techs: string | null;                // JSON-encoded string[] — FRP, GRP, CTP, HVAC…

  // i18n (coalesced by backend)
  title: string;
  slug: string;
  summary: string | null;
  content: string;                     // JSON-encoded { html, description, key_features[], technologies_used[], design_highlights[] }
  featured_image_alt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  locale: string;

  created_at: string;
  updated_at: string;

  // optional relations (returned by by-slug / by-id endpoints)
  gallery?: ProjectImage[];
}

export interface ProjectImage {
  id: string;
  project_id: string;
  asset_id: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  // i18n (coalesced by backend)
  alt: string | null;
  caption: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectListParams extends PaginationParams {
  is_featured?: boolean;
  is_published?: boolean;
  category?: string;
  location?: string;
  client?: string;
  product_type?: string;
  q?: string;
}
