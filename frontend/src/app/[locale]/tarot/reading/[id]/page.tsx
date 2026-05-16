import React from 'react';
import TarotResultClient from './TarotResultClient';
import type { Metadata } from 'next';

import brand from '../../../../../../../config/brand.json';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || `${brand.public_url}/api`).replace(/\/$/, '');

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
    const title = `Tarot Falı — ${cardNames} — ${brand.name}`;
    const description = `${data.question || 'Genel rehberlik'} için çekilen ${data.cards.length} kart ve detaylı yapay zeka yorumu.`;
    const ogImageUrl = `${brand.public_url}/${locale}/tarot/reading/${id}/opengraph-image`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
        type: 'article',
        siteName: brand.name,
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
      title: `Tarot Falı — ${brand.name}`,
      description: 'Detaylı tarot falı yorumu.',
    };
  }
}

import PageContainer from '@/components/common/PageContainer';

export default function TarotReadingPage() {
  return (
    <PageContainer width="full" pad="none" className="bg-(--gm-bg)">
      <TarotResultClient />
    </PageContainer>
  );
}
