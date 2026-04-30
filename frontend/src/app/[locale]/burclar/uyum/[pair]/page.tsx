import React from 'react';
import ZodiacCompatibility from '@/components/containers/zodiac/ZodiacCompatibility';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/seo/server';

type Props = {
  params: Promise<{ pair: string; locale: string }>;
};

const labels: Record<string, string> = {
  aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
  leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
  sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık'
};

const VALID_SIGNS = new Set(Object.keys(labels));

/**
 * Türkçe slug → İngilizce key mapping (URL'lerde "koc-yengec" gibi yazılırsa).
 * Hem İngilizce hem Türkçe slug'ları kabul eder.
 */
const TR_TO_EN: Record<string, string> = {
  koc: 'aries', 'koç': 'aries',
  boga: 'taurus', 'boğa': 'taurus',
  ikizler: 'gemini',
  yengec: 'cancer', 'yengeç': 'cancer',
  aslan: 'leo',
  basak: 'virgo', 'başak': 'virgo',
  terazi: 'libra',
  akrep: 'scorpio',
  yay: 'sagittarius',
  oglak: 'capricorn', 'oğlak': 'capricorn',
  kova: 'aquarius',
  balik: 'pisces', 'balık': 'pisces',
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
      fallback: { title: 'Burç Uyumu', description: 'İki burç arası uyum analizi.' },
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
      title: `${labelA} ve ${labelB} Burç Uyumu Analizi`,
      description: `${labelA} burcu ile ${labelB} burcu arasındaki aşk, arkadaşlık ve iş uyumu. İki burç arasındaki tutku ve dinamikleri keşfedin.`,
      ogImage: ogImageUrl,
    },
  });
}

export default async function CompatibilityPage({ params }: Props) {
  const { pair } = await params;
  const parsed = parsePair(pair);
  if (!parsed) notFound();

  return (
    <main className="min-h-screen bg-[var(--gm-bg)] pt-32">
      <ZodiacCompatibility signA={parsed.signA} signB={parsed.signB} />
    </main>
  );
}
