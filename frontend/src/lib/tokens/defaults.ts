import type { DesignTokens } from './types';

// 2026-04-27: Cream + Gold + Ink + Plum palette (eski Amethyst+Midnight'tan değişti)
// SSR fetch fail olursa bu varsayılanlar kullanılır.
export const DEFAULT_TOKENS: DesignTokens = {
  version: '2',
  colors: {
    // Brand — warm editorial gold
    brand_primary: '#C9A961',
    brand_primary_dark: '#A8884A',
    brand_primary_light: '#D4BB7A',
    brand_secondary: '#C9A961',
    brand_secondary_dim: '#B89651',
    brand_secondary_light: '#E5D0A0',
    brand_accent: '#3D2E47',          // plum (mystical accent)
    gold_50: '#FCF8ED',
    gold_100: '#F7EFD5',
    gold_200: '#EEDDAA',
    gold_300: '#E2C877',
    gold_400: '#D4B554',
    gold_500: '#C9A961',
    gold_600: '#A8884A',
    gold_700: '#856B3A',
    gold_800: '#5F4E2F',
    gold_900: '#3F3524',
    sand_50: '#FFFCF7',
    sand_100: '#FAF6EF',
    sand_200: '#F2EBDD',
    sand_300: '#E8DDC8',
    sand_400: '#D8C7A8',
    sand_500: '#C4AF8B',
    sand_600: '#A18C6B',
    sand_700: '#78684F',
    sand_800: '#534839',
    sand_900: '#2A2620',
    // Background — ivory / cream
    bg_base: '#FAF6EF',
    bg_deep: '#F2EBDD',
    bg_surface: '#FFFFFF',
    bg_surface_high: '#F7F1E4',
    // Text — warm ink
    text_primary: '#2A2620',
    text_secondary: '#4A4238',
    text_muted: '#8A8276',
    text_muted_soft: '#6B6358',
    // Borders — gold transparency
    border: 'rgba(168,136,74,0.25)',
    border_soft: 'rgba(168,136,74,0.15)',
    // Status
    success: '#4CAF6E',
    warning: '#F0A030',
    error: '#E55B4D',
    info: '#5B9BD5',
    // Dark theme variants
    bg_base_dark: '#2A2620',
    bg_deep_dark: '#1A1715',
    bg_surface_dark: '#3D362D',
    bg_surface_high_dark: '#4A4238',
    text_primary_dark: '#FAF6EF',
    text_secondary_dark: '#E5DCC8',
    text_muted_dark: '#A09888',
  },
  typography: {
    font_display: 'Cinzel, Georgia, serif',
    font_serif: 'Fraunces, Georgia, serif',
    font_sans: 'Manrope, system-ui, -apple-system, sans-serif',
    font_mono: 'JetBrains Mono, monospace',
    base_size: '16px',
  },
  radius: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    pill: '9999px',
  },
  shadows: {
    soft: '0 2px 20px rgba(45,37,32,0.06)',
    card: '0 8px 40px rgba(45,37,32,0.10)',
    glow_primary: '0 0 60px rgba(201,169,97,0.18)',
    glow_gold: '0 0 30px rgba(201,169,97,0.22)',
  },
  branding: {
    app_name: 'GoldMoodAstro',
    tagline: 'Yıldızlarla tanışan modern astroloji',
    tagline_en: 'Modern astrology meets the stars',
    logo_url: '',
    favicon_url: '',
    theme_color: '#C9A961',
    theme_color_dark: '#2A2620',
    og_image_url: '',
  },
};
