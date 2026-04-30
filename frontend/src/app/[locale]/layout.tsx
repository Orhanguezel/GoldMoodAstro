import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Cinzel, Fraunces, Manrope, Outfit, Gabriela } from 'next/font/google';

import { Providers } from '../providers';
import ClientLayout from '../ClientLayout';
import { ThemeProvider } from '@/components/ThemeProvider';
import { buildMetadataFromSeo, fetchSeoObject, fetchSeoPageObject, mergeSeoPageIntoSeo } from '@/seo/server';
import JsonLd from '@/seo/JsonLd';
import { graph, org, website } from '@/seo/jsonld';
import type { PublicMenuItemDto } from '@/integrations/shared';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8094/api').replace(/\/$/, '');

async function fetchHeaderMenuItems(locale: string): Promise<PublicMenuItemDto[]> {
  try {
    const url = `${API_BASE}/menu_items?location=header&is_active=true&locale=${encodeURIComponent(locale)}&nested=true`;
    const res = await fetch(url, { next: { revalidate: 60, tags: ['menu_items_header'] } });
    if (!res.ok) return [];
    const json = await res.json();
    const items = Array.isArray(json) ? json : (json?.items ?? json?.data ?? []);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

// 2026-04-27 vizyon revize: Cinzel (display) + Fraunces (editorial body) + Manrope (UI sans)
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const gabriela = Gabriela({
  subsets: ['latin'],
  variable: '--font-gabriela',
  display: 'swap',
  weight: ['400'],
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
const BRAND_SAME_AS = [
  'https://www.instagram.com/goldmoodastro',
  'https://www.youtube.com/@goldmoodastro',
  'https://www.linkedin.com/company/goldmoodastro',
  'https://twitter.com/goldmoodastro',
];

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // SSR fetch: header menu items — hidrasyon mismatch'i önlemek için server'da çekilir
  const initialMenuItems = await fetchHeaderMenuItems(locale);

  const jsonLdData = graph([
    org({
      id: `${SITE_URL}/#org`,
      name: 'GoldMoodAstro',
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.svg`,
      sameAs: BRAND_SAME_AS,
      description: "Turkiye'nin astroloji, tarot ve numeroloji danismanlik platformu.",
      priceRange: '₺149-₺3500',
      areaServed: 'TR',
    }),
    website({
      id: `${SITE_URL}/#website`,
      name: 'GoldMoodAstro',
      url: SITE_URL,
      publisherId: `${SITE_URL}/#org`,
      searchUrlTemplate: `${SITE_URL}/tr/consultants?q={q}`,
    }),
  ]);

  return (
    <ThemeProvider>
      <div className={`font-sans antialiased text-text-primary bg-bg-primary ${manrope.variable} ${fraunces.variable} ${cinzel.variable} ${outfit.variable} ${gabriela.variable}`}>
        {/* SSR Splash Screen Overlay */}
        <div
          id="gm-splash-ssr"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99998,
            background: 'var(--gm-bg, #FAF6EF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.4s ease',
          }}
          aria-hidden="true"
          suppressHydrationWarning
        >
          <div style={{
            color: '#C9A961',
            fontSize: '1.5rem',
            letterSpacing: '0.2em',
            fontWeight: 600,
            textTransform: 'uppercase',
            fontFamily: 'Cinzel, serif'
          }}>
            GoldMoodAstro
          </div>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(sessionStorage.getItem('gm_splash_seen')){var el=document.getElementById('gm-splash-ssr');if(el)el.style.display='none'}}catch(e){}})()`
          }}
        />
        <JsonLd data={jsonLdData} id="site-graph" />
        <Providers>
          <Suspense fallback={null}>
            <ClientLayout locale={locale} initialMenuItems={initialMenuItems}>
              {children}
            </ClientLayout>
          </Suspense>
        </Providers>
      </div>
    </ThemeProvider>
  );
}
