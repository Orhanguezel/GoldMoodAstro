'use client';

import React, { useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { tr as dateFnsTr } from 'date-fns/locale';
import { ShieldCheck, Clock, Calendar, User } from 'lucide-react';
import { useCreateBookingPublicMutation } from '@/integrations/rtk/public/bookings_public.endpoints';
import { useCreateForBookingMutation, useInitIyzicoPaymentMutation } from '@/integrations/rtk/public/orders.endpoints';

export default function BookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'tr';

  const consultantId = searchParams.get('consultantId') || '';
  const resourceId = searchParams.get('resourceId') || '';
  const slotId = searchParams.get('slotId') || '';
  const date = searchParams.get('date') || '';
  const time = searchParams.get('time') || '';
  const price = searchParams.get('price') || '0';
  const duration = searchParams.get('duration') || '60';
  const name = searchParams.get('name') || '';

  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [createBooking] = useCreateBookingPublicMutation();
  const [createOrder] = useCreateForBookingMutation();
  const [initIyzico] = useInitIyzicoPaymentMutation();

  const dateLocale = locale === 'tr' ? dateFnsTr : undefined;
  const formattedDate = date
    ? format(parseISO(date), 'd MMMM yyyy', { locale: dateLocale })
    : '—';

  const handleCheckout = async () => {
    if (!consultantId || !resourceId || !slotId || !date || !time) {
      setError(locale === 'tr' ? 'Eksik randevu bilgisi.' : 'Missing booking information.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // 1. Randevu oluştur
      const booking = await createBooking({
        consultant_id: consultantId,
        resource_id: resourceId,
        slot_id: slotId,
        appointment_date: date,
        appointment_time: time,
        session_duration: Number(duration),
        session_price: price,
        customer_note: note || undefined,
      } as any).unwrap();

      // 2. Sipariş oluştur
      const order = await createOrder({
        booking_id: (booking as any).id ?? (booking as any).booking?.id,
        payment_gateway_slug: 'iyzipay',
      }).unwrap();

      // 3. Iyzipay başlat
      const iyzico = await initIyzico({ orderId: order.order_id, locale }).unwrap();

      // 4. Iyzipay'e yönlendir
      window.location.href = iyzico.checkout_url;
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.message || 'Hata oluştu.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center py-20" style={{ padding: '5rem 4%' }}>
      <div className="w-full max-w-[480px]">
        <h1 className="font-serif text-3xl text-text mb-2">
          {locale === 'tr' ? 'Randevu Özeti' : 'Booking Summary'}
        </h1>
        <p className="text-text-muted text-sm mb-8">
          {locale === 'tr' ? 'Bilgilerinizi kontrol edin ve ödemeye geçin.' : 'Review your details and proceed to payment.'}
        </p>

        {/* Summary card */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 mb-5 space-y-4">
          <div className="flex items-center gap-3">
            <User size={16} className="text-text-muted flex-shrink-0" />
            <div>
              <p className="text-xs text-text-muted">{locale === 'tr' ? 'Danışman' : 'Consultant'}</p>
              <p className="text-text font-medium">{name || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-text-muted flex-shrink-0" />
            <div>
              <p className="text-xs text-text-muted">{locale === 'tr' ? 'Tarih' : 'Date'}</p>
              <p className="text-text font-medium">{formattedDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-text-muted flex-shrink-0" />
            <div>
              <p className="text-xs text-text-muted">{locale === 'tr' ? 'Saat & Süre' : 'Time & Duration'}</p>
              <p className="text-text font-medium">{time} · {duration} dk</p>
            </div>
          </div>

          <div className="border-t border-border pt-4 flex items-center justify-between">
            <span className="text-text-muted text-sm">{locale === 'tr' ? 'Toplam' : 'Total'}</span>
            <span className="font-serif text-2xl text-brand-secondary">
              ₺{Math.round(Number(price))}
            </span>
          </div>
        </div>

        {/* Note */}
        <div className="mb-5">
          <label className="block text-xs text-text-muted mb-1.5">
            {locale === 'tr' ? 'Not (opsiyonel)' : 'Note (optional)'}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder={locale === 'tr' ? 'Danışmana iletmek istediğiniz bir not...' : 'A note for the consultant...'}
            className="w-full bg-bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted resize-none focus:outline-none focus:border-brand-primary/50 transition-colors"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm">
            {error}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full py-3.5 rounded-full bg-brand-primary text-text font-medium text-base transition-all hover:opacity-90 disabled:opacity-50 shadow-glow"
        >
          {loading
            ? locale === 'tr' ? 'İşleniyor...' : 'Processing...'
            : locale === 'tr' ? 'Güvenli Ödemeye Geç' : 'Proceed to Payment'}
        </button>

        {/* Trust badge */}
        <div className="flex items-center justify-center gap-2 mt-4 text-text-muted text-xs">
          <ShieldCheck size={13} />
          <span>{locale === 'tr' ? 'Iyzipay güvencesiyle ödeme' : 'Payment secured by Iyzipay'}</span>
        </div>
      </div>
    </main>
  );
}
