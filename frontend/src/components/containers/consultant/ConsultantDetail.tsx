'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Award, CheckCircle, Clock, Globe, Star, ShieldCheck, Sparkles, Calendar, Heart } from 'lucide-react';

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
import { useAddFavoriteMutation, useRemoveFavoriteMutation } from '@/integrations/rtk/hooks';
import { useGetConsultantMediaSettingsQuery, type MediaKind } from '@/integrations/rtk/public/media_messages.endpoints';
import ReviewList from '@/components/common/public/ReviewList';
import SlotPicker from './SlotPicker';
import ConsultantMessageModal from './ConsultantMessageModal';
import MediaQuestionModal from './MediaQuestionModal';
import { ChevronDown, MessageCircle, Phone, Check, Mic, Video } from 'lucide-react';
import { useUiSection } from '@/i18n';

type Props = {
  id: string;
  locale: string;
};

export default function ConsultantDetail({ id, locale }: Props) {
  const { ui } = useUiSection('ui_consultant', locale);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: consultant, isFetching, isError } = useGetConsultantQuery({ id, locale }, { skip: !id });
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const { data: serviceCategories = [] } = useListServiceCategoriesPublicQuery();
  const { data: dbLanguages = [] } = useListLanguagesPublicQuery();
  const [trackConsultantView] = useTrackConsultantViewMutation();
  const { data: karne } = useGetConsultantOutcomeScoreQuery(id, { skip: !id });
  const { data: services = [], isLoading: servicesLoading } = useListConsultantServicesPublicQuery(
    { consultantId: consultant?.id || '', locale },
    { skip: !consultant?.id },
  );
  const [selectedSlot, setSelectedSlot] = useState<ConsultantSlotPublic | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [mediaQuestionKind, setMediaQuestionKind] = useState<MediaKind | null>(null);
  const [requestNowBooking, { isLoading: isRequestingNow }] = useRequestNowBookingMutation();
  const [addFavorite, addFavoriteState] = useAddFavoriteMutation();
  const [removeFavorite, removeFavoriteState] = useRemoveFavoriteMutation();
  const { isAuthenticated } = useAuthStore();
  const { data: mediaSettings } = useGetConsultantMediaSettingsQuery(consultant?.id || id, { skip: !consultant?.id && !id });
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

  // Auto-select the first service, usually the free introduction.
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

  useEffect(() => {
    setIsFavorited(Boolean(consultant?.is_favorited));
    setFavoriteCount(Number(consultant?.favorite_count || 0));
  }, [consultant?.is_favorited, consultant?.favorite_count]);

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
        <h2 className="font-serif text-3xl text-[var(--gm-text)]">{ui('ui_consultant_not_found', 'Consultant Not Found')}</h2>
        <Link href={`/${locale}/consultants`} className="btn-premium py-3 px-8">
          {ui('ui_consultant_all_consultants', 'All Consultants')}
        </Link>
      </div>
    );
  }

  const rating = parseFloat(consultant.rating_avg || '0');
  const isOnline = Boolean(consultant.is_online);
  const initials = (consultant.full_name || 'GS').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const format = (key: string, fallback: string, vars: Record<string, string | number>) =>
    Object.entries(vars).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      ui(key, fallback),
    );

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

  const openMediaQuestion = (kind: MediaKind) => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login?next=${encodeURIComponent(`/${locale}/consultants/${id}`)}`);
      return;
    }
    setMediaQuestionKind(kind);
  };

  const handleRequestNow = async () => {
    if (!isAuthenticated) {
      toast.error(ui('ui_consultant_error_login_required', 'You must be logged in'));
      router.push(`/${locale}/login?next=${encodeURIComponent(`/${locale}/consultants/${id}`)}`);
      return;
    }
    if (!isOnline) {
      toast.error(ui('ui_consultant_error_not_online', 'Consultant is not online right now'));
      return;
    }
    try {
      const res = await requestNowBooking({
        consultant_id: consultant.id,
        service_id: selectedService?.id,
        customer_message: ui('ui_consultant_instant_request_msg', 'Instant session request'),
      }).unwrap();
      toast.success(res.message || ui('ui_consultant_request_sent', 'Request sent, waiting for consultant'));
      // Go directly to the call page. It handles pending approval, polling, and LiveKit connection.
      router.push(`/${locale}/booking/${res.id}/call`);
    } catch (e: any) {
      const msg = e?.data?.error?.message;
      if (msg === 'consultant_not_online') toast.error(ui('ui_consultant_error_offline', 'Consultant is currently offline'));
      else toast.error(msg || ui('ui_consultant_request_failed', 'Could not create request'));
    }
  };

  const handleFavoriteToggle = async () => {
    if (!consultant) return;
    if (!isAuthenticated) {
      router.push(`/${locale}/login?next=${encodeURIComponent(`/${locale}/consultants/${id}`)}`);
      return;
    }

    const nextFavorited = !isFavorited;
    const previousFavorited = isFavorited;
    const previousCount = favoriteCount;
    setIsFavorited(nextFavorited);
    setFavoriteCount((count) => Math.max(0, count + (nextFavorited ? 1 : -1)));

    try {
      if (nextFavorited) {
        await addFavorite(consultant.id).unwrap();
        toast.success(ui('ui_consultant_favorite_added', 'Added to favorites'));
      } else {
        await removeFavorite(consultant.id).unwrap();
        toast.success(ui('ui_consultant_favorite_removed', 'Removed from favorites'));
      }
    } catch {
      setIsFavorited(previousFavorited);
      setFavoriteCount(previousCount);
      toast.error(ui('ui_consultant_favorite_failed', 'Favorite could not be updated'));
    }
  };

  return (
    <div className="relative">
      <Link
        href={`/${locale}/consultants`}
        className="inline-flex items-center gap-2 text-(--gm-text-dim) hover:text-(--gm-gold) transition-colors text-sm font-bold uppercase tracking-widest mb-12"
      >
        <ArrowLeft className="w-4 h-4" /> {ui('ui_consultant_all_consultants', 'All Consultants')}
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
              {isOnline && (
                <div className="absolute bottom-4 right-4 w-6 h-6 bg-(--gm-success) border-4 border-(--gm-bg) rounded-full" />
              )}
            </div>

            <div className="flex-1 text-center md:text-left pb-4">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                <h1 className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-tight text-(--gm-text) [text-shadow:0_2px_24px_var(--gm-shadow-soft)]">
                  {consultant.full_name}
                </h1>
                <ShieldCheck className="w-8 h-8 text-(--gm-gold)" />
                {isOnline && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-(--gm-success)/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-(--gm-success)">
                    <span className="h-1.5 w-1.5 rounded-full bg-(--gm-success) animate-pulse" />
                    {ui('ui_consultant_online', 'Online')}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleFavoriteToggle}
                  disabled={addFavoriteState.isLoading || removeFavoriteState.isLoading}
                  aria-pressed={isFavorited}
                  aria-label={isFavorited ? ui('ui_consultant_favorite_remove', 'Remove from favorites') : ui('ui_consultant_favorite_add', 'Add to favorites')}
                  className="inline-flex items-center gap-2 rounded-full border border-(--gm-border-soft) bg-(--gm-surface) px-4 py-2 text-sm font-bold text-(--gm-text) transition hover:border-(--gm-gold) disabled:opacity-60"
                >
                  <Heart className={`h-5 w-5 ${isFavorited ? 'fill-(--gm-gold) text-(--gm-gold)' : 'text-(--gm-gold)'}`} />
                  <span>{favoriteCount}</span>
                </button>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start items-center gap-8">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-(--gm-gold) fill-(--gm-gold)" />
                  <span className="text-(--gm-text) font-bold text-xl">{rating.toFixed(1)}</span>
                  <span className="text-(--gm-text-dim) text-sm">
                    ({format('ui_consultant_reviews_count', '{n} Reviews', { n: consultant.rating_count })})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-(--gm-text-dim) text-sm">
                  <Award className="w-5 h-5 text-(--gm-gold)" />
                  <span className="font-bold">{consultant.total_sessions}</span>
                  <span>{ui('ui_consultant_sessions_label', 'Sessions')}</span>
                </div>
                <div className="flex items-center gap-2 text-(--gm-text-dim) text-sm">
                  <Clock className="w-5 h-5 text-(--gm-gold)" />
                  <span className="font-bold">{consultant.session_duration}</span>
                  <span>{ui('ui_consultant_minutes_label', 'Minutes')}</span>
                </div>
                <div className="flex items-center gap-2 text-(--gm-text-dim) text-sm">
                  <Heart className="w-5 h-5 text-(--gm-gold)" />
                  <span className="font-bold">{favoriteCount}</span>
                  <span>{ui('ui_consultant_favorite_count_label', 'people favorited')}</span>
                </div>
                {consultant.supports_video && (
                  <div className="flex items-center gap-2 text-(--gm-text-dim) text-sm">
                    <div className="w-2 h-2 rounded-full bg-(--gm-success) animate-pulse" />
                    <span className="font-bold">{ui('ui_consultant_video_label', 'Video')}</span>
                    <span className="opacity-70">{ui('ui_consultant_video_available', 'Video Session Available')}</span>
                  </div>
                )}
                {karne && karne.total_answered > 0 && typeof karne.score === 'number' && (
                  <div
                    className="flex items-center gap-2 text-(--gm-text-dim) text-sm"
                    title={`${ui('ui_consultant_karne_title', 'Report Card')}: ${karne.happened} ${ui('ui_consultant_karne_happened', 'happened')} · ${karne.partially} ${ui('ui_consultant_karne_partial', 'partially')} · ${karne.did_not_happen} ${ui('ui_consultant_karne_not_happened', 'did not happen')}`}
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
                    <span>{ui('ui_consultant_karne_title', 'Report Card')} ({karne.total_answered} {ui('ui_consultant_karne_followup', 'follow-ups')})</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* About */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-(--gm-gold)" />
              <h2 className="font-display text-2xl text-(--gm-text)">{ui('ui_consultant_section_experience', 'Spiritual Journey & Experience')}</h2>
            </div>
            <p className="text-(--gm-text-dim) font-serif italic text-[1.35rem] leading-relaxed opacity-90 first-letter:text-5xl first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-(--gm-gold)">
              {consultant.bio || ui('ui_consultant_no_bio', 'This consultant has not added a description yet.')}
            </p>
          </div>

          {/* Skills & Lang */}
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-(--gm-surface) border border-(--gm-border-soft) rounded-3xl p-8 shadow-(--gm-shadow-soft)">
              <h3 className="text-[10px] font-bold text-(--gm-gold-dim) tracking-[0.2em] uppercase mb-6">
                {ui('ui_consultant_expertise_title', 'Areas of Expertise')}
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
                {ui('ui_consultant_languages_title', 'Consultation Languages')}
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

          {/* Reviews */}
          <ReviewList
            targetType="consultant"
            targetId={consultant.id}
            locale={locale}
            titleOverride={ui('ui_consultant_reviews_title', 'Reviews')}
            compact
          />
        </div>

        {/* Sticky Sidebar — Multi-Service */}
        <aside className="lg:sticky lg:top-32 w-full space-y-6">
          {/* Primary actions: message + talk now */}
          <div className="space-y-2">
            <button
              onClick={handleSendMessage}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full border border-(--gm-gold)/40 hover:border-(--gm-gold) hover:bg-(--gm-gold)/10 text-(--gm-gold) text-[11px] font-bold uppercase tracking-widest transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              {ui('ui_consultant_send_message', 'Send Message')}
            </button>
            {isOnline && (
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
                {isRequestingNow ? ui('ui_consultant_request_now_loading', 'Sending Request...') : ui('ui_consultant_request_now', 'Talk Now (5 min)')}
              </button>
            )}
            {mediaSettings?.audio_enabled && (
              <button
                type="button"
                onClick={() => openMediaQuestion('audio')}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full border border-(--gm-gold)/40 hover:border-(--gm-gold) hover:bg-(--gm-gold)/10 text-(--gm-gold) text-[11px] font-bold uppercase tracking-widest transition-all"
              >
                <Mic className="w-4 h-4" />
                {ui('ui_consultant_media_audio_cta', 'Voice Question')} - ₺{mediaSettings.audio_price}
              </button>
            )}
            {mediaSettings?.video_enabled && (
              <button
                type="button"
                onClick={() => openMediaQuestion('video')}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full border border-(--gm-gold)/40 hover:border-(--gm-gold) hover:bg-(--gm-gold)/10 text-(--gm-gold) text-[11px] font-bold uppercase tracking-widest transition-all"
              >
                <Video className="w-4 h-4" />
                {ui('ui_consultant_media_video_cta', 'Video Question')} - ₺{mediaSettings.video_price}
              </button>
            )}
          </div>

          <div className="bg-(--gm-surface) border border-(--gm-border-soft) rounded-[32px] p-6 md:p-8 shadow-(--gm-shadow-card) relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-(--gm-primary) via-(--gm-gold) to-(--gm-accent)" />

            <div className="flex items-center gap-3 mb-6 pt-2">
              <Sparkles className="w-4 h-4 text-(--gm-gold)" />
              <h3 className="text-[10px] font-bold text-(--gm-gold-dim) tracking-[0.2em] uppercase">
                {ui('ui_consultant_packages_title', 'Service Packages')}
              </h3>
            </div>

            {/* Service list */}
            <div className="space-y-3 mb-6">
              {servicesLoading && (
                <div className="text-center py-6 text-(--gm-text-muted) text-sm">{ui('ui_consultant_packages_loading', 'Loading packages...')}</div>
              )}
              {!servicesLoading && services.length === 0 && (
                <div className="text-center py-6 text-(--gm-text-muted) text-sm">{ui('ui_consultant_packages_empty', 'No active packages for this consultant.')}</div>
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
	                            {svc.media_type === 'video'
                                ? ui('ui_consultant_video_badge', 'Video')
                                : ui('ui_consultant_audio_badge', 'Audio')}
	                          </span>
	                          {isFree && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-(--gm-success)/15 text-(--gm-success) text-[9px] font-bold uppercase tracking-widest">
                              {ui('ui_consultant_free_badge', 'Free')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-(--gm-text-dim)">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {svc.duration_minutes} {ui('ui_consultant_minutes_short', 'min')}
                          </span>
                          <span className="text-(--gm-gold) font-bold">
                            {isFree ? ui('ui_consultant_free_badge', 'Free') : `₺${Math.round(Number(svc.price))}`}
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
                  <h3 className="text-[10px] font-bold text-(--gm-gold-dim) tracking-[0.2em] uppercase">{ui('ui_consultant_slot_pick_title', 'Select Time')}</h3>
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
                      ? ui('ui_consultant_book_select_slot', 'SELECT A TIME')
                      : selectedService.is_free === 1
                      ? ui('ui_consultant_book_free', 'BOOK FREE SESSION')
                      : ui('ui_consultant_book_paid', 'BOOK SESSION')}
                  </span>
                </button>

                <p className="text-center text-[10px] font-medium tracking-[0.1em] text-(--gm-text-muted) uppercase italic">
                  {selectedService.is_free === 1
                    ? ui('ui_consultant_note_free', '* This is a free introductory session.')
                    : ui('ui_consultant_note_paid', '* Payment will be processed via Iyzico in the next step.')}
                </p>
              </div>
            )}
          </div>

          {/* Trust Info */}
          <div className="flex flex-col items-center gap-4 px-6">
            <div className="flex items-center gap-3 text-[10px] font-bold text-(--gm-gold-dim) tracking-[0.2em] uppercase">
              <ShieldCheck className="w-4 h-4 text-(--gm-success)" />
              <span>{ui('ui_consultant_verified_profile', 'Verified Expert Profile')}</span>
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
      {mediaQuestionKind && mediaSettings && (
        <MediaQuestionModal
          open={Boolean(mediaQuestionKind)}
          locale={locale}
          consultantId={consultant.id}
          kind={mediaQuestionKind}
          price={mediaQuestionKind === 'audio' ? mediaSettings.audio_price : mediaSettings.video_price}
          currency={mediaSettings.currency}
          onClose={() => setMediaQuestionKind(null)}
          onInsufficientCredits={() => router.push(`/${locale}/me/credits`)}
        />
      )}
    </div>
  );
}
