import React from 'react';
import ZodiacCompatibility from '@/components/containers/zodiac/ZodiacCompatibility';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/seo/server';

type Props = {
  params: Promise<{ pair: string; locale: string }>;
};

const labels: Record<string, string> = {
  aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer',
  leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio',
  sagittarius: 'Sagittarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces'
};

const VALID_SIGNS = new Set(Object.keys(labels));

/**
 * Turkish slug alias to English key mapping.
 * Accepts English and Turkish slugs.
 */
const TR_TO_EN: Record<string, string> = {
  koc: 'aries', 'ko\u00e7': 'aries',
  boga: 'taurus', 'bo\u011fa': 'taurus',
  ikizler: 'gemini',
  yengec: 'cancer', 'yenge\u00e7': 'cancer',
  aslan: 'leo',
  basak: 'virgo', 'ba\u015fak': 'virgo',
  terazi: 'libra',
  akrep: 'scorpio',
  yay: 'sagittarius',
  oglak: 'capricorn', 'o\u011flak': 'capricorn',
  kova: 'aquarius',
  balik: 'pisces', 'bal\u0131k': 'pisces',
};

function normalizeSign(token: string): string | null {
  const lower = token.trim().toLowerCase();
  if (VALID_SIGNS.has(lower)) return lower;
  if (TR_TO_EN[lower]) return TR_TO_EN[lower];
  return null;
}

function parsePair(pair: string): { signA: string; signB: string } | null {
  const parts = pair.split('-');
  if (parts.length !== 2) return null;
  const a = normalizeSign(parts[0]);
  const b = normalizeSign(parts[1]);
  if (!a || !b) return null;
  return { signA: a, signB: b };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pair, locale } = await params;
  const parsed = parsePair(pair);
  if (!parsed) {
    return buildPageMetadata({
      locale,
      pageKey: 'burclar-pair-uyumu',
      pathname: `/burclar/uyum/${pair}`,
      fallback: { title: 'Zodiac Compatibility', description: 'Compatibility analysis between two zodiac signs.' },
    });
  }
  const labelA = labels[parsed.signA];
  const labelB = labels[parsed.signB];
  const ogImageUrl = `https://goldmoodastro.com/${locale}/burclar/uyum/${parsed.signA}-${parsed.signB}/opengraph-image`;

  return buildPageMetadata({
    locale,
    pageKey: 'burclar-pair-uyumu',
    pathname: `/burclar/uyum/${parsed.signA}-${parsed.signB}`,
    fallback: {
      title: `${labelA} and ${labelB} Zodiac Compatibility Analysis`,
      description: `Love, friendship and work compatibility between ${labelA} and ${labelB}. Discover the passion and dynamics between both signs.`,
      ogImage: ogImageUrl,
    },
  });
}

import PageContainer from '@/components/common/PageContainer';

export default async function CompatibilityPage({ params }: Props) {
  const { pair } = await params;
  const parsed = parsePair(pair);
  if (!parsed) notFound();

  return (
    <PageContainer className="bg-(--gm-bg)" verticalPadding="large">
      <ZodiacCompatibility signA={parsed.signA} signB={parsed.signB} />
    </PageContainer>
  );
}
