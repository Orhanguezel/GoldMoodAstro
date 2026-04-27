/**
 * GoldMoodAstro — Mobile Theme Tokens
 * 2026-04-27 vizyon revize: Cream + Gold + Ink + Plum palette.
 * Mobile default = dark theme (cosmos/mystic hissi). Web default = light.
 *
 * Eski isimler (midnight, stardust, amethyst) backward-compat için
 * aynı renge alias'lı kalıyor; yeni komponentler yeni isimleri kullansın.
 */

// ── Renk değerleri (theme-agnostic palette) ──────────────────

const PALETTE = {
  // Brand — warm editorial gold
  gold:      '#C9A961',
  goldDim:   '#B89651',
  goldLight: '#E5D0A0',
  goldDeep:  '#A8884A',

  // Plum (mystical accent)
  plum:      '#3D2E47',
  plumSoft:  '#5D4A66',

  // Ink (warm dark — bg)
  ink:       '#2A2620',
  inkDeep:   '#1A1715',
  inkSoft:   '#3D362D',
  inkSofter: '#4A4238',

  // Cream (light bg / dark text-on-dark)
  cream:     '#FAF6EF',
  creamDeep: '#F2EBDD',
  sand:      '#E5DCC8',
  sandSoft:  '#A09888',
  sandMuted: '#8A8276',
  sandHard:  '#6B6358',

  // Status
  success:   '#4CAF6E',
  danger:    '#E55B4D',
  warning:   '#F0A030',
  info:      '#5B9BD5',
} as const;

// ── Default theme (DARK — mobile primary) ────────────────────

export const colors = {
  // Yeni semantik isimler
  bg:           PALETTE.ink,
  bgDeep:       PALETTE.inkDeep,
  surface:      PALETTE.inkSoft,
  surfaceHigh:  PALETTE.inkSofter,

  text:         PALETTE.cream,
  textDim:      PALETTE.sand,
  textMuted:    PALETTE.sandSoft,

  // Brand
  gold:         PALETTE.gold,
  goldDim:      PALETTE.goldDim,
  goldLight:    PALETTE.goldLight,
  goldDeep:     PALETTE.goldDeep,
  plum:         PALETTE.plum,
  plumSoft:     PALETTE.plumSoft,

  // Status
  success:      PALETTE.success,
  danger:       PALETTE.danger,
  warning:      PALETTE.warning,
  info:         PALETTE.info,
  
  // Palette access
  sand:         PALETTE.sand,
  cream:        PALETTE.cream,
  ink:          PALETTE.ink,
  inkDeep:      PALETTE.inkDeep,
  inkSoft:      PALETTE.inkSoft,
  inkSofter:    PALETTE.inkSofter,

  // Lines (gold transparency üzerinde dark)
  line:         'rgba(201, 169, 97, 0.20)',
  lineSoft:     'rgba(201, 169, 97, 0.10)',

  // ── Backward-compat aliases (eski komponentler kırılmasın) ──
  midnight:     PALETTE.ink,           // dark bg
  deep:         PALETTE.inkDeep,
  stardust:     PALETTE.cream,         // text
  stardustDim:  PALETTE.sand,
  muted:        PALETTE.sandSoft,
  mutedSoft:    PALETTE.sandHard,
  amethyst:     PALETTE.gold,          // ⚠ marka rengi gold oldu (eski mor değil)
  amethystDark: PALETTE.goldDeep,
  amethystLight: PALETTE.goldLight,
};

// ── Light theme variant (gerektiğinde override) ──────────────

export const lightColors = {
  bg:           PALETTE.cream,
  bgDeep:       PALETTE.creamDeep,
  surface:      '#FFFFFF',
  surfaceHigh:  '#F7F1E4',

  text:         PALETTE.ink,
  textDim:      PALETTE.inkSofter,
  textMuted:    PALETTE.sandHard,

  gold:         PALETTE.gold,
  goldDim:      PALETTE.goldDim,
  goldLight:    PALETTE.goldLight,
  goldDeep:     PALETTE.goldDeep,
  plum:         PALETTE.plum,
  plumSoft:     PALETTE.plumSoft,

  success:      PALETTE.success,
  danger:       PALETTE.danger,
  warning:      PALETTE.warning,
  info:         PALETTE.info,

  line:         'rgba(168, 136, 74, 0.25)',
  lineSoft:     'rgba(168, 136, 74, 0.15)',
};

export const statusBar = {
  light: 'dark' as const,
  dark: 'light' as const,
  default: 'light' as const,
};

export const gradients = {
  hero: [PALETTE.gold, PALETTE.ink] as const,
  heroSoft: [PALETTE.goldLight, PALETTE.cream] as const,
  premium: [PALETTE.goldDeep, PALETTE.gold, PALETTE.goldLight] as const,
  darkSurface: [PALETTE.inkDeep, PALETTE.ink, PALETTE.inkSoft] as const,
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  '2xl': 64,
  '3xl': 80,
};

// ── Tipografi ──────────────────────────────────────────────────
// Cinzel (display), Fraunces (editorial body/serif), Manrope (UI sans)
// expo-google-fonts paketleri: @expo-google-fonts/cinzel, /fraunces, /manrope
export const font = {
  display:        'Cinzel_400Regular',
  displayMedium:  'Cinzel_500Medium',
  displayBold:    'Cinzel_700Bold',
  serif:          'Fraunces_400Regular',
  serifItalic:    'Fraunces_400Regular_Italic',
  serifMedium:    'Fraunces_500Medium',
  serifBold:      'Fraunces_500Medium',
  sans:           'Manrope_400Regular',
  sansMedium:     'Manrope_500Medium',
  sansBold:       'Manrope_700Bold',
  mono:           'JetBrainsMono_400Regular',
};

export const shadows = {
  soft: {
    shadowColor: PALETTE.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  card: {
    shadowColor: PALETTE.inkDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.40,
    shadowRadius: 24,
    elevation: 6,
  },
  gold: {
    shadowColor: PALETTE.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 3,
  },
  glowGold: {
    shadowColor: PALETTE.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 4,
  },
};

// ── Branding metadata (mobile uses for splash/onboarding/about) ─
export const branding = {
  appName: 'GoldMoodAstro',
  tagline: 'Yıldızlarla tanışan modern astroloji',
  taglineEn: 'Modern astrology meets the stars',
  themeColor: PALETTE.gold,
  themeColorDark: PALETTE.ink,
};

export type AppColorTokens = typeof colors;
export type AppLightColorTokens = typeof lightColors;
