'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Premium BirthChartBanner component.
 * Replaces the generic banner with a high-end, realistic visual experience.
 */
export default function BirthChartBanner({ locale = 'tr' }: { locale?: string }) {
  const isTr = locale === 'tr';
  
  const content = {
    title: isTr ? 'Doğum Haritan Hazır' : 'Your Birth Chart is Ready',
    subtitle: isTr ? 'Saniyeler içinde detaylı analiz.' : 'Detailed analysis in seconds.',
    cta: isTr ? 'Haritamı Oluştur' : 'Generate My Chart'
  };

  return (
    <section className="container mx-auto px-4 py-12">
      <div 
        className={cn(
          "group relative overflow-hidden rounded-[2rem] border border-(--gm-border-soft) bg-(--gm-bg-deep) shadow-2xl transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(201,169,97,0.3)]",
          "h-[320px] md:h-[280px] lg:h-[300px]"
        )}
      >
        {/* Realistic Background Image - Positioned to the right */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-linear-to-r from-(--gm-bg-deep) via-(--gm-bg-deep)/80 to-transparent z-10" />
          <Image
            src="/assets/images/banners/birth-chart-banner-bg.png" 
            alt="Mystical Birth Chart" 
            fill
            sizes="(max-width: 768px) 100vw, 70vw"
            className="object-cover object-center transition-transform duration-[2s] group-hover:scale-110 md:left-auto md:w-[70%]"
          />
        </div>

        {/* Floating Accents */}
        <div className="absolute top-10 right-[15%] w-32 h-32 bg-(--gm-gold)/10 blur-3xl rounded-full animate-pulse z-0" />

        {/* Content Box */}
        <div className="relative z-20 h-full flex flex-col justify-center px-8 md:px-16 max-w-2xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-4 animate-[fadeIn_0.8s_ease-out_forwards]">
            <Sparkles size={14} className="text-(--gm-gold) animate-pulse" />
            <span className="font-display text-[10px] tracking-[0.4em] uppercase text-(--gm-gold-deep)">
              {isTr ? 'Kişisel Analiz' : 'Personal Analysis'}
            </span>
          </div>

          {/* Title */}
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-(--gm-text) leading-tight mb-4 tracking-wide">
            {content.title.split(' ').map((word, i) => (
              <span key={i} className={i === 2 ? "text-(--gm-gold) italic font-serif lowercase" : ""}>
                {word}{' '}
              </span>
            ))}
          </h2>

          {/* Subtitle */}
          <p className="font-serif italic text-base md:text-lg text-(--gm-text-dim) mb-8 opacity-80 max-w-md">
            {content.subtitle}
          </p>

          {/* CTA Button */}
          <Link 
            href="/birth-chart" 
            className="inline-flex items-center gap-3 w-fit btn-premium px-8 py-4 shadow-gold group/btn"
          >
            <span className="font-semibold tracking-[0.15em]">{content.cta}</span>
            <ArrowRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </div>

        {/* Decorative Corner Element */}
        <div className="absolute bottom-0 right-0 p-4 md:p-8 opacity-20 pointer-events-none">
          <svg width="120" height="120" viewBox="0 0 100 100" fill="none" className="rotate-slow">
            <circle cx="50" cy="50" r="45" stroke="var(--gm-gold)" strokeWidth="0.5" strokeDasharray="2 4" />
            <circle cx="50" cy="50" r="30" stroke="var(--gm-gold)" strokeWidth="0.2" />
          </svg>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </section>
  );
}
