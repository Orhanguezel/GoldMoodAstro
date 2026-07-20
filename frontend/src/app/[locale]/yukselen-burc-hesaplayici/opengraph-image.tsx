import { createToolOgImage, toolOgSize } from '@/lib/og/toolOg';

export const runtime = 'edge';
export const size = toolOgSize;
export const contentType = 'image/png';
export const alt = 'Yükselen Burç Hesaplayıcı';

export default async function OG() {
  return createToolOgImage({
    eyebrow: 'YÜKSELEN BURÇ',
    symbol: '🌅',
    title: 'Yükselen Burç Hesaplayıcı',
    subtitle: 'Doğum saatinle gerçek haritanı gör',
  });
}
