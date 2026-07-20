import { createToolOgImage, toolOgSize } from '@/lib/og/toolOg';

export const runtime = 'edge';
export const size = toolOgSize;
export const contentType = 'image/png';
export const alt = 'Numeroloji';

export default async function OG() {
  return createToolOgImage({
    eyebrow: 'NUMEROLOJİ',
    symbol: '🔢',
    title: 'Numeroloji',
    subtitle: 'Doğum tarihindeki sayıların anlamı',
  });
}
