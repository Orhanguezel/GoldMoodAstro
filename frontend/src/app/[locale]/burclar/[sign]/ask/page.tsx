export const revalidate = 86400;
import ZodiacDetail from '@/components/containers/zodiac/ZodiacDetail';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';

type Props = {
  params: Promise<{ sign: string; locale: string }>;
};

const labels: Record<string, string> = {
  aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
  leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
  sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık'
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sign, locale } = await params;
  const label = labels[sign] || sign;
  return buildPageMetadata({
    locale,
    pageKey: 'burclar-ask',
    pathname: `/burclar/${sign}/ask`,
    fallback: {
      title: `${label} Burcu Aşk Uyumu ve İlişkileri`,
      description: `${label} burcunun aşk hayatı, romantik uyumu ve ilişkilerdeki karakteri.`,
    },
  });
}

export default function SignLovePage() {
  return (
    <main className="min-h-screen bg-[var(--gm-bg)] pt-32">
      <ZodiacDetail initialTab="love" />
    </main>
  );
}
