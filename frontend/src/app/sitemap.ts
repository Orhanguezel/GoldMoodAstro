// frontend/src/app/sitemap.ts

import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ['tr', 'en'];
  const pages = ['', '/consultants', '/birth-chart', '/about', '/faqs', '/contact', '/blog'];
  
  const staticRoutes = locales.flatMap(locale => 
    pages.map(page => ({
      url: `${BASE_URL}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: page === '' ? 1 : 0.8,
    }))
  );

  return [...staticRoutes];
}
