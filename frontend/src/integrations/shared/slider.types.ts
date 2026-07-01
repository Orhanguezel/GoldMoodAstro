// =============================================================
// FILE: src/integrations/types/slider.types.ts
// goldmoodastro - Slider types + normalizers
// Parent + i18n (slider + slider_i18n) compatible with backend
// =============================================================

/* -------------------- Helpers -------------------- */

const asStr = (v: unknown): string => (typeof v === 'string' ? v : String(v ?? ''));

const asBool = (v: unknown): boolean => v === true || v === 1 || v === '1' || v === 'true';

const asNum = (v: unknown): number => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/* -------------------- API types (RAW) -------------------- */

/**
 * Shape returned by the admin controller.
 * Object produced by toAdminView() (parent + joined i18n).
 */
export interface ApiSliderAdmin {
  /** Parent slider.id */
  id: number;
  /** Parent slider.uuid */
  uuid: string;

  /** i18n.locale */
  locale: string;
  /** i18n.name */
  name: string;
  /** i18n.slug */
  slug: string;
  /** i18n.description */
  description: string | null;

  /** Parent image_url (or computed through publicUrlOf) */
  image_url: string | null;
  /** Parent image_asset_id (storage_assets.id) */
  image_asset_id: string | null;
  /** Effective URL through storage (asset_url || image_url) */
  image_effective_url: string | null;

  /** i18n.alt */
  alt: string | null;
  /** i18n.button_text */
  buttonText: string | null;
  /** i18n.button_link */
  buttonLink: string | null;

  /** Parent featured / is_active / order */
  featured: boolean | 0 | 1;
  is_active: boolean | 0 | 1;
  display_order: number;

  created_at: string;
  updated_at: string;

  /** Flexible JSON field (localized settings, flags, etc.) */
  meta?: Record<string, unknown> | null;
}

/**
 * SlideData type from the public controller.
 * Object returned by rowToPublic() (i18n + parent).
 */
export interface ApiSliderPublic {
  /** Parent slider.id (converted to string) */
  id: string;
  title: string;
  description: string;
  image: string;
  alt?: string;
  buttonText: string;
  buttonLink: string;
  isActive: boolean;
  order: number;
  priority?: 'low' | 'medium' | 'high';
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
  locale: string;
}

/* -------------------- FE DTO types -------------------- */

/**
 * Normalized DTO used on the admin side.
 * (id is converted to string, other fields are preserved)
 */
export interface SliderAdminDto {
  id: string;
  uuid: string;

  locale: string;
  name: string;
  slug: string;
  description: string | null;

  image_url: string | null;
  image_asset_id: string | null;
  image_effective_url: string | null;

  alt: string | null;
  buttonText: string | null;
  buttonLink: string | null;

  featured: boolean;
  is_active: boolean;
  display_order: number;

  created_at: string;
  updated_at: string;

  /** Flexible JSON field shared by FE & BE (not required right now) */
  meta: Record<string, unknown> | null;
}

/**
 * DTO used on the public side (hero slider, etc.).
 * Almost identical to the API shape, normalized only for type safety.
 */
export interface SliderPublicDto {
  id: string;
  title: string;
  description: string;
  image: string;
  alt?: string;
  buttonText: string;
  buttonLink: string;
  isActive: boolean;
  order: number;
  priority?: 'low' | 'medium' | 'high';
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
  locale: string;
}

/* -------------------- Query param tipleri -------------------- */

export type SliderSortField = 'display_order' | 'name' | 'created_at' | 'updated_at';

export type SliderSortOrder = 'asc' | 'desc';

/**
 * Admin list query (compatible with adminListQuerySchema)
 * - locale is optional (all languages when omitted)
 */
export interface SliderAdminListQueryParams {
  q?: string;
  locale?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  sort?: SliderSortField;
  order?: SliderSortOrder;
}

/**
 * Public list query (compatible with publicListQuerySchema)
 * - backend defaults to 'de' when locale is omitted
 */
export interface SliderPublicListQueryParams {
  locale?: string;
  q?: string;
  limit?: number;
  offset?: number;
  sort?: SliderSortField;
  order?: SliderSortOrder;
}

/**
 * Public detail – slug + locale
 * GET /sliders/:slug?locale=tr
 */
export interface SliderPublicDetailQuery {
  slug: string;
  locale?: string;
}

/* -------------------- Create / Update payloads -------------------- */

/**
 * Payload compatible with CreateBody (createSchema)
 * - Contains both parent and i18n fields
 */
export interface SliderCreatePayload {
  /** i18n.locale; backend defaults to 'de' when omitted */
  locale?: string;

  /** i18n fields */
  name: string;
  slug?: string;
  description?: string | null;
  alt?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;

  /** Parent fields */
  image_url?: string | null;
  image_asset_id?: string | null;
  featured?: boolean;
  is_active?: boolean;
  display_order?: number;

  /** Flexible JSON meta - backend may ignore it for now */
  meta?: Record<string, unknown> | null;
}

/**
 * Payload compatible with UpdateBody (updateSchema.partial)
 * - Optionally updates both parent and i18n fields
 */
export interface SliderUpdatePayload {
  locale?: string;

  name?: string;
  slug?: string;
  description?: string | null;
  alt?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;

  image_url?: string | null;
  image_asset_id?: string | null;
  featured?: boolean;
  is_active?: boolean;
  display_order?: number;

  meta?: Record<string, unknown> | null;
}

/**
 * Reorder body - reorderSchema (ids: number[])
 * - ids: parent slider.id list
 */
export interface SliderReorderPayload {
  ids: number[];
}

/**
 * Status set – setStatusSchema
 * - Parent is_active toggling
 */
export interface SliderSetStatusPayload {
  is_active: boolean;
}

/**
 * Image set - setImageSchema (image is cleared when asset_id is null)
 * - Parent image_url / image_asset_id are set
 */
export interface SliderSetImagePayload {
  asset_id: string | null;
}

/* -------------------- Normalizers -------------------- */

export const normalizeSliderAdmin = (api: ApiSliderAdmin): SliderAdminDto => ({
  id: asStr(api.id),
  uuid: asStr(api.uuid),
  locale: asStr(api.locale || 'tr'),
  name: asStr(api.name),
  slug: asStr(api.slug),
  description: api.description ?? null,

  image_url: api.image_url ?? null,
  image_asset_id: api.image_asset_id ?? null,
  image_effective_url: api.image_effective_url ?? api.image_url ?? null,

  alt: api.alt ?? null,
  buttonText: api.buttonText ?? null,
  buttonLink: api.buttonLink ?? null,

  featured: asBool(api.featured),
  is_active: asBool(api.is_active),
  display_order: asNum(api.display_order),

  created_at: asStr(api.created_at),
  updated_at: asStr(api.updated_at),

  meta: api.meta ?? null,
});

export const normalizeSliderPublic = (api: ApiSliderPublic): SliderPublicDto => ({
  id: asStr(api.id),
  title: asStr(api.title),
  description: asStr(api.description ?? ''),
  image: asStr(api.image ?? ''),
  alt: api.alt ?? undefined,
  buttonText: asStr(api.buttonText ?? 'View'),
  buttonLink: asStr(api.buttonLink ?? ''),

  isActive: asBool(api.isActive),
  order: asNum(api.order),
  priority: api.priority,
  showOnMobile: api.showOnMobile,
  showOnDesktop: api.showOnDesktop,
  locale: asStr(api.locale || 'tr'),
});
