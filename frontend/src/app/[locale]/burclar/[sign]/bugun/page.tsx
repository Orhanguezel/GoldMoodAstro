export const revalidate = 86400;
import ZodiacDetail from '@/components/containers/zodiac/ZodiacDetail';
import { Metadata } from 'next';

type Props = {
  params: Promise<{ sign: string; locale: string }>;
};

const labels: Record<string, string> = {
  aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
  leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
  sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık'
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sign } = await params;
  const label = labels[sign] || sign;
  const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const ogImageUrl = `https://goldmoodastro.com/${(await params).locale}/burclar/${sign}/bugun/opengraph-image`;

  return {
    title: `${today} ${label} Burcu Günlük Yorumu — GoldMoodAstro`,
    description: `${label} burcu için ${today} tarihli günlük yorum. Bugün sizi neler bekliyor? Aşk, para ve sağlık tavsiyeleri.`,
    openGraph: {
      title: `${today} ${label} Burcu Günlük Yorumu`,
      description: `${label} burcu için ${today} tarihli günlük yorum. Bugün sizi neler bekliyor?`,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${label} Burcu` }],
      type: 'article',
      siteName: 'GoldMoodAstro',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${today} ${label} Burcu Günlük Yorumu`,
      description: `${label} burcu için günlük yorum.`,
      images: [ogImageUrl],
    },
  };
}

export default function SignDailyPage() {
  return (
    <main className="min-h-screen bg-background pt-20">
      <ZodiacDetail initialTab="daily" />
    </main>
  );
}
