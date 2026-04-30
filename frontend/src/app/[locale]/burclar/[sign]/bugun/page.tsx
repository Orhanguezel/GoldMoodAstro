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
  const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const ogImageUrl = `https://goldmoodastro.com/${locale}/burclar/${sign}/bugun/opengraph-image`;

  return buildPageMetadata({
    locale,
    pageKey: 'burclar-bugun',
    pathname: `/burclar/${sign}/bugun`,
    fallback: {
      title: `${today} ${label} Burcu Günlük Yorumu`,
      description: `${label} burcu için ${today} tarihli günlük yorum. Bugün sizi neler bekliyor? Aşk, para ve sağlık tavsiyeleri.`,
      ogImage: ogImageUrl,
    },
  });
}

export default function SignDailyPage() {
  return (
    <main className="min-h-screen bg-[var(--gm-bg)] pt-32">
      <ZodiacDetail initialTab="daily" />
    </main>
  );
}
