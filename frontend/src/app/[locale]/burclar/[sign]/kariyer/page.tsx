export const revalidate = 86400;
import ZodiacDetail from '@/components/containers/zodiac/ZodiacDetail';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/seo/server';
import {
  VALID_ZODIAC_SIGNS,
  buildZodiacFallbackInfo,
  fetchZodiacInfoServer,
  zodiacLabels,
} from '@/lib/zodiac/pageInfo.server';

type Props = {
  params: Promise<{ sign: string; locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sign, locale } = await params;
  const label = zodiacLabels[sign] || sign;
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

export default async function SignCareerPage({ params }: Props) {
  const { sign, locale } = await params;
  if (!VALID_ZODIAC_SIGNS.has(sign)) notFound();
  const label = zodiacLabels[sign] || sign;
  const info = (await fetchZodiacInfoServer(sign, locale)) ?? buildZodiacFallbackInfo(sign, label, locale);

  return (
    <PageContainer width="full" pad="none" className="bg-(--gm-bg)">
      <ZodiacDetail initialTab="career" initialInfo={info} sectionFocus="career" />
    </PageContainer>
  );
}
