import { createToolOgImage, toolOgSize } from '@/lib/og/toolOg';

export const runtime = 'edge';
export const size = toolOgSize;
export const contentType = 'image/png';
export const alt = 'Rüya Tabiri';

export default async function OG() {
  return createToolOgImage({
    eyebrow: 'RÜYA TABİRİ',
    symbol: '🌙',
    title: 'Rüya Tabiri',
    subtitle: 'Rüyandaki sembolleri çöz',
  });
}
