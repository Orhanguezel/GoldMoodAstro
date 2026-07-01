'use client';

/**
 * BecomeConsultantHero - premium hero banner for the consultant application page.
 * The image is intentionally dark, so white/amber text stays readable in every theme.
 */
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, ChevronRight, ShieldCheck, Star } from 'lucide-react';
import { useUiSection } from '@/i18n';

interface Props {
  locale?: string;
}

export default function BecomeConsultantHero({ locale = 'tr' }: Props) {
  const { ui } = useUiSection('ui_become_consultant', locale as any);

  return (
    <section
      data-header-overlay="true"
      className="relative overflow-hidden"
      style={{ minHeight: 480 }}
    >
      {/* Background image */}
      <Image
        src="/images/banner-become-consultant-bg.png"
        alt={ui('ui_become_consultant_hero_alt', 'Become a Consultant')}
        fill
        sizes="100vw"
        className="object-cover object-right-center"
        priority
      />

      {/* Contrast layers for text readability on the dark image. */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/20" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />

      {/* Decorative golden glow */}
      <div
        className="absolute right-[20%] top-1/2 -translate-y-1/2 h-96 w-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)' }}
      />

      {/* Animated star particles */}
      <span className="absolute top-16 left-[42%] w-1.5 h-1.5 rounded-full bg-amber-300/70 animate-ping" style={{ animationDuration: '2.8s' }} />
      <span className="absolute top-1/3 left-[55%] w-1 h-1 rounded-full bg-purple-300/60 animate-ping" style={{ animationDuration: '3.5s' }} />
      <Star size={8} className="absolute bottom-20 left-[48%] text-amber-300/40 fill-amber-300/30 animate-pulse" style={{ animationDuration: '4s' }} />

      {/* Gold accent line top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

      <div className="relative z-10 w-full max-w-[1300px] mx-auto px-6 py-24 md:py-32 lg:py-36">
        <div className="max-w-2xl">
          {/* Breadcrumb stays white for contrast on the dark hero. */}
          <div className="flex items-center gap-2 mb-8 text-[10px] font-bold uppercase tracking-[0.24em]">
            <Link
              href={`/${locale}`}
              className="text-white/40 hover:text-amber-300/90 transition-colors no-underline"
            >
              {ui('ui_become_consultant_hero_home', 'Home')}
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-amber-400/90">{ui('ui_become_consultant_hero_current', 'Become a Consultant')}</span>
          </div>

          {/* Badge */}
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300 mb-8 backdrop-blur-sm">
            <Sparkles size={10} />
            {ui('ui_become_consultant_hero_badge', 'CAREER OPPORTUNITY')}
          </span>

          <h1 className="font-display text-4xl font-light leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl mb-6">
            {ui('ui_become_consultant_hero_h1_prefix', 'Share Your Wisdom,')}{' '}
            <span className="text-amber-400 italic font-serif">
              {ui('ui_become_consultant_hero_h1_accent', 'Become a Consultant')}
            </span>
          </h1>

          <p className="font-serif italic text-white/65 text-lg leading-relaxed mb-10 max-w-xl">
            {ui('ui_become_consultant_hero_subtitle', 'Guide thousands on their spiritual journey. Set your own schedule and grow your income.')}
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-8 mb-10">
            {[
              { val: '500+', label: ui('ui_become_consultant_hero_stat_users', 'Active Users') },
              { val: '%70', label: ui('ui_become_consultant_hero_stat_share', 'Revenue Share') },
              { val: '48h', label: ui('ui_become_consultant_hero_stat_approval', 'Fast Approval') },
            ].map(({ val, label }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="font-display text-2xl font-semibold text-amber-400">{val}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</span>
              </div>
            ))}
          </div>

          {/* CTA button */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="#basvuru-formu"
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-8 py-3.5 text-xs font-bold uppercase tracking-[0.22em] text-[#0D0B1E] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(212,175,55,0.5)]"
            >
              {ui('ui_become_consultant_hero_apply', 'Apply Now')}
              <ChevronRight size={14} />
            </Link>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40">
              <ShieldCheck size={13} className="text-emerald-400/70" />
              {ui('ui_become_consultant_hero_review_note', 'Applications reviewed within 48h')}
            </span>
          </div>
        </div>
      </div>

      {/* Gold accent line bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/25 to-transparent" />
    </section>
  );
}
