import React from 'react';
import DreamResultClient from './DreamResultClient';
import type { Metadata } from 'next';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://goldmoodastro.com/api').replace(/\/$/, '');

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  
  try {
    const res = await fetch(`${API_BASE}/dreams/reading/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('Failed to fetch');
    const { data } = await res.json();

    const symbols = data.symbols.map((s: any) => s.name).join(', ');
    const title = `Dream Interpretation — ${symbols} — GoldMoodAstro`;
    const description = `${data.symbols.length} symbols in your dream with detailed AI interpretation. ${symbols} and more.`;
    const ogImageUrl = `https://goldmoodastro.com/${locale}/ruya-tabiri/result/${id}/opengraph-image`;

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
      title: 'Dream Interpretation — GoldMoodAstro',
      description: 'Detailed dream interpretation.',
    };
  }
}

import PageContainer from '@/components/common/PageContainer';

export default function DreamResultPage() {
  return (
    <PageContainer width="full" pad="none" className="bg-(--gm-bg)">
      <DreamResultClient />
    </PageContainer>
  );
}
