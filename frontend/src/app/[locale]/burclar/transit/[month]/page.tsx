import React from 'react';
import ZodiacTransit from '@/components/containers/zodiac/ZodiacTransit';
import { Metadata } from 'next';

type Props = {
  params: Promise<{ month: string; locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { month } = await params;
  const [year, monthNum] = month.split('-');
  const dateObj = new Date(parseInt(year), parseInt(monthNum) - 1);
  const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return {
    title: `${monthLabel} Zodiac Transits and Sky Report — GoldMoodAstro`,
    description: `What awaits the zodiac signs in ${monthLabel}? Planetary transits, new moon and full moon effects. Monthly sky report for all 12 signs.`,
  };
}

import PageContainer from '@/components/common/PageContainer';

export default function TransitPage() {
  return (
    <PageContainer as="main" width="wide" className="min-h-screen bg-(--gm-bg)" withHeaderOffset>
      <ZodiacTransit />
    </PageContainer>
  );
}
