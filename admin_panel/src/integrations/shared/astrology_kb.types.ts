// =============================================================
// FILE: src/integrations/shared/astrology_kb.types.ts
// FAZ 19 / T19-3 — Admin astrology_kb CRUD shared types
// =============================================================

export type AstrologyKbKind =
  | 'planet_sign' | 'planet_house' | 'sign_house'
  | 'aspect' | 'sign' | 'house' | 'planet'
  | 'transit' | 'synastry' | 'misc';

export type AstrologyKbTone =
  | 'neutral' | 'warm' | 'professional' | 'poetic' | 'direct';

export type AstrologyKbReviewStatus = 'pending' | 'approved' | 'rejected';

export type AstrologyKbDto = {
  id: string;
  kind: AstrologyKbKind;
  key1: string;
  key2: string | null;
  key3: string | null;
  locale: string;
  title: string;
  content: string;
  short_summary: string | null;
  tone: AstrologyKbTone;
  source: string | null;
  author: string | null;
  is_active: boolean;
  review_status: AstrologyKbReviewStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AstrologyKbListQueryParams = {
  search?: string;
  kind?: AstrologyKbKind;
  key1?: string;
  key2?: string;
  key3?: string;
  locale?: string;
  review_status?: AstrologyKbReviewStatus;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'updated_at' | 'kind' | 'key1';
  order?: 'asc' | 'desc';
};

export type AstrologyKbListResponse = {
  items: AstrologyKbDto[];
  total: number;
};

export type AstrologyKbCreatePayload = Omit<
  AstrologyKbDto,
  'id' | 'review_status' | 'reviewed_by' | 'reviewed_at' | 'created_at' | 'updated_at'
>;

export type AstrologyKbUpdatePayload = Partial<AstrologyKbCreatePayload>;

export type AstrologyKbBulkImportPayload = {
  items: AstrologyKbCreatePayload[];
  upsert?: boolean;
};

export type AstrologyKbBulkImportResult = {
  ok: boolean;
  inserted: number;
  updated: number;
  failed: number;
};

export type AstrologyKbTranslationDraftPayload = {
  source_locale?: string;
  target_locale?: string;
  limit?: number;
};

export type AstrologyKbTranslationDraftResult = {
  ok: boolean;
  created: number;
  skipped: number;
  source_total: number;
};
