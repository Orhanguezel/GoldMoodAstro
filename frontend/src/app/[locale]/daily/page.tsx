import type { Metadata } from 'next';
import DailyPageClient from './DailyPageClient';
import Banner from '@/layout/banner/Breadcrum';
import { buildPageMetadata } from '@/seo/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'daily',
    pathname: '/daily',
    fallback: {
      title: locale === 'tr' ? 'Günlük Yorum — GoldMoodAstro' : locale === 'de' ? 'Tagesdeutung — GoldMoodAstro' : 'Daily Reading — GoldMoodAstro',
      description: locale === 'tr'
        ? 'Doğum haritanıza göre hazırlanan günlük astroloji yorumu.'
        : locale === 'de'
          ? 'Tägliche astrologische Deutung auf Grundlage Ihres Geburtshoroskops.'
          : 'Daily astrology reading prepared according to your natal chart.',
    },
  });
}

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
