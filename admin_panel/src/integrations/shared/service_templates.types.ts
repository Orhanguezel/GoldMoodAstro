// =============================================================
// FILE: src/integrations/shared/service_templates.types.ts
// =============================================================

import type { BoolLike } from './common';

export interface ServiceCategoryDto {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceCategoryCreatePayload {
  slug: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  sort_order?: number;
  is_active?: BoolLike;
}

export type ServiceCategoryUpdatePayload = Partial<ServiceCategoryCreatePayload>;

export interface ServiceTemplateDto {
  id: string;
  category_slug: string;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  price: string | number;
  currency: string;
  media_type: 'audio' | 'video';
  is_free: boolean;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceTemplateCreatePayload {
  category_slug: string;
  name: string;
  slug: string;
  description?: string | null;
  duration_minutes?: number;
  price?: string | number;
  currency?: string;
  media_type?: 'audio' | 'video';
  is_free?: BoolLike;
  sort_order?: number;
  is_active?: BoolLike;
}

export type ServiceTemplateUpdatePayload = Partial<ServiceTemplateCreatePayload>;

export interface ServiceTemplateListQueryParams {
  category_slug?: string;
}
