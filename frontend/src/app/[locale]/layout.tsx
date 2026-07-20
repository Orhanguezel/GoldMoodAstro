import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Cinzel, Fraunces, Manrope } from 'next/font/google';

import { Providers } from '../providers';
import ClientLayout from '../ClientLayout';
import { ThemeProvider } from '@/components/ThemeProvider';
import ScrollAnchorFixer from '@/components/common/ScrollAnchorFixer';
import { buildMetadataFromSeo, fetchSeoObject, fetchSeoPageObject, mergeSeoPageIntoSeo } from '@/seo/server';
import JsonLd from '@/seo/JsonLd';
import { graph, org, website } from '@/seo/jsonld';
import type { PublicMenuItemDto } from '@/integrations/shared';
import { getBrandServer } from '@/lib/brand.server';

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

async function fetchFooterSections(locale: string) {
  try {
    const url = `${API_BASE}/footer_sections?is_active=true&order=display_order.asc&locale=${encodeURIComponent(locale)}`;
    const res = await fetch(url, { next: { revalidate: 60, tags: ['footer_sections'] } });
    if (!res.ok) return [];
    const json = await res.json();
    const items = Array.isArray(json) ? json : (json?.items ?? json?.data ?? []);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

async function fetchFooterMenuItems(locale: string): Promise<PublicMenuItemDto[]> {
  try {
    const url = `${API_BASE}/menu_items?location=footer&is_active=true&locale=${encodeURIComponent(locale)}`;
    const res = await fetch(url, { next: { revalidate: 60, tags: ['menu_items_footer'] } });
    if (!res.ok) return [];
    const json = await res.json();
    const items = Array.isArray(json) ? json : (json?.items ?? json?.data ?? []);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

async function fetchCompanyBrand() {
  try {
    const res = await fetch(`${API_BASE}/site_settings/company_brand`, {
      next: { revalidate: 300, tags: ['site-settings', 'company_brand'] },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.value && typeof json.value === 'object' ? json.value : null;
  } catch {
    return null;
  }
}

// 2026-04-27 vizyon revize: Cinzel (display) + Fraunces (editorial body) + Manrope (UI sans)
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '600', '700'],
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  fallback: ['Georgia', 'serif'],
});

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '600'],
  fallback: ['Georgia', 'serif'],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const [seo, homeSeo, brand] = await Promise.all([
    fetchSeoObject(locale),
    fetchSeoPageObject(locale, 'home'),
    getBrandServer(),
  ]);
  
  const mergedSeo = mergeSeoPageIntoSeo(seo, homeSeo);
  
  // Marka ayarlarını SEO objesine enjekte et (OG/Logo fallback için)
  if (brand.og_image && !mergedSeo.og_image) mergedSeo.og_image = brand.og_image;
  if (brand.name && !mergedSeo.site_name) mergedSeo.site_name = brand.name;

  return await buildMetadataFromSeo(mergedSeo, {
    locale,
    pathname: '/',
  });
}

// Site URL ve sosyal linkler getBrandServer()'dan gelecek

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // SSR fetch: header + footer menu items + brand settings (paralel)
  const [initialMenuItems, initialFooterSections, initialFooterMenuItems, brand, companyBrand] = await Promise.all([
    fetchHeaderMenuItems(locale),
    fetchFooterSections(locale),
    fetchFooterMenuItems(locale),
    getBrandServer(),
    fetchCompanyBrand(),
  ]);

  const SITE_URL = brand.public_url || 'https://goldmoodastro.com';
  const socialLinks = brand.social ? Object.values(brand.social).filter(Boolean) : [];
  const companyPhone = typeof companyBrand?.phone === 'string' ? companyBrand.phone : undefined;
  const companyEmail = typeof companyBrand?.email === 'string' ? companyBrand.email : undefined;
  const companyAddress = typeof companyBrand?.address === 'string' ? companyBrand.address : undefined;

  const jsonLdData = graph([
    org({
      id: `${SITE_URL}/#org`,
      name: brand.name || 'GoldMoodAstro',
      url: SITE_URL,
      logo: brand.logo_light || `${SITE_URL}/logo/logo.png`,
      sameAs: socialLinks,
      description: brand.tagline || "Turkiye'nin astroloji, tarot ve numeroloji danismanlik platformu.",
      priceRange: '₺149-₺3500',
      areaServed: 'TR',
      telephone: companyPhone,
      email: companyEmail,
      address: companyAddress
        ? {
            streetAddress: companyAddress,
            addressLocality: 'İstanbul',
            addressRegion: 'İstanbul',
            addressCountry: 'TR',
          }
        : undefined,
      contactPoint: companyPhone || companyEmail
        ? [{
            telephone: companyPhone,
            email: companyEmail,
            contactType: 'customer support',
            areaServed: 'TR',
            availableLanguage: ['tr', 'en'],
          }]
        : undefined,
    }),
    website({
      id: `${SITE_URL}/#website`,
      name: brand.name || 'GoldMoodAstro',
      url: SITE_URL,
      publisherId: `${SITE_URL}/#org`,
      searchUrlTemplate: `${SITE_URL}/${locale}/consultants?q={q}`,
    }),
  ]);

  return (
    <ThemeProvider>
      <div className={`font-sans antialiased text-(--gm-text) bg-(--gm-bg) ${manrope.variable} ${fraunces.variable} ${cinzel.variable}`}>
        <JsonLd data={jsonLdData} id="site-graph" />
        <ScrollAnchorFixer />
        <Providers>
          {/* 2026-07-20: children BURADA <Suspense> icindeydi. Next kabugu hemen
              gonderip HTTP 200'u kesinlestiriyordu; bu yuzden sayfalardaki
              notFound() dogru ekrani render etse de 404 URETEMIYORDU.
              Minimal test (senkron, dogrudan notFound() cagiran sayfa) da 200
              donunce kaynak kesinlesti. Suspense kaldirildi. */}
          <ClientLayout
            locale={locale}
            initialMenuItems={initialMenuItems}
            initialFooterSections={initialFooterSections}
            initialFooterMenuItems={initialFooterMenuItems}
          >
            {children}
          </ClientLayout>
        </Providers>
      </div>
    </ThemeProvider>
  );
}
