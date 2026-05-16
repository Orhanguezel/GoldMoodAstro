import type { DesignTokens } from './designTokenTypes';
import { DEFAULT_REMOTE_TOKENS } from './defaultRemoteTokens';
import type { AppBranding, AppColors, AppFont, AppGradients, AppLightColors, AppRadius, AppShadows, AppTheme } from './appTheme';
import { defaultAppTheme } from './appTheme';

function parsePx(v: string | undefined, fallback: number): number {
  if (!v || typeof v !== 'string') return fallback;
  const m = /^(\d+(?:\.\d+)?)px$/i.exec(v.trim());
  if (m) return Math.round(Number(m[1]));
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function expoFontFromStack(stack: string | undefined, role: 'display' | 'serif' | 'sans' | 'mono'): string {
  const s = (stack ?? '').toLowerCase();
  if (role === 'mono' || s.includes('jetbrains')) return 'JetBrainsMono_400Regular';
  if (s.includes('cinzel')) {
    if (s.includes('700') || s.includes('bold')) return 'Cinzel_700Bold';
    if (s.includes('500') || s.includes('medium')) return 'Cinzel_500Medium';
    return 'Cinzel_400Regular';
  }
  if (s.includes('fraunces')) {
    if (s.includes('italic')) return 'Fraunces_400Regular_Italic';
    if (s.includes('700') || s.includes('bold')) return 'Fraunces_700Bold';
    if (s.includes('500') || s.includes('medium')) return 'Fraunces_500Medium';
    return 'Fraunces_400Regular';
  }
  if (s.includes('manrope') || s.includes('outfit') || s.includes('inter')) {
    if (s.includes('700') || s.includes('bold')) return 'Manrope_700Bold';
    if (s.includes('500') || s.includes('medium')) return 'Manrope_500Medium';
    return 'Manrope_400Regular';
  }
  switch (role) {
    case 'display':
      return 'Cinzel_400Regular';
    case 'serif':
      return 'Fraunces_400Regular';
    case 'sans':
      return 'Manrope_400Regular';
    default:
      return 'JetBrainsMono_400Regular';
  }
}

function mapTypographyToAppFont(t: DesignTokens['typography']): AppFont {
  return {
    display: expoFontFromStack(t.font_display, 'display'),
    displayMedium: 'Cinzel_500Medium',
    displayBold: 'Cinzel_700Bold',
    serif: expoFontFromStack(t.font_serif ?? t.font_display, 'serif'),
    serifItalic: 'Fraunces_400Regular_Italic',
    serifMedium: 'Fraunces_500Medium',
    serifBold: 'Fraunces_700Bold',
    sans: expoFontFromStack(t.font_sans, 'sans'),
    sansMedium: 'Manrope_500Medium',
    sansBold: 'Manrope_700Bold',
    mono: expoFontFromStack(t.font_mono, 'mono'),
  };
}

function buildRnShadows(ink: string, gold: string): AppShadows {
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
      shadowOpacity: 0.28,
      shadowRadius: 12,
      elevation: 3,
    },
    glowGold: {
      shadowColor: gold,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.42,
      shadowRadius: 22,
      elevation: 4,
    },
  };
}

function mapColors(c: DesignTokens['colors']): AppColors {
  const bg = c.bg_base;
  const bgDeep = c.bg_deep;
  const surface = c.bg_surface;
  const surfaceHigh = c.bg_surface_high;
  const text = c.text_primary;
  const textDim = c.text_secondary;
  const textMuted = c.text_muted;
  const gold = c.brand_primary;
  const goldDim = c.brand_secondary_dim ?? c.brand_primary_dark;
  const goldLight = c.brand_primary_light ?? c.brand_secondary_light;
  const goldDeep = c.brand_primary_dark;
  const plum = c.brand_accent;
  const plumSoft = c.brand_secondary ?? c.brand_accent;

  const ink = c.sand_900 ?? c.text_primary;
  const inkDeep = c.bg_deep_dark ?? '#1A1715';
  const inkSoft = c.bg_surface_dark ?? '#3D362D';
  const inkSofter = c.bg_surface_high_dark ?? '#4A4238';
  const cream = c.sand_100 ?? c.text_primary_dark ?? '#FAF6EF';

  return {
    bg,
    bgDeep,
    surface,
    surfaceHigh,
    text,
    textDim,
    textMuted,
    gold,
    goldDim,
    goldLight,
    goldDeep,
    plum,
    plumSoft,
    success: c.success,
    danger: c.error,
    warning: c.warning,
    info: c.info,
    sand: c.sand_200 ?? '#E5DCC8',
    cream,
    ink,
    inkDeep,
    inkSoft,
    inkSofter,
    line: c.border,
    lineSoft: c.border_soft,
    midnight: ink,
    deep: inkDeep,
    stardust: cream,
    stardustDim: c.sand_300 ?? textDim,
    muted: c.text_muted_soft ?? textMuted,
    mutedSoft: c.text_muted_soft ?? textMuted,
    amethyst: gold,
    amethystDark: goldDeep,
    amethystLight: goldLight,
  };
}

