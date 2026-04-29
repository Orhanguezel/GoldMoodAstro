import React from 'react';
import BigThree from '@/components/containers/zodiac/BigThree';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const ogImageUrl = `https://goldmoodastro.com/${locale}/big-three/opengraph-image`;

  return {
    title: 'Big Three — Güneş, Ay ve Yükselen Burç Kartı Oluştur',
    description: 'Kozmik kimliğinizin en önemli üç parçasını keşfedin: Güneş (Ego), Ay (Duygular) ve Yükselen (Dış Dünya). Şık tasarımınızla paylaşın.',
    openGraph: {
      title: 'Big Three — Kozmik Kimliğini Keşfet',
      description: 'Güneş, Ay ve Yükselen burcunuzla kozmik kimlik kartınızı oluşturun.',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: 'Big Three' }],
      type: 'website',
      siteName: 'GoldMoodAstro',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Big Three — Kozmik Kimliğini Keşfet',
      description: 'Güneş, Ay ve Yükselen burcunuzla kozmik kimlik kartınızı oluşturun.',
      images: [ogImageUrl],
    },
  };
}

export default function BigThreePage() {
  return (
    <main className="min-h-screen bg-background pt-20">
      <BigThree />
    </main>
  );
}
