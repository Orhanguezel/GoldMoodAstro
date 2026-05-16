import type { ViewStyle } from 'react-native';

/** RN shadow kartları (web CSS shadow string’i parse edilmez). */
export type RnShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

export type AppColors = {
  bg: string;
  bgDeep: string;
  surface: string;
  surfaceHigh: string;
  text: string;
  textDim: string;
  textMuted: string;
  gold: string;
  goldDim: string;
  goldLight: string;
  goldDeep: string;
  plum: string;
  plumSoft: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  sand: string;
  cream: string;
  ink: string;
  inkDeep: string;
  inkSoft: string;
  inkSofter: string;
  line: string;
  lineSoft: string;
  midnight: string;
  deep: string;
  stardust: string;
  stardustDim: string;
  muted: string;
  mutedSoft: string;
  amethyst: string;
  amethystDark: string;
  amethystLight: string;
};

export type AppLightColors = {
  bg: string;
  bgDeep: string;
  surface: string;
  surfaceHigh: string;
  text: string;
  textDim: string;
  textMuted: string;
  gold: string;
  goldDim: string;
  goldLight: string;
  goldDeep: string;
  plum: string;
  plumSoft: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  line: string;
  lineSoft: string;
};

export type AppRadius = Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'pill', number>;

export type AppSpacing = Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | '2xl' | '3xl', number>;

export type AppFont = {
  display: string;
  displayMedium: string;
  displayBold: string;
  serif: string;
  serifItalic: string;
  serifMedium: string;
  serifBold: string;
  sans: string;
  sansMedium: string;
  sansBold: string;
  mono: string;
};

export type AppShadows = Record<'soft' | 'card' | 'gold' | 'glowGold', RnShadowStyle>;

export type AppGradients = {
  hero: readonly [string, string];
  heroSoft: readonly [string, string];
  premium: readonly [string, string, string];
  darkSurface: readonly [string, string, string];
};

export type AppBranding = {
  appName: string;
  tagline: string;
  taglineEn: string;
  themeColor: string;
  themeColorDark: string;
  logoUrl: string;
  ogImageUrl: string;
};

export type AppStatusBar = {
  light: 'dark' | 'light' | 'auto';
  dark: 'dark' | 'light' | 'auto';
  default: 'dark' | 'light' | 'auto';
};

export type AppTheme = {
  colors: AppColors;
  lightColors: AppLightColors;
  statusBar: AppStatusBar;
  gradients: AppGradients;
  radius: AppRadius;
  spacing: AppSpacing;
  font: AppFont;
  shadows: AppShadows;
  branding: AppBranding;
};

export type AppColorTokens = AppColors;
export type AppLightColorTokens = AppLightColors;

const PALETTE_STATIC = {
  gold: '#C9A961',
  goldDim: '#B89651',
  goldLight: '#E5D0A0',
  goldDeep: '#A8884A',
  plum: '#3D2E47',
  plumSoft: '#5D4A66',
  ink: '#2A2620',
  inkDeep: '#1A1715',
  inkSoft: '#3D362D',
  inkSofter: '#4A4238',
  cream: '#FAF6EF',
  creamDeep: '#F2EBDD',
  sand: '#E5DCC8',
  sandSoft: '#A09888',
  sandMuted: '#8A8276',
  sandHard: '#6B6358',
  success: '#4CAF6E',
  danger: '#E55B4D',
  warning: '#F0A030',
  info: '#5B9BD5',
} as const;

