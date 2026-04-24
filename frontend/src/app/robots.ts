import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

import { fetchSetting } from '@/i18n/server';
import { normalizeLocalhostOrigin, stripTrailingSlash } from '@/integrations/shared';

async function getBaseUrl(): Promise<string> {
  const env = stripTrailingSlash(String(process.env.NEXT_PUBLIC_SITE_URL || '').trim());
  if (env) return normalizeLocalhostOrigin(env);

  const publicBase = await fetchSetting('public_base_url', '*', { revalidate: 600 });
  const fromDb = stripTrailingSlash(String(publicBase?.value || '').trim());
  if (fromDb && /^https?:\/\//i.test(fromDb)) return normalizeLocalhostOrigin(fromDb);

  const h = await headers();

  const xfProto = String(h.get('x-forwarded-proto') || '')
    .split(',')[0]
    ?.trim();
  const xfHost = String(h.get('x-forwarded-host') || '')
    .split(',')[0]
    ?.trim();

  const host = xfHost || String(h.get('host') || '').trim();
  const proto = (xfProto || 'https').trim();
  if (host) return normalizeLocalhostOrigin(stripTrailingSlash(`${proto}://${host}`));

  return 'http://localhost:3000';
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = await getBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
      },
      {
        userAgent: 'Bytespider',
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

