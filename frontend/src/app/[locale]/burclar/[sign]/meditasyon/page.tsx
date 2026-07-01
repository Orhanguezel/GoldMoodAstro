import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ZodiacMeditationPlayer from '@/components/containers/zodiac/ZodiacMeditationPlayer';
import PageContainer from '@/components/common/PageContainer';
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
      title: meta ? `${meta.label} Meditation and Affirmations` : 'Zodiac Meditation',
      description: meta
        ? `Short audio meditation, daily affirmations and element-focused calming practice for ${meta.label}.`
        : 'Zodiac-focused audio meditation and daily affirmations.',
    },
  });
}

export default async function ZodiacMeditationPage({ params }: Props) {
  const { sign } = await params;
  const meta = getZodiacMeta(sign);
  if (!meta) notFound();

  return (
    <PageContainer width="full" pad="none" className="bg-(--gm-bg)">
      <ZodiacMeditationPlayer signKey={meta.key as ZodiacSign} />
    </PageContainer>
  );
}
