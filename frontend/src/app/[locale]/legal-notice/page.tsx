'use client';

import React, { useMemo } from 'react';
import Banner from '@/layout/banner/Breadcrum';
import LegalNoticePageContent from '@/components/containers/legal/LegalNoticePageContent';
import { LayoutSeoBridge } from '@/seo';
import { useLocaleShort, useUiSection } from '@/i18n';
import { isValidUiText } from '@/integrations/shared';
import { safeStr } from '@/integrations/shared';

import PageContainer from '@/components/common/PageContainer';

export default function LegalNoticePage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_legal_notice', locale as any);

  const bannerTitle = useMemo(() => {
    const key = 'ui_legal_notice_page_title';
    const v = safeStr(ui(key, ''));
    return isValidUiText(v, key) ? v : 'Legal Notice';
  }, [ui]);

  return (
    <PageContainer verticalPadding="large">
      <LayoutSeoBridge title={bannerTitle} noindex={false} />
      <LegalNoticePageContent />
    </PageContainer>
  );
}
