// =============================================================
// FILE: src/components/containers/appointment/AppointmentPageContent.tsx
// FINAL — Public Appointment PAGE content
// =============================================================

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import {
  useListResourcesPublicQuery,
  useListServicesPublicQuery,
  useListAvailabilitySlotsPublicQuery,
  useCreateBookingPublicMutation,
  useListResourceWorkingHoursPublicQuery,
  useGetSiteSettingByKeyQuery,
  useGetServiceBySlugPublicQuery,
} from '@/integrations/rtk/hooks';

import type {
  BookingPublicCreatePayload,
  ResourceSlotDto,
  ResourceWorkingHourDto,
  ResourcePublicItemDto
} from '@/integrations/shared';
import { normalizeHm, toCdnSrc } from '@/integrations/shared';

import { useLocaleShort, useUiSection } from '@/i18n';
import { isValidUiText } from '@/integrations/shared';
import { localizePath } from '@/integrations/shared';

import {
  safeStr,
  isValidEmail,
  normalizePhone,
  isValidYmd,
  isValidHm,
  slotTime,
} from './_utils/appointmentHelpers';

import { TherapistSelect } from './_utils/TherapistSelect';
import { DailyAvailableSlots } from './_utils/DailyAvailableSlots';
import { WeeklyPlanTable } from './_utils/WeeklyPlanTable';

import { FiArrowRight, FiCheckCircle } from 'react-icons/fi';

type FormState = {
  name: string;
  email: string;
  phone: string;

  resource_id: string;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:mm
  service_id: string;

  customer_message: string; // kept for payload compatibility (not rendered)
};

const DEFAULT_STATE: FormState = {
  name: '',
  email: '',
  phone: '',
  resource_id: '',
  appointment_date: '',
  appointment_time: '',
  service_id: '',
  customer_message: '',
};



