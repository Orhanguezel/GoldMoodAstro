import React from 'react';
import TarotHub from '@/components/containers/tarot/TarotHub';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'tarot',
    pathname: '/tarot',
    fallback: {
      title: 'Ücretsiz Tarot Falı ve Kart Anlamları — GoldMoodAstro',
      description: 'Tek kart, üç kart veya Kelt Haçı açılımı ile Tarot rehberliğini keşfedin. Yapay zeka destekli derinlemesine kart yorumları.',
    },
  });
}

export default function TarotPage() {
  return (
    <main className="min-h-screen bg-background pt-20">
      <TarotHub />
    </main>
  );
}
