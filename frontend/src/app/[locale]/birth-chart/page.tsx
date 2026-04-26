import type { Metadata } from 'next';
import BirthChartPageClient from './BirthChartPageClient';

export const metadata: Metadata = {
  title: 'Doğum Haritası Hesaplama — GoldMoodAstro',
  description:
    'Ücretsiz doğum haritası hesaplama. Gezegen konumları, ev yerleşimleri ve natal harita çarkını görüntüleyin.',
};

export default function BirthChartPage() {
  return <BirthChartPageClient />;
}
