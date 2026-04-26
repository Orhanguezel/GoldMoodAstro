// src/modules/_shared/common.ts

import { z } from 'zod';

/* ================= helpers ================= */
/** Güvenilir sıralama kolonları */
export type Sortable = 'created_at' | 'updated_at' | 'display_order' | 'order_num';



/** Query param: true/false, 1/0, yes/no (case-insensitive) */
export const boolLike = z.preprocess((val) => {
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;
    if (s === 'false' || s === '0' || s === 'no' || s === 'off') return false;
  }
  return val;
}, z.union([
  z.boolean(),
  z.literal(0),
  z.literal(1),
  z.literal('0'),
  z.literal('1'),
  z.literal('true'),
  z.literal('false'),
]));

export const REL_OR_URL = z
  .string()
  .min(1)
  .refine(
    (v) =>
      v.startsWith('/') || // relative
      /^https?:\/\/.+/i.test(v), // absolute url
    'URL veya / ile başlayan relative path olmalıdır',
  );

export const packStringArray = (arr?: string[]): string | null | undefined => {
  if (typeof arr === 'undefined') return undefined;
  const clean = Array.from(new Set((arr || []).map((s) => s.trim()).filter(Boolean)));
  return JSON.stringify(clean);
};

/* ================= utils ================= */
export const toBool = (v: unknown): boolean => v === true || v === 1 || v === '1' || v === 'true';

export const safeJson = <T>(s: string | null, fallback: T): T => {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
};

export const to01 = (v: any): 0 | 1 | undefined => {
  if (v === true || v === 1 || v === '1' || v === 'true') return 1;
  if (v === false || v === 0 || v === '0' || v === 'false') return 0;
  return undefined;
};

export const parseOrder = (
  orderParam?: string,
  sort?: Sortable,
  ord?: 'asc' | 'desc',
): { col: Sortable; dir: 'asc' | 'desc' } | null => {
  if (orderParam) {
    const m = orderParam.match(/^([a-zA-Z0-9_]+)\.(asc|desc)$/);
    const col = m?.[1] as Sortable | undefined;
    const dir = m?.[2] as 'asc' | 'desc' | undefined;
    if (col && dir && (col === 'created_at' || col === 'updated_at' || col === 'display_order')) {
      return { col, dir };
    }
  }
  if (sort && ord) return { col: sort, dir: ord };
  return null;
};

export const isRec = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export const isStr = (v: unknown): v is string => typeof v === 'string';




/** HTML string → JSON-string {"html": "..."} */
export const packContent = (htmlOrJson: string): string => {
  try {
    const parsed = JSON.parse(htmlOrJson) as unknown;
    if (isRec(parsed) && typeof (parsed as any).html === 'string') {
      return JSON.stringify({ html: (parsed as any).html });
    }
  } catch {
    // düz HTML ise no-op
  }
  return JSON.stringify({ html: htmlOrJson });
};

export const parseJsonStringArray = (s: string): string[] => {
  const raw = String(s ?? '').trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((x) => String(x ?? '').trim()).filter(Boolean);
  } catch {
    return [];
  }
};

/**
 * DB LONGTEXT JSON-string kolonlar için güvenli normalize:
 * - string[] => ok
 * - string(JSON) => parse
 * - null/undefined => []
 */
export const asStringArray = (v: unknown): string[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((x) => String(x ?? '').trim()).filter(Boolean);
  if (typeof v === 'string') return parseJsonStringArray(v);
  return [];
};