'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Compass, Stars } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * WelcomePremiumBanner component.
 * A grand, wide-format banner that establishes the brand's premium identity.
 */
export default function WelcomePremiumBanner({ locale = 'tr' }: { locale?: string }) {
  const isTr = locale === 'tr';
  
  const content = {
    title: isTr ? "GoldMoodAstro'ya Hoş Geldiniz" : "Welcome to GoldMoodAstro",
    subtitle: isTr ? "Yıldızlarla tanışan modern astroloji." : "Modern astrology meets the stars.",
    cta: isTr ? "Danışmanları Keşfet" : "Discover Consultants"
  };

  return (
    <section className="container mx-auto px-4 py-12">
      <div 
        className={cn(
          "group relative overflow-hidden rounded-[3rem] bg-(--gm-bg-deep) shadow-3xl transition-all duration-700 hover:shadow-[0_30px_100px_-20px_rgba(201,169,97,0.35)]",
          "min-h-[450px] md:min-h-[400px] lg:min-h-[420px] border border-(--gm-border-soft)"
        )}
      >
        {/* Grand Background Image — image önce, overlay üstüne (image görünür kalır) */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/images/banners/welcome-premium-banner-bg.png"
            alt="Mystical Observatory"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center transition-transform duration-[10s] group-hover:scale-110"
          />
          {/* Sol → sağ tema-aware gradient overlay (text okunsun ama image kaybolmasın) */}
          <div className="absolute inset-0 z-10 bg-linear-to-r from-(--gm-bg-deep)/85 via-(--gm-bg-deep)/30 to-transparent" />
          {/* Alt vignette — text bölgesinde extra kontrast */}
          <div className="absolute bottom-0 left-0 w-full h-1/3 bg-linear-to-t from-(--gm-bg-deep)/60 to-transparent z-15" />
        </div>

        {/* Floating Mystical Accents */}
        <div className="absolute top-[10%] right-[20%] w-64 h-64 bg-(--gm-gold)/10 blur-[120px] rounded-full animate-pulse z-0" />

        {/* Content Box - Glassmorphism styled */}
        <div className="relative z-20 h-full flex flex-col justify-center px-8 md:px-20 lg:px-32 max-w-4xl py-12">
          {/* Brand Mark */}
          <div className="flex items-center gap-3 mb-6 animate-[fadeIn_1s_ease-out_forwards]">
            <div className="w-12 h-[1px] bg-(--gm-gold-deep)" />
            <Compass size={16} className="text-(--gm-gold) animate-spin-slow" />
            <span className="font-display text-[12px] tracking-[0.5em] uppercase text-(--gm-gold-light)">
              {isTr ? 'Geleceği Keşfet' : 'Explore the Future'}
            </span>
            <div className="w-12 h-[1px] bg-(--gm-gold-deep)" />
          </div>

          {/* Title - Large & Elegant */}
          <h2 className="font-display text-4xl md:text-5xl lg:text-7xl text-white leading-[1.1] mb-6 tracking-tight drop-shadow-lg">
            {content.title.split(' ').map((word, i) => (
              <span key={i} className={i === 0 ? "text-(--gm-gold)" : ""}>
                {word}{' '}
              </span>
            ))}
          </h2>

          {/* Subtitle - Italic & Refined */}
          <p className="font-serif italic text-lg md:text-xl lg:text-2xl text-white/80 mb-12 max-w-xl leading-relaxed">
            {content.subtitle}
          </p>

          {/* CTA Buttons - Premium Dual Set */}
          <div className="flex flex-col sm:flex-row gap-6">
            <Link 
              href="/consultants" 
              className="inline-flex items-center justify-center gap-3 btn-premium px-12 py-5 shadow-gold group/btn text-sm"
            >
              <Stars size={18} fill="currentColor" />
              <span className="font-bold tracking-[0.2em] uppercase">{content.cta}</span>
              <ArrowRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
            </Link>
            
            <Link 
              href="/about" 
              className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full border border-white/20 text-white/90 backdrop-blur-md hover:bg-white/10 transition-all duration-300 text-sm tracking-[0.15em] uppercase font-medium"
            >
              {isTr ? 'Hikayemiz' : 'Our Story'}
            </Link>
          </div>
        </div>

        {/* Corner Detail */}
        <div className="absolute bottom-8 right-12 hidden md:block opacity-40">
          <div className="flex flex-col items-end gap-2">
            <div className="font-display text-[10px] tracking-[0.6em] uppercase text-white/60">
              GoldMoodAstro ✦ 2026
            </div>
            <div className="h-px w-32 bg-linear-to-l from-white/60 to-transparent" />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-spin-slow {
          animation: spin 12s linear infinite;
        }
      `}</style>
    </section>
  );
}
