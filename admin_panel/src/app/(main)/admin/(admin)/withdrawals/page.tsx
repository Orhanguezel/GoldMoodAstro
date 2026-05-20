import React from 'react';
import type { Metadata } from 'next';
import { WithdrawalsClient } from './withdrawals-client';
import { PageContainer } from '@/components/layout/PageContainer';

export const metadata: Metadata = {
  title: 'Para Çekme Talepleri | GoldMoodAstro',
  description: 'Bekleyen para çekme taleplerini yönetin.',
};

export default function AdminWithdrawalsPage() {
  return (
    <PageContainer
      title="Para Çekme Talepleri"
      description="Danışmanların para çekme taleplerini görüntüleyin, onaylayın veya reddedin."
      breadcrumbs={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Para Çekme Talepleri' },
      ]}
    >
      <WithdrawalsClient />
    </PageContainer>
  );
}
