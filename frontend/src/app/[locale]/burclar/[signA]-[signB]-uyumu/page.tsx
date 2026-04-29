import React from 'react';
import ZodiacCompatibility from '@/components/containers/zodiac/ZodiacCompatibility';
import { Metadata } from 'next';

type Props = {
  params: Promise<{ signA: string; signB: string; locale: string }>;
};

const labels: Record<string, string> = {
  aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
  leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
  sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık'
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { signA, signB } = await params;
  const labelA = labels[signA] || signA;
  const labelB = labels[signB] || signB;
  const ogImageUrl = `https://goldmoodastro.com/${(await params).locale}/burclar/${signA}-${signB}-uyumu/opengraph-image`;

  return {
    title: `${labelA} ve ${labelB} Burç Uyumu Analizi — GoldMoodAstro`,
    description: `${labelA} burcu ile ${labelB} burcu arasındaki aşk, arkadaşlık ve iş uyumu. İki burç arasındaki tutku ve dinamikleri keşfedin.`,
    openGraph: {
      title: `${labelA} ve ${labelB} Burç Uyumu`,
      description: `${labelA} ile ${labelB} arasındaki aşk, arkadaşlık ve iş uyumu.`,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${labelA} ve ${labelB} Uyumu` }],
      type: 'article',
      siteName: 'GoldMoodAstro',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${labelA} ve ${labelB} Burç Uyumu`,
      description: `${labelA} ve ${labelB} burcu arasındaki uyumu keşfedin.`,
      images: [ogImageUrl],
    },
  };
}

export default function CompatibilityPage() {
  return (
    <main className="min-h-screen bg-background pt-20">
      <ZodiacCompatibility />
    </main>
  );
}
