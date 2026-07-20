import { createToolOgImage, toolOgSize } from '@/lib/og/toolOg';

export const runtime = 'edge';
export const size = toolOgSize;
export const contentType = 'image/png';
export const alt = 'Yıldızname';

export default async function OG() {
  return createToolOgImage({
    eyebrow: 'YILDIZNAME',
    symbol: '📜',
    title: 'Yıldızname',
    subtitle: 'Geleneksel kişisel yol haritan',
  });
}
