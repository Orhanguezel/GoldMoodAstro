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

  // 2026-07-20 (GSC): gecersiz burc slug'i -> noindex (bkz. [sign]/page.tsx notu).
  if (!VALID_ZODIAC_SIGNS.has(sign)) {
    return { title: 'Not found', robots: { index: false, follow: false } };
  }
  const label = zodiacLabels[sign] || sign;
  return buildPageMetadata({
    locale,
    pageKey: 'burclar-ask',
    pathname: `/burclar/${sign}/ask`,
    fallback: {
      title: `${label} Love Compatibility and Relationships`,
      description: `${label} love life, romantic compatibility and relationship character.`,
    },
  });
}

import PageContainer from '@/components/common/PageContainer';

export default async function SignLovePage({ params }: Props) {
  const { sign, locale } = await params;
  if (!VALID_ZODIAC_SIGNS.has(sign)) notFound();
  const label = zodiacLabels[sign] || sign;
  const info = (await fetchZodiacInfoServer(sign, locale)) ?? buildZodiacFallbackInfo(sign, label, locale);

  return (
    <PageContainer width="full" pad="none" className="bg-(--gm-bg)">
      <ZodiacDetail initialTab="love" initialInfo={info} sectionFocus="love" />
    </PageContainer>
  );
}
