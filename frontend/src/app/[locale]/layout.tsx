import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Cormorant_Garamond, Outfit } from 'next/font/google';

import { Providers } from '../providers';
import ClientLayout from '../ClientLayout';
import { buildMetadataFromSeo, fetchSeoObject } from '@/seo/server';
import JsonLd from '@/seo/JsonLd';
import { graph, org, website, localBusiness } from '@/seo/jsonld';

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.energetische-massage-bonn.de';

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
      name: 'Energetische Massage',
      url: SITE_URL,
      logo: 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1773003525/site-media/ChatGPT_Image_8_Mar_2026_21_57_57.webp',
    }),
    website({
      id: `${SITE_URL}/#website`,
      name: 'Energetische Massage Bonn',
      url: SITE_URL,
      publisherId: `${SITE_URL}/#org`,
    }),
    localBusiness({
      id: `${SITE_URL}/#business`,
      name: 'Energetische Massage Bonn',
      alternateName: 'Königs Massage',
      description:
        locale === 'tr'
          ? 'Bonn\'da enerjetik masaj seansları: bilinçli dokunuş, net sınırlar ve derin gevşeme. Randevu ile.'
          : locale === 'en'
            ? 'Energetic massage sessions in Bonn: mindful touch, clear boundaries and deep relaxation. By appointment.'
            : 'Energetische Massage in Bonn – achtsame Berührung, klare Grenzen und tiefe Entspannung. Termine nach Vereinbarung.',
      url: SITE_URL,
      telephone: '+49 176 41107158',
      email: 'info@energetische-massage-bonn.de',
      address: {
        addressLocality: 'Bonn',
        addressRegion: 'NRW',
        addressCountry: 'DE',
      },
      geo: { latitude: 50.7374, longitude: 7.0982 },
      founder: { name: 'Anastasia König' },
      priceRange: '€€',
      image: 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1773003525/site-media/ChatGPT_Image_8_Mar_2026_21_57_57.webp',
      serviceType: 'Energetische Entspannungsmassage',
      areaServed: 'Bonn',
    }),
  ]);

  return (
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
  );
}
