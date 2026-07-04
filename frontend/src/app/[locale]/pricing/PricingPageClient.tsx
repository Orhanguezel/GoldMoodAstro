// =============================================================
// FILE: src/app/[locale]/pricing/PricingPageClient.tsx
// goldmoodastro – Pricing Page Client (DESIGN SYSTEM SYNC)
// =============================================================

'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Star, Video, Mic, CreditCard, ShieldCheck, ArrowRight } from 'lucide-react';
import { localizePath } from '@/integrations/shared';
import { useListSubscriptionPlansQuery } from '@/integrations/rtk/public/subscriptions.endpoints';
import { useRedeemCampaignMutation, type Campaign } from '@/integrations/rtk/public/campaigns.endpoints';
import type { SubscriptionPlanPublicUi } from '@/integrations/rtk/public/subscriptions.endpoints';
import PageContainer from '@/components/common/PageContainer';

type Locale = 'tr' | 'en' | string;

const FALLBACK_PLANS: SubscriptionPlanPublicUi[] = [
  {
    id: 'fallback-free',
    code: 'free',
    name_tr: 'Free',
    name_en: 'Free',
    description_tr: 'Start exploring the platform with core features.',
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
    name_tr: 'Monthly',
    name_en: 'Monthly',
    description_tr: 'Unlimited AI readings and premium consultant tools.',
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
    name_tr: 'Yearly',
    name_en: 'Yearly',
    description_tr: 'Premium access with yearly pricing advantage.',
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
    daily: 'Günlük Yorum',
    daily_desc: 'Her gün planlanmış astroloji yorumu',
    transit: 'Günlük Transit',
    transit_desc: 'Kişisel gezegen hareketi takibi',
    synastry: 'Sinastri',
    synastry_desc: 'İlişki uyumu analizi',
    chart: 'Temel Doğum Haritası',
    chart_desc: 'Temel astroloji seans kurulumu',
    support: 'Öncelikli Destek',
    support_desc: 'Öncelikli destek ve yanıtlar',
    video: 'Görüntülü Seans',
    video_desc: 'Canlı kameralı danışmanlık',
    ad: 'Reklamsız',
    ad_desc: 'Tanıtım öğeleri olmadan temiz deneyim',
  },
  de: {
    daily: 'Tägliche Deutung',
    daily_desc: 'Geplante tägliche Astrologie-Deutung',
    transit: 'Täglicher Transit',
    transit_desc: 'Persönliche Verfolgung der Planetenbewegung',
    synastry: 'Synastrie',
    synastry_desc: 'Einblicke in die Beziehungskompatibilität',
    chart: 'Basis-Geburtshoroskop',
    chart_desc: 'Grundlegende Astrologie-Sitzung',
    support: 'Priorisierter Support',
    support_desc: 'Bevorzugter Support und Antworten',
    video: 'Video-Sitzung',
    video_desc: 'Live-Beratung mit Kamera',
    ad: 'Werbefrei',
    ad_desc: 'Sauberes Erlebnis ohne Werbeelemente',
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

const REQUIRED_PLAN_CODES: SubscriptionPlanPublicUi['code'][] = ['free', 'monthly', 'yearly'];

function normalizePlanSet(plans?: SubscriptionPlanPublicUi[] | null): SubscriptionPlanPublicUi[] {
  const merged = new Map<string, SubscriptionPlanPublicUi>();

  for (const fallbackPlan of FALLBACK_PLANS) {
    merged.set(fallbackPlan.code, { ...fallbackPlan });
  }

  if (Array.isArray(plans)) {
    for (const plan of plans) {
      if (!plan?.code) continue;
      merged.set(plan.code, {
        ...merged.get(plan.code),
        ...plan,
      } as SubscriptionPlanPublicUi);
    }
  }

  return REQUIRED_PLAN_CODES.map((code) => merged.get(code) ?? FALLBACK_PLANS[0]!);
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
  const [redeemCampaign, { isLoading: couponLoading }] = useRedeemCampaignMutation();
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [appliedCampaign, setAppliedCampaign] = useState<Partial<Campaign> | null>(null);

  const sortedPlans = useMemo(() => {
    const source = normalizePlanSet(plans);
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
        subtitle: 'Sesli ve görüntülü danışmanlık için net karşılaştırma',
        lead:
          'Her aşama için şeffaf fiyatlandırma. Ücretsiz başlayın, premium danışmanlık özelliklerine ihtiyaç duyduğunuzda yükseltin.',
        footerInfo:
          'İstediğiniz zaman iptal edebilirsiniz. İptal süreci bilinçli olarak basit ve nettir.',
        transparencyTitle: 'Şeffaf Fiyatlandırma',
        transparencySubtitle: 'Fiyatlar ve iptal koşulları açıkça yayınlanır.',
        policyTitle: 'Şeffaflık',
        policyBody:
          'Net fiyatlandırma. Gizli koşul yok. İptal kolaydır ve iade koşulları açıkça anlatılır.',
        cancel: 'İptal Etmek Katılmaktan Daha Kolay',
        cancellationPolicy: 'İptal Politikası',
        kvkk: 'Gizlilik',
        returnPolicy: 'İade Politikası',
        perMinuteVoice: `Sesli: ${VOICE_RATE_TRY}₺ / 15 dk`,
        perMinuteVideo: `Görüntülü: ${VIDEO_RATE_TRY}₺ / 15 dk`,
        modeHeadline: 'Sesli ve Görüntülü Danışmanlık',
        modeLead: 'Tüm kullanıcılar sesli görüşme yapabilir. Görüntülü görüşmeler premium planlara dahildir.',
        freeLabel: 'Ücretsiz',
        premiumLabel: 'Premium',
        cta: 'Hemen Başla',
        cta2: 'Danışman Bul',
        couponTitle: 'Kupon kodunuz mu var?',
        couponLead: 'İndirimi görmek için abonelik kampanya kodunuzu girin.',
        couponPlaceholder: 'HOSGELDIN20',
        couponApply: 'Uygula',
        couponSuccess: 'Kupon geçerli. İndirim ödeme sırasında uygulanır.',
        couponError: 'Kupon uygulanamadı. Giriş yapmanız veya başka bir kod denemeniz gerekebilir.',
        featureHeader: 'Özellik',
        seePolicy: 'Politika detaylarını gör',
        loadingPlans: 'Fiyat planları güncelleniyor...',
        fallbackPlans: 'Planlar yüklenemedi; yedek fiyatlandırma gösteriliyor.',
      }
    : locale === 'de'
    ? {
        title: 'Preise',
        subtitle: 'Klarer Vergleich für Sprach- und Videoberatung',
        lead:
          'Transparente Preise für jede Phase. Kostenlos starten und bei Bedarf auf Premium-Funktionen upgraden.',
        footerInfo:
          'Sie können jederzeit kündigen. Die Kündigung ist bewusst einfach und klar gestaltet.',
        transparencyTitle: 'Transparente Preise',
        transparencySubtitle: 'Preise und Kündigungsbedingungen werden klar veröffentlicht.',
        policyTitle: 'Transparenz',
        policyBody:
          'Klare Preise. Keine versteckten Bedingungen. Die Kündigung ist einfach und die Erstattungsbedingungen sind erklärt.',
        cancel: 'Kündigen ist einfacher als Beitreten',
        cancellationPolicy: 'Kündigungsrichtlinie',
        kvkk: 'Datenschutz',
        returnPolicy: 'Erstattungsrichtlinie',
        perMinuteVoice: `Sprache: ${VOICE_RATE_TRY}₺ / 15 Min`,
        perMinuteVideo: `Video: ${VIDEO_RATE_TRY}₺ / 15 Min`,
        modeHeadline: 'Sprach- vs. Videoberatung',
        modeLead: 'Alle Nutzer können Sprachsitzungen nutzen. Videositzungen sind in Premium-Plänen enthalten.',
        freeLabel: 'Kostenlos',
        premiumLabel: 'Premium',
        cta: 'Jetzt starten',
        cta2: 'Berater finden',
        couponTitle: 'Haben Sie einen Gutscheincode?',
        couponLead: 'Geben Sie einen Kampagnencode ein, um den Rabatt zu prüfen.',
        couponPlaceholder: 'WILLKOMMEN20',
        couponApply: 'Anwenden',
        couponSuccess: 'Gutschein ist gültig. Der Rabatt wird beim Bezahlen angewendet.',
        couponError: 'Gutschein konnte nicht angewendet werden. Melden Sie sich an oder versuchen Sie einen anderen Code.',
        featureHeader: 'Funktion',
        seePolicy: 'Richtliniendetails ansehen',
        loadingPlans: 'Preispläne werden aktualisiert...',
        fallbackPlans: 'Pläne konnten nicht geladen werden; Ersatzpreise werden angezeigt.',
      }
    : {
        title: 'Pricing',
        subtitle: 'Clear comparison for voice vs video consultations',
        lead: 'Transparent pricing for every stage. Start free, then upgrade when you need premium consultation features.',
        footerInfo:
          'You can cancel anytime — cancellation is intentionally simple and clear.',
        transparencyTitle: 'Transparent Pricing',
        transparencySubtitle: 'Pricing and cancellation terms are clearly published.',
        policyTitle: 'Transparency',
        policyBody:
          'Clear pricing. No hidden conditions. Cancellation is easy and refund conditions are explained.',
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
        couponTitle: 'Have a coupon code?',
        couponLead: 'Enter a subscription campaign code to check the discount.',
        couponPlaceholder: 'WELCOME20',
        couponApply: 'Apply',
        couponSuccess: 'Coupon is eligible. The discount is applied during checkout.',
        couponError: 'Coupon could not be applied. You may need to sign in or try another code.',
        featureHeader: 'Feature',
        seePolicy: 'See policy details',
        loadingPlans: 'Pricing plans are being updated...',
        fallbackPlans: 'Could not load plans; showing fallback pricing.',
      };

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return;
    setCouponError('');
    try {
      const res = await redeemCampaign({ code, applies_to: 'subscription' }).unwrap();
      setAppliedCampaign(res.campaign);
    } catch {
      setAppliedCampaign(null);
      setCouponError(copy.couponError);
    }
  };

  const voiceFeatures = [
    {
      text: 'Noise-filtered audio quality',
      included: true,
    },
    {
      text: 'Lower-cost sessions',
      included: true,
    },
    {
      text: 'No camera usage',
      included: true,
    },
  ];

  const videoFeatures = [
    {
      text: 'Facial expression and eye contact',
      included: true,
    },
    {
      text: 'Richer communication for in-depth reading',
      included: true,
    },
    {
      text: `${copy.perMinuteVideo} (Premium plan)`,
      included: true,
    },
  ];

  const fc = featureCopy[locale as keyof typeof featureCopy] ?? featureCopy.en;
  const featureMatrix = [
    {
      key: 'daily',
      feature: fc.daily,
      desc: fc.daily_desc,
      freeValue: featureHas(freePlan, 'daily_reading_basic') || isPremiumPlan(freePlan),
      premiumValue: true,
      valueLabel: fc.daily,
    },
    {
      key: 'chart',
      feature: fc.chart,
      desc: fc.chart_desc,
      freeValue: featureHas(freePlan, 'birth_chart_basic'),
      premiumValue: true,
      valueLabel: fc.chart,
    },
    {
      key: 'synastry',
      feature: fc.synastry,
      desc: fc.synastry_desc,
      freeValue: featureHas(freePlan, 'synastry'),
      premiumValue: featureHas(monthlyPlan, 'synastry') || featureHas(yearlyPlan, 'synastry'),
      valueLabel: fc.synastry,
    },
    {
      key: 'transit',
      feature: fc.transit,
      desc: fc.transit_desc,
      freeValue: featureHas(freePlan, 'transit_calendar'),
      premiumValue: featureHas(monthlyPlan, 'transit_calendar') || featureHas(yearlyPlan, 'transit_calendar'),
      valueLabel: fc.transit,
    },
    {
      key: 'support',
      feature: fc.support,
      desc: fc.support_desc,
      freeValue: false,
      premiumValue: featureHas(monthlyPlan, 'priority_support') || featureHas(yearlyPlan, 'priority_support'),
      valueLabel: fc.support,
    },
    {
      key: 'video',
      feature: fc.video,
      desc: fc.video_desc,
      freeValue: false,
      premiumValue: true,
      valueLabel: fc.video,
    },
    {
      key: 'ad',
      feature: fc.ad,
      desc: fc.ad_desc,
      freeValue: false,
      premiumValue: featureHas(monthlyPlan, 'ad_free') || featureHas(yearlyPlan, 'ad_free'),
      valueLabel: fc.ad,
    },
  ];

  return (
    <PageContainer className="bg-(--gm-bg) text-(--gm-text)" verticalPadding="large">
      <div className="pb-14">
        <p className="text-sm font-normal uppercase tracking-[0.2em] text-(--gm-primary) mb-3">{copy.subtitle}</p>
        <div className="mt-2 mb-8">
          <h1 className="font-serif text-[clamp(2rem,4.8vw,3.2rem)] text-(--gm-gold) leading-tight">
            {copy.title}
          </h1>
          <p className="mt-4 text-(--gm-text-dim) max-w-[var(--gm-w-narrow)]">
            {copy.lead}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={localizePath(locale, '/register')} className="inline-flex items-center gap-2 rounded-full bg-(--gm-primary) px-8 py-4 text-xs font-bold uppercase tracking-[0.24em] text-(--gm-bg) shadow-(--gm-shadow-card) hover:bg-(--gm-primary-dark) transition-all">
              {copy.cta}
            </Link>
            <Link href={localizePath(locale, '/consultants')} className="inline-flex items-center gap-2 rounded-full border border-(--gm-border) px-8 py-4 text-xs font-bold uppercase tracking-[0.24em] text-(--gm-text) hover:bg-(--gm-surface) transition-all">
              {copy.cta2}
            </Link>
          </div>
        </div>

        <section className="grid md:grid-cols-3 gap-6">
          {sortedPlans.map((plan) => {
            const name = locale === 'tr' ? plan.name_tr : plan.name_en;
            const description = locale === 'tr' ? plan.description_tr : plan.description_en;
            const price = toMoney(plan.price_minor, plan.currency, locale);
            const periodLabel = plan.period;

            const isHighlighted = plan.code === 'monthly' || plan.code === 'yearly';
            const badgeLabel = locale === 'tr' ? (plan.code === 'free' ? copy.freeLabel : copy.premiumLabel) : (plan.code === 'free' ? 'Free' : 'Premium');
            const trialText = plan.trial_days > 0 ? `${plan.trial_days} day trial` : null;

            return (
              <article
                key={plan.id}
                className={`rounded-2xl border border-(--gm-border) bg-(--gm-surface) overflow-hidden ${
                  isHighlighted ? 'ring-2 ring-(--gm-gold) shadow-(--gm-shadow-card)' : 'shadow-(--gm-shadow-soft)'
                }`}
              >
                <div className="px-6 py-6 border-b border-(--gm-border-soft) bg-(--gm-bg-deep)">
                  <div className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-(--gm-gold)">
                    <Star size={13} />
                    <span>{badgeLabel}</span>
                  </div>
                  <h2 className="mt-4 font-serif text-2xl text-(--gm-text)">{name}</h2>
                  <p className="mt-2 text-sm text-(--gm-text-dim) min-h-[44px]">{description || ''}</p>
                  <div className="mt-5">
                    <p className="text-[1.85rem] font-semibold text-(--gm-gold) leading-none">
                      {plan.price_minor === 0 ? 'Free' : price}
                    </p>
                    <p className="mt-1 text-xs text-(--gm-text-muted)">
                      {plan.code === 'free'
                        ? 'No card required to start'
                        : `${plan.price_minor === 0 ? '' : ` / ${periodLabel}`}${trialText ? ` · ${trialText}` : ''}`}
                    </p>
                  </div>
                </div>
                <ul className="divide-y divide-(--gm-border-soft)">
                  {[
                    { key: 'daily', label: fc.daily },
                    {
                      key: 'chart',
                      label: fc.chart,
                    },
                    {
                      key: 'video',
                      label: fc.video,
                    },
                    {
                      key: 'support',
                      label: fc.support,
                    },
                  ].map((item) => {
                    const isIncluded =
                      (item.key === 'daily' && (featureHas(plan, 'daily_reading_basic') || featureHas(plan, 'daily_reading_premium'))) ||
                      (item.key === 'chart' && featureHas(plan, 'birth_chart_basic')) ||
                      (item.key === 'video' && isPremiumPlan(plan)) ||
                      (item.key === 'support' && isPremiumPlan(plan));
                    return (
                      <li key={item.key} className="px-6 py-3 text-sm flex items-center justify-between">
                        <span className="text-(--gm-text-dim)">{item.label}</span>
                        <span
                          className={`text-sm ${isIncluded ? 'text-(--gm-success)' : 'text-(--gm-text-muted)'}`}
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

        <section className="mt-8 rounded-2xl border border-(--gm-border) bg-(--gm-surface) p-5 shadow-(--gm-shadow-soft)">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-[var(--gm-w-form)]">
              <h2 className="font-serif text-xl text-(--gm-gold)">{copy.couponTitle}</h2>
              <p className="mt-2 text-sm text-(--gm-text-dim)">{copy.couponLead}</p>
            </div>
            <div className="flex w-full gap-2 md:w-auto">
              <input
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                placeholder={copy.couponPlaceholder}
                disabled={!!appliedCampaign || couponLoading}
                className="min-w-0 flex-1 rounded-full border border-(--gm-border) bg-(--gm-bg) px-4 py-3 text-sm font-semibold tracking-[0.12em] text-(--gm-text) outline-none placeholder:text-(--gm-text-muted) focus:border-(--gm-gold) md:w-56"
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={!couponCode.trim() || !!appliedCampaign || couponLoading}
                className="rounded-full bg-(--gm-gold) px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-(--gm-bg-deep) disabled:cursor-not-allowed disabled:opacity-50"
              >
                {couponLoading ? '...' : copy.couponApply}
              </button>
            </div>
          </div>
          {appliedCampaign && (
            <p className="mt-3 text-sm text-(--gm-success)">
              {copy.couponSuccess} ({appliedCampaign.code}
              {appliedCampaign.value ? ` · ${appliedCampaign.type === 'discount_percentage' ? `%${Number(appliedCampaign.value)}` : appliedCampaign.value}` : ''})
            </p>
          )}
          {couponError && <p className="mt-3 text-sm text-(--gm-error)">{couponError}</p>}
        </section>

        <section className="mt-16">
          <div className="text-center max-w-[var(--gm-w-narrow)] mx-auto">
            <h3 className="mt-2 text-2xl md:text-3xl text-(--gm-gold) font-serif">
              {copy.modeHeadline}
            </h3>
            <p className="mt-3 text-sm text-(--gm-text-dim)">{copy.modeLead}</p>
          </div>

          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <article className="rounded-2xl bg-(--gm-surface) border border-(--gm-border) p-6 shadow-(--gm-shadow-soft)">
              <div className="flex items-center gap-3 mb-4">
                <Mic className="text-(--gm-gold)" size={20} />
                <h4 className="font-serif text-xl text-(--gm-text)">
                  Audio Session (Standard)
                </h4>
              </div>
              <p className="text-(--gm-text-dim) text-sm mb-3">
                {copy.perMinuteVoice}
              </p>
              <ul className="space-y-2 text-sm text-(--gm-text)">
                {voiceFeatures.map((item) => (
                  <li key={item.text} className="flex gap-2">
                    <Check size={16} className="text-(--gm-success) mt-[2px] flex-shrink-0" />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl border border-(--gm-gold) bg-(--gm-bg-deep) p-6 shadow-(--gm-shadow-card) relative">
              <span className="absolute top-4 right-4 inline-flex items-center px-3 py-1 rounded-full text-[10px] tracking-[0.16em] uppercase bg-(--gm-gold)/15 text-(--gm-gold)">
                {locale === 'tr' ? 'Premium' : 'Premium'}
              </span>
              <div className="flex items-center gap-3 mb-4">
                <Video className="text-(--gm-gold)" size={20} />
                <h4 className="font-serif text-xl text-(--gm-text)">
                  Video Session (Premium)
                </h4>
              </div>
              <p className="text-(--gm-text-dim) text-sm mb-3">
                {copy.perMinuteVideo}
              </p>
              <ul className="space-y-2 text-sm text-(--gm-text)">
                {videoFeatures.map((item) => (
                  <li key={item.text} className="flex gap-2">
                    <Check size={16} className="text-(--gm-success) mt-[2px] flex-shrink-0" />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="text-(--gm-text-muted) border-b border-(--gm-border)">
                  <th className="py-3 text-left font-medium pr-4">{copy.featureHeader}</th>
                  <th className="py-3 text-center font-medium px-3">
                    {getPlanLabel(freePlan, 'Free')}
                  </th>
                  <th className="py-3 text-center font-medium px-3">
                    {getPlanLabel(planToShow, 'Monthly')}
                  </th>
                  <th className="py-3 text-center font-medium px-3">
                    {getPlanLabel(activeYear, 'Yearly')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {featureMatrix.map((row) => (
                  <tr key={row.key} className="border-b border-(--gm-border-soft)">
                    <td className="py-3 pr-4">
                      <p className="text-(--gm-text)">{row.feature}</p>
                      <p className="text-xs text-(--gm-text-muted) mt-1">{row.desc}</p>
                    </td>
                    <td className="py-3 px-3 text-center text-(--gm-text)">
                      {row.freeValue ? <Check size={16} className="mx-auto text-(--gm-success)" /> : <span className="text-(--gm-text-muted)">—</span>}
                    </td>
                    <td className="py-3 px-3 text-center text-(--gm-text)">
                      {row.premiumValue ? (
                        <Check size={16} className="mx-auto text-(--gm-success)" />
                      ) : (
                        <span className="text-(--gm-text-muted)">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center text-(--gm-text)">
                      {row.premiumValue ? (
                        <Check size={16} className="mx-auto text-(--gm-success)" />
                      ) : (
                        <span className="text-(--gm-text-muted)">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-14 rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface)/20 p-6">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h4 className="font-serif text-xl text-(--gm-gold)">
                {copy.transparencyTitle}
              </h4>
              <p className="mt-2 text-sm text-(--gm-text-dim) max-w-[var(--gm-w-narrow)]">
                {copy.policyBody || copy.transparencySubtitle}
              </p>
            </div>
            <Link href={localizePath(locale, '/terms')} className="inline-flex items-center gap-2 rounded-full border border-(--gm-border) px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-(--gm-text) hover:bg-(--gm-surface) transition-all">
              <CreditCard size={16} />
              <span>{copy.seePolicy}</span>
            </Link>
          </div>
          <div className="mt-6 grid sm:grid-cols-3 gap-4 text-sm text-(--gm-text-muted)">
            <a href={localizePath(locale, '/terms')} className="hover:text-(--gm-gold) transition-colors">
              {copy.cancellationPolicy}
            </a>
            <a href={localizePath(locale, '/kvkk')} className="hover:text-(--gm-gold) transition-colors">
              {copy.kvkk}
            </a>
            <a href={localizePath(locale, '/legal-notice')} className="hover:text-(--gm-gold) transition-colors">
              {copy.returnPolicy}
            </a>
          </div>
          <p className="mt-4 text-sm text-(--gm-text-dim)">{copy.footerInfo}</p>
          <p className="mt-5 text-xs text-(--gm-text-muted) flex items-center gap-2">
            <ShieldCheck size={14} />
            {copy.cancel}
            <ArrowRight size={14} />
          </p>
        </section>

        {(isLoading || isFetching) && (
          <div className="mt-8 text-sm text-(--gm-text-muted)">
            {copy.loadingPlans}
          </div>
        )}
        {isError && (
          <div className="mt-8 text-sm text-(--gm-error)">
            {copy.fallbackPlans}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
