import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Cinzel, Fraunces, Manrope } from 'next/font/google';

import { Providers } from '../providers';
import ClientLayout from '../ClientLayout';
import { ThemeProvider } from '@/components/ThemeProvider';
import { buildMetadataFromSeo, fetchSeoObject, fetchSeoPageObject, mergeSeoPageIntoSeo } from '@/seo/server';
import JsonLd from '@/seo/JsonLd';
import { graph, org, website } from '@/seo/jsonld';
import Script from 'next/script';

// 2026-04-27 vizyon revize: Cinzel (display) + Fraunces (editorial body) + Manrope (UI sans)
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  fallback: ['Georgia', 'serif'],
});

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  fallback: ['Georgia', 'serif'],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const [seo, homeSeo] = await Promise.all([
    fetchSeoObject(locale),
    fetchSeoPageObject(locale, 'home'),
  ]);
  return await buildMetadataFromSeo(mergeSeoPageIntoSeo(seo, homeSeo), { locale, pathname: '/' });
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
      <div className={`font-sans antialiased text-text-primary bg-bg-primary ${manrope.variable} ${fraunces.variable} ${cinzel.variable}`}>
        <Script
          src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
          strategy="beforeInteractive"
        />
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
