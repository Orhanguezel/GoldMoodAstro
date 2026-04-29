// frontend/src/app/sitemap.ts

import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ['tr', 'en'];
  const pages = [
    '', '/consultants', '/pricing', '/birth-chart', '/about', '/faqs', '/contact', '/blog',
    '/burclar', '/burcunu-ogren', '/unluler-ve-burclari', '/yukselen-burc-hesaplayici', '/big-three'
  ];
  
  const signs = [
    'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 
    'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
  ];

  const signSubPages = ['/ask', '/kariyer', '/saglik', '/bugun', '/meditasyon'];

  const staticRoutes = locales.flatMap(locale => 
    pages.map(page => ({
      url: `${BASE_URL}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: page === '' ? 1 : 0.8,
    }))
  );

  const signRoutes = locales.flatMap(locale =>
    signs.flatMap(sign => {
      const routes = [{
        url: `${BASE_URL}/${locale}/burclar/${sign}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.7,
      }];
      
      signSubPages.forEach(sub => {
        routes.push({
          url: `${BASE_URL}/${locale}/burclar/${sign}${sub}`,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: 0.6,
        });
      });
      
      return routes;
    })
  );

  return [...staticRoutes, ...signRoutes];
}
