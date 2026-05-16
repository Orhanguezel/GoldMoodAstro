'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageContainer from '@/components/common/PageContainer';

export default function ProfileBookingsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'tr';

  useEffect(() => {
    router.replace(`/${locale}/dashboard?tab=bookings`);
  }, [locale, router]);

  return (
    <PageContainer center className="min-h-screen bg-(--gm-bg)">
      <p className="text-(--gm-muted) animate-pulse">Yönlendiriliyorsunuz...</p>
    </PageContainer>
  );
}
