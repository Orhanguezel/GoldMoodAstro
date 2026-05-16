import React from 'react';
import BecomeConsultantPage from '@/components/containers/become-consultant/BecomeConsultantPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Danışman Ol | GoldMoodAstro',
  description: 'GoldMoodAstro ailesine katılın, uzmanlığınızı binlerce kullanıcıyla paylaşın ve kazanç elde edin.',
};

import PageContainer from '@/components/common/PageContainer';

export default function Page() {
  return (
    <PageContainer width="wide" pad="none">
      <BecomeConsultantPage />
    </PageContainer>
  );
}
