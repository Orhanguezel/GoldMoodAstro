'use client';

import React, { useMemo } from 'react';
import Banner from '@/layout/banner/Breadcrum';
import PrivacyPolicyPageContent from '@/components/containers/legal/PrivacyPolicyPageContent';
import { LayoutSeoBridge } from '@/seo';
import { useLocaleShort, useUiSection } from '@/i18n';
import { isValidUiText, safeStr } from '@/integrations/shared';

import PageContainer from '@/components/common/PageContainer';

export default function PrivacyPolicyPage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_privacy_policy', locale as any);

  const bannerTitle = useMemo(() => {
    const key = 'ui_privacy_policy_page_title';
    const v = safeStr(ui(key, ''));
    return isValidUiText(v, key) ? v : 'Privacy Policy';
  }, [ui]);

  return (
    <PageContainer verticalPadding="large">
      <LayoutSeoBridge title={bannerTitle} noindex={false} />
      <PrivacyPolicyPageContent />
    </PageContainer>
  );
}
