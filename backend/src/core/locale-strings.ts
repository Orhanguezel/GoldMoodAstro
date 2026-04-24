// =============================================================
// FILE: src/core/locale-strings.ts
// Deterministic locale string loader from public/locales/*.json
// =============================================================

import { readFileSync } from "fs";
import { join } from "path";

const DEFAULT_FALLBACK = "de";
const cache = new Map<string, Record<string, unknown>>();

function load(locale: string): Record<string, unknown> {
  const hit = cache.get(locale);
  if (hit) return hit;

  const filePath = join(process.cwd(), "public", "locales", `${locale}.json`);
  try {
    const data = JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>;
    cache.set(locale, data);
    return data;
  } catch {
    cache.set(locale, {});
    return {};
  }
}

/**
 * Locale dosyasından çeviri string'i döndürür.
 * key: dot-separated (ör. "chat.price_policy")
 * params: placeholder değerleri (ör. { url: "https://..." })
 * Fallback: locale bulunamazsa "de" dener, o da yoksa key döner.
 */
export function t(
  locale: string,
  key: string,
  params?: Record<string, string>,
): string {
  const parts = key.split(".");

  let value: unknown = load(locale);
  for (const p of parts) value = (value as any)?.[p];

  // fallback
  if (typeof value !== "string" && locale !== DEFAULT_FALLBACK) {
    value = load(DEFAULT_FALLBACK);
    for (const p of parts) value = (value as any)?.[p];
  }

  if (typeof value !== "string") return key;

  let result = value;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      result = result.replaceAll(`{${k}}`, v);
    }
  }
  return result;
}
