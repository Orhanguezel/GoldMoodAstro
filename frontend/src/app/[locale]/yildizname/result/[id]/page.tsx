import { Metadata, ResolvingMetadata } from 'next';
import YildiznameResultClient from './YildiznameResultClient';
import { fetchYildiznameReading } from './fetchYildizname.server';

type Props = {
  params: Promise<{ id: string; locale: string }>;
};

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { id, locale } = await params;
  const result = await fetchYildiznameReading(id);

  if (!result) {
    return {
      title: 'Yildizname Result — GoldMoodAstro',
    };
  }

  const name = result.name;
  const menzil = result.menzil?.name_tr || '';

  const ogImageUrl = `https://goldmoodastro.com/${locale}/yildizname/result/${id}/opengraph-image`;

  return {
    title: `Yildizname Analysis for ${name}: ${menzil} — GoldMoodAstro`,
    description: result.result_text?.substring(0, 160) + '...',
    openGraph: {
      title: `${name} Yildizname Mansion: ${menzil}`,
      description: `Private yildizname analysis prepared for ${name} with ebced calculation.`,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: name }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Yildizname Analysis for ${name}`,
      description: `${menzil} mansion analysis.`,
      images: [ogImageUrl],
    },
  };
}

import PageContainer from '@/components/common/PageContainer';
import Banner from '@/layout/banner/Breadcrum';

const BANNER: Record<string, string> = {
  tr: 'Yıldızname Sonucu',
  en: 'Yildizname Result',
  de: 'Yildizname-Ergebnis',
};

export default async function YildiznameResultPage({ params }: Props) {
  const { locale } = await params;
  // Sayfa kendi arka planını (bg-deep) basıyordu; kap max-width'li olduğu için
  // sağda solda gövde rengi kalıyor ve ortada koyu bir şerit görünüyordu.
  // Diğer sayfalarla aynı düzen: breadcrumb banner + gövde rengi + afterBanner.
  return (
    <>
      <Banner title={BANNER[locale] ?? BANNER.en} />
      <PageContainer className="bg-(--gm-bg)" pad="afterBanner">
        <YildiznameResultClient />
      </PageContainer>
    </>
  );
}
