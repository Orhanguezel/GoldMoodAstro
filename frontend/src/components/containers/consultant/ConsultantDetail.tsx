'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Award, CheckCircle, Clock, Globe, Star, ShieldCheck, Sparkles, Calendar } from 'lucide-react';

import {
  useGetConsultantQuery,
  useTrackConsultantViewMutation,
  type ConsultantSlotPublic,
} from '@/integrations/rtk/public/consultants.public.endpoints';
import { useAuthStore } from '@/features/auth/auth.store';
import { toast } from 'sonner';
import { trackEvent } from '@/integrations/telemetry';
import { useRequestNowBookingMutation } from '@/integrations/rtk/public/bookings_public.endpoints';
import { useListConsultantServicesPublicQuery, type ConsultantServicePublic } from '@/integrations/rtk/public/consultant_services.public.endpoints';
import { useListServiceCategoriesPublicQuery } from '@/integrations/rtk/public/service_categories.public.endpoints';
import { useListLanguagesPublicQuery } from '@/integrations/rtk/public/languages.public.endpoints';
import { useGetConsultantOutcomeScoreQuery } from '@/integrations/rtk/hooks';
import ReviewList from '@/components/common/public/ReviewList';
import SlotPicker from './SlotPicker';
import ConsultantMessageModal from './ConsultantMessageModal';
import { ChevronDown, MessageCircle, Phone, Check, Mic, Video } from 'lucide-react';

type Props = {
  id: string;
  locale: string;
};

