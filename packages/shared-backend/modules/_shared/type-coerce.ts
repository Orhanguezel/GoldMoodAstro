// src/modules/_shared/type-coerce.ts
// Type coercion utilities

/** Boolean with default */
export function toBoolDefault(v: unknown, def = false): boolean {
  if (v === true || v === 1 || v === '1' || v === 'true') return true;
  if (v === false || v === 0 || v === '0' || v === 'false') return false;
  return def;
}

/** String/unknown → integer (NaN → def) */
export function toInt(v: unknown, def = 0): number {
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  return Number.isFinite(n) ? n : def;
}

/** String/unknown → number (NaN → 0) */
export function toNum(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Locale string normalize: "TR" → "tr", "en-US" → "en" */
export function normalizeLocaleStr(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim().toLowerCase();
  if (!s) return null;
  return s.split(/[-_]/)[0] || null;
}
