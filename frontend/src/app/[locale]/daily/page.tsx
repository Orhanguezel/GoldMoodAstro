import type { Metadata } from 'next';
import DailyPageClient from './DailyPageClient';
import Banner from '@/layout/banner/Breadcrum';

export const metadata: Metadata = {
  title: 'Today Reading — GoldMoodAstro',
  description: 'Daily astrology reading prepared according to your natal chart.',
};

export default async function DailyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // 2026-07-20: baslik Turkce sayfada bile Ingilizce sabitti.
  const BANNER: Record<string, string> = {
    tr: 'Günlük Yorum',
    en: 'Daily Reading',
    de: 'Tagesdeutung',
  };

  return (
    <>
      <Banner title={BANNER[locale] ?? BANNER.en} />
      <DailyPageClient />
    </>
  );
}
