import { createToolOgImage, toolOgSize } from '@/lib/og/toolOg';

export const runtime = 'edge';
export const size = toolOgSize;
export const contentType = 'image/png';
export const alt = 'Kahve Falı';

export default async function OG() {
  return createToolOgImage({
    eyebrow: 'KAHVE FALI',
    symbol: '☕',
    title: 'Kahve Falı',
    subtitle: 'Fincanındaki sembolün anlamı',
  });
}
