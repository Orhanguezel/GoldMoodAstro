import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Cormorant_Garamond, Outfit } from 'next/font/google';

import { Providers } from '../providers';
import ClientLayout from '../ClientLayout';
import { ThemeProvider } from '@/components/ThemeProvider';
import { buildMetadataFromSeo, fetchSeoObject } from '@/seo/server';
import JsonLd from '@/seo/JsonLd';
import { graph, org, website } from '@/seo/jsonld';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  fallback: ['Georgia', 'serif'],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const seo = await fetchSeoObject(locale);
  return await buildMetadataFromSeo(seo, { locale, pathname: '/' });
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.goldmoodastro.com';

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const jsonLdData = graph([
    org({
      id: `${SITE_URL}/#org`,
      name: 'GoldMoodAstro',
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.svg`,
    }),
    website({
      id: `${SITE_URL}/#website`,
      name: 'GoldMoodAstro',
      url: SITE_URL,
      publisherId: `${SITE_URL}/#org`,
    }),
  ]);

  return (
    <ThemeProvider>
      <div className={`font-sans antialiased text-text-primary bg-bg-primary ${outfit.variable} ${cormorant.variable}`}>
        <JsonLd data={jsonLdData} id="site-graph" />
        <Providers>
          <Suspense fallback={null}>
            <ClientLayout locale={locale}>
              {children}
            </ClientLayout>
          </Suspense>
        </Providers>
      </div>
    </ThemeProvider>
  );
}
