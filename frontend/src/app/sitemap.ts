// frontend/src/app/sitemap.ts
//
// T31-B6: 3 locale (tr/en/de) + alternates ile zenginleştirildi.
// Her URL için Next.js otomatik <xhtml:link rel="alternate" hreflang> üretir
// (alternates.languages property'sinden).

import { MetadataRoute } from 'next';

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');

const LOCALES = ['tr', 'en', 'de'] as const;
const DEFAULT_LOCALE = 'tr';

const ZODIAC_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;

const SIGN_SUB_PAGES = ['/ask', '/kariyer', '/saglik', '/bugun', '/meditasyon'];

/** Statik üst seviye sayfalar — admin paneldeki seo_pages key'leriyle senkron. */
const STATIC_PAGES = [
  '', '/consultants', '/pricing', '/birth-chart', '/about', '/faqs', '/contact',
  '/blog', '/daily', '/sinastri', '/tarot', '/kahve-fali', '/ruya-tabiri',
  '/numeroloji', '/yildizname',
  '/editorial-policy',
  '/burclar', '/burcunu-ogren', '/unluler-ve-burclari',
  '/yukselen-burc-hesaplayici', '/big-three',
];

/** Locale'lere göre alternates objesi üret — Next.js sitemap'e <xhtml:link> olarak basar. */
function buildAlternates(path: string): { languages: Record<string, string> } {
  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = `${BASE_URL}/${loc}${path}`;
  }
  languages['x-default'] = `${BASE_URL}/${DEFAULT_LOCALE}${path}`;
  return { languages };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Statik sayfalar × 3 locale
  const staticRoutes: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    STATIC_PAGES.map((page) => ({
      url: `${BASE_URL}/${locale}${page}`,
      lastModified: now,
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
        lastModified: now,
        changeFrequency: 'daily' as const,
        priority: 0.7,
        alternates: buildAlternates(mainPath),
      };

      const subs: MetadataRoute.Sitemap = SIGN_SUB_PAGES.map((sub) => {
        const subPath = `${mainPath}${sub}`;
        return {
          url: `${BASE_URL}/${locale}${subPath}`,
          lastModified: now,
          changeFrequency: 'daily' as const,
          priority: 0.6,
          alternates: buildAlternates(subPath),
        };
      });

      return [main, ...subs];
    }),
  );

  return [...staticRoutes, ...signRoutes];
}
