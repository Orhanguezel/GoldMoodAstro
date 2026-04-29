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
      title: 'Sinastri Analizi — İlişki Uyumu Raporu — GoldMoodAstro',
      description: 'İki doğum haritasının uyumunu Swiss Ephemeris ile hesapla, yapay zeka ile romantik, dürüst ve perspektif veren bir analiz al. Hızlı uyum + manuel rapor + davet modu.',
    },
  });
}

export default function SinastriLayout({ children }: Props) {
  return <>{children}</>;
}
