import type { Metadata } from 'next';
import { Suspense } from 'react';

import PricingPageClient from './PricingPageClient';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === 'tr' ? 'Fiyatlandırma | GoldMoodAstro' : 'Pricing | GoldMoodAstro',
    description:
      locale === 'tr'
        ? 'Sesli ve görüntülü danışmanlık karşılaştırmalı ücretler, abonelik planları ve şeffaf ödeme bilgileri.'
        : 'Voice and video consultation pricing, subscription plans, and transparent checkout details.',
  };
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;

  return (
    <Suspense fallback={null}>
      <PricingPageClient locale={locale} />
    </Suspense>
  );
}
