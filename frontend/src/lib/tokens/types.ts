export interface DesignTokenColors {
  brand_primary: string;
  brand_primary_dark: string;
  brand_primary_light: string;
  brand_secondary: string;
  brand_secondary_dim: string;
  brand_secondary_light: string;
  brand_accent: string;
  bg_base: string;
  bg_deep: string;
  bg_surface: string;
  bg_surface_high: string;
  text_primary: string;
  text_secondary: string;
  text_muted: string;
  text_muted_soft: string;
  border: string;
  border_soft: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface DesignTokenTypography {
  font_display: string;
  font_sans: string;
  font_mono: string;
  base_size: string;
}

export interface DesignTokenRadius {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  pill: string;
}

export interface DesignTokenShadows {
  soft: string;
  card: string;
  glow_primary: string;
  glow_gold: string;
}

export interface DesignTokenBranding {
  app_name: string;
  tagline: string;
  tagline_en: string;
  logo_url: string;
  favicon_url: string;
  theme_color: string;
  og_image_url: string;
}

export interface DesignTokens {
  version: string;
  colors: DesignTokenColors;
  typography: DesignTokenTypography;
  radius: DesignTokenRadius;
  shadows: DesignTokenShadows;
  branding: DesignTokenBranding;
}
