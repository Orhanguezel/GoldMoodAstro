import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'sinastri',
    pathname: '/sinastri',
    fallback: {
      title: 'Synastry Analysis — Relationship Compatibility Report — GoldMoodAstro',
      description: 'Calculate compatibility between two birth charts with Swiss Ephemeris and get a romantic, honest and perspective-giving AI analysis. Quick match, manual report and invite mode.',
    },
  });
}

export default function SinastriLayout({ children }: Props) {
  return <>{children}</>;
}
