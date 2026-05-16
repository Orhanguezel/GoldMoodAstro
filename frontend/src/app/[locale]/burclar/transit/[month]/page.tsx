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
  const monthLabel = dateObj.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  return {
    title: `${monthLabel} Burç Geçişleri ve Gökyüzü Raporu — GoldMoodAstro`,
    description: `${monthLabel} ayında burçları neler bekliyor? Gezegen geçişleri, yeniay ve dolunay etkileri. 12 burç için aylık gökyüzü raporu.`,
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
