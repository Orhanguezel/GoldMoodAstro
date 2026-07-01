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
    const title = `Tarot Reading — ${cardNames} — ${brand.name}`;
    const description = `${data.cards.length} cards drawn for ${data.question || 'general guidance'} with detailed AI interpretation.`;
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
      title: `Tarot Reading — ${brand.name}`,
      description: 'Detailed tarot reading interpretation.',
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
