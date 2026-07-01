import React from 'react';
import BecomeConsultantPage from '@/components/containers/become-consultant/BecomeConsultantPage';
import { Metadata } from 'next';
import PageContainer from '@/components/common/PageContainer';
import BecomeConsultantHero from '@/components/common/public/BecomeConsultantHero';

export const metadata: Metadata = {
  title: 'Become a Consultant | GoldMoodAstro',
  description: 'Join GoldMoodAstro, share your expertise with thousands of users, and earn income.',
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Page({ params }: Props) {
  const { locale } = await params;
  return (
    <>
      <BecomeConsultantHero locale={locale} />
      <PageContainer width="wide" pad="none">
        <BecomeConsultantPage />
      </PageContainer>
    </>
  );
}
