'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Gift, Sparkle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Premium FirstSessionDiscountBanner component.
 * A warm, welcoming design to convert new users with a special discount.
 */
export default function FirstSessionDiscountBanner({ locale = 'tr' }: { locale?: string }) {
  const isTr = locale === 'tr';
  
  const content = {
    title: isTr ? 'İlk Seansa Özel İndirim' : 'First Session Special',
    subtitle: isTr ? 'Yeni üyelere %20 — danışmanını seç.' : '20% off for new members — pick your expert.',
    cta: isTr ? 'Hemen Başla' : 'Start Now'
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <div 
        className={cn(
          "group relative overflow-hidden rounded-[2.5rem] bg-(--gm-bg) border border-(--gm-border-soft) shadow-xl transition-all duration-500 hover:shadow-[0_20px_50px_-10px_rgba(201,169,97,0.2)]",
          "h-[340px] md:h-[260px] lg:h-[280px]"
        )}
      >
        {/* Cinematic Background Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-linear-to-r from-(--gm-bg) via-(--gm-bg)/70 to-transparent z-10" />
          <Image
            src="/assets/images/banners/first-session-discount-banner-bg.png" 
            alt="Mystical Compass & Crystals" 
            fill
            sizes="(max-width: 768px) 100vw, 65vw"
            className="object-cover object-center transition-transform duration-[4s] group-hover:scale-105 md:left-auto md:w-[65%]"
          />
        </div>

        {/* Ambient Glows */}
        <div className="absolute top-[20%] right-[30%] w-48 h-48 bg-(--gm-gold)/15 blur-3xl rounded-full animate-pulse z-0" />

        {/* Content Box */}
        <div className="relative z-20 h-full flex flex-col justify-center px-8 md:px-16 lg:px-24 max-w-2xl">
          {/* Eyebrow / Badge */}
          <div className="flex items-center gap-3 mb-5 animate-[fadeIn_0.8s_ease-out_forwards]">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-(--gm-bg-deep) border border-(--gm-gold-light) text-(--gm-gold-deep) shadow-sm">
              <Gift size={18} />
            </div>
            <span className="font-display text-[11px] tracking-[0.3em] uppercase text-(--gm-gold-deep) font-semibold">
              {isTr ? 'Hoş Geldin Hediyesi' : 'Welcome Gift'}
            </span>
          </div>

          {/* Title and Discount Badge */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-3">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-(--gm-text) leading-tight tracking-tight">
              {content.title}
            </h2>
            
            {/* Premium %20 Badge */}
            <div className="hidden md:flex items-center justify-center bg-(--gm-gold) text-(--gm-bg-deep) px-4 py-1.5 rounded-full rotate-3 shadow-md border border-(--gm-gold-light)">
              <span className="font-display text-lg font-bold tracking-tighter">%20</span>
              <span className="text-[10px] ml-1 font-bold uppercase tracking-wider">{isTr ? 'İNDİRİM' : 'OFF'}</span>
            </div>
          </div>

          {/* Subtitle */}
          <p className="font-serif italic text-base md:text-lg text-(--gm-text-dim) mb-8 max-w-md opacity-80">
            {content.subtitle}
          </p>

          {/* CTA Button */}
          <Link 
            href="/consultants" 
            className="inline-flex items-center gap-3 w-fit btn-premium px-10 py-4 shadow-soft group/btn"
          >
            <span className="font-semibold tracking-[0.12em] uppercase text-xs">{content.cta}</span>
            <ArrowRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </div>

        {/* Floating Mystical Detail */}
        <div className="absolute top-8 right-8 pointer-events-none opacity-40">
          <Sparkle size={24} className="text-(--gm-gold-light) animate-spin-slow" />
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}
