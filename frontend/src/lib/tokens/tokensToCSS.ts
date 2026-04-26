import type { DesignTokens } from './types';

function cssValue(value: string | undefined): string {
  return String(value || '').replace(/[;{}]/g, '').trim();
}

/**
 * DesignTokens → :root CSS variables string.
 * Dark theme variantları varsa [data-theme="dark"] bloğunda override yazılır.
 * globals.css'teki :root + [data-theme="dark"] hardcoded fallback'ler korunur.
 */
export function tokensToCSS(tokens: DesignTokens): string {
  const c = tokens.colors;
  const t = tokens.typography;
  const r = tokens.radius;
  const s = tokens.shadows;

  const lightVars = `
--gm-primary:${cssValue(c.brand_primary)};
--gm-primary-dark:${cssValue(c.brand_primary_dark)};
--gm-primary-light:${cssValue(c.brand_primary_light)};
--gm-primary-hover:${cssValue(c.brand_primary_dark)};
--gm-gold:${cssValue(c.brand_secondary)};
--gm-gold-dim:${cssValue(c.brand_secondary_dim)};
--gm-gold-light:${cssValue(c.brand_secondary_light)};
--gm-gold-deep:${cssValue(c.brand_primary_dark)};
--gm-accent:${cssValue(c.brand_accent)};
--gm-gold-50:${cssValue(c.gold_50)};
--gm-gold-100:${cssValue(c.gold_100)};
--gm-gold-200:${cssValue(c.gold_200)};
--gm-gold-300:${cssValue(c.gold_300)};
--gm-gold-400:${cssValue(c.gold_400)};
--gm-gold-500:${cssValue(c.gold_500)};
--gm-gold-600:${cssValue(c.gold_600)};
--gm-gold-700:${cssValue(c.gold_700)};
--gm-gold-800:${cssValue(c.gold_800)};
--gm-gold-900:${cssValue(c.gold_900)};
--gm-sand-50:${cssValue(c.sand_50)};
--gm-sand-100:${cssValue(c.sand_100)};
--gm-sand-200:${cssValue(c.sand_200)};
--gm-sand-300:${cssValue(c.sand_300)};
--gm-sand-400:${cssValue(c.sand_400)};
--gm-sand-500:${cssValue(c.sand_500)};
--gm-sand-600:${cssValue(c.sand_600)};
--gm-sand-700:${cssValue(c.sand_700)};
--gm-sand-800:${cssValue(c.sand_800)};
--gm-sand-900:${cssValue(c.sand_900)};
--gm-bg:${cssValue(c.bg_base)};
--gm-bg-deep:${cssValue(c.bg_deep)};
--gm-surface:${cssValue(c.bg_surface)};
--gm-surface-high:${cssValue(c.bg_surface_high)};
--gm-text:${cssValue(c.text_primary)};
--gm-text-dim:${cssValue(c.text_secondary)};
--gm-muted:${cssValue(c.text_muted)};
--gm-muted-soft:${cssValue(c.text_muted_soft)};
--gm-border:${cssValue(c.border)};
--gm-border-soft:${cssValue(c.border_soft)};
--gm-success:${cssValue(c.success)};
--gm-warning:${cssValue(c.warning)};
--gm-error:${cssValue(c.error)};
--gm-info:${cssValue(c.info)};
--gm-font-display:${cssValue(t.font_display)};
--gm-font-serif:${cssValue(t.font_serif)};
--gm-font-sans:${cssValue(t.font_sans)};
--gm-font-mono:${cssValue(t.font_mono)};
--gm-font-base-size:${cssValue(t.base_size)};
--gm-radius-xs:${cssValue(r.xs)};
--gm-radius-sm:${cssValue(r.sm)};
--gm-radius-md:${cssValue(r.md)};
--gm-radius-lg:${cssValue(r.lg)};
--gm-radius-xl:${cssValue(r.xl)};
--gm-radius-pill:${cssValue(r.pill)};
--gm-shadow-soft:${cssValue(s.soft)};
--gm-shadow-card:${cssValue(s.card)};
--gm-shadow-glow:${cssValue(s.glow_primary)};
--gm-shadow-gold:${cssValue(s.glow_gold)};
`.trim();

  // Dark theme override — bg/text/border alanları, brand renkleri aynı kalır
  const hasDark = c.bg_base_dark || c.text_primary_dark;
  const darkVars = hasDark
    ? `
--gm-bg:${cssValue(c.bg_base_dark)};
--gm-bg-deep:${cssValue(c.bg_deep_dark)};
--gm-surface:${cssValue(c.bg_surface_dark)};
--gm-surface-high:${cssValue(c.bg_surface_high_dark)};
--gm-text:${cssValue(c.text_primary_dark)};
--gm-text-dim:${cssValue(c.text_secondary_dark)};
--gm-muted:${cssValue(c.text_muted_dark)};
`.trim()
    : '';

  return `:root {\n${lightVars}\n}\n${darkVars ? `[data-theme="dark"] {\n${darkVars}\n}` : ''}`;
}
