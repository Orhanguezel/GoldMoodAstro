import React from 'react';
import CoffeeHub from '@/components/containers/coffee/CoffeeHub';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'kahve-fali',
    pathname: '/kahve-fali',
    fallback: {
      title: 'Ücretsiz Kahve Falı — Vision AI ile Gerçekçi Yorumlar — GoldMoodAstro',
      description: 'Fincanınızın fotoğrafını çekin, yapay zeka sembolleri saniyeler içinde analiz etsin. Geleneksel kahve falı deneyimi modern teknolojiyle buluşuyor.',
    },
  });
}

export default function CoffeePage() {
  return (
    <main className="min-h-screen bg-[var(--gm-bg)] pt-32">
      <CoffeeHub />
    </main>
  );
}
