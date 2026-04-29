import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ZodiacMeditationPlayer from '@/components/containers/zodiac/ZodiacMeditationPlayer';
import { getZodiacMeta } from '@/lib/zodiac/signs';
import type { ZodiacSign } from '@/types/common';

export const revalidate = 86400;

type Props = {
  params: Promise<{ sign: string; locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sign } = await params;
  const meta = getZodiacMeta(sign);
  if (!meta) {
    return {
      title: 'Burç Meditasyonu — GoldMoodAstro',
    };
  }
  return {
    title: `${meta.label} Meditasyonu ve Affirmasyonları — GoldMoodAstro`,
    description: `${meta.label} burcu için kısa sesli meditasyon, günlük affirmasyonlar ve element odaklı sakinleşme pratiği.`,
  };
}

export default async function ZodiacMeditationPage({ params }: Props) {
  const { sign } = await params;
  const meta = getZodiacMeta(sign);
  if (!meta) notFound();

  return (
    <main className="min-h-screen bg-background pt-20">
      <ZodiacMeditationPlayer signKey={meta.key as ZodiacSign} />
    </main>
  );
}
