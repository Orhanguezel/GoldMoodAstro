import './globals.css';
import React from 'react';
import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { fetchSetting } from '@/i18n/server';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#7B5EA7',
};

function extractUrl(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') {
    const s = val.trim();
    if (s.startsWith('{')) {
      try { return (JSON.parse(s) as { url?: string }).url || ''; } catch { return s; }
    }
    return s;
  }
  if (typeof val === 'object') return String((val as { url?: string }).url || '');
  return '';
}

const SUPPORTED_LOCALES = ['tr', 'en', 'de'];

/** Extract locale from the request URL pathname (e.g. /en/about → "en") */
async function resolveHtmlLang(): Promise<string> {
  const h = await headers();
  const pathname = h.get('x-next-url') || h.get('x-invoke-path') || '';
  const seg = pathname.split('/').filter(Boolean)[0] || '';
  if (SUPPORTED_LOCALES.includes(seg)) return seg;
  return 'tr';
}

export async function generateMetadata(): Promise<Metadata> {
  const favicon = await fetchSetting('site_favicon', '*');
  const faviconUrl = extractUrl(favicon?.value) || '/favicon.svg';

  const gscVerification = await fetchSetting('google_site_verification', '*');
  const gscCode = String(gscVerification?.value || '').trim();

  const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com'),
    title: {
      default: 'GoldMoodAstro — Astroloji & Ruhsal Danışmanlık',
      template: '%s | GoldMoodAstro',
    },
    manifest: '/manifest.webmanifest',
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl,
    },
  };

  if (gscCode) {
    metadata.verification = {
      google: gscCode,
    };
  }

  return metadata;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await resolveHtmlLang();
  return (
    <html lang={lang} data-theme="dark" suppressHydrationWarning>
      <head>
        <meta name="description" content="GoldMoodAstro — Astroloji, tarot, numeroloji ve ruhsal koçluk için uzman danışmanlarla bağlantı platformu." />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
