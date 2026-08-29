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
    pageKey: 'yildizname',
    pathname: '/yildizname',
    fallback: {
      title: 'Yildizname Calculator & Ebjed Reading | GoldMoodAstro',
      description: 'Create a personal Yildizname reading from your name, mother’s name and birth year. Explore Ebjed symbolism and 28 lunar mansions with responsible interpretation.',
    },
  });
}

// 2026-07-20: layout hem children'ı hem SeoLandingArticle'ı basıyordu; page.tsx de
// aynı bileşeni render ettiği için tüm editoryal içerik sayfada İKİ KEZ çıkıyordu
// (sayfa 8576px, başlıklar mükerrer). Diğer 7 landing sayfasında layout yok ya da
// içerik basmıyor — yıldızname de aynı yapıya getirildi: layout yalnızca metadata.
export default async function YildiznameLayout({ children }: Props) {
  return <>{children}</>;
}
