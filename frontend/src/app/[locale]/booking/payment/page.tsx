'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';
import { localizePath } from '@/integrations/shared';

export default function BookingPaymentCallbackPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'tr';

  const status = searchParams.get('status');
  const isSuccess = status === 'success';

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
    <main className="min-h-screen flex items-center justify-center py-20 px-4">
      <div className="w-full max-w-[440px] text-center">
        {isSuccess ? (
          <>
            <CheckCircle2 size={64} className="mx-auto mb-6 text-green-500" strokeWidth={1.5} />
            <h1 className="font-serif text-3xl text-text mb-3">{copy.successTitle}</h1>
            <p className="text-text-muted text-sm leading-relaxed mb-8">{copy.successDesc}</p>
            <Link
              href={localizePath(locale, '/profile/bookings')}
              className="inline-block w-full py-3.5 rounded-full bg-brand-primary text-white font-medium text-base text-center hover:opacity-90 transition-opacity"
            >
              {copy.myBookings}
            </Link>
          </>
        ) : (
          <>
            <XCircle size={64} className="mx-auto mb-6 text-red-500" strokeWidth={1.5} />
            <h1 className="font-serif text-3xl text-text mb-3">{copy.failTitle}</h1>
            <p className="text-text-muted text-sm leading-relaxed mb-8">{copy.failDesc}</p>
            <div className="flex flex-col gap-3">
              <Link
                href={localizePath(locale, '/consultants')}
                className="inline-block w-full py-3.5 rounded-full bg-brand-primary text-white font-medium text-base text-center hover:opacity-90 transition-opacity"
              >
                {copy.tryAgain}
              </Link>
              <Link
                href={localizePath(locale, '/')}
                className="inline-block w-full py-3.5 rounded-full border border-border text-text-muted text-sm text-center hover:border-brand-primary hover:text-text transition-colors"
              >
                {copy.home}
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
