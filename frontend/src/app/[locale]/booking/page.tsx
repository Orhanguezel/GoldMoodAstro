'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { tr as dateFnsTr } from 'date-fns/locale';
import { ShieldCheck, Clock, Calendar, User, Tag, Check, X, ArrowLeft, Lock, Sparkles } from 'lucide-react';
import { useCreateBookingPublicMutation } from '@/integrations/rtk/public/bookings_public.endpoints';
import { useCreateForBookingMutation, useInitIyzicoPaymentMutation } from '@/integrations/rtk/public/orders.endpoints';
import { useRedeemCampaignMutation } from '@/integrations/rtk/public/campaigns.endpoints';
import { useGetConsultantPublicQuery } from '@/integrations/rtk/public/consultants.public.endpoints';
import { useAuthStore } from '@/features/auth/auth.store';
import Link from 'next/link';

export default function BookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'tr';

  // Booking endpoint requireAuth korumalı — login değilse login sayfasına dönüş
  // url ile yönlendir; login sonrası bu sayfaya geri gelir.
  // ÖNEMLİ: isReady'ı bekle — yoksa ME yüklenirken false olup haksız redirect.
  const { isAuthenticated, isReady } = useAuthStore();
  useEffect(() => {
    if (isReady && !isAuthenticated) {
      const returnTo = encodeURIComponent(
        `${window.location.pathname}${window.location.search}`,
      );
      router.replace(`/${locale}/login?next=${returnTo}`);
    }
  }, [isReady, isAuthenticated, locale, router]);

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

  // Danışman profilini API'den çek (avatar için)
  const { data: consultant } = useGetConsultantPublicQuery(consultantId, {
    skip: !consultantId,
  });
  const avatarUrl = consultant?.avatar_url || '';
  const consultantName = consultant?.full_name || name;
  const initials = (consultantName || 'GM')
    .split(/\s+/)
    .map((w) => w[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
      // Backend YYYY-MM-DD bekliyor; URL ISO formatında gelebilir
      const ymd = date.length >= 10 ? date.slice(0, 10) : date;

      const booking = await createBooking({
        consultant_id: consultantId,
        resource_id: resourceId,
        appointment_date: ymd,
        appointment_time: time,
        session_duration: Number(duration),
        session_price: price,
        customer_message: note || undefined,
      } as any).unwrap();

      const order = await createOrder({
        booking_id: (booking as any).id ?? (booking as any).booking?.id,
        payment_gateway_slug: 'iyzico',
      }).unwrap();

      const iyzico = await initIyzico({ orderId: order.order_id, locale }).unwrap();
      window.location.href = iyzico.checkout_url;
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.message || 'Hata oluştu.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--gm-bg)] px-6 pb-24 pt-32">
      <div className="mx-auto max-w-5xl grid lg:grid-cols-2 gap-16 items-start">
        
        {/* Left: Summary */}
        <div className="space-y-10">
          <div>
            <Link href={`/${locale}/consultants/${consultantId}`} className="inline-flex items-center gap-2 text-[var(--gm-text-dim)] hover:text-[var(--gm-gold)] transition-colors text-sm font-bold uppercase tracking-widest mb-10">
              <ArrowLeft className="w-4 h-4" /> Geri Dön
            </Link>
            <h1 className="font-serif text-5xl text-[var(--gm-text)] leading-tight mb-4">Seansınızı <br />Tamamlayın</h1>
            <p className="text-[var(--gm-text-dim)] font-serif italic text-lg leading-relaxed">
              Uzman rehberliğinde kozmik bir yolculuğa başlamadan önceki son adım.
            </p>
          </div>

          <div className="bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] rounded-[32px] p-10 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
              <Sparkles className="w-20 h-20 text-[var(--gm-gold)]" />
            </div>

            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-full border-2 border-(--gm-gold)/30 p-0.5 shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={consultantName || 'Danışman'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-(--gm-bg-deep) flex items-center justify-center text-(--gm-gold) font-display text-base">
                    {initials}
                  </div>
                )}
              </div>
              <div>
                <p className="text-[var(--gm-gold-dim)] text-[10px] font-bold tracking-[0.2em] uppercase mb-1">Danışman</p>
                <p className="text-[var(--gm-text)] font-serif text-2xl">{consultantName || '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <Calendar className="w-5 h-5 text-[var(--gm-gold)] mt-1" />
                <div>
                  <p className="text-[var(--gm-gold-dim)] text-[9px] font-bold tracking-[0.2em] uppercase mb-1">Tarih</p>
                  <p className="text-[var(--gm-text)] font-serif text-lg">{formattedDate}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock className="w-5 h-5 text-[var(--gm-gold)] mt-1" />
                <div>
                  <p className="text-[var(--gm-gold-dim)] text-[9px] font-bold tracking-[0.2em] uppercase mb-1">Saat & Süre</p>
                  <p className="text-[var(--gm-text)] font-serif text-lg">{time} · {duration}dk</p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-[var(--gm-border-soft)] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[var(--gm-text-dim)] font-serif text-lg italic">Seans Ücreti</span>
                <span className="text-[var(--gm-text)] font-serif text-xl">₺{Math.round(originalPrice)}</span>
              </div>
              
              {appliedCampaign && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--gm-success)] font-serif text-lg italic flex items-center gap-2">
                    <Tag className="w-4 h-4" /> İndirim ({appliedCampaign.code})
                  </span>
                  <span className="text-[var(--gm-success)] font-serif text-xl">-₺{Math.round(discountAmount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-[var(--gm-border-soft)]">
                <span className="text-[var(--gm-text)] font-serif text-2xl italic">Toplam</span>
                <span className="text-[var(--gm-gold)] font-serif text-4xl">₺{Math.round(finalPrice)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="space-y-8 pt-16">
          {/* Coupon */}
          <div className="bg-[var(--gm-bg-deep)]/50 border border-[var(--gm-border-soft)] rounded-[24px] p-8">
            <label className="block text-[10px] font-bold text-[var(--gm-gold-dim)] tracking-[0.2em] uppercase mb-4 ml-1">
              Kupon Kodunuz
            </label>
            <div className="relative">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                disabled={!!appliedCampaign || couponLoading}
                placeholder="Kupon girin..."
                className="w-full bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] rounded-2xl px-6 py-4 text-sm text-[var(--gm-text)] placeholder:text-[var(--gm-muted)] focus:outline-none focus:border-[var(--gm-gold)]/50 transition-colors uppercase font-mono tracking-wider"
              />
              {!appliedCampaign ? (
                <button
                  onClick={handleApplyCoupon}
                  disabled={!couponCode || couponLoading}
                  className="absolute right-2 top-2 bottom-2 px-6 rounded-xl bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] text-xs font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {couponLoading ? '...' : 'UYGULA'}
                </button>
              ) : (
                <div className="absolute right-4 top-4 text-[var(--gm-success)]">
                  <Check className="w-6 h-6" />
                </div>
              )}
            </div>
            {couponError && <p className="text-xs text-[var(--gm-error)] mt-3 ml-2 italic">{couponError}</p>}
            {appliedCampaign && (
              <button 
                onClick={() => { setAppliedCampaign(null); setCouponCode(''); }}
                className="text-[10px] font-bold text-[var(--gm-text-dim)] mt-3 ml-2 hover:text-[var(--gm-error)] flex items-center gap-2 transition-colors uppercase tracking-widest"
              >
                <X className="w-3 h-3" /> İndirimi Kaldır
              </button>
            )}
          </div>

          {/* Note */}
          <div className="bg-[var(--gm-bg-deep)]/50 border border-[var(--gm-border-soft)] rounded-[24px] p-8">
            <label className="block text-[10px] font-bold text-[var(--gm-gold-dim)] tracking-[0.2em] uppercase mb-4 ml-1">
              Danışmana Not (Opsiyonel)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Görüşme öncesi iletmek istediğiniz detaylar..."
              className="w-full bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] rounded-2xl px-6 py-4 text-sm text-[var(--gm-text)] placeholder:text-[var(--gm-muted)] resize-none focus:outline-none focus:border-[var(--gm-gold)]/50 transition-colors font-serif italic"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-6 rounded-2xl bg-[var(--gm-error)]/5 border border-[var(--gm-error)]/20 text-[var(--gm-error)] text-sm italic font-serif">
              {error}
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full group relative py-6 rounded-full bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] font-bold text-lg tracking-widest uppercase overflow-hidden hover:shadow-[0_0_50px_rgba(201,169,97,0.3)] transition-all disabled:opacity-50"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {loading ? 'İŞLENİYOR...' : (
                <>
                  <Lock className="w-5 h-5" /> GÜVENLİ ÖDEME
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </button>

          {/* Trust badges */}
          <div className="flex flex-col items-center gap-6 pt-4">
            <div className="flex items-center gap-3 text-[var(--gm-text-dim)] text-xs font-bold tracking-[0.2em] uppercase">
              <ShieldCheck className="w-4 h-4 text-[var(--gm-success)]" />
              <span>Güvenli Altyapı</span>
              <span className="opacity-20">|</span>
              <span className="text-[var(--gm-gold-dim)]">Iyzipay</span>
            </div>
            
            <div className="flex gap-4 opacity-30">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4 grayscale invert" alt="Visa" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-4 grayscale invert" alt="Mastercard" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
