import React from 'react';
import BigThree from '@/components/containers/zodiac/BigThree';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const ogImageUrl = `https://goldmoodastro.com/${locale}/big-three/opengraph-image`;

  return buildPageMetadata({
    locale,
    pageKey: 'big-three',
    pathname: '/big-three',
    fallback: {
      title: 'Big Three — Güneş, Ay ve Yükselen Burç Kartı',
      description: 'Kozmik kimliğinizin en önemli üç parçasını keşfedin: Güneş (Ego), Ay (Duygular) ve Yükselen (Dış Dünya).',
      ogImage: ogImageUrl,
    },
  });
}

export default function BigThreePage() {
  return (
    <main className="min-h-screen bg-[var(--gm-bg)] pt-32">
      <BigThree />
    </main>
  );
}
