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
      title: 'Yıldızname (Ebced) — Adın ve Anne Adınla 28 Ay Menzilinde Sembolik Yorum',
      description: 'Türk-İslam yıldızname geleneği: ad + anne adı + doğum yılı → ebced sayısı → 28 Ay Menzili. Ücretsiz hesapla, premium harita harmanlanmış yorum ekle.',
    },
  });
}

export default function YildiznameLayout({ children }: Props) {
  return <>{children}</>;
}
