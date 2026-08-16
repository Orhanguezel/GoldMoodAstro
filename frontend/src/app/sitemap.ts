// frontend/src/app/sitemap.ts
//
// T31-B6: 3 locale (tr/en/de) + alternates ile zenginleştirildi.
// Her URL için Next.js otomatik <xhtml:link rel="alternate" hreflang> üretir
// (alternates.languages property'sinden).

import { MetadataRoute } from 'next';
import brand from '../../../config/brand.json';
import { toLocalizedPublicPath, type PublicLocale } from '@/i18n/localizedRoutes';

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || brand.public_url || 'https://goldmoodastro.com').replace(/\/$/, '');

const LOCALES = ['tr', 'en', 'de'] as const;
import { allSignPairs } from '@/lib/zodiac/compatibility';

const DEFAULT_LOCALE = 'tr';

const ZODIAC_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;

// Template-heavy love/career/health/meditation pages stay noindex and outside
// the sitemap until each sign has substantively unique editorial content.
const SIGN_SUB_PAGES = ['/bugun'];
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8094/api').replace(/\/$/, '');
const DEFAULT_LASTMOD = '2026-06-20T00:00:00.000Z';
const TODAY_LASTMOD = `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`;

function localizedUrl(locale: PublicLocale, path: string): string {
  const localized = toLocalizedPublicPath(locale, path);
  return `${BASE_URL}/${locale}${localized === '/' ? '' : localized}`;
}

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
    languages[loc] = localizedUrl(loc, path);
  }
  languages['x-default'] = localizedUrl(DEFAULT_LOCALE, path);
  return { languages };
}

type BlogRouteItem = {
  id: string;
  locale: PublicLocale;
  slug: string;
  updatedAt?: string;
  createdAt?: string;
};

async function fetchBlogItems(locale: PublicLocale): Promise<BlogRouteItem[]> {
  try {
    const qs = new URLSearchParams({
      module_key: 'blog',
      locale,
      default_locale: locale,
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
        return {
          id: String(item?.id ?? `${locale}:${slug}`),
          locale,
          slug,
          updatedAt: item?.updated_at,
          createdAt: item?.created_at,
        };
      })
      .filter(Boolean) as BlogRouteItem[];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Statik sayfalar × 3 locale
  const staticRoutes: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    STATIC_PAGES.map((page) => ({
      url: localizedUrl(locale, page),
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
        url: localizedUrl(locale, mainPath),
        lastModified: new Date('2026-07-04T00:00:00.000Z'),
        changeFrequency: 'daily' as const,
        priority: 0.7,
        alternates: buildAlternates(mainPath),
      };

      const subs: MetadataRoute.Sitemap = SIGN_SUB_PAGES.map((sub) => {
        const subPath = `${mainPath}${sub}`;
        return {
          url: localizedUrl(locale, subPath),
          lastModified: new Date(sub === '/bugun' ? TODAY_LASTMOD : '2026-06-20T00:00:00.000Z'),
          changeFrequency: 'daily' as const,
          priority: 0.6,
          alternates: buildAlternates(subPath),
        };
      });

      return [main, ...subs];
    }),
  );

  // İkili burç uyumu — 66 tekrarsız çift × 3 dil. Sayfalar index,follow ve
  // sunucuda çifte özgü içerik basıyor (bkz. lib/zodiac/compatibility.ts);
  // sitemap'te olmadıkları için Google'ın keşfi tesadüfe kalmıştı.
  const compatibilityRoutes: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    allSignPairs().map(({ slug }) => {
      const path = `/burclar/uyum/${slug}`;
      return {
        url: localizedUrl(locale, path),
        lastModified: new Date('2026-08-17T00:00:00.000Z'),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
        alternates: buildAlternates(path),
      };
    }),
  );

  const blogItems = (await Promise.all(LOCALES.map((locale) => fetchBlogItems(locale)))).flat();
  const blogTranslations = new Map<string, Partial<Record<PublicLocale, string>>>();
  for (const item of blogItems) {
    const translations = blogTranslations.get(item.id) ?? {};
    translations[item.locale] = item.slug;
    blogTranslations.set(item.id, translations);
  }
  const blogRoutes: MetadataRoute.Sitemap = blogItems.map((item) => {
    const translations = blogTranslations.get(item.id) ?? {};
    const languages: Record<string, string> = {};
    for (const locale of LOCALES) {
      const slug = translations[locale];
      if (slug) languages[locale] = localizedUrl(locale, `/blog/${slug}`);
    }
    const defaultSlug = translations[DEFAULT_LOCALE];
    if (defaultSlug) languages['x-default'] = localizedUrl(DEFAULT_LOCALE, `/blog/${defaultSlug}`);
    return {
      url: localizedUrl(item.locale, `/blog/${item.slug}`),
      lastModified: item.updatedAt || item.createdAt ? new Date(item.updatedAt || item.createdAt!) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.65,
      alternates: { languages },
    };
  });

  return [...staticRoutes, ...signRoutes, ...compatibilityRoutes, ...blogRoutes];
}
