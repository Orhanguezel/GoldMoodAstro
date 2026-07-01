import React from 'react';
import CoffeeResultClient from './CoffeeResultClient';
import type { Metadata } from 'next';
import PageContainer from '@/components/common/PageContainer';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://goldmoodastro.com/api').replace(/\/$/, '');

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  
  try {
    const res = await fetch(`${API_BASE}/coffee/reading/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('Failed to fetch');
    const { data } = await res.json();

    const symbols = data.symbols.map((s: any) => s.name).join(', ');
    const title = `Coffee Reading — ${symbols} — GoldMoodAstro`;
    const description = `${data.symbols.length} symbols in your cup with detailed AI interpretation. ${symbols} and more.`;
    const ogImageUrl = `https://goldmoodastro.com/${locale}/kahve-fali/result/${id}/opengraph-image`;

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
      title: 'Coffee Reading — GoldMoodAstro',
      description: 'Detailed coffee reading interpretation.',
    };
  }
}

export default function CoffeeResultPage() {
  return (
    <PageContainer verticalPadding="large">
      <CoffeeResultClient />
    </PageContainer>
  );
}
