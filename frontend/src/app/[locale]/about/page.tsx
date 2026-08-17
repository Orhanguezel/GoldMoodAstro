import type { Metadata } from 'next';
import AboutPageContent from '@/components/containers/about/AboutPageContent';
import PageContainer from '@/components/common/PageContainer';
import Banner from '@/layout/banner/Breadcrum';
import { localizedPath } from '@/integrations/shared';

type Props = {
  params: Promise<{ locale: string }>;
};

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');

const META = {
  tr: {
    title: 'Hakkımızda | GoldMoodAstro',
    description:
      'GoldMoodAstro misyonunu, kurucu hikayesini, danışman doğrulama yaklaşımını ve güvenli ruhsal danışmanlık deneyimini keşfedin.',
    banner: 'Hakkımızda',
  },
  en: {
    title: 'About GoldMoodAstro',
    description:
      'Learn about GoldMoodAstro, our founder story, consultant verification approach and responsible spiritual guidance experience.',
    banner: 'About',
  },
  de: {
    title: 'Über GoldMoodAstro',
    description:
      'Erfahren Sie mehr über GoldMoodAstro, unsere Gründerstory, Beraterprüfung und verantwortungsvolle spirituelle Beratung.',
    banner: 'Über uns',
  },
} as const;

function copyFor(locale: string) {
  if (locale === 'tr' || locale === 'de') return META[locale];
  return META.en;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const copy = copyFor(locale);
  const canonical = `${SITE_URL}${localizedPath(locale, '/about', 'tr')}`;
  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical,
      languages: {
        tr: `${SITE_URL}${localizedPath('tr', '/about', 'tr')}`,
        en: `${SITE_URL}${localizedPath('en', '/about', 'tr')}`,
        de: `${SITE_URL}${localizedPath('de', '/about', 'tr')}`,
        'x-default': `${SITE_URL}${localizedPath('tr', '/about', 'tr')}`,
      },
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: canonical,
      siteName: 'GoldMoodAstro',
      type: 'website',
    },
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const copy = copyFor(locale);

  return (
    <>
      <Banner title={copy.banner} />
      <PageContainer pad="afterBanner">
        <AboutPageContent />
      </PageContainer>
    </>
  );
}
