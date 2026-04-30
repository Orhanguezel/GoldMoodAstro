'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Crown, ArrowRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Premium Membership Banner component.
 * Features a luxurious, high-end design for the premium subscription CTA.
 */
export default function PremiumMembershipBanner({ locale = 'tr' }: { locale?: string }) {
  const isTr = locale === 'tr';
  
  const content = {
    title: isTr ? 'Premium ile Sınırsız' : 'Unlimited with Premium',
    subtitle: isTr ? 'Aylık ₺149 — istediğin zaman iptal.' : 'TRY 149/mo — cancel anytime.',
    cta: isTr ? 'Önerilen Plan' : 'Recommended Plan'
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <div 
        className={cn(
          "group relative overflow-hidden rounded-[2.5rem] bg-[#1A1715] shadow-2xl transition-all duration-500 hover:shadow-[0_20px_80px_-20px_rgba(201,169,97,0.4)]",
          "h-[340px] md:h-[260px] lg:h-[280px] border border-white/5"
        )}
      >
        {/* Luxurious Background Elements */}
        <div className="absolute inset-0 z-0">
          {/* Subtle vignette/gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-r from-[#1A1715] via-[#1A1715]/60 to-transparent z-10" />
          
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
            <div className="p-1.5 rounded-md bg-(--gm-gold) text-[#1A1715]">
              <Crown size={12} fill="currentColor" />
            </div>
            <span className="font-display text-[10px] tracking-[0.4em] uppercase text-(--gm-gold-light)">
              {isTr ? 'Ayrıcalıklı Deneyim' : 'Exclusive Experience'}
            </span>
          </div>

          {/* Title */}
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-white leading-tight mb-3 tracking-wide">
            {content.title.split(' ').map((word, i) => (
              <span key={i} className={word.toLowerCase() === 'premium' ? "text-(--gm-gold) drop-shadow-[0_0_15px_rgba(201,169,97,0.5)]" : ""}>
                {word}{' '}
              </span>
            ))}
          </h2>

          {/* Subtitle */}
          <p className="font-serif italic text-base md:text-lg text-white/60 mb-8 max-w-sm">
            {content.subtitle}
          </p>

          {/* CTA Button */}
          <Link 
            href="/pricing" 
            className="inline-flex items-center gap-3 w-fit bg-(--gm-gold) hover:bg-(--gm-gold-light) text-[#1A1715] px-10 py-4 rounded-full transition-all duration-300 transform group-hover:translate-y-[-2px] shadow-[0_10px_30px_-5px_rgba(201,169,97,0.4)] group/btn"
          >
            <Zap size={18} fill="currentColor" />
            <span className="font-semibold tracking-[0.15em] uppercase text-xs">{content.cta}</span>
            <ArrowRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </div>

        {/* Bottom Left Detail */}
        <div className="absolute bottom-6 left-8 md:left-16 flex items-center gap-4 opacity-30">
          <div className="h-px w-12 bg-white/40" />
          <span className="font-display text-[8px] tracking-[0.5em] uppercase text-white/40">
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
