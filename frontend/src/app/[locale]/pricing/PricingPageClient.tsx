'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Check, Star, Video, Mic, CreditCard, ShieldCheck, ArrowRight } from 'lucide-react';
import { localizePath } from '@/integrations/shared';
import { useListSubscriptionPlansQuery } from '@/integrations/rtk/public/subscriptions.endpoints';
import type { SubscriptionPlanPublicUi } from '@/integrations/rtk/public/subscriptions.endpoints';

type Locale = 'tr' | 'en' | string;

const FALLBACK_PLANS: SubscriptionPlanPublicUi[] = [
  {
    id: 'fallback-free',
    code: 'free',
    name_tr: 'Ücretsiz',
    name_en: 'Free',
    description_tr: 'Temel özelliklerle platformu keşfetmeye başlayın.',
    description_en: 'Start using core features of the platform.',
    price_minor: 0,
    currency: 'TRY',
    period: 'monthly',
    trial_days: 0,
    is_active: 1,
    display_order: 0,
    features: ['daily_reading_basic', 'birth_chart_basic'],
  },
  {
    id: 'fallback-monthly',
    code: 'monthly',
    name_tr: 'Aylık',
    name_en: 'Monthly',
    description_tr: 'Sınırsız AI yorumlar ve premium danışman araçları.',
    description_en: 'Unlimited AI readings and premium consultant tools.',
    price_minor: 14900,
    currency: 'TRY',
    period: 'monthly',
    trial_days: 7,
    is_active: 1,
    display_order: 1,
    features: [
      'daily_reading_premium',
      'birth_chart_basic',
      'synastry',
      'transit_calendar',
      'priority_support',
      'video_session_premium',
    ],
  },
  {
    id: 'fallback-yearly',
    code: 'yearly',
    name_tr: 'Yıllık',
    name_en: 'Yearly',
    description_tr: 'Yıllık ödeme avantajı ve kalıcı premium erişim.',
    description_en: 'Premium access with yearly pricing advantage.',
    price_minor: 149900,
    currency: 'TRY',
    period: 'yearly',
    trial_days: 14,
    is_active: 1,
    display_order: 2,
    features: [
      'daily_reading_premium',
      'birth_chart_basic',
      'synastry',
      'transit_calendar',
      'priority_support',
      'video_session_premium',
      'yearly_review',
    ],
  },
];

const featureCopy = {
  tr: {
    daily: 'Günlük Okuma',
    daily_desc: 'Önceden planlanan günlük astroloji yorumları',
    transit: 'Günlük Transit',
    transit_desc: 'Kişisel evre ve hareket takibi',
    synastry: 'Sinastri',
    synastry_desc: 'İlişki uyumu analizleri',
    chart: 'Temel Doğum Haritası',
    chart_desc: 'Doğum haritanızla temel danışmanlık',
    support: 'Öncelikli Destek',
    support_desc: 'Öncelikli görüşme ve yorum desteği',
    video: 'Görüntülü Görüşme',
    video_desc: 'Danışmanla kamera destekli görüşme',
    ad: 'Reklamsız Deneyim',
    ad_desc: 'Reklam içeriğinden arındırılmış arayüz',
  },
  en: {
    daily: 'Daily Reading',
    daily_desc: 'Scheduled daily astrology reading',
    transit: 'Daily Transit',
    transit_desc: 'Personal planetary motion tracking',
    synastry: 'Synastry',
    synastry_desc: 'Relationship compatibility insights',
    chart: 'Basic Birth Chart',
    chart_desc: 'Core astrology session setup',
    support: 'Priority Support',
    support_desc: 'Priority support and responses',
    video: 'Video Session',
    video_desc: 'Live camera-based consultation',
    ad: 'Ad-free',
    ad_desc: 'Cleaner experience without promotional clutter',
  },
};

const CHECK_LABELS: Record<string, string> = {
  yes: '✔',
  no: '—',
};

function featureHas(plan: SubscriptionPlanPublicUi | null, key: string): boolean {
  const features = Array.isArray(plan?.features) ? plan.features : [];
  return features.includes(key);
}

