import type { DesignTokens } from './types';

function cssValue(value: string): string {
  return String(value || '').replace(/[;{}]/g, '').trim();
}

export function tokensToCSS(tokens: DesignTokens): string {
  const c = tokens.colors;
  const t = tokens.typography;
  const r = tokens.radius;
  const s = tokens.shadows;

  return `:root {
--gm-primary:${cssValue(c.brand_primary)};
--gm-primary-dark:${cssValue(c.brand_primary_dark)};
--gm-primary-light:${cssValue(c.brand_primary_light)};
--gm-gold:${cssValue(c.brand_secondary)};
--gm-gold-dim:${cssValue(c.brand_secondary_dim)};
--gm-gold-light:${cssValue(c.brand_secondary_light)};
--gm-accent:${cssValue(c.brand_accent)};
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
}`;
}
