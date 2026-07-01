'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Sparkles, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/features/auth/auth.store';
import { useUiSection } from '@/i18n';

export function DiscountPromoBanner({
  className,
  locale = 'tr',
}: {
  className?: string;
  locale?: string;
}) {
  const { isAuthenticated, user } = useAuthStore();
  const { ui } = useUiSection('ui_extra' as any);
  if (user?.is_premium) return null;

  const consultantsHref = `/${locale}/consultants`;
  const ctaHref = isAuthenticated
    ? `${consultantsHref}#consultants-results`
    : `/${locale}/register?next=${encodeURIComponent(consultantsHref)}`;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.45)] cursor-pointer select-none transition-transform duration-500 hover:scale-[1.01]',
        className,
      )}
      style={{ minHeight: 200 }}
    >
      {/* Background image */}
      <Image
        src="/images/banner-consultants-bg.png"
        alt={ui('ui_extra_b2_promo_ad_alt', 'Advertisement')}
        fill
        sizes="(max-width: 768px) 100vw, 1200px"
        className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
        priority={false}
      />

      {/* Gradient — left side pitch-dark so white text is always readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/65 to-black/10" />

      {/* Particle decorations */}
      <span className="absolute top-6 left-[45%] w-1.5 h-1.5 rounded-full bg-amber-300/60 animate-ping" style={{ animationDuration: '2.4s' }} />
      <span className="absolute bottom-8 right-[30%] w-1 h-1 rounded-full bg-purple-300/70 animate-ping" style={{ animationDuration: '3.1s' }} />

      {/* Text content */}
      <div className="relative z-10 flex h-full flex-col justify-center gap-4 px-8 py-10 sm:px-12 md:px-16 max-w-[65%]">
        {/* Label chip */}
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300 backdrop-blur-sm">
          <Zap size={9} />
          {ui('ui_extra_b2_promo_discount_chip', 'SPECIAL OFFER')}
        </span>

        {/* Headline — fixed white, not --gm-text */}
        <h3 className="font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl md:text-4xl">
          {ui('ui_extra_b2_promo_discount_title', 'First Session Special Discount')}
        </h3>

        {/* Subtitle — fixed white/muted */}
        <p className="font-serif italic text-sm text-white/65 sm:text-base">
          {ui('ui_extra_b2_promo_discount_sub', '20% off for new members. Choose your consultant and begin your journey.')}
        </p>

        {/* CTA */}
        <Link
          href={ctaHref}
          className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-amber-400 px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#0D0B1E] transition-all duration-300 hover:shadow-[0_0_28px_rgba(212,175,55,0.55)] hover:scale-105"
        >
          {ui('ui_extra_b2_promo_discount_cta', 'Get Started')}
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* AD badge */}
      <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest text-white/60 backdrop-blur-sm">
        © {ui('ui_extra_b2_promo_ad_badge', 'Ad')}
      </span>
    </div>
  );
}

export function BecomeConsultantBanner({
  className,
  locale = 'tr',
  compact = false,
}: {
  className?: string;
  locale?: string;
  compact?: boolean;
}) {
  const { ui } = useUiSection('ui_extra' as any);

  return (
    <div
      className={cn(
        'group relative overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-[1.01]',
        compact ? 'rounded-[32px]' : 'rounded-[40px]',
        className,
      )}
      style={{ minHeight: compact ? 200 : 300 }}
    >
      {/* Background image */}
      <Image
        src="/images/banner-become-consultant-bg.png"
        alt={ui('ui_extra_b2_promo_become_alt', 'Become a Consultant')}
        fill
        sizes="(max-width: 768px) 100vw, 1200px"
        className="object-cover object-right-center transition-transform duration-700 group-hover:scale-105"
        priority={false}
      />

      {/* Gradient — pitch-dark left, text always readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/72 to-black/15" />

      {/* Glow behind astrolabe */}
      <div className="absolute right-[15%] top-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-amber-400/8 blur-[80px] pointer-events-none" />

      {/* Star decorations */}
      <Star size={10} className="absolute top-8 left-[38%] text-amber-300/40 fill-amber-300/30 animate-pulse" style={{ animationDuration: '3s' }} />
      <Star size={7} className="absolute bottom-10 left-[52%] text-purple-300/50 fill-purple-300/30 animate-pulse" style={{ animationDuration: '4.2s' }} />

      {/* Content */}
      <div className={cn(
        'relative z-10 flex h-full flex-col justify-center gap-5 px-8 py-12 max-w-[65%] sm:px-12 md:px-16',
        compact && 'gap-3 py-10',
      )}>
        {/* Badge */}
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-purple-300/30 bg-purple-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-purple-200 backdrop-blur-sm">
          <Sparkles size={9} />
          {ui('ui_extra_b2_promo_career_chip', 'CAREER OPPORTUNITY')}
        </span>

        {/* Headline — fixed white */}
        <h3 className={cn(
          'font-display font-semibold leading-tight tracking-tight text-white',
          compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl md:text-5xl',
        )}>
          {ui('ui_extra_b2_promo_career_title', 'Share Your Wisdom, Become a Consultant')}
        </h3>

        {/* Subtitle */}
        {!compact && (
          <p className="font-serif italic text-base text-white/65 leading-relaxed sm:text-lg max-w-md">
            {ui('ui_extra_b2_promo_career_sub', 'Guide thousands of users. Manage your own time and increase your earnings.')}
          </p>
        )}

        {/* Stats row */}
        {!compact && (
          <div className="flex flex-wrap gap-6 text-[11px] font-bold uppercase tracking-widest">
            {[
              { val: '500+', label: ui('ui_extra_b2_promo_stat_users', 'Active Users') },
              { val: '%70', label: ui('ui_extra_b2_promo_stat_revenue', 'Revenue Share') },
              { val: '48h', label: ui('ui_extra_b2_promo_stat_approval', 'Approval Time') },
            ].map(({ val, label }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-xl font-display text-amber-400">{val}</span>
                <span className="text-white/45">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/${locale}/become-consultant`}
          className={cn(
            'mt-2 inline-flex w-fit items-center gap-2 rounded-full font-bold uppercase tracking-[0.2em] transition-all duration-300 hover:scale-105',
            compact
              ? 'bg-amber-400 px-5 py-2 text-[10px] text-[#0D0B1E] hover:shadow-[0_0_24px_rgba(212,175,55,0.5)]'
              : 'bg-amber-400 px-8 py-3.5 text-xs text-[#0D0B1E] hover:shadow-[0_0_36px_rgba(212,175,55,0.6)]',
          )}
        >
          {ui('ui_extra_b2_promo_career_cta', 'Apply')}
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