/** Web (light) varsayılanı: krem zemin, mürekkep tipografi — frontend globals ile aynı aile. */
function buildColorsFromPalette(p: typeof PALETTE_STATIC): AppColors {
  return {
    bg: p.cream,
    bgDeep: p.creamDeep,
    surface: '#FFFFFF',
    surfaceHigh: '#F7F1E4',
    text: p.ink,
    textDim: p.inkSofter,
    textMuted: p.sandHard,
    gold: p.gold,
    goldDim: p.goldDim,
    goldLight: p.goldLight,
    goldDeep: p.goldDeep,
    plum: p.plum,
    plumSoft: p.plumSoft,
    success: p.success,
    danger: p.danger,
    warning: p.warning,
    info: p.info,
    sand: p.sand,
    cream: p.cream,
    ink: p.ink,
    inkDeep: p.inkDeep,
    inkSoft: '#3D362D',
    inkSofter: '#4A4238',
    line: 'rgba(168, 136, 74, 0.25)',
    lineSoft: 'rgba(168, 136, 74, 0.15)',
    midnight: p.ink,
    deep: p.inkDeep,
    stardust: p.cream,
    stardustDim: p.sand,
    muted: p.sandSoft,
    mutedSoft: p.sandHard,
    amethyst: p.gold,
    amethystDark: p.goldDeep,
    amethystLight: p.goldLight,
  };
}

function buildLightColorsFromPalette(p: typeof PALETTE_STATIC): AppLightColors {
  return {
    bg: p.cream,
    bgDeep: p.creamDeep,
    surface: '#FFFFFF',
    surfaceHigh: '#F7F1E4',
    text: p.ink,
    textDim: p.inkSofter,
    textMuted: p.sandHard,
    gold: p.gold,
    goldDim: p.goldDim,
    goldLight: p.goldLight,
    goldDeep: p.goldDeep,
    plum: p.plum,
    plumSoft: p.plumSoft,
    success: p.success,
    danger: p.danger,
    warning: p.warning,
    info: p.info,
    line: 'rgba(168, 136, 74, 0.25)',
    lineSoft: 'rgba(168, 136, 74, 0.15)',
  };
}

function buildShadows(ink: string, _inkDeep: string, gold: string): AppShadows {
  return {
    soft: {
      shadowColor: ink,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 2,
    },
    card: {
      shadowColor: ink,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
      elevation: 4,
    },
    gold: {
      shadowColor: gold,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 3,
    },
    glowGold: {
      shadowColor: gold,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.45,
      shadowRadius: 24,
      elevation: 4,
    },
  };
}

const defaultFont: AppFont = {
  display: 'Cinzel_400Regular',
  displayMedium: 'Cinzel_500Medium',
  displayBold: 'Cinzel_700Bold',
  serif: 'Fraunces_400Regular',
  serifItalic: 'Fraunces_400Regular_Italic',
  serifMedium: 'Fraunces_500Medium',
  serifBold: 'Fraunces_500Medium',
  sans: 'Manrope_400Regular',
  sansMedium: 'Manrope_500Medium',
  sansBold: 'Manrope_700Bold',
  mono: 'JetBrainsMono_400Regular',
};

const defaultRadius: AppRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

const defaultSpacing: AppSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  '2xl': 64,
  '3xl': 80,
};

export const defaultAppTheme: AppTheme = {
  colors: buildColorsFromPalette(PALETTE_STATIC),
  lightColors: buildLightColorsFromPalette(PALETTE_STATIC),
  statusBar: {
    light: 'dark',
    dark: 'light',
    default: 'dark',
  },
  gradients: {
    hero: [PALETTE_STATIC.gold, PALETTE_STATIC.cream],
    heroSoft: [PALETTE_STATIC.goldLight, PALETTE_STATIC.creamDeep],
    premium: [PALETTE_STATIC.goldDeep, PALETTE_STATIC.gold, PALETTE_STATIC.goldLight],
    darkSurface: [PALETTE_STATIC.inkDeep, PALETTE_STATIC.ink, PALETTE_STATIC.inkSoft],
  },
  radius: defaultRadius,
  spacing: defaultSpacing,
  font: defaultFont,
  shadows: buildShadows(PALETTE_STATIC.ink, PALETTE_STATIC.inkDeep, PALETTE_STATIC.gold),
  branding: {
    appName: 'GoldMoodAstro',
    tagline: 'Ruhsal danışmanlık platformu',
    taglineEn: 'Your spiritual guidance platform',
    themeColor: PALETTE_STATIC.gold,
    themeColorDark: PALETTE_STATIC.ink,
    logoUrl: '',
    ogImageUrl: '',
  },
};
