'use client';

import React, { useMemo } from 'react';
import Banner from '@/layout/banner/Breadcrum';
import KvkkPageContent from '@/components/containers/legal/KvkkPageContent';
import { LayoutSeoBridge } from '@/seo';
import { useLocaleShort, useUiSection } from '@/i18n';
import { isValidUiText, safeStr } from '@/integrations/shared';

import PageContainer from '@/components/common/PageContainer';

export default function KvkkPage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_kvkk', locale as any);

  const bannerTitle = useMemo(() => {
    const key = 'ui_kvkk_page_title';
    const v = safeStr(ui(key, ''));
    return isValidUiText(v, key) ? v : 'KVKK Aydınlatma Metni';
  }, [ui]);

  return (
    <PageContainer width="readable" pad="page">
      <LayoutSeoBridge title={bannerTitle} noindex={false} />
      <KvkkPageContent />
    </PageContainer>
  );
}