export default function ConsultantDetail({ id, locale }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: consultant, isFetching, isError } = useGetConsultantQuery(id, { skip: !id });
  const { data: serviceCategories = [] } = useListServiceCategoriesPublicQuery();
  const { data: dbLanguages = [] } = useListLanguagesPublicQuery();
  const [trackConsultantView] = useTrackConsultantViewMutation();
  const { data: karne } = useGetConsultantOutcomeScoreQuery(id, { skip: !id });
  const { data: services = [], isLoading: servicesLoading } = useListConsultantServicesPublicQuery(consultant?.id || '', {
    skip: !consultant?.id,
  });
  const [selectedSlot, setSelectedSlot] = useState<ConsultantSlotPublic | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [requestNowBooking, { isLoading: isRequestingNow }] = useRequestNowBookingMutation();
  const { isAuthenticated } = useAuthStore();
  const isTr = locale === 'tr';
  const expertiseLabels = React.useMemo(
    () => Object.fromEntries(serviceCategories.map((category) => [category.slug, category.name])),
    [serviceCategories],
  );
  const languageLabels = React.useMemo(
    () => Object.fromEntries(dbLanguages.map((lang) => [
      lang.slug,
      locale === 'tr' ? lang.name_tr : locale === 'de' ? lang.name_de : lang.name_en,
    ])),
    [dbLanguages, locale],
  );

  // İlk servis otomatik seçilsin (genelde ücretsiz tanışma)
  useEffect(() => {
    if (!selectedServiceId && services.length > 0) {
      setSelectedServiceId(services[0].id);
      setExpandedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  useEffect(() => {
    const targetId = consultant?.id || id;
    if (!targetId) return;
    trackConsultantView(targetId);
    trackEvent('consultant_view', { consultant_id: targetId, slug: consultant?.slug }).catch(() => {});
  }, [consultant?.id, consultant?.slug, id, trackConsultantView]);

  const selectedService: ConsultantServicePublic | undefined = services.find((s) => s.id === selectedServiceId);

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--gm-bg)]">
        <div className="w-12 h-12 border-2 border-[var(--gm-gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !consultant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[var(--gm-bg)]">
        <div className="w-20 h-20 rounded-full bg-[var(--gm-surface)] flex items-center justify-center border border-[var(--gm-border-soft)]">
          <span className="text-3xl text-[var(--gm-gold)] opacity-30">!</span>
        </div>
        <h2 className="font-serif text-3xl text-[var(--gm-text)]">Danışman Bulunamadı</h2>
        <Link href={`/${locale}/consultants`} className="btn-premium py-3 px-8">
          Tüm Danışmanlar
        </Link>
      </div>
    );
  }

  const rating = parseFloat(consultant.rating_avg || '0');
  const price = Math.round(Number(consultant.session_price));
  const initials = (consultant.full_name || 'GS').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  const handleBook = () => {
    if (!selectedSlot) return;
    const svc = selectedService;
    trackEvent('booking_start', {
      consultant_id: consultant.id,
      service_id: svc?.id,
      slot_id: selectedSlot.id,
      media_type: svc?.media_type,
    }).catch(() => {});
    const q = new URLSearchParams({
      consultantId: consultant.id,
      resourceId: selectedSlot.resource_id,
      slotId: selectedSlot.id,
      date: selectedSlot.slot_date,
      time: selectedSlot.slot_time.slice(0, 5),
      price: String(svc?.price ?? consultant.session_price),
      duration: String(svc?.duration_minutes ?? consultant.session_duration),
      name: consultant.full_name || '',
    });
    if (svc?.id) q.set('serviceId', svc.id);
    if (svc?.media_type) q.set('serviceMediaType', svc.media_type);
    if (svc?.is_free === 1) q.set('free', '1');
    const topic = searchParams.get('topic');
    if (topic) q.set('topic', topic);
    router.push(`/${locale}/booking?${q.toString()}`);
  };

  const handleSendMessage = () => {
    setMessageOpen(true);
  };

  const handleRequestNow = async () => {
    if (!isAuthenticated) {
      toast.error('Giriş yapmalısınız');
      router.push(`/${locale}/auth/login?next=${encodeURIComponent(`/${locale}/consultants/${id}`)}`);
      return;
    }
    if (!consultant.is_available) {
      toast.error('Danışman şu anda çevrimiçi değil');
      return;
    }
    try {
      const res = await requestNowBooking({
        consultant_id: consultant.id,
        service_id: selectedService?.id,
        customer_message: 'Hemen görüşme talebi',
      }).unwrap();
      toast.success(res.message || 'Talep iletildi, danışman bekleniyor');
      router.push(`/${locale}/profile/bookings?highlight=${res.id}`);
    } catch (e: any) {
      const msg = e?.data?.error?.message;
      if (msg === 'consultant_not_online') toast.error('Danışman şu an çevrimdışı');
      else toast.error(msg || 'Talep oluşturulamadı');
    }
  };

  return (
    <div className="relative">
      <Link
        href={`/${locale}/consultants`}
        className="inline-flex items-center gap-2 text-(--gm-text-dim) hover:text-(--gm-gold) transition-colors text-sm font-bold uppercase tracking-widest mb-12"
      >
        <ArrowLeft className="w-4 h-4" /> Tüm Danışmanlar
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16 items-start">
        {/* Main Content */}
        <div className="space-y-16">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center md:items-end gap-10">
            <div className="relative">
              <div className="w-40 h-40 rounded-full border-2 border-(--gm-gold) p-1.5 bg-(--gm-bg)">
                {consultant.avatar_url ? (
                  <img
                    src={consultant.avatar_url}
                    alt={consultant.full_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-(--gm-bg-deep) flex items-center justify-center text-(--gm-gold) font-serif text-5xl">
                    {initials}
                  </div>
                )}
              </div>
              {consultant.is_available && (
                <div className="absolute bottom-4 right-4 w-6 h-6 bg-(--gm-success) border-4 border-(--gm-bg) rounded-full" />
              )}
            </div>

            <div className="flex-1 text-center md:text-left pb-4">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                <h1 className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-tight text-(--gm-text) [text-shadow:0_2px_24px_var(--gm-shadow-soft)]">
                  {consultant.full_name}
                </h1>
                <ShieldCheck className="w-8 h-8 text-(--gm-gold)" />
              </div>

              <div className="flex flex-wrap justify-center md:justify-start items-center gap-8">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-(--gm-gold) fill-(--gm-gold)" />
                  <span className="text-(--gm-text) font-bold text-xl">{rating.toFixed(1)}</span>
                  <span className="text-(--gm-text-dim) text-sm">({consultant.rating_count} Yorum)</span>
                </div>
                <div className="flex items-center gap-2 text-(--gm-text-dim) text-sm">
                  <Award className="w-5 h-5 text-(--gm-gold)" />
                  <span className="font-bold">{consultant.total_sessions}</span>
                  <span>Seans</span>
                </div>
                <div className="flex items-center gap-2 text-(--gm-text-dim) text-sm">
                  <Clock className="w-5 h-5 text-(--gm-gold)" />
                  <span className="font-bold">{consultant.session_duration}</span>
                  <span>Dakika</span>
                </div>
                {consultant.supports_video && (
                  <div className="flex items-center gap-2 text-(--gm-text-dim) text-sm">
                    <div className="w-2 h-2 rounded-full bg-(--gm-success) animate-pulse" />
                    <span className="font-bold">{isTr ? 'Görüntülü' : 'Video'}</span>
                    <span className="opacity-70">{isTr ? 'Görüşme Mevcut' : 'Available'}</span>
                  </div>
                )}
                {karne && karne.total_answered > 0 && typeof karne.score === 'number' && (
                  <div
                    className="flex items-center gap-2 text-(--gm-text-dim) text-sm"
                    title={`Karne: ${karne.happened} gerçekleşti · ${karne.partially} kısmen · ${karne.did_not_happen} olmadı`}
                  >
                    <ShieldCheck
                      className={`w-5 h-5 ${
                        karne.score >= 70
                          ? 'text-[var(--gm-success)]'
                          : karne.score >= 40
                          ? 'text-[var(--gm-warning)]'
                          : 'text-[var(--gm-error)]'
                      }`}
                    />
                    <span className="font-bold">%{karne.score}</span>
                    <span>Karne ({karne.total_answered} takip)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* About */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-(--gm-gold)" />
              <h2 className="font-display text-2xl text-(--gm-text)">Ruhsal Yolculuk & Deneyim</h2>
            </div>
            <p className="text-(--gm-text-dim) font-serif italic text-[1.35rem] leading-relaxed opacity-90 first-letter:text-5xl first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-(--gm-gold)">
              {consultant.bio || 'Bu danışman henüz bir açıklama eklememiş.'}
            </p>
          </div>

          {/* Skills & Lang */}
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-(--gm-surface) border border-(--gm-border-soft) rounded-3xl p-8 shadow-(--gm-shadow-soft)">
              <h3 className="text-[10px] font-bold text-(--gm-gold-dim) tracking-[0.2em] uppercase mb-6">
                Uzmanlık Alanları
              </h3>
              <div className="flex flex-wrap gap-3">
                {(consultant.expertise || []).map((exp) => (
                  <span
                    key={exp}
                    className="px-5 py-2.5 rounded-full text-[11px] font-bold tracking-widest uppercase border border-(--gm-gold)/30 text-(--gm-gold) bg-(--gm-gold)/5"
                  >
                    {expertiseLabels[exp] || exp}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-(--gm-surface) border border-(--gm-border-soft) rounded-3xl p-8 shadow-(--gm-shadow-soft)">
              <h3 className="text-[10px] font-bold text-(--gm-gold-dim) tracking-[0.2em] uppercase mb-6">
                Danışmanlık Dilleri
              </h3>
              <div className="flex flex-wrap gap-3">
                {(consultant.languages || []).map((lang) => (
                  <span
                    key={lang}
                    className="flex items-center gap-3 px-5 py-2.5 rounded-full text-[11px] font-bold tracking-widest uppercase border border-(--gm-border-soft) text-(--gm-text-dim) bg-(--gm-surface)"
                  >
                    <Globe className="w-4 h-4 text-(--gm-gold)" />
                    {languageLabels[lang] || lang.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Değerlendirmeler */}
          <ReviewList
            targetType="consultant"
            targetId={consultant.id}
            locale={locale}
            titleOverride="Değerlendirmeler"
            compact
          />
        </div>

        {/* Sticky Sidebar — Multi-Service */}
        <aside className="lg:sticky lg:top-32 w-full space-y-6">
          {/* Üst eylem butonları: Mesaj + Hemen Görüş */}
          <div className="space-y-2">
            <button
              onClick={handleSendMessage}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full border border-(--gm-gold)/40 hover:border-(--gm-gold) hover:bg-(--gm-gold)/10 text-(--gm-gold) text-[11px] font-bold uppercase tracking-widest transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              Mesaj Gönder
            </button>
            {consultant.is_available === 1 && (
              <button
                onClick={handleRequestNow}
                disabled={isRequestingNow}
                className="w-full relative inline-flex items-center justify-center gap-2 py-3.5 rounded-full bg-(--gm-success) hover:bg-(--gm-success)/90 text-(--gm-text) text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg disabled:opacity-50"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--gm-text)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--gm-text)]" />
                </span>
                <Phone className="w-4 h-4" />
                {isRequestingNow ? 'Talep Gönderiliyor...' : 'Hemen Görüş (5 dk)'}
              </button>
            )}
          </div>

          <div className="bg-(--gm-surface) border border-(--gm-border-soft) rounded-[32px] p-6 md:p-8 shadow-(--gm-shadow-card) relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-(--gm-primary) via-(--gm-gold) to-(--gm-accent)" />

            <div className="flex items-center gap-3 mb-6 pt-2">
              <Sparkles className="w-4 h-4 text-(--gm-gold)" />
              <h3 className="text-[10px] font-bold text-(--gm-gold-dim) tracking-[0.2em] uppercase">
                Hizmet Paketleri
              </h3>
            </div>

            {/* Service list */}
            <div className="space-y-3 mb-6">
              {servicesLoading && (
                <div className="text-center py-6 text-(--gm-text-muted) text-sm">Paketler yükleniyor...</div>
              )}
              {!servicesLoading && services.length === 0 && (
                <div className="text-center py-6 text-(--gm-text-muted) text-sm">Bu danışman için aktif paket yok.</div>
              )}
              {services.map((svc) => {
                const isSelected = selectedServiceId === svc.id;
                const isExpanded = expandedServiceId === svc.id;
                const isFree = svc.is_free === 1;
                return (
                  <div
                    key={svc.id}
                    className={`rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-(--gm-gold) bg-(--gm-gold)/10 shadow-(--gm-shadow-glow)'
                        : 'border-(--gm-border-soft) hover:border-(--gm-gold)/40 hover:bg-(--gm-gold)/5'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedServiceId(svc.id);
                        setExpandedServiceId(isExpanded ? null : svc.id);
                        setSelectedSlot(null);
                        trackEvent('service_select', { service_id: svc.id }).catch(() => {});
                      }}
                      className="w-full flex items-center justify-between gap-3 p-4 text-left"
                    >
                      <span
                        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'border-(--gm-success) bg-(--gm-success) text-(--gm-text)' : 'border-(--gm-border-soft) bg-transparent'
                        }`}
                        aria-hidden
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                      </span>
                      <div className="flex-1 min-w-0">
	                        <div className="flex items-center gap-2 mb-1">
	                          <span className="font-serif text-base text-(--gm-text) truncate">{svc.name}</span>
	                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-(--gm-bg-deep) border border-(--gm-border-soft) text-(--gm-text-dim) text-[9px] font-bold uppercase tracking-widest">
	                            {svc.media_type === 'video' ? <Video className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
	                            {svc.media_type === 'video' ? 'Görüntülü' : 'Sesli'}
	                          </span>
	                          {isFree && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-(--gm-success)/15 text-(--gm-success) text-[9px] font-bold uppercase tracking-widest">
                              Ücretsiz
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-(--gm-text-dim)">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {svc.duration_minutes} dk
                          </span>
                          <span className="text-(--gm-gold) font-bold">
                            {isFree ? 'Ücretsiz' : `₺${Math.round(Number(svc.price))}`}
                          </span>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-(--gm-text-muted) transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isExpanded && svc.description && (
                      <div className="px-4 pb-4 -mt-1 text-[12px] text-(--gm-text-dim) leading-relaxed font-serif italic border-t border-(--gm-border-soft) pt-3">
                        {svc.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Slot picker */}
            {selectedService && (
              <div className="space-y-4 pt-6 border-t border-(--gm-border-soft)">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-(--gm-gold)" />
                  <h3 className="text-[10px] font-bold text-(--gm-gold-dim) tracking-[0.2em] uppercase">Saat Seç</h3>
                </div>

                <div className="min-h-[160px]">
                  <SlotPicker
                    consultantId={id}
                    locale={locale}
                    onSelect={setSelectedSlot}
                    selectedSlotId={selectedSlot?.id}
                  />
                </div>

                <button
                  onClick={handleBook}
                  disabled={!selectedSlot}
                  className={`w-full group relative py-4 rounded-full font-bold text-sm tracking-widest uppercase overflow-hidden transition-all disabled:opacity-50 ${
                    selectedService.is_free === 1
                      ? 'bg-(--gm-success) text-(--gm-text) hover:shadow-(--gm-shadow-card)'
                      : 'bg-(--gm-gold) text-(--gm-bg-deep) hover:shadow-(--gm-shadow-glow)'
                  }`}
                >
                  <span className="relative z-10 inline-flex items-center justify-center gap-2">
                    {selectedService.is_free === 1 && <Phone className="w-4 h-4" />}
                    {!selectedSlot
                      ? 'SAAT SEÇİN'
                      : selectedService.is_free === 1
                      ? 'ÜCRETSİZ RANDEVU AL'
                      : 'RANDEVU AL'}
                  </span>
                </button>

                <p className="text-center text-[10px] font-medium tracking-[0.1em] text-(--gm-text-muted) uppercase italic">
                  {selectedService.is_free === 1
                    ? '* Ücretsiz tanışma görüşmesidir.'
                    : '* Ödeme bir sonraki adımda Iyzico üzerinden alınacaktır.'}
                </p>
              </div>
            )}
          </div>

          {/* Trust Info */}
          <div className="flex flex-col items-center gap-4 px-6">
            <div className="flex items-center gap-3 text-[10px] font-bold text-(--gm-gold-dim) tracking-[0.2em] uppercase">
              <ShieldCheck className="w-4 h-4 text-(--gm-success)" />
              <span>Onaylı Uzman Profil</span>
            </div>
          </div>
        </aside>
      </div>

      <ConsultantMessageModal
        open={messageOpen}
        onClose={() => setMessageOpen(false)}
        consultantId={consultant.id}
        consultantName={consultant.full_name || ''}
        locale={locale}
      />
    </div>
  );
}
