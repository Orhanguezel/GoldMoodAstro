'use client';

import React, { useMemo } from 'react';
import Banner from '@/layout/banner/Breadcrum';
import CookiePolicyPageContent from '@/components/containers/legal/CookiePolicyPageContent';
import { LayoutSeoBridge } from '@/seo';
import { useLocaleShort, useUiSection } from '@/i18n';
import { isValidUiText } from '@/integrations/shared';
import { safeStr } from '@/integrations/shared';

import PageContainer from '@/components/common/PageContainer';

export default function CookiePolicyPage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_cookie_policy', locale as any);

  const bannerTitle = useMemo(() => {
    const key = 'ui_cookie_policy_page_title';
    const v = safeStr(ui(key, ''));
    return isValidUiText(v, key) ? v : 'Cookie Policy';
  }, [ui]);

  return (
    <PageContainer width="readable" pad="large">
      <LayoutSeoBridge title={bannerTitle} noindex={false} />
      <CookiePolicyPageContent />
    </PageContainer>
  );
}
