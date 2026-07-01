import type { Metadata } from 'next';
import DailyPageClient from './DailyPageClient';
import Banner from '@/layout/banner/Breadcrum';

export const metadata: Metadata = {
  title: 'Today Reading — GoldMoodAstro',
  description: 'Daily astrology reading prepared according to your natal chart.',
};

export default async function DailyPage({ params }: { params: Promise<{ locale: string }> }) {
  await params;

  return (
    <>
      <Banner title="Daily Reading" />
      <DailyPageClient />
    </>
  );
}
