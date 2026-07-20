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
      title: 'Yildizname (Ebced) — Symbolic Reading with Your Name and Mother Name',
      description: 'Turkish-Islamic yildizname tradition: name + mother name + birth year to ebced number and 28 lunar mansions. Calculate free and add premium chart-blended interpretation.',
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
