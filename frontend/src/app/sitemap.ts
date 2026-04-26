import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

import { fetchActiveLocales, fetchSetting, getDefaultLocale } from '@/i18n/server';
import { getServerApiBase } from '@/i18n/apiBase.server';
import { normalizeLocalhostOrigin, stripTrailingSlash } from '@/integrations/shared';
import { absUrlJoin, localizedPath, normLocaleShort, normPath, uniq } from '@/integrations/shared';
import { normalizeArrayResponse, safeStr } from '@/integrations/shared';

export const revalidate = 3600;

const API = getServerApiBase();

type SlugEntry = { id: string; slug: string; updated_at?: string };

// ── Base URL ──

async function getBaseUrl(): Promise<string> {
  const env = stripTrailingSlash(safeStr(process.env.NEXT_PUBLIC_SITE_URL));
  if (env) return normalizeLocalhostOrigin(env);

  const publicBase = await fetchSetting('public_base_url', '*', { revalidate: 600 });
  const fromDb = stripTrailingSlash(safeStr((publicBase as any)?.value));
  if (fromDb && /^https?:\/\//i.test(fromDb)) return normalizeLocalhostOrigin(fromDb);

  const h = await headers();
  const xfProto = safeStr(h.get('x-forwarded-proto')).split(',')[0]?.trim();
  const xfHost = safeStr(h.get('x-forwarded-host')).split(',')[0]?.trim();
  const host = xfHost || safeStr(h.get('host'));
  const proto = xfProto || 'https';
  if (host) return normalizeLocalhostOrigin(stripTrailingSlash(`${proto}://${host}`));

  return 'http://localhost:3000';
}

// ── API Helpers ──

function apiUrl(path: string): string {
  const base = API.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

async function fetchApiJson<T>(path: string): Promise<T | null> {
  if (!API) return null;
  try {
    const res = await fetch(apiUrl(path), { next: { revalidate } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchSlugsByLocale(
  endpoint: string,
  locale: string,
  defaultLocale: string,
  extraParams?: Record<string, string>,
): Promise<SlugEntry[]> {
  const qs = new URLSearchParams({
    locale,
    default_locale: defaultLocale,
    limit: '500',
    sort: 'updated_at',
    orderDir: 'desc',
    ...extraParams,
  });

  const raw = await fetchApiJson<unknown>(`/${endpoint}?${qs.toString()}`);
  return normalizeArrayResponse<Record<string, any>>(raw)
    .map((x) => ({
      id: safeStr(x?.id),
      slug: safeStr(x?.slug),
      updated_at: typeof x?.updated_at === 'string' ? x.updated_at : undefined,
    }))
    .filter((x) => x.id && x.slug);
}

// ── URL Builders ──

function localizedAbsUrl(baseUrl: string, locale: string, pathname: string, defaultLocale: string): string {
  const loc = normLocaleShort(locale, defaultLocale);
  const path = normPath(pathname);
  return absUrlJoin(baseUrl, localizedPath(loc, path, defaultLocale));
}

function buildAlternates(baseUrl: string, locales: string[], pathname: string, defaultLocale: string) {
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = localizedAbsUrl(baseUrl, l, pathname, defaultLocale);
  }
  languages['x-default'] = localizedAbsUrl(baseUrl, defaultLocale, pathname, defaultLocale);
  return { languages };
}

// ── Sitemap ──

const STATIC_PATHS = [
  '/',
  '/about',
  '/consultants',
  '/blog',
  '/contact',
  '/faqs',
  '/terms',
  '/privacy-policy',
  '/privacy-notice',
  '/legal-notice',
  '/cookie-policy',
  '/kvkk',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = await getBaseUrl();
  const activeLocales = uniq((await fetchActiveLocales()).map((l) => normLocaleShort(l)));
  const defaultLocale = normLocaleShort(await getDefaultLocale());

  // Dynamic slugs — parallel fetch
  const [, blogByLocale] = await Promise.all([
    Promise.resolve([]),
    Promise.all(
      activeLocales.map(
        async (l) =>
          [l, await fetchSlugsByLocale('custom_pages', l, defaultLocale, { module_key: 'blog', is_published: '1' })] as const,
      ),
    ),
  ]);

  function buildSlugMap(byLocale: (readonly [string, SlugEntry[]])[]) {
    const map: Record<string, Record<string, SlugEntry>> = {};
    for (const [loc, list] of byLocale) {
      for (const it of list) {
        map[it.id] = map[it.id] || {};
        map[it.id]![loc] = it;
      }
    }
    return map;
  }

  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  for (const pathname of STATIC_PATHS) {
    for (const loc of activeLocales) {
      entries.push({
        url: localizedAbsUrl(baseUrl, loc, pathname, defaultLocale),
        alternates: buildAlternates(baseUrl, activeLocales, pathname, defaultLocale),
      });
    }
  }

  // Dynamic pages
  function pushDynamic(slugMap: Record<string, Record<string, SlugEntry>>, prefix: string) {
    for (const perLocale of Object.values(slugMap)) {
      for (const loc of activeLocales) {
        const found = perLocale[loc] || perLocale[defaultLocale];
        if (!found?.slug) continue;
        const path = `${prefix}/${found.slug}`;
        entries.push({
          url: localizedAbsUrl(baseUrl, loc, path, defaultLocale),
          alternates: buildAlternates(baseUrl, activeLocales, path, defaultLocale),
          ...(found.updated_at ? { lastModified: found.updated_at } : {}),
        });
      }
    }
  }

  pushDynamic(buildSlugMap(blogByLocale), '/blog');

  return entries;
}
