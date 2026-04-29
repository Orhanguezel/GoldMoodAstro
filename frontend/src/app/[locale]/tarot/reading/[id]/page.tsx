import React from 'react';
import TarotResultClient from './TarotResultClient';
import type { Metadata } from 'next';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://goldmoodastro.com/api').replace(/\/$/, '');

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  
  try {
    const res = await fetch(`${API_BASE}/tarot/reading/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('Failed to fetch');
    const { data } = await res.json();

    const cardNames = data.cards.map((c: any) => c.name).join(', ');
    const title = `Tarot Falı — ${cardNames} — GoldMoodAstro`;
    const description = `${data.question || 'Genel rehberlik'} için çekilen ${data.cards.length} kart ve detaylı yapay zeka yorumu.`;
    const ogImageUrl = `https://goldmoodastro.com/${locale}/tarot/reading/${id}/opengraph-image`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
        type: 'article',
        siteName: 'GoldMoodAstro',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl],
      },
    };
  } catch (err) {
    return {
      title: 'Tarot Falı — GoldMoodAstro',
      description: 'Detaylı tarot falı yorumu.',
    };
  }
}

export default function TarotReadingPage() {
  return (
    <main className="min-h-screen bg-background pt-20">
      <TarotResultClient />
    </main>
  );
}
