import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ZodiacMeditationPlayer from '@/components/containers/zodiac/ZodiacMeditationPlayer';
import { getZodiacMeta } from '@/lib/zodiac/signs';
import type { ZodiacSign } from '@/types/common';
import { buildPageMetadata } from '@/seo/server';

export const revalidate = 86400;

type Props = {
  params: Promise<{ sign: string; locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sign, locale } = await params;
  const meta = getZodiacMeta(sign);
  return buildPageMetadata({
    locale,
    pageKey: 'burclar-meditasyon',
    pathname: `/burclar/${sign}/meditasyon`,
    fallback: {
      title: meta ? `${meta.label} Meditasyonu ve Affirmasyonları` : 'Burç Meditasyonu',
      description: meta
        ? `${meta.label} burcu için kısa sesli meditasyon, günlük affirmasyonlar ve element odaklı sakinleşme pratiği.`
        : 'Burç odaklı sesli meditasyon ve günlük affirmasyonlar.',
    },
  });
}

export default async function ZodiacMeditationPage({ params }: Props) {
  const { sign } = await params;
  const meta = getZodiacMeta(sign);
  if (!meta) notFound();

  return (
    <main className="min-h-screen bg-[var(--gm-bg)] pt-32">
      <ZodiacMeditationPlayer signKey={meta.key as ZodiacSign} />
    </main>
  );
}
