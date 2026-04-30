'use client';

import React from 'react';
import Image from 'next/image';
import { Smartphone, Apple, Play, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * AppDownloadSection component.
 * Premium section to drive mobile app installs with a sophisticated visual style.
 */
export default function AppDownloadSection({ locale = 'tr' }: { locale?: string }) {
  const isTr = locale === 'tr';
  
  const content = {
    title: isTr ? 'Cebinizdeki Yıldız Rehberi' : 'Your Star Guide in Your Pocket',
    subtitle: isTr ? 'GoldMoodAstro mobil uygulamasıyla dilediğiniz her yerden canlı danışmanlık alın, bildirimlerle hiçbir gökyüzü olayını kaçırmayın.' : 'Get live consultancy from anywhere with the GoldMoodAstro mobile app, and never miss any celestial events with instant notifications.',
    appleText: isTr ? "App Store'dan İndir" : "Download on App Store",
    googleText: isTr ? "Google Play'den Al" : "Get it on Google Play",
    qrLabel: isTr ? 'Hemen Tara' : 'Scan Now'
  };

  return (
    <section className="container mx-auto px-4 py-16">
      <div 
        className={cn(
          "relative overflow-hidden rounded-[3rem] bg-[#1A1715] border border-white/5 shadow-3xl",
          "min-h-[500px] md:min-h-[450px] lg:min-h-[480px] flex flex-col md:flex-row items-center"
        )}
      >
        {/* Cinematic Background Image (Right Side) */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-linear-to-r from-[#1A1715] via-[#1A1715]/90 to-transparent z-10 md:block hidden" />
          <div className="absolute inset-0 bg-linear-to-b from-[#1A1715]/40 to-[#1A1715] z-10 md:hidden" />
          
          <Image
            src="/assets/images/banners/app-download-bg.png" 
            alt="Mobile App Experience" 
            fill
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-cover object-center opacity-90 md:left-auto md:w-[60%]"
          />
        </div>

        {/* Content Box */}
        <div className="relative z-20 w-full md:w-[60%] px-8 md:px-16 lg:px-24 py-16 flex flex-col justify-center">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-full bg-(--gm-gold)/10 text-(--gm-gold)">
              <Smartphone size={18} className="animate-bounce" />
            </div>
            <span className="font-display text-[11px] tracking-[0.4em] uppercase text-(--gm-gold-light)">
              {isTr ? 'Mobil Uygulama' : 'Mobile App'}
            </span>
          </div>

          {/* Title */}
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-6 tracking-tight">
            {content.title}
          </h2>

          {/* Subtitle */}
          <p className="font-serif italic text-lg md:text-xl text-white/85 mb-12 max-w-lg leading-relaxed">
            {content.subtitle}
          </p>

          {/* Download Buttons Set */}
          <div className="flex flex-wrap gap-5 mb-10">
            {/* Apple Store */}
            <a 
              href="#" 
              className="flex items-center gap-4 bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur-md px-6 py-3 rounded-2xl transition-all duration-300 group"
            >
              <Apple size={32} className="text-white" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase tracking-wider text-white/50 leading-none mb-1">Download on</span>
                <span className="text-lg font-semibold text-white leading-none">App Store</span>
              </div>
            </a>

            {/* Play Store */}
            <a 
              href="#" 
              className="flex items-center gap-4 bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur-md px-6 py-3 rounded-2xl transition-all duration-300 group"
            >
              <Play size={28} fill="white" className="text-white" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase tracking-wider text-white/50 leading-none mb-1">Get it on</span>
                <span className="text-lg font-semibold text-white leading-none">Google Play</span>
              </div>
            </a>
          </div>

          {/* QR Code / Web to App conversion */}
          <div className="flex items-center gap-4 opacity-80 hover:opacity-100 transition-opacity duration-300 group/qr cursor-help">
            <div className="p-3 bg-white/10 rounded-xl border border-white/20 group-hover/qr:border-(--gm-gold)/40 transition-colors">
              <QrCode size={48} className="text-white/70 group-hover/qr:text-(--gm-gold-light)" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-[10px] tracking-[0.2em] uppercase text-white/60">{content.qrLabel}</span>
              <span className="text-xs text-white/40">{isTr ? 'Kameranı aç ve okut' : 'Open camera to scan'}</span>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-(--gm-gold)/5 blur-[100px] rounded-full pointer-events-none" />
      </div>
    </section>
  );
}
