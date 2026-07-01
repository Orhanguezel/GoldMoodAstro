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
      title: 'Free Dream Interpretation — Hidden Language of the Subconscious — GoldMoodAstro',
      description: 'Describe your dreams and let AI analyze them with psychological archetypes and ancient symbolism. In-depth dream readings.',
    },
  });
}

import PageContainer from '@/components/common/PageContainer';
import Banner from '@/layout/banner/Breadcrum';

export default async function DreamsPage({ params }: Props) {
  await params;

  return (
    <>
      <Banner title="Dream Interpretation" />
      <PageContainer className="min-h-screen bg-(--gm-bg)" verticalPadding="large">
        <DreamHub />
      </PageContainer>
    </>
  );
}
