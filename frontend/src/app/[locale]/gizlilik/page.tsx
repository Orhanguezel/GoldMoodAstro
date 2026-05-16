'use client';

import React, { useMemo } from 'react';
import PrivacyPolicyPageContent from '@/components/containers/legal/PrivacyPolicyPageContent';
import { LayoutSeoBridge } from '@/seo';
import { useLocaleShort, useUiSection } from '@/i18n';
import { isValidUiText, safeStr } from '@/integrations/shared';
import PageContainer from '@/components/common/PageContainer';
import Banner from '@/layout/banner/Breadcrum';

export default function GizlilikPage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_privacy_policy', locale as any);

  const bannerTitle = useMemo(() => {
    const key = 'ui_privacy_policy_fallback_title';
    const v = safeStr(ui(key, ''));
    return isValidUiText(v, key) ? v : 'Gizlilik Politikası';
  }, [ui]);

  return (
    <>
      <LayoutSeoBridge title={bannerTitle} noindex={false} />
      <Banner title={bannerTitle} />
      <PageContainer width="readable" pad="large" className="bg-(--gm-bg) min-h-[50vh]">
        <PrivacyPolicyPageContent />
      </PageContainer>
    </>
  );
}
