import React from 'react';
import BecomeConsultantPage from '@/components/containers/become-consultant/BecomeConsultantPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Danışman Ol | GoldMoodAstro',
  description: 'GoldMoodAstro ailesine katılın, uzmanlığınızı binlerce kullanıcıyla paylaşın ve kazanç elde edin.',
};

export default function Page() {
  return <BecomeConsultantPage />;
}
