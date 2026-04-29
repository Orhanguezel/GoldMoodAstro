import ZodiacDetail from '@/components/containers/zodiac/ZodiacDetail';
import { Metadata } from 'next';

export const revalidate = 86400; // 24 hours

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
  return {
    title: `${label} Burcu Özellikleri ve Günlük Yorumu — GoldMoodAstro`,
    description: `${label} burcunun detaylı karakter analizi, aşk, iş ve sağlık yorumları. Günlük ${label} burcu yorumunuzu okuyun.`,
  };
}

export default function SignDetailPage() {
  return (
    <main className="min-h-screen bg-background pt-20">
      <ZodiacDetail />
    </main>
  );
}
