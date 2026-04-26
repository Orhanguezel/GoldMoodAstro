// Backend: site_settings (key-value with locale)

export interface SiteSetting {
  id: string;
  key: string;
  locale: string;
  value: string | Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AppLocale {
  code: string;
  name?: string;
  label?: string;
  is_active?: boolean;
  is_default?: boolean;
}

// Typed known setting value shapes
export interface SeoSetting {
  title_default?: string;
  title_template?: string;
  description?: string;
  site_name?: string;
  open_graph?: {
    images?: string[];
  };
  facebook?: {
    app_id?: string;
  };
}

export interface BrandingSetting {
  logo_url?: string;
  logo_alt?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
}
