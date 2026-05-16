import type { MetadataRoute } from 'next';
import { fetchSetting } from '@/i18n/server';
import { DEFAULT_TOKENS } from '@/lib/tokens/defaults';
import brandFallback from '../../../config/brand.json';

const FALLBACK_BG = DEFAULT_TOKENS.colors.bg_base;
const FALLBACK_THEME = brandFallback.theme_color || DEFAULT_TOKENS.branding.theme_color;

async function readBrandColors(): Promise<{ bg: string; theme: string }> {
  try {
    const row = await fetchSetting('design_tokens', '*', { revalidate: 300 });
    const raw = row?.value;
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const bg = obj?.colors?.bg_base || FALLBACK_BG;
    const theme = obj?.branding?.theme_color || obj?.colors?.brand_primary || FALLBACK_THEME;
    return { bg, theme };
  } catch {
    return { bg: FALLBACK_BG, theme: FALLBACK_THEME };
  }
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { bg, theme } = await readBrandColors();
  return {
    name: brandFallback.name || 'GoldMoodAstro',
    short_name: brandFallback.name?.split(' ')[0] || 'GoldMood',
    description: brandFallback.tagline || 'Astroloji, tarot ve yaşam koçluğu için uzman danışmanlarla bağlantı platformu.',
    start_url: '/tr',
    display: 'standalone',
    background_color: bg,
    theme_color: theme,
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/favicon/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/favicon/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/favicon/apple-touch-icon.svg',
        sizes: '180x180',
        type: 'image/svg+xml',
      },
    ],
  };
}
