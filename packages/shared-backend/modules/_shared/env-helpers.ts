// src/modules/_shared/env-helpers.ts
// Environment variable parse utilities

/** "true" / "1" / "yes" → true, else fallback */
export function parseEnvBool(val: string | undefined, fallback: boolean): boolean {
  if (val == null) return fallback;
  const s = val.trim().toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === '0' || s === 'no') return false;
  return fallback;
}

/** String → number, fallback if NaN */
export function parseEnvInt(val: string | undefined, fallback: number): number {
  if (val == null) return fallback;
  const n = parseInt(val, 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Comma-separated string → trimmed array */
export function parseEnvList(val: string | undefined): string[] {
  if (!val) return [];
  return val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
