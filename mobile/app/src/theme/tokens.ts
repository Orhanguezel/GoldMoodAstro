/**
 * GoldMoodAstro marka paleti — mistik/astroloji teması.
 * Primary: Ametist mor. Accent: Altın. Background: Gece mavisi.
 */

export const colors = {
  // Arka plan
  midnight: '#0D0B1E',
  deep: '#1A1630',
  surface: '#241E3D',
  surfaceHigh: '#2E2850',

  // İçerik
  stardust: '#F0E6FF',
  stardustDim: '#C9B8E8',
  muted: '#7A6DA0',
  mutedSoft: '#4D4570',

  // Marka
  amethyst: '#7B5EA7',
  amethystDark: '#5C4480',
  amethystLight: '#9B7EC8',
  gold: '#D4AF37',
  goldDim: '#B8962E',
  goldLight: '#F0CF6B',

  // Durum
  success: '#4CAF6E',
  danger: '#E55B4D',
  warning: '#F0A030',
  info: '#5B9BD5',

  // Çizgiler
  line: 'rgba(201, 184, 232, 0.14)',
  lineSoft: 'rgba(201, 184, 232, 0.07)',
};

export const radius = {
  xs: 12,
  sm: 20,
  md: 28,
  lg: 40,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const font = {
  display: 'Fraunces_400Regular',
  displayItalic: 'Fraunces_400Regular_Italic',
  sans: 'InterTight_400Regular',
  sansMedium: 'InterTight_500Medium',
  sansBold: 'InterTight_700Bold',
  mono: 'JetBrainsMono_400Regular',
};

export const shadows = {
  soft: {
    shadowColor: '#7B5EA7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  card: {
    shadowColor: '#0D0B1E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 6,
  },
  gold: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
};
