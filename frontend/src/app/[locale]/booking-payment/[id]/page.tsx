'use client';

import React from 'react';
import { use } from 'react';
import Banner from '@/layout/banner/Breadcrum';
import BookingPaymentContent from '@/components/containers/booking-payment/BookingPaymentContent';
import { useLocaleShort } from '@/i18n';

export default function BookingPaymentPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = use(params);
  const locale = useLocaleShort();

  const title =
    locale === 'de'
      ? 'Zahlung'
      : locale === 'tr'
        ? 'Ödeme'
        : 'Payment';

  return (
    <>
      <Banner title={title} />
      <BookingPaymentContent bookingId={id} />
    </>
  );
}
