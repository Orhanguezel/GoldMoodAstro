import React from 'react';
import DreamHub from '@/components/containers/dreams/DreamHub';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'ruya-tabiri',
    pathname: '/ruya-tabiri',
    fallback: {
      title: 'Ücretsiz Rüya Tabiri — Bilinçaltınızın Gizli Dili — GoldMoodAstro',
      description: 'Gördüğünüz rüyaları anlatın, yapay zeka psikolojik arketipler ve kadim sembolojiyle rüyanızı analiz etsin. Derinlemesine rüya yorumları.',
    },
  });
}

import PageContainer from '@/components/common/PageContainer';

export default function DreamsPage() {
  return (
    <PageContainer className="min-h-screen bg-(--gm-bg)" verticalPadding="large">
      <DreamHub />
    </PageContainer>
  );
}
