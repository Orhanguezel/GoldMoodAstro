
// =============================================================
// FILE: src/modules/_shared/json.ts
// FINAL — JSON helpers (safe, reusable)
// =============================================================

import { customType } from 'drizzle-orm/mysql-core';

export type JsonObject = Record<string, any>;

/** Drizzle ORM MySQL JSON kolonu helper */
export const jsonCol = <T = unknown>(name: string) =>
  customType<{ data: T; driverData: string }>({
    dataType() {
      return 'json';
    },
    fromDriver(value: string): T {
      if (typeof value === 'object') return value as T;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    },
    toDriver(value: T): string {
      return typeof value === 'string' ? value : JSON.stringify(value);
    },
  })(name);

export function safeJsonParse<T = any>(input: unknown, fallback: T): T {
  if (input === null || input === undefined) return fallback;
  if (typeof input !== 'string') return fallback;
  const s = input.trim();
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export function packJson(v: unknown): string {
  // JSON.stringify undefined => undefined; DB için string bekleniyor
  if (v === undefined) return 'null';
  try {
    return JSON.stringify(v);
  } catch {
    return 'null';
  }
}

export function unpackArray(s?: string | null): string[] {
  const parsed = safeJsonParse<any>(s, []);
  return Array.isArray(parsed) ? parsed.map((x) => String(x ?? '')).filter(Boolean) : [];
}

export function extractHtmlFromJson(s?: string | null): string {
  const parsed = safeJsonParse<any>(s, null);
  if (parsed && typeof parsed === 'object' && typeof parsed.html === 'string') return parsed.html;
  // Eğer düz string html gelmişse
  if (typeof s === 'string' && s.trim()) return s;
  return '';
}


/** JSON-string veya array kabul eden helper */
export function parseJsonArrayString(input: string): string[] {
  const s = input.trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((x) => String(x ?? '').trim()).filter(Boolean);
  } catch {
    return [];
  }
}

