import React from 'react';
import type { Metadata } from 'next';
import ZodiacFinderQuiz from '@/components/containers/zodiac/ZodiacFinderQuiz';
import { buildPageMetadata } from '@/seo/server';

export const revalidate = 86400;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'burcunu-ogren',
    pathname: '/burcunu-ogren',
    fallback: {
      title: 'Burcunu Öğren — GoldMoodAstro',
      description: 'Doğum gününü seçerek güneş burcunu, elementini ve sana yakın astrolojik temaları hızlıca keşfet.',
    },
  });
}

export default function BurcunuOgrenPage() {
  return (
    <main className="min-h-screen bg-background pt-20">
      <ZodiacFinderQuiz />
    </main>
  );
}
