import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';
import PageContainer from '@/components/common/PageContainer';
import SeoLandingArticle from '@/components/seo/SeoLandingArticle';

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

export default async function YildiznameLayout({ children, params }: Props) {
  const { locale } = await params;
  return (
    <>
      {children}
      <PageContainer className="bg-(--gm-bg)" verticalPadding="large">
        <SeoLandingArticle type="yildizname" locale={locale} />
      </PageContainer>
    </>
  );
}
