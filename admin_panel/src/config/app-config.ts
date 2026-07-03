// =============================================================
// FILE: src/config/app-config.ts
// Admin Panel Config — DB'den gelen branding verileri için fallback
// =============================================================

import packageJson from '../../package.json';

const currentYear = new Date().getFullYear();
const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Admin Panel';
const appCopyright = process.env.NEXT_PUBLIC_APP_COPYRIGHT || 'Platform';
const appDescription = process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Yonetim paneli.';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3094';

export type AdminBrandingConfig = {
  app_name: string;
  app_copyright: string;
  html_lang: string;
  theme_color: string;
  favicon_16: string;
  favicon_32: string;
  favicon_url: string;
  logo_url: string;
  apple_touch_icon: string;
  meta: {
    title: string;
    description: string;
    og_url: string;
    og_title: string;
    og_description: string;
    og_image: string;
    twitter_card: string;
  };
};

export const DEFAULT_BRANDING: AdminBrandingConfig = {
  app_name: appName,
  app_copyright: appCopyright,
  html_lang: 'tr',
  theme_color: '#1f1535',
  favicon_16: '/favicon/favicon-16x16.png',
  favicon_32: '/favicon/favicon-32x32.png',
  favicon_url: '/favicon.ico',
  logo_url: '/brand/logo.png',
  apple_touch_icon: '/apple-touch-icon.png',
  meta: {
    title: appName,
    description: appDescription,
    og_url: siteUrl,
    og_title: appName,
    og_description: appDescription,
    og_image: '/brand/og-image.png',
    twitter_card: 'summary_large_image',
  },
};

export const APP_CONFIG = {
  name: DEFAULT_BRANDING.app_name,
  version: packageJson.version,
  copyright: `© ${currentYear}, ${DEFAULT_BRANDING.app_copyright}.`,
  meta: {
    title: DEFAULT_BRANDING.meta.title,
    description: DEFAULT_BRANDING.meta.description,
  },
  branding: DEFAULT_BRANDING,
} as const;
