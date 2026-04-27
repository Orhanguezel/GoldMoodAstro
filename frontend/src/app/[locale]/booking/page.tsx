'use client';

import React, { useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { tr as dateFnsTr } from 'date-fns/locale';
import { ShieldCheck, Clock, Calendar, User } from 'lucide-react';
import { useCreateBookingPublicMutation } from '@/integrations/rtk/public/bookings_public.endpoints';
import { useCreateForBookingMutation, useInitIyzicoPaymentMutation } from '@/integrations/rtk/public/orders.endpoints';
import { useRedeemCampaignMutation } from '@/integrations/rtk/public/campaigns.endpoints';
import { Tag, Check, X } from 'lucide-react';

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
  const [redeemCampaign] = useRedeemCampaignMutation();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCampaign, setAppliedCampaign] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const dateLocale = locale === 'tr' ? dateFnsTr : undefined;
  
  const originalPrice = Number(price);
  let finalPrice = originalPrice;
  let discountAmount = 0;

  if (appliedCampaign) {
    if (appliedCampaign.type === 'discount_percentage') {
      discountAmount = (originalPrice * Number(appliedCampaign.value)) / 100;
    } else if (appliedCampaign.type === 'discount_fixed') {
      discountAmount = Number(appliedCampaign.value);
    }
    finalPrice = Math.max(0, originalPrice - discountAmount);
  }

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await redeemCampaign({ 
        code: couponCode, 
        applies_to: 'consultant_booking' 
      }).unwrap();
      setAppliedCampaign(res.campaign);
    } catch (err: any) {
      setCouponError(locale === 'tr' ? 'Geçersiz kupon kodu.' : 'Invalid coupon code.');
    } finally {
      setCouponLoading(false);
    }
  };
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

          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">{locale === 'tr' ? 'Seans Ücreti' : 'Session Price'}</span>
              <span className="text-text">₺{Math.round(originalPrice)}</span>
            </div>
            
            {appliedCampaign && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-success flex items-center gap-1">
                  <Tag size={12} />
                  {locale === 'tr' ? 'İndirim' : 'Discount'} ({appliedCampaign.code})
                </span>
                <span className="text-success">-₺{Math.round(discountAmount)}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-text-muted text-sm">{locale === 'tr' ? 'Toplam' : 'Total'}</span>
              <span className="font-serif text-2xl text-brand-secondary">
                ₺{Math.round(finalPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Coupon Code */}
        <div className="mb-5">
          <label className="block text-xs text-text-muted mb-1.5">
            {locale === 'tr' ? 'Kupon Kodu' : 'Coupon Code'}
          </label>
          <div className="relative">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              disabled={!!appliedCampaign || couponLoading}
              placeholder={locale === 'tr' ? 'Kupon kodunu girin...' : 'Enter coupon code...'}
              className="w-full bg-bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-brand-primary/50 transition-colors uppercase font-mono"
            />
            {!appliedCampaign ? (
              <button
                onClick={handleApplyCoupon}
                disabled={!couponCode || couponLoading}
                className="absolute right-2 top-2 bottom-2 px-4 rounded-lg bg-brand-primary/10 text-brand-primary text-xs font-bold hover:bg-brand-primary/20 transition-colors disabled:opacity-50"
              >
                {couponLoading ? '...' : (locale === 'tr' ? 'UYGULA' : 'APPLY')}
              </button>
            ) : (
              <div className="absolute right-3 top-3 text-success">
                <Check size={20} />
              </div>
            )}
          </div>
          {couponError && <p className="text-[10px] text-error mt-1 ml-1">{couponError}</p>}
          {appliedCampaign && (
            <button 
              onClick={() => { setAppliedCampaign(null); setCouponCode(''); }}
              className="text-[10px] text-text-muted mt-1 ml-1 hover:text-error flex items-center gap-1"
            >
              <X size={10} /> {locale === 'tr' ? 'Kuponu Kaldır' : 'Remove Coupon'}
            </button>
          )}
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