function mapLightColors(c: DesignTokens['colors']): AppLightColors {
  return {
    bg: c.bg_base,
    bgDeep: c.bg_deep,
    surface: c.bg_surface,
    surfaceHigh: c.bg_surface_high,
    text: c.text_primary,
    textDim: c.text_secondary,
    textMuted: c.text_muted,
    gold: c.brand_primary,
    goldDim: c.brand_secondary_dim,
    goldLight: c.brand_primary_light,
    goldDeep: c.brand_primary_dark,
    plum: c.brand_accent,
    plumSoft: c.brand_secondary,
    success: c.success,
    danger: c.error,
    warning: c.warning,
    info: c.info,
    line: c.border,
    lineSoft: c.border_soft,
  };
}

function mapRadius(r: DesignTokens['radius']): AppRadius {
  return {
    xs: parsePx(r.xs, defaultAppTheme.radius.xs),
    sm: parsePx(r.sm, defaultAppTheme.radius.sm),
    md: parsePx(r.md, defaultAppTheme.radius.md),
    lg: parsePx(r.lg, defaultAppTheme.radius.lg),
    xl: parsePx(r.xl, defaultAppTheme.radius.xl),
    pill: Math.min(999, parsePx(r.pill, defaultAppTheme.radius.pill)),
  };
}

function mapGradients(c: DesignTokens['colors']): AppGradients {
  const bg = c.bg_base_dark ?? c.sand_900 ?? '#2A2620';
  const gold = c.brand_primary;
  const cream = c.text_primary_dark ?? c.sand_100 ?? '#FAF6EF';
  const deep = c.bg_deep_dark ?? '#1A1715';
  const surf = c.bg_surface_dark ?? '#3D362D';
  return {
    hero: [gold, bg] as const,
    heroSoft: [c.brand_primary_light, cream] as const,
    premium: [c.brand_primary_dark, gold, c.brand_primary_light] as const,
    darkSurface: [deep, bg, surf] as const,
  };
}

function mapBranding(b: DesignTokens['branding']): AppBranding {
  return {
    appName: b.app_name || defaultAppTheme.branding.appName,
    tagline: b.tagline || defaultAppTheme.branding.tagline,
    taglineEn: b.tagline_en || defaultAppTheme.branding.taglineEn,
    themeColor: b.theme_color || defaultAppTheme.branding.themeColor,
    themeColorDark: b.theme_color_dark || b.theme_color || defaultAppTheme.branding.themeColorDark,
    logoUrl: b.logo_url ?? '',
    ogImageUrl: b.og_image_url ?? '',
  };
}

export function normalizeRemoteTokens(raw: unknown): DesignTokens {
  if (!raw || typeof raw !== 'object') return DEFAULT_REMOTE_TOKENS;
  const r = raw as Partial<DesignTokens>;
  if (!r.colors || typeof r.colors !== 'object') return DEFAULT_REMOTE_TOKENS;
  const rc = r.colors as Partial<DesignTokens['colors']>;
  if (typeof rc.brand_primary !== 'string') return DEFAULT_REMOTE_TOKENS;

  const base = DEFAULT_REMOTE_TOKENS;
  return {
    ...base,
    ...r,
    version: typeof r.version === 'string' ? r.version : base.version,
    colors: { ...base.colors, ...rc },
    typography: { ...base.typography, ...(r.typography ?? {}) },
    radius: { ...base.radius, ...(r.radius ?? {}) },
    shadows: { ...base.shadows, ...(r.shadows ?? {}) },
    branding: { ...base.branding, ...(r.branding ?? {}) },
  };
}

export function designTokensToAppTheme(tokens: DesignTokens): AppTheme {
  const c = tokens.colors;
  const colors = mapColors(c);
  const lightColors = mapLightColors(c);
  const font = mapTypographyToAppFont(tokens.typography);
  const radius = mapRadius(tokens.radius);
  const shadows = buildRnShadows(colors.text, colors.gold);
  const gradients = mapGradients(c);
  const branding = mapBranding(tokens.branding);

  return {
    ...defaultAppTheme,
    colors,
    lightColors,
    radius,
    font,
    shadows,
    gradients,
    branding,
    statusBar: defaultAppTheme.statusBar,
    spacing: defaultAppTheme.spacing,
  };
}
