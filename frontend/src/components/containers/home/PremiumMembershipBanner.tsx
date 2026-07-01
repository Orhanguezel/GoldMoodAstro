'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Crown, ArrowRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiSection } from '@/i18n';

/**
 * Premium Membership Banner component.
 * Features a luxurious, high-end design for the premium subscription CTA.
 */
export default function PremiumMembershipBanner({ locale = 'tr' }: { locale?: string }) {
  const isTr = locale === 'tr';
  const { ui } = useUiSection('ui_extra' as any);

  const content = {
    title: ui('ui_extra_b4_premium_banner_title', 'Unlimited with Premium'),
    subtitle: ui('ui_extra_b4_premium_banner_subtitle', 'Monthly TRY 149, cancel anytime.'),
    cta: ui('ui_extra_b4_premium_banner_cta', 'Recommended Plan')
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <div 
        className={cn(
          "group relative overflow-hidden rounded-[2.5rem] bg-(--gm-bg-deep) shadow-2xl transition-all duration-500 hover:shadow-[0_20px_80px_-20px_rgba(201,169,97,0.4)]",
          "h-[340px] md:h-[260px] lg:h-[280px] border border-[var(--gm-border-soft)]"
        )}
      >
        {/* Luxurious Background Elements */}
        <div className="absolute inset-0 z-0">
          {/* Subtle vignette/gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-r from-(--gm-bg-deep) via-(--gm-bg-deep)/80 to-transparent z-10" />
          
          <Image
            src="/assets/images/banners/premium-membership-banner-bg.png" 
            alt="Premium Star Emblem" 
            fill
            sizes="(max-width: 768px) 90vw, 50vw"
            className="object-contain object-right opacity-80 transition-transform duration-[3s] group-hover:scale-105 group-hover:rotate-3"
          />
        </div>

        {/* Dynamic Light Rays */}
        <div className="absolute top-0 right-0 w-[50%] h-full bg-linear-to-l from-(--gm-gold)/10 to-transparent pointer-events-none z-0" />

        {/* Content Box */}
        <div className="relative z-20 h-full flex flex-col justify-center px-8 md:px-16 lg:px-24 max-w-2xl">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-4 animate-[slideIn_0.7s_ease-out_forwards]">
            <div className="p-1.5 rounded-md bg-[var(--gm-gold)] text-amber-950">
              <Crown size={12} fill="currentColor" />
            </div>
            <span className="font-display text-[10px] tracking-[0.4em] uppercase text-[var(--gm-gold-deep)] font-bold">
              {ui('ui_extra_b4_premium_banner_badge', 'Premium Experience')}
            </span>
          </div>

          {/* Title */}
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-[var(--gm-text)] leading-tight mb-3 tracking-wide">
            {content.title.split(' ').map((word, i) => (
              <span key={i} className={word.toLowerCase() === 'premium' ? "text-[var(--gm-gold-deep)] font-semibold drop-shadow-[0_0_15px_rgba(201,169,97,0.3)]" : "font-normal"}>
                {word}{' '}
              </span>
            ))}
          </h2>

          {/* Subtitle */}
          <p className="font-serif italic text-base md:text-lg text-[var(--gm-text)]/80 mb-8 max-w-sm">
            {content.subtitle}
          </p>

          {/* CTA Button */}
          <Link 
            href="/pricing" 
            className="inline-flex items-center gap-3 w-fit bg-[var(--gm-gold)] hover:bg-[var(--gm-gold-deep)] text-amber-950 px-10 py-4 rounded-full transition-all duration-300 transform group-hover:translate-y-[-2px] shadow-[0_10px_30px_-5px_rgba(201,169,97,0.4)] group/btn"
          >
            <Zap size={18} fill="currentColor" />
            <span className="font-bold tracking-[0.15em] uppercase text-xs">{content.cta}</span>
            <ArrowRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </div>

        {/* Bottom Left Detail */}
        <div className="absolute bottom-6 left-8 md:left-16 flex items-center gap-4 opacity-40">
          <div className="h-px w-12 bg-[var(--gm-text)]/40" />
          <span className="font-display text-[8px] tracking-[0.5em] uppercase text-[var(--gm-text)]/60 font-semibold">
            GoldMood Elite
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
