export const revalidate = 86400;
import ZodiacDetail from '@/components/containers/zodiac/ZodiacDetail';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';

type Props = {
  params: Promise<{ sign: string; locale: string }>;
};

const labels: Record<string, string> = {
  aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer',
  leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio',
  sagittarius: 'Sagittarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces'
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sign, locale } = await params;
  const label = labels[sign] || sign;
  const today = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const ogImageUrl = `https://goldmoodastro.com/${locale}/burclar/${sign}/bugun/opengraph-image`;

  return buildPageMetadata({
    locale,
    pageKey: 'burclar-bugun',
    pathname: `/burclar/${sign}/bugun`,
    fallback: {
      title: `${today} ${label} Daily Horoscope`,
      description: `${today} daily horoscope for ${label}. What awaits you today? Love, money and wellness guidance.`,
      ogImage: ogImageUrl,
    },
  });
}

import PageContainer from '@/components/common/PageContainer';

export default function SignDailyPage() {
  return (
    <PageContainer width="full" pad="none" className="bg-(--gm-bg)">
      <ZodiacDetail initialTab="daily" />
    </PageContainer>
  );
}