function isPremiumPlan(plan: SubscriptionPlanPublicUi | null): boolean {
  return !!plan && plan.code !== 'free';
}

function toMoney(valueMinor: number, currency: string, locale: Locale) {
  const value = valueMinor / 100;
  if (!Number.isFinite(value)) return `${valueMinor} ${currency}`;
  const fallbackLocale = locale === 'tr' ? 'tr-TR' : 'en-US';
  return new Intl.NumberFormat(fallbackLocale, {
    style: 'currency',
    currency: String(currency || 'TRY'),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const VOICE_RATE_TRY = 250;
const VIDEO_RATE_TRY = 350;

type Props = {
  locale: Locale;
};

export default function PricingPageClient({ locale = 'tr' }: Props) {
  const { data: plans, isLoading, isError, isFetching } = useListSubscriptionPlansQuery(undefined, {
    pollingInterval: 0,
  });

  const sortedPlans = useMemo(() => {
    const source =
      !plans || !Array.isArray(plans) || plans.length === 0
        ? FALLBACK_PLANS
        : plans.map((p) => ({ ...p, display_order: Number(p.display_order || 0) }));
    return [...source].sort((a, b) => a.display_order - b.display_order);
  }, [plans]);

  const freePlan = sortedPlans.find((plan) => plan.code === 'free') ?? sortedPlans[0] ?? null;
  const monthlyPlan = sortedPlans.find((plan) => plan.code === 'monthly') ?? sortedPlans[1] ?? null;
  const yearlyPlan = sortedPlans.find((plan) => plan.code === 'yearly') ?? sortedPlans[2] ?? null;
  const activeMonth = monthlyPlan;
  const activeYear = yearlyPlan;
  const planToShow = activeMonth ?? freePlan;

  const getPlanLabel = (plan: SubscriptionPlanPublicUi | null, fallback: string) => {
    if (!plan) return fallback;
    return locale === 'tr' ? plan.name_tr || plan.name_en || fallback : plan.name_en || plan.name_tr || fallback;
  };

  const copy = locale === 'tr'
    ? {
        title: 'Fiyatlandırma',
        subtitle: 'Sesli ve görüntülü danışmanlık farkını netleştirdik',
        lead:
          'Hedefimiz, danışmanlık deneyimini şeffaf fiyatlandırma ile sunmak. Ücretsiz ve abonelik planları ile premium özelliklere erişim sağlar.',
        footerInfo:
          'İptal etmek, üye olmaktan her zaman daha kolaydır. KVKK ve iade politikamızla güvenle başlayın.',
        transparencyTitle: 'Şeffaflık',
        transparencySubtitle: 'Ödeme ve iptal kuralları açıkça görünür.',
        cancel: 'İptal Etmek Üye Olmaktan Kolaydır',
        cancellationPolicy: 'İptal Politikası',
        kvkk: 'KVKK',
        returnPolicy: 'İade Politikası',
        perMinuteVoice: `Sesli: ${VOICE_RATE_TRY}₺ / 15 dk`,
        perMinuteVideo: `Görüntülü: ${VIDEO_RATE_TRY}₺ / 15 dk`,
        modeHeadline: 'Sesli ve Görüntülü Danışmanlık Karşılaştırması',
        modeLead: 'Tüm kullanıcılar sesli seansa erişir; görüntülü seanslar premium katmanda aktif.',
        freeLabel: 'Ücretsiz',
        premiumLabel: 'Premium',
        cta: 'Kullanıma Başla',
        cta2: 'Danışman Bul',
      }
    : {
        title: 'Pricing',
        subtitle: 'Clear comparison for voice vs video consultations',
        lead: 'Transparent pricing for every stage. Start free, then upgrade when you need premium consultation features.',
        footerInfo:
          'You can cancel any time; cancellation is intentionally easy. Continue with full policy transparency.',
        transparencyTitle: 'Transparency',
        transparencySubtitle: 'Payment and cancellation terms are visible.',
        cancel: 'Cancel Is Easier Than Joining',
        cancellationPolicy: 'Cancellation Policy',
        kvkk: 'Privacy',
        returnPolicy: 'Refund Policy',
        perMinuteVoice: `Voice: ${VOICE_RATE_TRY}₺ / 15 min`,
        perMinuteVideo: `Video: ${VIDEO_RATE_TRY}₺ / 15 min`,
        modeHeadline: 'Voice vs Video Consultation',
        modeLead: 'All users can use voice sessions. Video sessions are included with premium plans.',
        freeLabel: 'Free',
        premiumLabel: 'Premium',
        cta: 'Start Now',
        cta2: 'Find a Consultant',
      };

  const voiceFeatures = [
    {
      text: locale === 'tr' ? 'Ses kalitesi + gürültü filtresi' : 'Noise-filtered audio quality',
      included: true,
    },
    {
      text: locale === 'tr' ? 'Düşük maliyetli seans' : 'Lower-cost sessions',
      included: true,
    },
    {
      text: locale === 'tr' ? 'Görüntü kullanımı yok' : 'No camera usage',
      included: true,
    },
  ];

  const videoFeatures = [
    {
      text: locale === 'tr' ? 'Yüz ifadeleri ve göz teması' : 'Facial expression and eye contact',
      included: true,
    },
    {
      text: locale === 'tr'
        ? 'Danışmanla daha detaylı enerji okuması'
        : 'Richer communication for in-depth reading',
      included: true,
    },
    {
      text: locale === 'tr' ? `${copy.perMinuteVideo} ${locale === 'tr' ? '(Premium plan)' : '(Premium plan)'}` : copy.perMinuteVideo,
      included: true,
    },
  ];

  const featureMatrix = [
    {
      key: 'daily',
      feature: featureCopy[locale === 'tr' ? 'tr' : 'en'].daily,
      desc: featureCopy[locale === 'tr' ? 'tr' : 'en'].daily_desc,
      freeValue: featureHas(freePlan, 'daily_reading_basic') || isPremiumPlan(freePlan),
      premiumValue: true,
      valueLabel: featureCopy[locale === 'tr' ? 'tr' : 'en'].daily,
    },
    {
      key: 'chart',
      feature: featureCopy[locale === 'tr' ? 'tr' : 'en'].chart,
      desc: featureCopy[locale === 'tr' ? 'tr' : 'en'].chart_desc,
      freeValue: featureHas(freePlan, 'birth_chart_basic'),
      premiumValue: true,
      valueLabel: featureCopy[locale === 'tr' ? 'tr' : 'en'].chart,
    },
    {
      key: 'synastry',
      feature: featureCopy[locale === 'tr' ? 'tr' : 'en'].synastry,
      desc: featureCopy[locale === 'tr' ? 'tr' : 'en'].synastry_desc,
      freeValue: featureHas(freePlan, 'synastry'),
      premiumValue: featureHas(monthlyPlan, 'synastry') || featureHas(yearlyPlan, 'synastry'),
      valueLabel: featureCopy[locale === 'tr' ? 'tr' : 'en'].synastry,
    },
    {
      key: 'transit',
      feature: featureCopy[locale === 'tr' ? 'tr' : 'en'].transit,
      desc: featureCopy[locale === 'tr' ? 'tr' : 'en'].transit_desc,
      freeValue: featureHas(freePlan, 'transit_calendar'),
      premiumValue: featureHas(monthlyPlan, 'transit_calendar') || featureHas(yearlyPlan, 'transit_calendar'),
      valueLabel: featureCopy[locale === 'tr' ? 'tr' : 'en'].transit,
    },
    {
      key: 'support',
      feature: featureCopy[locale === 'tr' ? 'tr' : 'en'].support,
      desc: featureCopy[locale === 'tr' ? 'tr' : 'en'].support_desc,
      freeValue: false,
      premiumValue: featureHas(monthlyPlan, 'priority_support') || featureHas(yearlyPlan, 'priority_support'),
      valueLabel: featureCopy[locale === 'tr' ? 'tr' : 'en'].support,
    },
    {
      key: 'video',
      feature: featureCopy[locale === 'tr' ? 'tr' : 'en'].video,
      desc: featureCopy[locale === 'tr' ? 'tr' : 'en'].video_desc,
      freeValue: false,
      premiumValue: true,
      valueLabel: featureCopy[locale === 'tr' ? 'tr' : 'en'].video,
    },
    {
      key: 'ad',
      feature: featureCopy[locale === 'tr' ? 'tr' : 'en'].ad,
      desc: featureCopy[locale === 'tr' ? 'tr' : 'en'].ad_desc,
      freeValue: false,
      premiumValue: featureHas(monthlyPlan, 'ad_free') || featureHas(yearlyPlan, 'ad_free'),
      valueLabel: featureCopy[locale === 'tr' ? 'tr' : 'en'].ad,
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--gm-bg)] text-[var(--gm-text)]">
      <section className="pt-8 pb-14 px-4 md:px-6 max-w-6xl mx-auto">
        <p className="section-label">{copy.subtitle}</p>
        <div className="mt-2 mb-8">
          <h1 className="font-serif text-[clamp(2rem,4.8vw,3.2rem)] text-[var(--gm-gold)] leading-tight">
            {copy.title}
          </h1>
          <p className="mt-4 text-[var(--gm-text-dim)] max-w-2xl">
            {copy.lead}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={localizePath(locale, '/register')} className="btn-premium">
              {copy.cta}
            </Link>
            <Link href={localizePath(locale, '/consultants')} className="btn-outline-premium">
              {copy.cta2}
            </Link>
          </div>
        </div>

        <section className="grid md:grid-cols-3 gap-6">
          {sortedPlans.map((plan) => {
            const name = locale === 'tr' ? plan.name_tr : plan.name_en;
            const description = locale === 'tr' ? plan.description_tr : plan.description_en;
            const price = toMoney(plan.price_minor, plan.currency, locale);
            const periodLabel =
              locale === 'tr'
                ? plan.period === 'yearly'
                  ? 'yıllık'
                  : 'aylık'
                : plan.period;

            const isHighlighted = plan.code === 'monthly' || plan.code === 'yearly';
            const badgeLabel = locale === 'tr' ? (plan.code === 'free' ? copy.freeLabel : copy.premiumLabel) : (plan.code === 'free' ? 'Free' : 'Premium');
            const trialText = plan.trial_days > 0 ? `${plan.trial_days} ${locale === 'tr' ? 'gün deneme' : 'day trial'}` : null;

            return (
              <article
                key={plan.id}
                className={`rounded-sm border border-[var(--gm-border)] bg-[var(--gm-surface)] overflow-hidden ${
                  isHighlighted ? 'ring-2 ring-[var(--gm-gold)] shadow-card' : 'shadow-soft'
                }`}
              >
                <div className="px-6 py-6 border-b border-[var(--gm-border-soft)] bg-[var(--gm-bg-deep)]">
                  <div className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-[var(--gm-gold)]">
                    <Star size={13} />
                    <span>{badgeLabel}</span>
                  </div>
                  <h2 className="mt-4 font-serif text-2xl text-[var(--gm-text)]">{name}</h2>
                  <p className="mt-2 text-sm text-[var(--gm-text-dim)] min-h-[44px]">{description || ''}</p>
                  <div className="mt-5">
                    <p className="text-[1.85rem] font-semibold text-[var(--gm-gold)] leading-none">
                      {plan.price_minor === 0 ? (locale === 'tr' ? 'Ücretsiz' : 'Free') : price}
                    </p>
                    <p className="mt-1 text-xs text-[var(--gm-text-muted)]">
                      {plan.code === 'free'
                        ? locale === 'tr'
                          ? 'Başlamak için kart bilgisi gerekmez'
                          : 'No card required to start'
                        : `${plan.price_minor === 0 ? '' : `${locale === 'tr' ? ' / ' : ' / '}${periodLabel}`}${trialText ? ` · ${trialText}` : ''}`}
                    </p>
                  </div>
                </div>
                <ul className="divide-y divide-[var(--gm-border-soft)]">
                  {[
                    { key: 'daily', label: featureCopy[locale === 'tr' ? 'tr' : 'en'].daily },
                    {
                      key: 'chart',
                      label: featureCopy[locale === 'tr' ? 'tr' : 'en'].chart,
                    },
                    {
                      key: 'video',
                      label: featureCopy[locale === 'tr' ? 'tr' : 'en'].video,
                    },
                    {
                      key: 'support',
                      label: featureCopy[locale === 'tr' ? 'tr' : 'en'].support,
                    },
                  ].map((item) => {
                    const isIncluded =
                      (item.key === 'daily' && (featureHas(plan, 'daily_reading_basic') || featureHas(plan, 'daily_reading_premium'))) ||
                      (item.key === 'chart' && featureHas(plan, 'birth_chart_basic')) ||
                      (item.key === 'video' && isPremiumPlan(plan)) ||
                      (item.key === 'support' && isPremiumPlan(plan));
                    return (
                      <li key={item.key} className="px-6 py-3 text-sm flex items-center justify-between">
                        <span className="text-[var(--gm-text-dim)]">{item.label}</span>
                        <span
                          className={`text-sm ${isIncluded ? 'text-[var(--gm-success)]' : 'text-[var(--gm-text-muted)]'}`}
                        >
                          {CHECK_LABELS[isIncluded ? 'yes' : 'no']}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </article>
            );
          })}
        </section>

        <section className="mt-16">
          <div className="text-center max-w-3xl mx-auto">
            <p className="section-label">{copy.modeHeadline}</p>
            <h3 className="mt-2 text-2xl md:text-3xl text-[var(--gm-gold)] font-serif">
              {copy.modeHeadline}
            </h3>
            <p className="mt-3 text-sm text-[var(--gm-text-dim)]">{copy.modeLead}</p>
          </div>

          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <article className="rounded-sm bg-[var(--gm-surface)] border border-[var(--gm-border)] p-6 shadow-soft">
              <div className="flex items-center gap-3 mb-4">
                <Mic className="text-[var(--gm-gold)]" size={20} />
                <h4 className="font-serif text-xl text-[var(--gm-text)]">
                  {locale === 'tr' ? 'Sesli Görüşme (Standart)' : 'Audio Session (Standard)'}
                </h4>
              </div>
              <p className="text-[var(--gm-text-dim)] text-sm mb-3">
                {copy.perMinuteVoice}
              </p>
              <ul className="space-y-2 text-sm text-[var(--gm-text)]">
                {voiceFeatures.map((item) => (
                  <li key={item.text} className="flex gap-2">
                    <Check size={16} className="text-[var(--gm-success)] mt-[2px] flex-shrink-0" />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-sm border border-[var(--gm-gold)] bg-[var(--gm-bg-deep)] p-6 shadow-card relative">
              <span className="absolute top-4 right-4 inline-flex items-center px-3 py-1 rounded-full text-[10px] tracking-[0.16em] uppercase bg-[var(--gm-gold)]/15 text-[var(--gm-gold)]">
                {locale === 'tr' ? 'Premium' : 'Premium'}
              </span>
              <div className="flex items-center gap-3 mb-4">
                <Video className="text-[var(--gm-gold)]" size={20} />
                <h4 className="font-serif text-xl text-[var(--gm-text)]">
                  {locale === 'tr' ? 'Görüntülü Görüşme (Premium)' : 'Video Session (Premium)'}
                </h4>
              </div>
              <p className="text-[var(--gm-text-dim)] text-sm mb-3">
                {copy.perMinuteVideo}
              </p>
              <ul className="space-y-2 text-sm text-[var(--gm-text)]">
                {videoFeatures.map((item) => (
                  <li key={item.text} className="flex gap-2">
                    <Check size={16} className="text-[var(--gm-success)] mt-[2px] flex-shrink-0" />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

        <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="text-[var(--gm-text-muted)] border-b border-[var(--gm-border)]">
                  <th className="py-3 text-left font-medium pr-4">{locale === 'tr' ? 'Özellik' : 'Feature'}</th>
                  <th className="py-3 text-center font-medium px-3">
                    {getPlanLabel(freePlan, locale === 'tr' ? 'Ücretsiz' : 'Free')}
                  </th>
                  <th className="py-3 text-center font-medium px-3">
                    {getPlanLabel(planToShow, locale === 'tr' ? 'Aylık' : 'Monthly')}
                  </th>
                  <th className="py-3 text-center font-medium px-3">
                    {getPlanLabel(activeYear, locale === 'tr' ? 'Yıllık' : 'Yearly')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {featureMatrix.map((row) => (
                  <tr key={row.key} className="border-b border-[var(--gm-border-soft)]">
                    <td className="py-3 pr-4">
                      <p className="text-[var(--gm-text)]">{row.feature}</p>
                      <p className="text-xs text-[var(--gm-text-muted)] mt-1">{row.desc}</p>
                    </td>
                    <td className="py-3 px-3 text-center text-[var(--gm-text)]">
                      {row.freeValue ? <Check size={16} className="mx-auto text-[var(--gm-success)]" /> : <span className="text-[var(--gm-text-muted)]">—</span>}
                    </td>
                    <td className="py-3 px-3 text-center text-[var(--gm-text)]">
                      {row.premiumValue ? (
                        <Check size={16} className="mx-auto text-[var(--gm-success)]" />
                      ) : (
                        <span className="text-[var(--gm-text-muted)]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center text-[var(--gm-text)]">
                      {row.premiumValue ? (
                        <Check size={16} className="mx-auto text-[var(--gm-success)]" />
                      ) : (
                        <span className="text-[var(--gm-text-muted)]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-14 rounded-sm border border-[var(--gm-border-soft)] bg-[var(--gm-bg-surface)]/20 p-6">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h4 className="font-serif text-xl text-[var(--gm-gold)]">
                {copy.transparencyTitle}
              </h4>
              <p className="mt-2 text-sm text-[var(--gm-text-dim)] max-w-2xl">{copy.transparencySubtitle}</p>
            </div>
            <Link href={localizePath(locale, '/support')} className="btn-outline-premium">
              <CreditCard size={16} />
              <span>{locale === 'tr' ? 'Şeffaf Kural Kitabı' : 'See policy details'}</span>
            </Link>
          </div>
          <div className="mt-6 grid sm:grid-cols-3 gap-4 text-sm text-[var(--gm-text-muted)]">
            <a href={localizePath(locale, '/terms')} className="hover:text-[var(--gm-gold)] transition-colors">
              {copy.cancellationPolicy}
            </a>
            <a href={localizePath(locale, '/privacy-policy')} className="hover:text-[var(--gm-gold)] transition-colors">
              {copy.kvkk}
            </a>
            <a href={localizePath(locale, '/faqs')} className="hover:text-[var(--gm-gold)] transition-colors">
              {copy.returnPolicy}
            </a>
          </div>
          <p className="mt-4 text-sm text-[var(--gm-text-dim)]">{copy.footerInfo}</p>
          <p className="mt-5 text-xs text-[var(--gm-text-muted)] flex items-center gap-2">
            <ShieldCheck size={14} />
            {copy.cancel}
            <ArrowRight size={14} />
          </p>
        </section>

        {(isLoading || isFetching) && (
          <div className="mt-8 text-sm text-[var(--gm-text-muted)]">
            {locale === 'tr' ? 'Fiyat planları güncelleniyor…' : 'Updating pricing plans…'}
          </div>
        )}
        {isError && (
          <div className="mt-8 text-sm text-[var(--gm-error)]">
            {locale === 'tr' ? 'Planlar sunucudan alınamadı, yedek veriler gösteriliyor.' : 'Could not load plans, showing fallback data.'}
          </div>
        )}
      </section>
    </main>
  );
}
