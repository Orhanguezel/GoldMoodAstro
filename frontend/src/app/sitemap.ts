// frontend/src/app/sitemap.ts
//
// T31-B6: 3 locale (tr/en/de) + alternates ile zenginleştirildi.
// Her URL için Next.js otomatik <xhtml:link rel="alternate" hreflang> üretir
// (alternates.languages property'sinden).

import { MetadataRoute } from 'next';
import brand from '../../../config/brand.json';

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || brand.public_url || 'https://goldmoodastro.com').replace(/\/$/, '');

const LOCALES = ['tr', 'en', 'de'] as const;
const DEFAULT_LOCALE = 'tr';

const ZODIAC_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;

const SIGN_SUB_PAGES = ['/ask', '/kariyer', '/saglik', '/bugun', '/meditasyon'];
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8094/api').replace(/\/$/, '');
const DEFAULT_LASTMOD = '2026-06-20T00:00:00.000Z';
const TODAY_LASTMOD = `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`;

/** Statik üst seviye sayfalar — admin paneldeki seo_pages key'leriyle senkron. */
const STATIC_PAGES = [
  '', '/consultants', '/pricing', '/birth-chart', '/about', '/faqs', '/contact',
  '/blog', '/daily', '/sinastri', '/tarot', '/kahve-fali', '/ruya-tabiri',
  '/numeroloji', '/yildizname',
  '/editorial-policy',
  '/burclar', '/burcunu-ogren', '/unluler-ve-burclari',
  '/yukselen-burc-hesaplayici', '/buyuk-uclu',
];

const STATIC_LASTMOD: Record<string, string> = {
  '': '2026-07-04T00:00:00.000Z',
  '/about': '2026-07-04T00:00:00.000Z',
  '/faqs': '2026-07-04T00:00:00.000Z',
  '/contact': '2026-07-04T00:00:00.000Z',
  '/blog': '2026-07-04T00:00:00.000Z',
  '/consultants': '2026-07-04T00:00:00.000Z',
  '/pricing': '2026-07-04T00:00:00.000Z',
  '/editorial-policy': '2026-07-04T00:00:00.000Z',
  '/burclar': '2026-07-04T00:00:00.000Z',
};

/** Locale'lere göre alternates objesi üret — Next.js sitemap'e <xhtml:link> olarak basar. */
function buildAlternates(path: string): { languages: Record<string, string> } {
  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = `${BASE_URL}/${loc}${path}`;
  }
  languages['x-default'] = `${BASE_URL}/${DEFAULT_LOCALE}${path}`;
  return { languages };
}

async function fetchBlogRoutes(locale: string): Promise<MetadataRoute.Sitemap> {
  try {
    const qs = new URLSearchParams({
      module_key: 'blog',
      locale,
      default_locale: DEFAULT_LOCALE,
      is_published: 'true',
      limit: '100',
      sort: 'updated_at',
      orderDir: 'desc',
    });
    const res = await fetch(`${API_BASE}/custom-pages?${qs.toString()}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const items = Array.isArray(json) ? json : (json?.items ?? json?.data ?? []);
    if (!Array.isArray(items)) return [];

    return items
      .map((item: any) => {
        const slug = String(item?.slug ?? '').trim();
        if (!slug) return null;
        const path = `/blog/${slug}`;
        const lastModified = item?.updated_at || item?.created_at
          ? new Date(item.updated_at || item.created_at)
          : new Date();
        return {
          url: `${BASE_URL}/${locale}${path}`,
          lastModified,
          changeFrequency: 'weekly' as const,
          priority: 0.65,
          alternates: buildAlternates(path),
        };
      })
      .filter(Boolean) as MetadataRoute.Sitemap;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Statik sayfalar × 3 locale
  const staticRoutes: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    STATIC_PAGES.map((page) => ({
      url: `${BASE_URL}/${locale}${page}`,
      lastModified: new Date(STATIC_LASTMOD[page] || DEFAULT_LASTMOD),
      changeFrequency: 'daily' as const,
      priority: page === '' ? 1 : 0.8,
      alternates: buildAlternates(page),
    })),
  );

  // 12 burç × 3 locale
  const signRoutes: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    ZODIAC_SIGNS.flatMap((sign) => {
      const mainPath = `/burclar/${sign}`;
      const main: MetadataRoute.Sitemap[number] = {
        url: `${BASE_URL}/${locale}${mainPath}`,
        lastModified: new Date('2026-07-04T00:00:00.000Z'),
        changeFrequency: 'daily' as const,
        priority: 0.7,
        alternates: buildAlternates(mainPath),
      };

      const subs: MetadataRoute.Sitemap = SIGN_SUB_PAGES.map((sub) => {
        const subPath = `${mainPath}${sub}`;
        return {
          url: `${BASE_URL}/${locale}${subPath}`,
          lastModified: new Date(sub === '/bugun' ? TODAY_LASTMOD : '2026-06-20T00:00:00.000Z'),
          changeFrequency: 'daily' as const,
          priority: 0.6,
          alternates: buildAlternates(subPath),
        };
      });

      return [main, ...subs];
    }),
  );

  const blogRoutes = (await Promise.all(LOCALES.map((locale) => fetchBlogRoutes(locale)))).flat();

  return [...staticRoutes, ...signRoutes, ...blogRoutes];
}
