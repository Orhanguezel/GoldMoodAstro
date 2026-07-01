'use client';

import React, { useMemo } from 'react';
import KvkkPageContent from '@/components/containers/legal/KvkkPageContent';
import { LayoutSeoBridge } from '@/seo';
import { useLocaleShort, useUiSection } from '@/i18n';
import { isValidUiText, safeStr } from '@/integrations/shared';
import PageContainer from '@/components/common/PageContainer';
import Banner from '@/layout/banner/Breadcrum';

export default function KvkkPage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_kvkk', locale as any);

  const bannerTitle = useMemo(() => {
    const key = 'ui_kvkk_page_title';
    const v = safeStr(ui(key, ''));
    return isValidUiText(v, key) ? v : 'KVKK Disclosure Text';
  }, [ui]);

  return (
    <>
      <LayoutSeoBridge title={bannerTitle} noindex={false} />
      <Banner title={bannerTitle} />
      <PageContainer width="readable" pad="large" className="bg-(--gm-bg) min-h-[50vh]">
        <KvkkPageContent />
      </PageContainer>
    </>
  );
}
