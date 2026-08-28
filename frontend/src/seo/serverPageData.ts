// =============================================================
// FILE: src/seo/serverPageData.ts
// Server-only page data fetchers (for per-slug SEO in App Router)
// =============================================================
import 'server-only';

import { cache } from 'react';

import type {
  CustomPageDto,
  ApiCustomPage,
} from '@/integrations/shared';
import { mapApiCustomPageToDto, normalizeArrayResponse } from '@/integrations/shared';
import { getDefaultLocale } from '@/i18n/server';
import { getServerApiBase } from '@/i18n/apiBase.server';
import { normLocaleShort } from '@/integrations/shared';

const API = getServerApiBase();

function apiUrl(path: string): string {
  const base = API.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

async function fetchApiJson<T>(path: string, opts?: { revalidate?: number }): Promise<T | null> {
  if (!API) return null;

  try {
    const res = await fetch(apiUrl(path), { next: { revalidate: opts?.revalidate ?? 300 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const fetchCustomPagePublicBySlug = cache(
  async (args: { slug: string; locale: string }): Promise<CustomPageDto | null> => {
    const slug = String(args.slug || '').trim();
    if (!slug) return null;

    const defaultLocale = await getDefaultLocale();
    const locale = normLocaleShort(args.locale, defaultLocale);

    const qs = new URLSearchParams({
      locale,
      // Indexed localized pages must never render another language as content.
      default_locale: locale,
    });

    const raw = await fetchApiJson<ApiCustomPage>(
      `/custom-pages/by-slug/${encodeURIComponent(slug)}?${qs.toString()}`,
      { revalidate: 300 },
    );

    if (!raw || raw.locale_resolved !== locale) return null;
    return mapApiCustomPageToDto(raw);
  },
);

export const fetchCustomPagePublicByLandingKey = cache(
  async (args: { landingKey: string; locale: string }): Promise<CustomPageDto | null> => {
    const landingKey = String(args.landingKey || '').trim();
    if (!landingKey) return null;

    const defaultLocale = await getDefaultLocale();
    const locale = normLocaleShort(args.locale, defaultLocale);

    const qs = new URLSearchParams({
      module_key: 'landing',
      landing_key: landingKey,
      locale,
      default_locale: locale,
      is_published: 'true',
      limit: '1',
    });

    const raw = await fetchApiJson<ApiCustomPage[]>(`/custom-pages?${qs.toString()}`, { revalidate: 300 });
    const first = Array.isArray(raw) ? raw[0] : null;

    if (!first || first.locale_resolved !== locale) return null;
    return mapApiCustomPageToDto(first);
  },
);

export const fetchCustomPagesPublicByModule = cache(
  async (args: {
    moduleKey: string;
    locale: string;
    limit?: number;
    /** Blog listesinde en yeni yazı önce gelmeli; SSS/legal'da eklenme sırası doğru. */
    orderDir?: 'asc' | 'desc';
    /** Ana sayfa bölümü yalnız "öne çıkan" yazıları ister. */
    featuredOnly?: boolean;
  }): Promise<CustomPageDto[]> => {
    const moduleKey = String(args.moduleKey || '').trim();
    if (!moduleKey) return [];

    const defaultLocale = await getDefaultLocale();
    const locale = normLocaleShort(args.locale, defaultLocale);

    const qs = new URLSearchParams({
      module_key: moduleKey,
      locale,
      default_locale: locale,
      is_published: 'true',
      limit: String(args.limit ?? 10),
      sort: 'created_at',
      orderDir: args.orderDir ?? 'asc',
    });
    if (args.featuredOnly) qs.set('featured', 'true');

    const raw = await fetchApiJson<unknown>(`/custom-pages?${qs.toString()}`, { revalidate: 300 });
    return normalizeArrayResponse<ApiCustomPage>(raw)
      .filter((item) => item.locale_resolved === locale)
      .map(mapApiCustomPageToDto);
  },
);
