import React from 'react';
import SynastryResultClient from './SynastryResultClient';
import type { Metadata } from 'next';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://goldmoodastro.com/api').replace(/\/$/, '');

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  
  try {
    const res = await fetch(`${API_BASE}/synastry/reading/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('Failed to fetch');
    const { data } = await res.json();

    const partnerName = data.partner_data?.name ?? 'Partner';
    const score = data.result?.score ?? 0;
    const title = `Aşk Uyumu Raporu — %${score} Uyum — GoldMoodAstro`;
    const description = `${partnerName} ile olan kozmik uyumunuzun detaylı analizi. Yıldızların aşkınıza olan etkisini keşfedin.`;
    const ogImageUrl = `https://goldmoodastro.com/${locale}/sinastri/result/${id}/opengraph-image`;

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
      title: 'Aşk Uyumu Raporu — GoldMoodAstro',
      description: 'Detaylı sinastri (uyum) analizi.',
    };
  }
}

export default function SynastryResultPage() {
  return (
    <main className="min-h-screen bg-background pt-20">
      <SynastryResultClient />
    </main>
  );
}
