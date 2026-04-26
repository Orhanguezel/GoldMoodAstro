'use client';

import React, { useMemo } from 'react';
import Banner from '@/layout/banner/Breadcrum';
import AboutPageContent from '@/components/containers/about/AboutPageContent';
import { LayoutSeoBridge } from '@/seo';
import { useLocaleShort, useUiSection } from '@/i18n';
import { isValidUiText } from '@/integrations/shared';
import { safeStr, toCdnSrc } from '@/integrations/shared';

export default function AboutPage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_about', locale as any);

  const fbBannerTitle = useMemo(() => {
    if (locale === 'de') return 'Über mich';
    if (locale === 'tr') return 'Hakkımda';
    return 'About';
  }, [locale]);

  const bannerTitle = useMemo(() => {
    const key = 'ui_about_page_title';
    const v = safeStr(ui(key, ''));
    return isValidUiText(v, key) ? v : fbBannerTitle;
  }, [ui, fbBannerTitle]);

  const pageTitle = useMemo(() => {
    const key = 'ui_about_meta_title';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;
    return `${bannerTitle || fbBannerTitle} | GoldMoodAstro`;
  }, [ui, bannerTitle, fbBannerTitle]);

  const pageDescription = useMemo(() => {
    const key = 'ui_about_meta_description';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;

    const key2 = 'ui_about_page_description';
    const d = safeStr(ui(key2, ''));
    if (isValidUiText(d, key2)) return d;

    if (locale === 'de')
      return 'Erfahren Sie mehr über GoldMoodAstro — die Plattform für Astrologie, Tarot und Life-Coaching mit erfahrenen Beratern.';
    if (locale === 'tr')
      return 'GoldMoodAstro hakkında bilgi edinin — astroloji, tarot ve yaşam koçluğu için uzman danışmanlarla bağlantı platformu.';
    return 'Learn about GoldMoodAstro — the platform connecting you with expert astrologers, tarot readers and life coaches.';
  }, [ui, locale]);

  const ogImageOverride = useMemo(() => {
    const key = 'ui_about_og_image';
    const raw = safeStr(ui(key, ''));
    if (!raw) return undefined;

    if (/^https?:\/\//i.test(raw)) return raw;
    return toCdnSrc(raw, 1200, 630, 'fill') || raw;
  }, [ui]);

  return (
    <>
      <LayoutSeoBridge
        title={pageTitle}
        description={pageDescription}
        ogImage={ogImageOverride}
        noindex={false}
      />

      <Banner title={bannerTitle} />
      <AboutPageContent />
    </>
  );
}
