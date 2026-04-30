'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ProfileBookingsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'tr';

  useEffect(() => {
    router.replace(`/${locale}/dashboard?tab=bookings`);
  }, [locale, router]);

  return (
    <div className="min-h-screen bg-(--gm-bg) flex items-center justify-center">
      <p className="text-(--gm-muted) animate-pulse">Yönlendiriliyorsunuz...</p>
    </div>
  );
}
