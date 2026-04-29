// FAZ 28 / T28-3 — Centralized funnel CTA
// frontend/src/components/common/ConsultantFunnelCTA.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, UserPlus, Crown } from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth.store';
import { useLocaleShort } from '@/i18n';
import { localizePath } from '@/integrations/shared';
import { getFunnelConfig, type FunnelFeature } from './funnel.config';

type Tier = 'guest' | 'free' | 'premium';
type Intensity = 'heavy' | 'light' | 'none';

type Props = {
  feature: FunnelFeature;
  /** Yönlendirme yoğunluğu — 'none' verilirse hiç render edilmez */
  intensity?: Intensity;
  /** Okuma bağlamı (örn. menzil adı, kart isimleri) — danışmana topic param ile geçer */
  context?: Record<string, string | number | undefined>;
  /** Override — auth state'e bakmadan tier zorla */
  tier?: Tier;
  /** Backward-compatible alias */
  tierOverride?: Tier;
};

function detectTier(opts: { isAuthenticated: boolean; isPremium?: boolean }): Tier {
  if (!opts.isAuthenticated) return 'guest';
  return opts.isPremium ? 'premium' : 'free';
}

function buildHref(
  locale: string,
  feature: FunnelFeature,
  context?: Record<string, string | number | undefined>,
): string {
  const cfg = getFunnelConfig(feature);
  const params = new URLSearchParams({ topic: cfg.topic });
  if (context && Object.keys(context).length > 0) {
    const clean = Object.fromEntries(
      Object.entries(context).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    );
    if (Object.keys(clean).length > 0) {
      params.set('context', JSON.stringify(clean));
    }
  }
  return `${localizePath(locale, '/consultants')}?${params.toString()}`;
}

export default function ConsultantFunnelCTA({
  feature,
  intensity = 'heavy',
  context,
  tier,
  tierOverride,
}: Props) {
  const locale = useLocaleShort();
  const isTr = locale === 'tr';
  const { isAuthenticated, user } = useAuthStore();

  if (intensity === 'none') return null;

  // Premium kontrol — user.subscription veya benzeri (yoksa false)
  const isPremium = Boolean((user as any)?.subscription_tier === 'premium');
  const resolvedTier: Tier = tier ?? tierOverride ?? detectTier({ isAuthenticated, isPremium });
  const cfg = getFunnelConfig(feature);
  const href = buildHref(locale, feature, context);

  // Tier × intensity'e göre copy
  const headline = (() => {
    if (resolvedTier === 'guest') return isTr ? 'Üye ol — ilk yorum %50 indirimli' : 'Sign up — 50% off first reading';
    if (resolvedTier === 'free') return isTr ? 'Derin analiz ister misin?' : 'Want a deeper analysis?';
    return isTr ? 'Bir uzmanla görüş' : 'Talk to an expert';
  })();

  const description = (() => {
    if (resolvedTier === 'guest') {
      return isTr
        ? `Hesabını aç, ${isTr ? cfg.headlineTr.toLowerCase() : cfg.headlineEn.toLowerCase()} ile birebir görüş. İlk seansa özel %50 indirim.`
        : 'Create an account and meet our experts one-on-one. 50% off your first session.';
    }
    if (resolvedTier === 'free') {
      return isTr
        ? `Yapay zeka yorumun yeterli mi? Onaylı ${cfg.headlineTr.toLowerCase()} ile sesli/görüntülü görüş — kişisel ve doğrudan.`
        : `Is the AI reading enough? Connect with verified ${cfg.headlineEn.toLowerCase()} via voice/video — personal and direct.`;
    }
    return isTr
      ? 'Premium üyeliğinle ek seans avantajların var.'
      : 'You have additional session perks with your premium plan.';
  })();

  const ctaLabel = (() => {
    if (resolvedTier === 'guest') return isTr ? 'Üye Ol' : 'Sign Up';
    return isTr ? 'Danışman Seç' : 'Choose a Consultant';
  })();

  const ctaHref = resolvedTier === 'guest' ? localizePath(locale, `/register?next=${encodeURIComponent(href)}`) : href;

  // INTENSITY: light → minimal satır, heavy → dolu kart
  if (intensity === 'light') {
    return (
      <div className="flex items-center justify-center gap-3 text-sm text-(--gm-text-dim) py-6 border-t border-(--gm-border-soft)">
        <span>{description}</span>
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-1.5 font-bold uppercase tracking-[0.18em] text-xs text-(--gm-gold-deep) hover:text-(--gm-gold) transition-colors"
        >
          {ctaLabel}
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  // HEAVY (default)
  const Icon = resolvedTier === 'guest' ? UserPlus : resolvedTier === 'premium' ? Crown : Sparkles;
  return (
    <div className="mt-8 rounded-[2.5rem] border-2 border-(--gm-gold)/30 bg-gradient-to-br from-(--gm-gold)/10 via-(--gm-gold)/5 to-transparent p-8 md:p-10 relative overflow-hidden">
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-(--gm-gold)/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-16 h-16 rounded-2xl bg-(--gm-gold)/15 border border-(--gm-gold)/30 flex items-center justify-center text-(--gm-gold-deep) shrink-0">
          <Icon className="w-7 h-7" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="font-display text-[10px] tracking-[0.32em] text-(--gm-gold-deep) uppercase mb-2">
            {isTr ? cfg.headlineTr : cfg.headlineEn}
          </div>
          <h3 className="font-serif text-xl md:text-2xl text-(--gm-text) mb-2">{headline}</h3>
          <p className="text-sm text-(--gm-text-dim) leading-relaxed">{description}</p>
        </div>
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-(--gm-gold) text-(--gm-bg-deep) text-xs font-bold uppercase tracking-[0.18em] hover:bg-(--gm-gold-light) transition-colors whitespace-nowrap shrink-0"
        >
          {ctaLabel}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
