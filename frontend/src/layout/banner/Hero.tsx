'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { useListSlidersQuery } from '@/integrations/rtk/hooks';
import type { SliderPublicDto } from '@/integrations/shared';
import { toCdnSrc, excerpt, localizePath } from '@/integrations/shared';

import { useResolvedLocale, useUiSection } from '@/i18n';

type HeroSlide = {
  id: string;
  title: string;
  desc: string;
  src: string;
  alt: string;
  buttonText?: string;
  buttonLink?: string;
};

const FALLBACK_HERO_IMAGE = '/img/hero-bg.png';

const FALLBACKS: Record<string, { title: string; desc: string; cta: string; ctaSecondary: string; badge: string }> = {
  de: {
    title: 'Ihr Weg zur inneren Klarheit',
    desc: 'Verbinden Sie sich mit erfahrenen Astrologen, Tarot-Lesern und Life-Coaches — für tiefe Einblicke und persönliche Führung.',
    cta: 'Berater Entdecken',
    ctaSecondary: 'Mehr Erfahren',
    badge: 'Astroloji · Tarot · Numeroloji',
  },
  en: {
    title: 'Find clarity through the cosmos',
    desc: 'Connect with expert astrologers, tarot readers, and life coaches for deep insights and personal guidance.',
    cta: 'Find a Consultant',
    ctaSecondary: 'Learn More',
    badge: 'Astrology · Tarot · Numerology',
  },
  tr: {
    title: 'Evreni okuyun, hayatı anlayın',
    desc: 'Uzman astrologlar, tarot okuyucuları ve yaşam koçlarıyla bağlantı kurun — derin içgörüler ve kişisel rehberlik için.',
    cta: 'Danışman Bul',
    ctaSecondary: 'Daha Fazla',
    badge: 'Astroloji · Tarot · Numeroloji',
  },
};

const Hero: React.FC<{ locale?: string }> = ({ locale: explicitLocale }) => {
  const locale = useResolvedLocale(explicitLocale);
  const { ui } = useUiSection('ui_hero', locale);
  const fb = FALLBACKS[locale || 'tr'] || FALLBACKS.de;

  const { data: sliderList, isLoading: slidersLoading } = useListSlidersQuery({
    locale, limit: 6, sort: 'display_order', order: 'asc',
  });

  const slides: HeroSlide[] = useMemo(() => {
    const list: SliderPublicDto[] = Array.isArray(sliderList) ? sliderList : [];
    return list.filter((s) => s.isActive).map<HeroSlide>((s) => {
      const rawImage = (s.image || '').trim();
      const cdn = rawImage ? toCdnSrc(rawImage, 1920, 1080, 'fill') : '';
      return {
        id: s.id,
        title: (s.title || '').trim(),
        desc: excerpt(s.description || '', 260),
        src: cdn || rawImage || FALLBACK_HERO_IMAGE,
        alt: s.alt || s.title || 'hero slide',
        buttonText: (s.buttonText || '').trim() || undefined,
        buttonLink: (s.buttonLink || '').trim() || undefined,
      };
    });
  }, [sliderList]);

  const hasSlides = slides.length > 0;
  const [activeIdx, setActiveIdx] = useState(0);
  const current = slides[activeIdx] || slides[0];

  useEffect(() => {
    if (!hasSlides || slides.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [hasSlides, slides.length]);

  const heroTitle = (current?.title || '').trim() || ui('ui_hero_title_fallback', fb.title);
  const heroDesc = (current?.desc || '').trim() || ui('ui_hero_desc_fallback', fb.desc);
  const ctaText = (current?.buttonText || '').trim() || ui('ui_hero_cta', fb.cta).trim() || fb.cta;
  const ctaSecondary = ui('ui_hero_cta_secondary', fb.ctaSecondary);
  const badgeText = ui('ui_hero_badge', fb.badge);

  const rawLink = current?.buttonLink || '/consultants';
  const ctaHref = localizePath(locale, rawLink.startsWith('/') ? rawLink : `/${rawLink}`);
  const secondaryHref = localizePath(locale, '/about');

  const heroSrc = current?.src || FALLBACK_HERO_IMAGE;
  const heroAlt = current?.alt || 'GoldMoodAstro';

  return (
    <section
      data-header-overlay="true"
      className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={heroSrc}
          alt={heroAlt}
          fill
          priority
          fetchPriority="high"
          quality={65}
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: 'linear-gradient(180deg, rgba(12,11,9,0.5) 0%, rgba(12,11,9,0.3) 40%, rgba(12,11,9,0.6) 70%, rgba(12,11,9,0.95) 100%)',
        }}
      />

      {/* Grain Texture */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-[3] text-center px-8 max-w-[800px]">
        {/* Badge */}
        <div className="hero-fade-up hero-fade-up-1 inline-flex items-center gap-2.5 px-6 py-2 border border-border-hover mb-10 text-[0.72rem] tracking-[0.25em] uppercase text-brand-primary">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-primary dot-pulse" />
          {badgeText}
        </div>

        {/* Title */}
        <h1 className="hero-fade-up hero-fade-up-2 font-serif text-[clamp(2.8rem,6vw,5.5rem)] font-light leading-[1.1] tracking-[-0.01em] mb-6 text-sand-50">
          {heroTitle}
        </h1>

        {/* Subtitle */}
        <p className="hero-fade-up hero-fade-up-3 text-[1.05rem] text-sand-300 max-w-[520px] mx-auto mb-11 font-light leading-[1.8]">
          {heroDesc}
        </p>

        {/* Buttons */}
        <div className="hero-fade-up hero-fade-up-4 flex gap-4 justify-center flex-wrap">
          <Link href={ctaHref} className="btn-premium">
            <span>{ctaText}</span>
          </Link>
          <Link href={secondaryHref} className="btn-outline-premium">
            {ctaSecondary}
          </Link>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="hero-fade-up absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 text-text-muted text-[0.65rem] tracking-[0.2em] uppercase z-[3]" style={{ animationDelay: '1.5s' }}>
        <span>Scroll</span>
        <div
          className="w-px h-[50px]"
          style={{
            background: 'linear-gradient(to bottom, var(--color-gold-400), transparent)',
            animation: 'scrollLine 2s ease-in-out infinite',
          }}
        />
      </div>
    </section>
  );
};

export default Hero;
