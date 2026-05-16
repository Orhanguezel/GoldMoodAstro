'use client';

import React, { useMemo } from 'react';
import PrivacyNoticePageContent from '@/components/containers/legal/PrivacyNoticePageContent';
import { LayoutSeoBridge } from '@/seo';
import { useLocaleShort, useUiSection } from '@/i18n';
import { isValidUiText } from '@/integrations/shared';
import { safeStr } from '@/integrations/shared';
import PageContainer from '@/components/common/PageContainer';
import Banner from '@/layout/banner/Breadcrum';

export default function PrivacyNoticePage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_privacy_notice', locale as any);

  const bannerTitle = useMemo(() => {
    const key = 'ui_privacy_notice_page_title';
    const v = safeStr(ui(key, ''));
    return isValidUiText(v, key) ? v : 'Privacy Notice';
  }, [ui]);

  return (
    <>
      <LayoutSeoBridge title={bannerTitle} noindex={false} />
      <Banner title={bannerTitle} />
      <PageContainer width="readable" pad="large" className="bg-(--gm-bg) min-h-[50vh]">
        <PrivacyNoticePageContent />
      </PageContainer>
    </>
  );
}
