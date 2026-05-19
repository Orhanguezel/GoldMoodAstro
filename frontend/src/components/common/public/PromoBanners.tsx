'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Sparkles, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/features/auth/auth.store';

/* ─────────────────────────────────────────────────────────────────
   1. DiscountPromoBanner — "İlk Seansa %20 İndirim" (slim hero)
   Kullanım: ConsultantList içinde filtre+grid arasına koy
───────────────────────────────────────────────────────────────── */
export function DiscountPromoBanner({
  className,
  locale = 'tr',
}: {
  className?: string;
  locale?: string;
}) {
  const { user } = useAuthStore();
  // Premium kullanıcılar reklam görmez
  if (user?.is_premium) return null;

  const isTr = locale === 'tr';

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[32px] border border-(--gm-border-soft) shadow-[0_8px_40px_rgba(0,0,0,0.35)] cursor-pointer select-none transition-transform duration-500 hover:scale-[1.01]',
        className,
      )}
      style={{ minHeight: 200 }}
    >
      {/* Background image */}
      <Image
        src="/images/banner-consultants-bg.png"
        alt="Reklam"
        fill
        sizes="(max-width: 768px) 100vw, 1200px"
        className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
        priority={false}
      />

      {/* Dark gradient overlay — left-heavy so text is readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0D0B1E]/90 via-[#0D0B1E]/60 to-transparent" />

      {/* Particle dots (decorative) */}
      <span className="absolute top-6 left-[45%] w-1.5 h-1.5 rounded-full bg-(--gm-gold)/60 animate-ping" style={{ animationDuration: '2.4s' }} />
      <span className="absolute bottom-8 right-[30%] w-1 h-1 rounded-full bg-(--gm-primary-light)/80 animate-ping" style={{ animationDuration: '3.1s' }} />

      {/* Text content */}
      <div className="relative z-10 flex h-full flex-col justify-center gap-4 px-8 py-10 sm:px-12 md:px-16 max-w-[65%]">
        {/* Label chip */}
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-(--gm-gold)/30 bg-(--gm-gold)/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-(--gm-gold)">
          <Zap size={9} />
          {isTr ? 'ÖZEL TEKLİF' : 'SPECIAL OFFER'}
        </span>

        {/* Headline */}
        <h3 className="font-display text-2xl font-semibold leading-tight tracking-tight text-(--gm-text) sm:text-3xl md:text-4xl">
          {isTr ? (
            <>İlk Seansa <span className="text-(--gm-gold)">Özel İndirim</span></>
          ) : (
            <>First Session <span className="text-(--gm-gold)">Special Discount</span></>
          )}
        </h3>

        {/* Subtitle */}
        <p className="font-serif italic text-sm text-(--gm-text-dim) sm:text-base">
          {isTr
            ? 'Yeni üyelere %20 indirim — danışmanını seç, yolculuğuna başla.'
            : 'New members get 20% off — choose your consultant and begin.'}
        </p>

        {/* CTA */}
        <Link
          href={`/${locale}/consultants`}
          className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-(--gm-gold) px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-(--gm-bg-deep) transition-all duration-300 hover:shadow-[0_0_28px_rgba(212,175,55,0.45)] hover:scale-105"
        >
          {isTr ? 'Hemen Başla' : 'Get Started'}
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* AD badge */}
      <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest text-white/70 backdrop-blur-sm">
        © Reklam
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   2. BecomeConsultantBanner — "Danışman Ol" CTA banner
   Kullanım: ConsultantList altında VEYA become-consultant hero
───────────────────────────────────────────────────────────────── */
export function BecomeConsultantBanner({
  className,
  locale = 'tr',
  compact = false,
}: {
  className?: string;
  locale?: string;
  compact?: boolean;
}) {
  const isTr = locale === 'tr';

  return (
    <div
      className={cn(
        'group relative overflow-hidden border border-(--gm-border-soft) shadow-[0_8px_40px_rgba(0,0,0,0.4)] transition-transform duration-500 hover:scale-[1.01]',
        compact ? 'rounded-[32px]' : 'rounded-[40px]',
        className,
      )}
      style={{ minHeight: compact ? 200 : 300 }}
    >
      {/* Background image */}
      <Image
        src="/images/banner-become-consultant-bg.png"
        alt="Danışman Ol"
        fill
        sizes="(max-width: 768px) 100vw, 1200px"
        className="object-cover object-right-center transition-transform duration-700 group-hover:scale-105"
        priority={false}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1a0938]/95 via-[#1a0938]/70 to-transparent" />

      {/* Glow behind astrolabe */}
      <div className="absolute right-[15%] top-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-(--gm-gold)/10 blur-[80px] pointer-events-none" />

      {/* Star decorations */}
      <Star
        size={10}
        className="absolute top-8 left-[38%] text-(--gm-gold)/40 fill-(--gm-gold)/30 animate-pulse"
        style={{ animationDuration: '3s' }}
      />
      <Star
        size={7}
        className="absolute bottom-10 left-[52%] text-(--gm-primary-light)/50 fill-(--gm-primary-light)/30 animate-pulse"
        style={{ animationDuration: '4.2s' }}
      />

      {/* Content */}
      <div className={cn(
        'relative z-10 flex h-full flex-col justify-center gap-5 px-8 py-12 max-w-[65%] sm:px-12 md:px-16',
        compact && 'gap-3 py-10',
      )}>
        {/* Badge */}
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-(--gm-primary-light)/30 bg-(--gm-primary)/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-(--gm-primary-light)">
          <Sparkles size={9} />
          {isTr ? 'KARİYER FIRSATI' : 'CAREER OPPORTUNITY'}
        </span>

        {/* Headline */}
        <h3 className={cn(
          'font-display font-semibold leading-tight tracking-tight text-(--gm-text)',
          compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl md:text-5xl',
        )}>
          {isTr ? (
            <>Uzmanlığınla <span className="text-(--gm-gold) italic">Danışman Ol</span></>
          ) : (
            <>Share Your Wisdom, <span className="text-(--gm-gold) italic">Become a Consultant</span></>
          )}
        </h3>

        {/* Subtitle */}
        {!compact && (
          <p className="font-serif italic text-base text-(--gm-text-dim) leading-relaxed sm:text-lg max-w-md">
            {isTr
              ? 'Binlerce kullanıcıya rehberlik edin. Kendi zamanınızı yönetin, kazancınızı artırın.'
              : 'Guide thousands of users. Manage your own schedule and grow your income.'}
          </p>
        )}

        {/* Stats row */}
        {!compact && (
          <div className="flex flex-wrap gap-6 text-[11px] font-bold uppercase tracking-widest">
            {[
              { val: isTr ? '500+' : '500+', label: isTr ? 'Aktif Kullanıcı' : 'Active Users' },
              { val: isTr ? '%70' : '70%', label: isTr ? 'Kazanç Payı' : 'Revenue Share' },
              { val: isTr ? '48h' : '48h', label: isTr ? 'Onay Süreci' : 'Approval Process' },
            ].map(({ val, label }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-xl font-display text-(--gm-gold)">{val}</span>
                <span className="text-(--gm-text-dim)">{label}</span>
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
              ? 'bg-(--gm-gold) px-5 py-2 text-[10px] text-(--gm-bg-deep) hover:shadow-[0_0_24px_rgba(212,175,55,0.4)]'
              : 'bg-(--gm-gold) px-8 py-3.5 text-xs text-(--gm-bg-deep) hover:shadow-[0_0_36px_rgba(212,175,55,0.5)]',
          )}
        >
          {isTr ? 'Başvur' : 'Apply Now'}
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
