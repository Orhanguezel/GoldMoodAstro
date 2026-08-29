import React from 'react';
import ZodiacHub from '@/components/containers/zodiac/ZodiacHub';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';

import PageContainer from '@/components/common/PageContainer';
import Banner from '@/layout/banner/Breadcrum';
import SeoLandingArticle from '@/components/seo/SeoLandingArticle';
import Link from 'next/link';
import { toLocalizedPublicPath, type PublicLocale } from '@/i18n/localizedRoutes';
import { fetchUiStrings } from '@/i18n/fetchUiStrings.server';

export const revalidate = 86400; // 24 hours

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'burclar',
    pathname: '/burclar',
    fallback: {
      title: 'Zodiac Signs and Traits — GoldMoodAstro',
      description: 'Detailed traits, character analyses, elements and ruling planets of the 12 zodiac signs. Discover the hidden world of your sign.',
    },
  });
}

export default async function BurclarPage({ params }: Props) {
  const { locale } = await params;
  const publicLocale = locale === 'en' || locale === 'de' ? locale : 'tr';
  const hubUi = await fetchUiStrings(publicLocale, {
    ui_compat_hub_card_title: publicLocale === 'tr' ? '78 Burç Uyumu Kombinasyonu' : publicLocale === 'de' ? '78 Sternzeichen-Kombinationen' : '78 Zodiac Compatibility Combinations',
    ui_compat_hub_card_text: publicLocale === 'tr' ? 'Tüm burç çiftlerini element ve nitelik üzerinden karşılaştırın.' : publicLocale === 'de' ? 'Vergleiche alle Zeichenpaare nach Element und Qualität.' : 'Compare every sign pair through element and modality.',
    ui_compat_hub_card_action: publicLocale === 'tr' ? 'Tüm uyumları aç' : publicLocale === 'de' ? 'Alle Kombinationen öffnen' : 'Explore all combinations',
  });
  const compatibilityHref = `/${publicLocale}${toLocalizedPublicPath(publicLocale as PublicLocale, '/burclar/uyum')}`;

  const BANNER: Record<string, string> = { tr: 'Burçlar', en: 'Zodiac Signs', de: 'Sternzeichen' };
  return (
    <>
      <Banner title={BANNER[locale] ?? BANNER.en} showTitle={false} />
      <PageContainer className="bg-(--gm-bg)" pad="afterBanner">
        <ZodiacHub />
        <Link
          href={compatibilityHref}
          className="mx-auto mb-12 block max-w-5xl rounded-3xl border border-(--gm-gold)/25 bg-(--gm-surface) p-6 transition hover:border-(--gm-gold)/50 md:p-8"
        >
          <h2 className="font-serif text-2xl text-(--gm-text)">{hubUi.ui_compat_hub_card_title}</h2>
          <p className="mt-2 text-(--gm-text-dim)">{hubUi.ui_compat_hub_card_text}</p>
          <span className="mt-4 inline-block text-xs font-bold uppercase tracking-[0.2em] text-(--gm-gold)">
            {hubUi.ui_compat_hub_card_action} →
          </span>
        </Link>
        {/* 2026-07-20: sayfa 283 kelimeydi, burclar hakkinda hic aciklama yoktu. */}
        <SeoLandingArticle type="burclar" locale={locale} />
      </PageContainer>
    </>
  );
}
