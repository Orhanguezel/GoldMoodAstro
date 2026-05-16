'use client';

import React, { useMemo } from 'react';
import Banner from '@/layout/banner/Breadcrum';
import TermsPageContent from '@/components/containers/legal/TermsPageContent';
import { LayoutSeoBridge } from '@/seo';
import { useLocaleShort, useUiSection } from '@/i18n';
import { isValidUiText } from '@/integrations/shared';
import { safeStr } from '@/integrations/shared';

import PageContainer from '@/components/common/PageContainer';

export default function TermsPage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_terms', locale as any);

  // -----------------------------
  // Banner Title (UI)
  // -----------------------------
  const bannerTitle = useMemo(() => {
    const key = 'ui_terms_page_title';
    const v = safeStr(ui(key, ''));
    return isValidUiText(v, key) ? v : 'Terms';
  }, [ui]);

  // Basic SEO - typically legal pages don't need heavy SEO logic, just title
  const pageTitle = bannerTitle;

  return (
    <PageContainer verticalPadding="large">
      <LayoutSeoBridge title={pageTitle} noindex={false} />
      <TermsPageContent />
    </PageContainer>
  );
}
