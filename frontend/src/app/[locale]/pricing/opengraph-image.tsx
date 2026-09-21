import { createLocalizedPageOgImage, localizedPageOgSize } from '@/lib/og/localizedPageOg';

export const runtime = 'edge';
export const size = localizedPageOgSize;
export const contentType = 'image/png';
export const alt = 'GoldMoodAstro pricing';

export default async function OG({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return createLocalizedPageOgImage('pricing', locale);
}
