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
  return buildPageMetadata({
    locale,
    pageKey: 'burclar-kariyer',
    pathname: `/burclar/${sign}/kariyer`,
    fallback: {
      title: `${label} Career and Work Life`,
      description: `Best professions for ${label}, success strategies in work life and career readings.`,
    },
  });
}

import PageContainer from '@/components/common/PageContainer';

export default function SignCareerPage() {
  return (
    <PageContainer width="full" pad="none" className="bg-(--gm-bg)">
      <ZodiacDetail initialTab="career" />
    </PageContainer>
  );
}
