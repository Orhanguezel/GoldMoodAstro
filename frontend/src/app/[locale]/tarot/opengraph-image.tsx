import { createToolOgImage, toolOgSize } from '@/lib/og/toolOg';

export const runtime = 'edge';
export const size = toolOgSize;
export const contentType = 'image/png';
export const alt = 'Tarot Açılımı';

export default async function OG() {
  return createToolOgImage({
    eyebrow: 'ÜCRETSİZ TAROT',
    symbol: '🔮',
    title: 'Tarot Açılımı',
    subtitle: 'Kart seç, yorumunu anında oku',
  });
}
