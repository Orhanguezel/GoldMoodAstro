import type { Metadata } from 'next';
import DailyPageClient from './DailyPageClient';
import Banner from '@/layout/banner/Breadcrum';

export const metadata: Metadata = {
  title: 'Bugünün Yorumu — GoldMoodAstro',
  description: 'Natal haritanıza göre hazırlanan günlük astroloji yorumu.',
};

export default async function DailyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <>
      <Banner title={locale === 'tr' ? 'Günlük Yorum' : 'Daily Reading'} />
      <DailyPageClient />
    </>
  );
}
