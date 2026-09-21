import { ImageResponse } from 'next/og';

import { getOgFonts } from '@/lib/fonts/og-fonts';
import { getOgTheme } from '@/seo/ogTheme';

export const localizedPageOgSize = { width: 1200, height: 630 };

export type LocalizedOgPage = 'home' | 'consultants' | 'pricing' | 'blog' | 'about';
type SupportedLocale = 'tr' | 'en' | 'de';

type PageOgCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  backgroundPath: string;
};

const COPY: Record<LocalizedOgPage, Record<SupportedLocale, PageOgCopy>> = {
  home: {
    tr: { eyebrow: 'ASTROLOJİ VE TAROT', title: 'Canlı Seanslarla Ruhsal Rehberlik', subtitle: 'Onaylı danışmanlarla güvenli ve kişisel bir deneyim', backgroundPath: '/uploads/seo/og_home.png' },
    en: { eyebrow: 'ASTROLOGY AND TAROT', title: 'Spiritual Guidance Through Live Sessions', subtitle: 'A safe, personal experience with verified consultants', backgroundPath: '/uploads/seo/og_home.png' },
    de: { eyebrow: 'ASTROLOGIE UND TAROT', title: 'Spirituelle Beratung in Live-Sitzungen', subtitle: 'Eine sichere, persönliche Erfahrung mit geprüften Beratern', backgroundPath: '/uploads/seo/og_home.png' },
  },
  consultants: {
    tr: { eyebrow: 'ONAYLI UZMANLAR', title: 'Astroloji ve Tarot Danışmanları', subtitle: 'Uzmanınızı seçin, canlı seans için randevu alın', backgroundPath: '/uploads/seo/og_consultants.png' },
    en: { eyebrow: 'VERIFIED EXPERTS', title: 'Astrology and Tarot Consultants', subtitle: 'Choose your expert and book a live session', backgroundPath: '/uploads/seo/og_consultants.png' },
    de: { eyebrow: 'GEPRÜFTE EXPERTEN', title: 'Astrologie- und Tarotberater', subtitle: 'Wählen Sie Ihren Experten und buchen Sie eine Live-Sitzung', backgroundPath: '/uploads/seo/og_consultants.png' },
  },
  pricing: {
    tr: { eyebrow: 'ŞEFFAF FİYATLANDIRMA', title: 'Seanslar ve Üyelikler', subtitle: 'İhtiyacınıza uygun hizmeti karşılaştırın', backgroundPath: '/images/og/pricing-2026.png' },
    en: { eyebrow: 'TRANSPARENT PRICING', title: 'Sessions and Memberships', subtitle: 'Compare services and find the right option for you', backgroundPath: '/images/og/pricing-2026.png' },
    de: { eyebrow: 'TRANSPARENTE PREISE', title: 'Sitzungen und Mitgliedschaften', subtitle: 'Vergleichen Sie Leistungen und finden Sie die passende Option', backgroundPath: '/images/og/pricing-2026.png' },
  },
  blog: {
    tr: { eyebrow: 'ASTROLOJİ GÜNLÜĞÜ', title: 'Astroloji Rehberleri ve Yorumlar', subtitle: 'Gökyüzünü ve kendinizi daha yakından keşfedin', backgroundPath: '/images/og/blog-2026.png' },
    en: { eyebrow: 'ASTROLOGY JOURNAL', title: 'Astrology Guides and Insights', subtitle: 'Explore the sky and understand yourself more deeply', backgroundPath: '/images/og/blog-2026.png' },
    de: { eyebrow: 'ASTROLOGIE-JOURNAL', title: 'Astrologie-Ratgeber und Einblicke', subtitle: 'Entdecken Sie den Himmel und sich selbst neu', backgroundPath: '/images/og/blog-2026.png' },
  },
  about: {
    tr: { eyebrow: 'HAKKIMIZDA', title: 'Misyon, Deneyim ve Güven', subtitle: 'GoldMoodAstro yaklaşımını ve kurucu hikayesini keşfedin', backgroundPath: '/images/og/about-2026.png' },
    en: { eyebrow: 'ABOUT US', title: 'Mission, Experience and Trust', subtitle: 'Discover the GoldMoodAstro approach and founder story', backgroundPath: '/images/og/about-2026.png' },
    de: { eyebrow: 'ÜBER UNS', title: 'Mission, Erfahrung und Vertrauen', subtitle: 'Entdecken Sie den Ansatz und die Gründerstory von GoldMoodAstro', backgroundPath: '/images/og/about-2026.png' },
  },
};

function supportedLocale(locale: string): SupportedLocale {
  return locale === 'tr' || locale === 'de' ? locale : 'en';
}

export function localizedPageOgCopy(page: LocalizedOgPage, locale: string): PageOgCopy {
  return COPY[page][supportedLocale(locale)];
}

export async function createLocalizedPageOgImage(page: LocalizedOgPage, locale: string) {
  const copy = localizedPageOgCopy(page, locale);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');
  const fonts = await getOgFonts().catch(() => undefined);
  const theme = await getOgTheme();

  return new ImageResponse(
    (
      <div
        style={{
          width: localizedPageOgSize.width,
          height: localizedPageOgSize.height,
          position: 'relative',
          display: 'flex',
          overflow: 'hidden',
          background: theme.bg,
          color: theme.text,
          fontFamily: 'Cinzel',
        }}
      >
        <img
          src={`${siteUrl}${copy.backgroundPath}`}
          alt=""
          width={localizedPageOgSize.width}
          height={localizedPageOgSize.height}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            background: 'linear-gradient(90deg, rgba(13,11,30,0.96) 0%, rgba(13,11,30,0.84) 56%, rgba(13,11,30,0.38) 100%)',
          }}
        />
        <div style={{ position: 'relative', padding: '72px 76px', width: '78%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 25, color: theme.gold, letterSpacing: 4 }}>{`${theme.brandUpper} · ${copy.eyebrow}`}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 67, lineHeight: 1.08, textShadow: '0 3px 18px rgba(0,0,0,0.55)' }}>{copy.title}</div>
            <div style={{ display: 'flex', maxWidth: 850, fontSize: 29, lineHeight: 1.35, color: theme.text, opacity: 0.92 }}>{copy.subtitle}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 23, color: theme.gold }}>
            <div style={{ width: 42, height: 2, display: 'flex', background: theme.gold }} />
            {theme.domain}
          </div>
        </div>
      </div>
    ),
    { ...localizedPageOgSize, fonts },
  );
}
