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

import PageContainer from '@/components/common/PageContainer';
import { useGetSiteSettingByKeyQuery } from '@/integrations/rtk/public/site_settings.endpoints';
import { gaEvent } from '@/lib/ga';
import { cn } from '@/lib/utils';
import { Mic, Video as VideoIcon } from 'lucide-react';
import { useUiSection } from '@/i18n';

export default function BookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'tr';
  const { ui } = useUiSection('ui_account');

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
  const date = searchParams.get('date') || '';
  const time = searchParams.get('time') || '';
  const price = searchParams.get('price') || '0';
  const duration = searchParams.get('duration') || '60';
  const name = searchParams.get('name') || '';
  const topic = searchParams.get('topic') || '';
  const serviceId = searchParams.get('serviceId') || '';
  const serviceMediaType = searchParams.get('serviceMediaType') || '';

  const [note, setNote] = useState('');
  const [mediaType, setMediaType] = useState<'audio' | 'video'>('audio');
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [consent3, setConsent3] = useState(false);
  const allConsent = consent1 && consent2 && consent3;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Locale-aware legal page slugs (custom_pages i18n slugs)
  const preInfoSlug = locale === 'en' ? 'pre-contract-information' : locale === 'de' ? 'vorvertragliche-informationen' : 'on-bilgilendirme-formu';
  const distanceSlug = locale === 'en' ? 'distance-sales-agreement' : locale === 'de' ? 'fernabsatzvertrag' : 'mesafeli-satis-sozlesmesi';

  const [createBooking] = useCreateBookingPublicMutation();
  const [createOrder] = useCreateForBookingMutation();
  const [initIyzico] = useInitIyzicoPaymentMutation();
  const [redeemCampaign] = useRedeemCampaignMutation();

  const { data: consultant } = useGetConsultantPublicQuery({ id: consultantId, locale }, {
    skip: !consultantId,
  });
  
  const { data: videoSetting } = useGetSiteSettingByKeyQuery({ key: 'feature_video_enabled' });
  const isVideoGlobalEnabled = videoSetting?.value === '1' || videoSetting?.value === 'true';
  const forcedMediaType = serviceMediaType === 'video' || serviceMediaType === 'audio' ? serviceMediaType : null;
  const canShowVideoOption =
    isVideoGlobalEnabled &&
    consultant?.supports_video &&
    !serviceMediaType;
  const resolvedMediaType = forcedMediaType ?? mediaType;
  const avatarUrl = consultant?.avatar_url || '';
  const consultantName = consultant?.full_name || name;
  const initials = (consultantName || 'GM')
    .split(/\s+/)
    .map((w: string) => w[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCampaign, setAppliedCampaign] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const dateLocale = locale === 'tr' ? dateFnsTr : undefined;
  
  const basePrice = Number(price);

  useEffect(() => {
    if (forcedMediaType) setMediaType(forcedMediaType);
  }, [forcedMediaType]);

  const originalPrice = basePrice;
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
      setCouponError(ui('ui_account_booking_invalid_coupon', 'Invalid coupon code.'));
    } finally {
      setCouponLoading(false);
    }
  };

  const formattedDate = date
    ? format(parseISO(date), 'd MMMM yyyy', { locale: dateLocale })
    : '—';

  const handleCheckout = async () => {
    if (!consultantId || !resourceId || !date || !time) {
      setError(ui('ui_account_booking_missing_info', 'Missing booking information.'));
      return;
    }
    if (!allConsent) {
      setError(ui('ui_account_booking_consent_required', 'Devam etmek için tüm onay kutularını işaretleyin.'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      const ymd = date.length >= 10 ? date.slice(0, 10) : date;
      const sourceMatch = topic.match(/^daily_reading_([0-9a-f-]{36})$/i);

      const booking = await createBooking({
        consultant_id: consultantId,
        resource_id: resourceId,
        appointment_date: ymd,
        appointment_time: time,
        session_duration: Number(duration),
        session_price: String(originalPrice),
        media_type: resolvedMediaType,
        withdrawal_consent: true,
        service_id: serviceId || undefined,
        customer_message: note || undefined,
        source_type: sourceMatch ? 'daily_reading' : undefined,
        source_id: sourceMatch?.[1],
      } as any).unwrap();

      // GA4 conversion (key event): paid session -> purchase + value
      const bookingId = (booking as any).id ?? (booking as any).booking?.id;
      gaEvent('purchase', {
        value: finalPrice,
        currency: 'TRY',
        transaction_id: bookingId,
        items: [
          {
            item_id: consultantId,
            item_name: consultantName || 'Consultation Session',
            item_category: 'consultation',
            price: finalPrice,
            quantity: 1,
          },
        ],
      });

      const order = await createOrder({
        booking_id: (booking as any).id ?? (booking as any).booking?.id,
        payment_gateway_slug: 'iyzico',
      }).unwrap();

      const iyzico = await initIyzico({ orderId: order.order_id, locale }).unwrap();
      window.location.href = iyzico.checkout_url;
    } catch (err: any) {
      const code = err?.data?.error?.message || err?.message;
      const msg =
        code === 'slot_conflict'
          ? ui('ui_account_booking_slot_conflict', 'Bu aralik az once doldu. Lutfen takvimden baska bir saat secin.')
          : code === 'outside_working_hours'
          ? ui('ui_account_booking_outside_hours', 'Secilen saat danismanin calisma saatleri disinda.')
          : code || ui('ui_account_booking_error_generic', 'An error occurred.');
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <PageContainer width="wide" className="bg-(--gm-bg)" verticalPadding="large">
      <div className="grid lg:grid-cols-2 gap-16 items-start">
        
        {/* Left: Summary */}
        <div className="space-y-10">
          <div>
            <Link href={`/${locale}/consultants/${consultantId}`} className="inline-flex items-center gap-2 text-(--gm-text-dim) hover:text-(--gm-gold) transition-colors text-sm font-bold uppercase tracking-widest mb-10">
              <ArrowLeft className="w-4 h-4" /> {ui('ui_account_booking_back', 'Go Back')}
            </Link>
            <h1 className="font-serif text-5xl text-(--gm-text) leading-tight mb-4">{ui('ui_account_booking_title_line1', 'Complete')} <br />{ui('ui_account_booking_title_line2', 'Your Session')}</h1>
            <p className="text-(--gm-text-dim) font-serif italic text-lg leading-relaxed">
              {ui('ui_account_booking_subtitle', 'The final step before starting a guided cosmic journey with your expert.')}
            </p>
          </div>

          <div className="bg-(--gm-surface) border border-(--gm-border-soft) rounded-[32px] p-10 space-y-8 relative overflow-hidden shadow-(--gm-shadow-soft)">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
              <Sparkles className="w-20 h-20 text-(--gm-gold)" />
            </div>

            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-full border-2 border-(--gm-gold)/30 p-0.5 shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={consultantName || ui('ui_account_booking_consultant', 'Consultant')}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-(--gm-bg-deep) flex items-center justify-center text-(--gm-gold) font-display text-base">
                    {initials}
                  </div>
                )}
              </div>
              <div>
                <p className="text-(--gm-gold-dim) text-[10px] font-bold tracking-[0.2em] uppercase mb-1">{ui('ui_account_booking_consultant', 'Consultant')}</p>
                <p className="text-(--gm-text) font-serif text-2xl">{consultantName || '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <Calendar className="w-5 h-5 text-(--gm-gold) mt-1" />
                <div>
                  <p className="text-(--gm-gold-dim) text-[9px] font-bold tracking-[0.2em] uppercase mb-1">{ui('ui_account_booking_date_label', 'Date')}</p>
                  <p className="text-(--gm-text) font-serif text-lg">{formattedDate}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock className="w-5 h-5 text-(--gm-gold) mt-1" />
                <div>
                  <p className="text-(--gm-gold-dim) text-[9px] font-bold tracking-[0.2em] uppercase mb-1">{ui('ui_account_booking_time_label', 'Time & Duration')}</p>
                  <p className="text-(--gm-text) font-serif text-lg">{time} · {duration}{ui('ui_account_booking_minutes_suffix', 'min')}</p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-(--gm-border-soft) space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-(--gm-text-dim) font-serif text-lg italic">{ui('ui_account_booking_session_fee', 'Session Fee')}</span>
                <span className="text-(--gm-text) font-serif text-xl">₺{Math.round(originalPrice)}</span>
              </div>
              
              {appliedCampaign && (
                <div className="flex items-center justify-between">
                  <span className="text-(--gm-success) font-serif text-lg italic flex items-center gap-2">
                    <Tag className="w-4 h-4" /> {ui('ui_account_booking_discount', 'Discount')} ({appliedCampaign.code})
                  </span>
                  <span className="text-(--gm-success) font-serif text-xl">-₺{Math.round(discountAmount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-(--gm-border-soft)">
                <span className="text-(--gm-text) font-serif text-2xl italic">{ui('ui_account_booking_total', 'Total')}</span>
                <span className="text-(--gm-gold) font-serif text-4xl">₺{Math.round(finalPrice)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="space-y-8 pt-16">
          {/* Coupon */}
          <div className="bg-(--gm-bg-deep)/50 border border-(--gm-border-soft) rounded-[24px] p-8">
            <label className="block text-[10px] font-bold text-(--gm-gold-dim) tracking-[0.2em] uppercase mb-4 ml-1">
              {ui('ui_account_booking_coupon_label', 'Your Coupon Code')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                disabled={!!appliedCampaign || couponLoading}
                placeholder={ui('ui_account_booking_coupon_placeholder', 'Enter coupon...')}
                className="w-full bg-(--gm-surface) border border-(--gm-border-soft) rounded-2xl px-6 py-4 text-sm text-(--gm-text) placeholder:text-(--gm-text-muted) focus:outline-none focus:border-(--gm-gold)/50 transition-colors uppercase font-mono tracking-wider"
              />
              {!appliedCampaign ? (
                <button
                  onClick={handleApplyCoupon}
                  disabled={!couponCode || couponLoading}
                  className="absolute right-2 top-2 bottom-2 px-6 rounded-xl bg-(--gm-gold) text-(--gm-bg-deep) text-xs font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {couponLoading ? '...' : ui('ui_account_booking_coupon_apply', 'APPLY')}
                </button>
              ) : (
                <div className="absolute right-4 top-4 text-(--gm-success)">
                  <Check className="w-6 h-6" />
                </div>
              )}
            </div>
            {couponError && <p className="text-xs text-(--gm-error) mt-3 ml-2 italic">{couponError}</p>}
            {appliedCampaign && (
              <button 
                onClick={() => { setAppliedCampaign(null); setCouponCode(''); }}
                className="text-[10px] font-bold text-(--gm-text-dim) mt-3 ml-2 hover:text-(--gm-error) flex items-center gap-2 transition-colors uppercase tracking-widest"
              >
                <X className="w-3 h-3" /> {ui('ui_account_booking_coupon_remove', 'Remove Discount')}
              </button>
            )}
          </div>

          {/* Media Type Selection */}
          {canShowVideoOption && (
            <div className="bg-(--gm-bg-deep)/50 border border-(--gm-border-soft) rounded-[24px] p-8">
              <label className="block text-[10px] font-bold text-(--gm-gold-dim) tracking-[0.2em] uppercase mb-6 ml-1">
                {ui('ui_account_booking_media_type_label', 'Select Session Type')}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setMediaType('audio')}
                  className={cn(
                    "flex flex-col items-center gap-4 p-6 rounded-2xl border transition-all duration-300",
                    mediaType === 'audio'
                      ? "bg-(--gm-gold)/10 border-(--gm-gold) text-(--gm-gold)"
                      : "bg-(--gm-surface) border-(--gm-border-soft) text-(--gm-text-dim) hover:border-(--gm-gold)/30"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    mediaType === 'audio' ? "bg-(--gm-gold) text-(--gm-bg-deep)" : "bg-(--gm-bg-deep) text-(--gm-text-muted)"
                  )}>
                    <Mic className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-widest">{ui('ui_account_booking_audio', 'Audio')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMediaType('video')}
                  className={cn(
                    "flex flex-col items-center gap-4 p-6 rounded-2xl border transition-all duration-300",
                    mediaType === 'video'
                      ? "bg-(--gm-gold)/10 border-(--gm-gold) text-(--gm-gold)"
                      : "bg-(--gm-surface) border-(--gm-border-soft) text-(--gm-text-dim) hover:border-(--gm-gold)/30"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    mediaType === 'video' ? "bg-(--gm-gold) text-(--gm-bg-deep)" : "bg-(--gm-bg-deep) text-(--gm-text-muted)"
                  )}>
                    <VideoIcon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-widest">{ui('ui_account_booking_video', 'Video')}</span>
                </button>
              </div>
              <p className="mt-4 ml-2 text-[10px] text-(--gm-text-muted) italic font-serif leading-relaxed">
                {ui('ui_account_booking_video_camera_note', '* You will need to allow camera access for a video session.')}
              </p>
            </div>
          )}

          {/* Note */}
          <div className="bg-(--gm-bg-deep)/50 border border-(--gm-border-soft) rounded-[24px] p-8">
            <label className="block text-[10px] font-bold text-(--gm-gold-dim) tracking-[0.2em] uppercase mb-4 ml-1">
              {ui('ui_account_booking_note_label', 'Note to Consultant (Optional)')}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder={ui('ui_account_booking_note_placeholder', 'Details you would like to share before the session...')}
              className="w-full bg-(--gm-surface) border border-(--gm-border-soft) rounded-2xl px-6 py-4 text-sm text-(--gm-text) placeholder:text-(--gm-text-muted) resize-none focus:outline-none focus:border-(--gm-gold)/50 transition-colors font-serif italic"
            />
          </div>

          {/* Feragat metni */}
          <p className="px-2 text-[11px] text-(--gm-text-muted) italic leading-relaxed">
            {ui('ui_account_booking_disclaimer', 'Bu hizmet; eğlence, kişisel farkındalık ve kişisel değerlendirme amacıyla sunulan çevrim içi danışmanlık hizmetidir. Kesin gelecek tahmini, garanti sonuç, sağlık teşhisi, tedavi önerisi, hukuki danışmanlık, yatırım tavsiyesi, bahis tahmini, büyü, ritüel veya benzeri vaatler içermez. Hizmet başladıktan sonra cayma hakkı kullanılamaz.')}
          </p>

          {/* Mesafeli satış onay kutuları — 3 ayrı, hepsi zorunlu (Mesafeli Söz. Yön. m.15/1-ğ) */}
          <div className="space-y-4 px-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input type="checkbox" checked={consent1} onChange={(e) => setConsent1(e.target.checked)} className="mt-1 w-5 h-5 shrink-0 accent-(--gm-gold)" />
              <span className="text-xs text-(--gm-text-dim) leading-relaxed">
                <Link href={`/${locale}/legal/${preInfoSlug}`} target="_blank" className="text-(--gm-gold) underline underline-offset-2">
                  {ui('ui_account_booking_preinfo_link', 'Ön Bilgilendirme Formu')}
                </Link>
                {ui('ui_account_booking_consent_mid', '’nu ve ')}
                <Link href={`/${locale}/legal/${distanceSlug}`} target="_blank" className="text-(--gm-gold) underline underline-offset-2">
                  {ui('ui_account_booking_distance_link', 'Mesafeli Hizmet Sözleşmesi')}
                </Link>
                {ui('ui_account_booking_consent1', '’ni okudum, anladım ve kabul ediyorum.')}
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input type="checkbox" checked={consent2} onChange={(e) => setConsent2(e.target.checked)} className="mt-1 w-5 h-5 shrink-0 accent-(--gm-gold)" />
              <span className="text-xs text-(--gm-text-dim) leading-relaxed">
                {ui('ui_account_booking_consent2', 'Satın aldığım hizmetin çevrim içi danışmanlık hizmeti olduğunu; eğlence, kişisel farkındalık ve kişisel değerlendirme amacı taşıdığını; kesin sonuç, sağlık, hukuk, finans, yatırım veya gelecek garantisi içermediğini kabul ediyorum.')}
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input type="checkbox" checked={consent3} onChange={(e) => setConsent3(e.target.checked)} className="mt-1 w-5 h-5 shrink-0 accent-(--gm-gold)" />
              <span className="text-xs text-(--gm-text-dim) leading-relaxed">
                {ui('ui_account_booking_consent3', 'Hizmetin ifasına randevu saatinde başlanmasını açıkça onaylıyorum. Hizmet başladıktan sonra Mesafeli Sözleşmeler Yönetmeliği kapsamında cayma hakkımı kullanamayacağımı bildiğimi kabul ediyorum.')}
              </span>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="p-6 rounded-2xl bg-(--gm-error)/5 border border-(--gm-error)/20 text-(--gm-error) text-sm italic font-serif">
              {error}
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={loading || !allConsent}
            className="w-full group relative py-6 rounded-full bg-(--gm-gold) text-(--gm-bg-deep) font-bold text-lg tracking-widest uppercase overflow-hidden hover:shadow-(--gm-shadow-glow) transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {loading ? ui('ui_account_booking_processing', 'PROCESSING...') : (
                <>
                  <Lock className="w-5 h-5" /> {ui('ui_account_booking_secure_pay', 'SECURE PAYMENT')}
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-[var(--gm-text)]/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </button>

          {/* Trust badges */}
          <div className="flex flex-col items-center gap-6 pt-4">
            <div className="flex items-center gap-3 text-(--gm-text-dim) text-xs font-bold tracking-[0.2em] uppercase">
              <ShieldCheck className="w-4 h-4 text-(--gm-success)" />
              <span>{ui('ui_account_booking_secure_infra', 'Secure Infrastructure')}</span>
              <span className="opacity-20">|</span>
              <span className="text-(--gm-gold-dim)">Iyzico</span>
            </div>
            
            <div className="flex items-center gap-5 opacity-50 text-(--gm-text-dim)">
              <svg viewBox="0 0 1000 324" className="h-4" aria-label="Visa" role="img" fill="currentColor">
                <path d="M651.2 0c-69.5 0-131.6 36-131.6 102.6 0 76.4 110.3 81.7 110.3 119.9 0 16.1-18.5 30.6-50 30.6-44.7 0-78-20.1-78-20.1l-14.3 67s38.4 17 89.4 17c76 0 135.6-37.9 135.6-105.6 0-80.7-110.7-85.9-110.7-121.5 0-12.6 15.2-26.4 46.7-26.4 35.4 0 64.3 14.6 64.3 14.6l14-64.7S695.5 0 651.2 0zM1.6 4.9L0 14.1s28.6 5.2 54.4 15.7c33.2 12 35.6 18.9 41.2 40.6L156.6 305h81.8L364.4 4.9h-81.6L201.7 209 168.5 35.7c-3-19.8-18.4-30.8-37.1-30.8H1.6zm394.8 0L332.3 305h77.7L474 4.9h-77.6zm433.5 0c-18.7 0-28.6 10-35.8 27.5L681.7 305h81.6l16.2-46h99.3l9.9 46H1000L939 4.9h-109.1zm10.6 81.2L877.6 199h-64.7l24.6-112.9z"/>
              </svg>
              <svg viewBox="0 0 60 36" className="h-5" aria-label="Mastercard" role="img">
                <circle cx="22" cy="18" r="14" fill="currentColor" opacity="0.7" />
                <circle cx="38" cy="18" r="14" fill="currentColor" opacity="0.4" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