export const AppointmentPageContent: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_appointment', locale as any);
  const searchParams = useSearchParams();

  const t = useCallback(
    (key: string, fallback: string) => {
      const v = safeStr(ui(key, fallback));
      return isValidUiText(v, key) ? v : fallback;
    },
    [ui],
  );

  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [localMsg, setLocalMsg] = useState<string>('');
  const [success, setSuccess] = useState(false);

  // Admin panelden yönetilebilir cover image (site_appointment_cover key)
  const { data: coverSetting } = useGetSiteSettingByKeyQuery({ key: 'site_appointment_cover' });
  const coverImage = useMemo(() => {
    // 1) Admin panelden yüklenen resim (BrandMediaTab)
    const fromSetting = safeStr(
      typeof coverSetting?.value === 'object' && coverSetting?.value !== null
        ? (coverSetting.value as any)?.url
        : coverSetting?.value,
    );
    // 2) UI section'dan gelen (eski yöntem, fallback)
    const fromUi = safeStr(ui('ui_appointment_cover_image', ''));
    // 3) Hardcoded fallback
    const fallback =
      'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748866951/uploads/anastasia/gallery/21-1748866946899-726331234.webp';
    const src = fromSetting || fromUi || fallback;
    return toCdnSrc(src, 1200, 900, 'fill') || src;
  }, [coverSetting, ui]);

  const coverAlt = useMemo(() => {
    return (
      safeStr(ui('ui_appointment_cover_image_alt', '')) ||
      t('ui_appointment_page_title', 'Appointment')
    );
  }, [ui, t]);

  // -------- optional: service preselect via query param --------
  const serviceSlug = useMemo(() => {
    const fromQuery =
      safeStr(searchParams?.get('service')) || safeStr(searchParams?.get('service_slug'));
    return fromQuery;
  }, [searchParams]);

  const { data: defaultLocaleRow } = useGetSiteSettingByKeyQuery({ key: 'default_locale' } as any);
  const defaultLocale = safeStr((defaultLocaleRow as any)?.value) || 'de';

  const { data: serviceFromSlug, isError: serviceError } = useGetServiceBySlugPublicQuery(
    { slug: serviceSlug, locale, default_locale: defaultLocale } as any,
    { skip: !serviceSlug } as any,
  );

  const { data: primaryServicesData } = useListServicesPublicQuery(
    { locale, default_locale: defaultLocale, limit: 1, order: 'display_order.asc' } as any,
    { refetchOnMountOrArgChange: true } as any,
  );

  const primaryService = useMemo(() => {
    const items = Array.isArray(primaryServicesData?.items) ? primaryServicesData.items : [];
    return (items[0] as any) ?? null;
  }, [primaryServicesData]);

  const lockedServiceId = useMemo(() => safeStr((serviceFromSlug as any)?.id), [serviceFromSlug]);
  const lockedServiceTitle = useMemo(
    () => safeStr((serviceFromSlug as any)?.name) || safeStr((serviceFromSlug as any)?.title),
    [serviceFromSlug],
  );
  const primaryServiceId = useMemo(() => safeStr(primaryService?.id), [primaryService]);
  const primaryServiceSlug = useMemo(
    () => safeStr(primaryService?.slug),
    [primaryService],
  );
  const primaryServiceTitle = useMemo(
    () => safeStr(primaryService?.name) || safeStr(primaryService?.title),
    [primaryService],
  );
  const activeServiceId = serviceSlug ? lockedServiceId : primaryServiceId;
  const activeServiceSlug = serviceSlug || primaryServiceSlug;
  const activeServiceTitle = serviceSlug ? lockedServiceTitle : primaryServiceTitle;
  const activeServicePrice = serviceSlug
    ? Number((serviceFromSlug as any)?.price_numeric ?? 0)
    : Number((primaryService as any)?.price_numeric ?? 0);

  const patch = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
  }, []);

  useEffect(() => {
    if (!activeServiceId) return;
    setForm((p) => {
      if (safeStr(p.service_id) === activeServiceId) return p;
      return { ...p, service_id: activeServiceId };
    });
  }, [activeServiceId]);

  // -------- resources (public) --------
  const {
    data: resourcesData,
    isLoading: resourcesLoading,
    isFetching: resourcesFetching,
    isError: resourcesError,
  } = useListResourcesPublicQuery({ type: 'therapist', locale }, {
    refetchOnMountOrArgChange: true,
  } as any);

  const resources: ResourcePublicItemDto[] = useMemo(() => {
    const arr = (resourcesData as unknown) ?? [];
    return Array.isArray(arr) ? (arr as ResourcePublicItemDto[]) : [];
  }, [resourcesData]);

  const isSingleTherapist = resources.length === 1;

  useEffect(() => {
    if (!isSingleTherapist) return;
    const only = resources[0];
    const rid = safeStr((only as any)?.id);
    if (!rid) return;

    setForm((p) => {
      if (safeStr(p.resource_id) === rid) return p;
      return { ...p, resource_id: rid, appointment_date: '', appointment_time: '' };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSingleTherapist, resources]);

  const hasTherapist = !!safeStr(form.resource_id);
  const hasDate = isValidYmd(safeStr(form.appointment_date));

  // -------- handlers --------
  const onPickTherapist = useCallback(
    (rid: string) => {
      patch('resource_id', rid);
      patch('appointment_date', '');
      patch('appointment_time', '');
      setLocalMsg('');
    },
    [patch],
  );

  const onPickDate = useCallback(
    (d: string) => {
      patch('appointment_date', d);
      patch('appointment_time', '');
      setLocalMsg('');
    },
    [patch],
  );

  const onPickTime = useCallback(
    (tm: string) => {
      patch('appointment_time', normalizeHm(tm));
      setLocalMsg('');
    },
    [patch],
  );

  // -------- daily slots list (public) --------
  const slotsArgs = useMemo(() => {
    const rid = safeStr(form.resource_id);
    const d = safeStr(form.appointment_date);
    if (!rid || !isValidYmd(d)) return null;
    return { resource_id: rid, date: d };
  }, [form.resource_id, form.appointment_date]);

  const {
    data: slotsData,
    isLoading: slotsLoading,
    isFetching: slotsFetching,
    isError: slotsError,
    refetch: refetchSlots,
  } = useListAvailabilitySlotsPublicQuery(
    slotsArgs as any,
    { skip: !slotsArgs, refetchOnMountOrArgChange: true } as any,
  );

  const slots: ResourceSlotDto[] = useMemo(() => {
    const arr = (slotsData as unknown) ?? [];
    if (!Array.isArray(arr)) return [];
    return [...(arr as ResourceSlotDto[])].sort((a, b) => slotTime(a).localeCompare(slotTime(b)));
  }, [slotsData]);

  const selectedTimeHm = useMemo(() => normalizeHm(form.appointment_time), [form.appointment_time]);

  // -------- weekly working hours (public) --------
  const whArgs = useMemo(() => {
    const rid = safeStr(form.resource_id);
    if (!rid) return null;
    return { resource_id: rid };
  }, [form.resource_id]);

  const {
    data: whData,
    isLoading: whLoading,
    isError: whError,
  } = useListResourceWorkingHoursPublicQuery(
    whArgs as any,
    { skip: !whArgs, refetchOnMountOrArgChange: true } as any,
  );

  const whRows = useMemo(() => {
    return Array.isArray(whData) ? (whData as ResourceWorkingHourDto[]) : [];
  }, [whData]);

  // -------- Create Booking --------
  const [createBooking, { isLoading: isSubmitting }] = useCreateBookingPublicMutation();

  // booking payment (disabled by default via site setting)
  const { data: paymentEnabledSetting } = useGetSiteSettingByKeyQuery({ key: 'booking_payment_enabled' });
  const bookingPaymentEnabled = useMemo(() => {
    const val = typeof paymentEnabledSetting?.value === 'string'
      ? paymentEnabledSetting.value.replace(/"/g, '')
      : String(paymentEnabledSetting?.value ?? '');
    return val === 'true' || val === '1';
  }, [paymentEnabledSetting]);

  const hasSelectedService = !!safeStr(form.service_id);

  const canSubmit =
    !!form.name &&
    isValidEmail(form.email) &&
    !!form.phone &&
    !!form.resource_id &&
    isValidYmd(form.appointment_date) &&
    isValidHm(form.appointment_time) &&
    hasSelectedService &&
    !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLocalMsg('');

    try {
      const payload: BookingPublicCreatePayload = {
        resource_id: form.resource_id,
        service_id: form.service_id || undefined,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        name: form.name,
        email: form.email,
        phone: normalizePhone(form.phone),
        customer_message: form.customer_message,
        locale,
      };

      await createBooking(payload).unwrap();

      // 🎯 GA4 Conversion Event Push (SPA)
      if (typeof window !== 'undefined') {
        (window as any).dataLayer = (window as any).dataLayer || [];
        (window as any).dataLayer.push({
          event: 'booking_completed',
          booking_service: payload.service_id || 'unknown',
          booking_service_name: activeServiceTitle || 'N/A',
          booking_date: payload.appointment_date, // "YYYY-MM-DD"
          booking_time: payload.appointment_time, // "HH:mm"
          booking_locale: locale,
          value: activeServicePrice, // Gerçek fiyat (numeric)
          currency: 'EUR',
        });
      }

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      const m =
        err?.data?.error?.message ||
        err?.message ||
        t('ui_appointment_form_error', 'Bir hata oluştu.');
      setLocalMsg(m);
    }
  };

  if (success) {
    return (
      <div className="bg-bg-primary min-h-[60vh] py-20 flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-lg text-center" data-aos="fade-up">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle size={40} />
          </div>
          <h2 className="text-3xl font-serif font-light text-text-primary mb-4">
            {t('ui_appointment_success_title', 'Randevunuz Alındı!')}
          </h2>
          <p className="text-text-secondary leading-relaxed mb-8">
            {bookingPaymentEnabled
              ? t(
                  'ui_appointment_success_msg_payment',
                  'Randevunuz onaylandıktan sonra online ödeme yapabilirsiniz.',
                )
              : t(
                  'ui_appointment_success_msg',
                  'Talebiniz bize ulaştı. En kısa sürede sizinle iletişime geçeceğiz.',
                )}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={localizePath(locale, '/')}
              className="inline-flex items-center justify-center px-8 py-3 bg-brand-primary text-white font-normal uppercase tracking-[0.15em]r hover:bg-brand-hover transition-all rounded-sm"
            >
              {t('ui_appointment_success_home', 'Ana Sayfaya Dön')}
            </Link>

            {bookingPaymentEnabled && (
              <Link
                href={localizePath(locale, '/profile')}
                className="inline-flex items-center justify-center px-8 py-3 border-2 border-brand-primary text-brand-primary font-normal uppercase tracking-[0.15em]r hover:bg-brand-primary hover:text-white transition-all rounded-sm"
              >
                {t('ui_appointment_success_pay', 'Odeme Yap')}
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-bg-primary py-12 lg:py-20 overflow-x-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center mb-12 lg:mb-16"
          data-aos="fade-up"
        >
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-brand-primary font-normal uppercase tracking-[0.2em] text-sm mb-4">
              {t('ui_appointment_subprefix', 'Energetische Massage')}{' '}
              {t('ui_appointment_sublabel', 'Appointment')}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-text-primary mb-5 leading-[1.05]">
              {t('ui_appointment_title', 'Randevu Al')}
            </h1>
            <p className="text-text-secondary text-lg leading-relaxed">
              {t(
                'ui_appointment_desc',
                'Size uygun terapisti ve saati seçerek kolayca randevu oluşturabilirsiniz.',
              )}
            </p>
          </div>

          <div className="relative w-full h-72 sm:h-80 lg:h-[420px] overflow-hidden border border-border-light shadow-medium bg-bg-card-hover">
            <Image
              src={coverImage as any}
              alt={coverAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
              loading="lazy"
            />
            <div
              className="absolute inset-0 bg-linear-to-t from-bg-dark/35 via-transparent to-transparent"
              aria-hidden
            />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Step 1 (smaller) */}
            <div className="lg:col-span-5" data-aos="fade-right">
              <div className="bg-bg-card p-6 md:p-8 shadow-soft border border-border-light">
                {activeServiceTitle ? (
                  <div className="bg-bg-card border border-border-light p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                      <div className="text-xs font-normal uppercase tracking-[0.2em] text-brand-primary mb-1">
                        {t('ui_appointment_selected_service_label', 'Selected service')}
                      </div>
                      <div className="font-serif font-light text-text-primary leading-snug">
                        {activeServiceTitle ||
                          t('ui_appointment_selected_service_loading', 'Loading...')}
                      </div>
                      {serviceError ? (
                        <div className="text-sm text-rose-700 mt-1">
                          {t(
                            'ui_appointment_selected_service_error',
                            'Service not found. Please pick a service again.',
                          )}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        href={localizePath(locale, '/services')}
                        className="text-sm font-bold text-brand-primary hover:underline"
                      >
                        {serviceSlug
                          ? t('ui_appointment_change_service', 'Change')
                          : t('ui_appointment_view_service_list', 'View service')}
                      </Link>

                      {activeServiceSlug ? (
                        <Link
                          href={localizePath(locale, `/services/${encodeURIComponent(activeServiceSlug)}`)}
                          className="text-sm font-bold text-text-primary hover:text-brand-primary transition-colors"
                        >
                          {t('ui_appointment_view_service', 'View')}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div className="pb-2 border-b border-border-light mb-6">
                  <span className="text-xs font-bold text-brand-primary uppercase tracking-widest block mb-1">
                    {t('ui_appointment_step_label', 'Step')} 1
                  </span>
                  <h2 className="text-2xl font-serif font-light text-text-primary">
                    {t('ui_appointment_step1_title', 'Terapist ve Zaman')}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TherapistSelect
                    resources={resources}
                    loading={resourcesLoading}
                    fetching={resourcesFetching}
                    error={!!resourcesError}
                    selectedId={form.resource_id}
                    onChange={onPickTherapist}
                    t={t}
                  />

                  <div className={!hasTherapist ? 'opacity-50 pointer-events-none' : ''}>
                    <label
                      htmlFor="appointment-date"
                      className="block text-sm font-bold text-text-primary mb-2 uppercase tracking-wide"
                    >
                      {t('ui_appointment_date_label', 'Tarih')}
                    </label>
                    <div className="relative">
                      <input
                        id="appointment-date"
                        type="date"
                        className="w-full px-4 py-3 bg-bg-card border border-border-light text-text-primary rounded-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all appearance-none uppercase text-sm font-medium"
                        value={form.appointment_date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => onPickDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {hasTherapist && hasDate ? (
                  <div className="pt-6 mt-6 border-t border-border-light animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-bold text-text-primary mb-2 uppercase tracking-wide">
                      {t('ui_appointment_time_label', 'Saat Seçimi')}
                    </label>

                    <DailyAvailableSlots
                      date={form.appointment_date}
                      slots={slots}
                      loading={slotsLoading}
                      fetching={slotsFetching}
                      error={!!slotsError}
                      selectedTime={selectedTimeHm}
                      onPickTime={onPickTime}
                      onRefresh={refetchSlots}
                      t={t}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Weekly schedule (wider) */}
            <div className="lg:col-span-7" data-aos="fade-left">
              <div className="bg-bg-card p-6 md:p-8 shadow-soft border border-border-light">
                <div className="mb-6">
                  <h2 className="text-2xl font-serif font-light text-text-primary mb-2">
                    {t('ui_appointment_weekly_title', 'Weekly Schedule')}
                  </h2>
                  <p className="text-text-secondary text-sm">
                    {t(
                      'ui_appointment_weekly_desc',
                      'You can view the selected therapist’s weekly working hours below.',
                    )}
                  </p>
                </div>

                <WeeklyPlanTable
                  resourceId={form.resource_id}
                  selectedDate={form.appointment_date}
                  workingHours={whRows}
                  whLoading={whLoading}
                  whError={!!whError}
                  t={t}
                />
              </div>
            </div>

            {/* Step 2 */}
            {selectedTimeHm ? (
              <div className="lg:col-span-12" data-aos="fade-up">
                <div className="bg-bg-card p-6 md:p-8 shadow-soft border border-border-light">
                  <div className="pb-2 border-b border-border-light mb-6">
                    <span className="text-xs font-bold text-brand-primary uppercase tracking-widest block mb-1">
                      {t('ui_appointment_step_label', 'Step')} 2
                    </span>
                    <h2 className="text-2xl font-serif font-light text-text-primary">
                      {t('ui_appointment_step2_title', 'Kişisel Bilgiler')}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="appointment-name"
                        className="block text-sm font-bold text-text-primary mb-2 uppercase tracking-wide"
                      >
                        {t('ui_appointment_field_name', 'Ad Soyad')}
                      </label>
                      <input
                        id="appointment-name"
                        type="text"
                        required
                        className="w-full px-4 py-3 bg-bg-card border border-border-light rounded-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all placeholder:text-text-muted/50"
                        placeholder={t('ui_appointment_ph_name', 'Adınız Soyadınız')}
                        value={form.name}
                        onChange={(e) => patch('name', e.target.value)}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="appointment-phone"
                        className="block text-sm font-bold text-text-primary mb-2 uppercase tracking-wide"
                      >
                        {t('ui_appointment_field_phone', 'Telefon')}
                      </label>
                      <input
                        id="appointment-phone"
                        type="tel"
                        required
                        className="w-full px-4 py-3 bg-bg-card border border-border-light rounded-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all placeholder:text-text-muted/50"
                        placeholder={t('ui_appointment_ph_phone', '05xx xxx xx xx')}
                        value={form.phone}
                        onChange={(e) => patch('phone', e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="appointment-email"
                        className="block text-sm font-bold text-text-primary mb-2 uppercase tracking-wide"
                      >
                        {t('ui_appointment_field_email', 'E-Posta')}
                      </label>
                      <input
                        id="appointment-email"
                        type="email"
                        required
                        className="w-full px-4 py-3 bg-bg-card border border-border-light rounded-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all placeholder:text-text-muted/50"
                        placeholder={t('ui_appointment_ph_email', 'ornek@email.com')}
                        value={form.email}
                        onChange={(e) => patch('email', e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="appointment-note"
                        className="block text-sm font-bold text-text-primary mb-2 uppercase tracking-wide"
                      >
                        {t('ui_appointment_field_note', 'Notunuz (Opsiyonel)')}
                      </label>
                      <textarea
                        id="appointment-note"
                        rows={3}
                        className="w-full px-4 py-3 bg-bg-card border border-border-light rounded-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all placeholder:text-text-muted/50 resize-y min-h-25"
                        placeholder={t('ui_appointment_ph_note', 'Varsa özel istekleriniz...')}
                        value={form.customer_message}
                        onChange={(e) => patch('customer_message', e.target.value)}
                      />
                    </div>
                  </div>

                  {localMsg ? (
                    <div className="mt-6 bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-sm flex items-start gap-2 text-sm font-medium">
                      <span className="mt-0.5">⚠️</span>
                      <span>{localMsg}</span>
                    </div>
                  ) : null}

                  <div className="mt-8 pt-6 border-t border-border-light flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-3 bg-bg-card border border-border-light rounded-xl px-4 py-3">
                      <div className="w-9 h-9 bg-bg-card flex items-center justify-center text-brand-primary border border-border-light shrink-0">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-bold text-text-primary">
                          {t('ui_appointment_info_title', 'Important')}
                        </div>
                        <div className="text-sm text-text-secondary leading-relaxed">
                          {t(
                            'ui_appointment_info_text',
                            'Your appointment is confirmed after approval via SMS/email. Please notify cancellations at least 24 hours in advance.',
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="px-8 py-4 bg-brand-primary text-white font-normal uppercase tracking-[0.15em]r rounded-xl hover:bg-brand-hover transition-all shadow-md hover:shadow-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                      {isSubmitting ? (
                        <span>{t('ui_appointment_btn_sending', 'Sending...')}</span>
                      ) : (
                        <>
                          <span>{t('ui_appointment_btn_submit', 'Submit')}</span>
                          <FiArrowRight />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
};

export default AppointmentPageContent;
