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
  return {
    title: `${label} Burcu Kariyer ve İş Hayatı — GoldMoodAstro`,
    description: `${label} burcu için en uygun meslekler, iş hayatındaki başarı stratejileri ve kariyer yorumları.`,
  };
}

export default function SignCareerPage() {
  return (
    <main className="min-h-screen bg-background pt-20">
      <ZodiacDetail initialTab="career" />
    </main>
  );
}
