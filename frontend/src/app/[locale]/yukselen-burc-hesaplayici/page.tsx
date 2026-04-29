import React from 'react';
import RisingSignCalculator from '@/components/containers/rising/RisingSignCalculator';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'yukselen-burc-hesaplayici',
    pathname: '/yukselen-burc-hesaplayici',
    fallback: {
      title: 'Yükselen Burç Hesaplama — Ücretsiz Doğum Haritası Analizi',
      description: 'Doğum saati ve yeri bilginizle yükselen burcunuzu saniyeler içinde öğrenin. Güneş, Ay ve Yükselen burç üçlüsü ile kozmik kimliğinizi keşfedin.',
    },
  });
}

export default function RisingCalculatorPage() {
  return (
    <main className="min-h-screen bg-background pt-20">
      <RisingSignCalculator />
    </main>
  );
}
