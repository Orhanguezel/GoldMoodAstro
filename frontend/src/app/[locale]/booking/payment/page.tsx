'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';
import { localizePath } from '@/integrations/shared';
import { trackEvent } from '@/integrations/telemetry';

import PageContainer from '@/components/common/PageContainer';

export default function BookingPaymentCallbackPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'tr';

  const status = searchParams.get('status');
  const isSuccess = status === 'success';

  useEffect(() => {
    if (isSuccess) {
      trackEvent('booking_completed', { status: 'success' }).catch(() => {});
    }
  }, [isSuccess]);

  const t = {
    tr: {
      successTitle: 'Ödeme Başarılı',
      successDesc: 'Randevunuz onaylandı. Danışmanınız kısa süre içinde sizinle iletişime geçecek.',
      failTitle: 'Ödeme Başarısız',
      failDesc: 'Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin veya farklı bir ödeme yöntemi kullanın.',
      myBookings: 'Randevularım',
      tryAgain: 'Tekrar Dene',
      home: 'Ana Sayfaya Dön',
    },
    en: {
      successTitle: 'Payment Successful',
      successDesc: 'Your booking is confirmed. Your consultant will get in touch with you shortly.',
      failTitle: 'Payment Failed',
      failDesc: 'The payment could not be completed. Please try again or use a different payment method.',
      myBookings: 'My Bookings',
      tryAgain: 'Try Again',
      home: 'Back to Home',
    },
  };

  const copy = t[locale as keyof typeof t] ?? t.tr;

  return (
    <PageContainer width="narrow" center className="bg-(--gm-bg) min-h-screen">
      <div className="w-full max-w-[440px] text-center bg-(--gm-surface) p-8 md:p-12 rounded-[24px] border border-(--gm-border-soft) shadow-(--gm-shadow-soft)">
        {isSuccess ? (
          <>
            <div className="w-20 h-20 bg-(--gm-success)/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-(--gm-success)" strokeWidth={1.5} />
            </div>
            <h1 className="font-serif text-3xl text-(--gm-text) mb-3">{copy.successTitle}</h1>
            <p className="text-(--gm-text-dim) text-sm leading-relaxed mb-8">{copy.successDesc}</p>
            <Link
              href={localizePath(locale, '/dashboard?tab=bookings')}
              className="btn-premium inline-block w-full py-4 text-xs"
            >
              {copy.myBookings}
            </Link>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-(--gm-error)/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={40} className="text-(--gm-error)" strokeWidth={1.5} />
            </div>
            <h1 className="font-serif text-3xl text-(--gm-text) mb-3">{copy.failTitle}</h1>
            <p className="text-(--gm-text-dim) text-sm leading-relaxed mb-8">{copy.failDesc}</p>
            <div className="flex flex-col gap-3">
              <Link
                href={localizePath(locale, '/consultants')}
                className="btn-premium inline-block w-full py-4 text-xs"
              >
                {copy.tryAgain}
              </Link>
              <Link
                href={localizePath(locale, '/')}
                className="btn-outline-premium inline-block w-full py-4 text-xs"
              >
                {copy.home}
              </Link>
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
