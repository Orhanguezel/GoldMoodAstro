'use client';

import React, { useMemo } from 'react';
import AboutPageContent from '@/components/containers/about/AboutPageContent';
import PageContainer from '@/components/common/PageContainer';
import { LayoutSeoBridge } from '@/seo';
import { useLocaleShort, useUiSection } from '@/i18n';
import { isValidUiText } from '@/integrations/shared';
import { safeStr, toCdnSrc } from '@/integrations/shared';
import Banner from '@/layout/banner/Breadcrum';

export default function AboutPage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_about', locale as any);

  const routeTitle = useMemo(() => {
    if (locale === 'de') return 'About';
    if (locale === 'tr') return 'About';
    return 'About';
  }, [locale]);

  const bannerTitle = useMemo(() => {
    const key = 'ui_about_page_title';
    const v = safeStr(ui(key, ''));
    return isValidUiText(v, key) ? v : routeTitle;
  }, [ui, routeTitle]);

  const pageTitle = useMemo(() => {
    const key = 'ui_about_meta_title';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;
    return `${bannerTitle || routeTitle} | GoldMoodAstro`;
  }, [ui, bannerTitle, routeTitle]);

  const pageDescription = useMemo(() => {
    const key = 'ui_about_meta_description';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;

    const key2 = 'ui_about_page_description';
    const d = safeStr(ui(key2, ''));
    if (isValidUiText(d, key2)) return d;

    if (locale === 'de')
      return 'Learn more about GoldMoodAstro, the platform for astrology, tarot and life coaching with experienced consultants.';
    if (locale === 'tr')
      return 'Learn more about GoldMoodAstro, the platform for astrology, tarot and life coaching with expert consultants.';
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
      <Banner title={routeTitle} />
      <PageContainer pad="large">
      <LayoutSeoBridge
        title={pageTitle}
        description={pageDescription}
        ogImage={ogImageOverride}
        noindex={false}
      />
      <AboutPageContent />
    </PageContainer>
    </>
  );
}
