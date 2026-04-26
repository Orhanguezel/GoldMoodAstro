// src/modules/_shared/locales.ts

import { z } from 'zod';
import {
  LOCALES,
  ensureLocalesLoadedFromSettings,
  getRuntimeDefaultLocale,
  normalizeLocale,
} from '../../core/i18n';

export type LocaleCode = string;
export type LocaleQueryLike = { locale?: string; default_locale?: string };




export function pickSafeDefault(): string {
  const base = getRuntimeDefaultLocale();
  if (LOCALES.includes(base)) return base;
  return LOCALES[0] || base;
}



export const LOCALE_SCHEMA = z
  .string()
  .min(2)
  .max(10)
  .regex(/^[a-zA-Z]{2,3}([_-][a-zA-Z0-9]{2,8})?$/, 'invalid_locale');

// ⚠️ Dynamic locales: avoid static enum (LOCALES can change at runtime)
export const LOCALE_ENUM = LOCALE_SCHEMA;

export const LOCALE_LIKE = z
  .string()
  .trim()
  .min(1)
  .transform((s) => normalizeLocale(s) || s.toLowerCase());

export async function resolveLocalesPublic(
  req: any,
  query?: LocaleQueryLike,
): Promise<{ locale: LocaleCode; def: LocaleCode }> {
  await ensureLocalesLoadedFromSettings();

  const q = query ?? ((req.query ?? {}) as LocaleQueryLike);

  const reqCandidate = pickSupportedLocale(q.locale) || pickSupportedLocale(req.locale) || null;
  const defCandidate = pickSupportedLocale(q.default_locale) || null;

  const runtimeDef = getRuntimeDefaultLocale();
  const safeDefault =
    defCandidate || (LOCALES.includes(runtimeDef) ? runtimeDef : null) || LOCALES[0] || runtimeDef;

  const safeLocale = reqCandidate || safeDefault;

  return { locale: safeLocale, def: safeDefault };
}

export function normalizeLooseLocale(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return null;
  return normalizeLocale(s) || s.toLowerCase();
}

export function pickSupportedLocale(raw?: string | null): string | null {
  const n = normalizeLooseLocale(raw);
  if (!n) return null;
  return LOCALES.includes(n) ? n : null;
}

export async function resolveLocales(
  req: any,
  query?: LocaleQueryLike,
): Promise<{ locale: LocaleCode; def: LocaleCode }> {
  await ensureLocalesLoadedFromSettings();

  const q = query ?? ((req.query ?? {}) as LocaleQueryLike);

  const reqCandidate = pickSupportedLocale(q.locale) || pickSupportedLocale(req.locale) || null;
  const defCandidate = pickSupportedLocale(q.default_locale) || null;

  const runtimeDef = getRuntimeDefaultLocale();
  const safeDefault =
    defCandidate || (LOCALES.includes(runtimeDef) ? runtimeDef : null) || LOCALES[0] || runtimeDef;

  const safeLocale = reqCandidate || safeDefault;

  return { locale: safeLocale, def: safeDefault };
}



export async function getDefaultLocale(): Promise<string> {
  await ensureLocalesLoadedFromSettings();
  return getRuntimeDefaultLocale();
}
