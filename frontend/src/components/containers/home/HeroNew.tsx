/**
 * HeroNew — Premium full-screen hero with real photographic background.
 * Replaces the vector/CSS-only version. Keep HeroNew.legacy.tsx as fallback.
 *
 * Architecture:
 *   • HeroNew (Server Component) — renders static shell + imports dynamic islands
 *   • HeroTrustCards (Client) — floating cards with real consultant data + avatars
 *   • HeroStats (Client) — bottom stats from live API
 *
 * Contrast strategy: all text = fixed white/amber (no theme vars).
 * Works in both light and dark themes because the dark image fills the section.
 */
import React, { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import HeroTrustCards from './HeroTrustCards';
import HeroStats from './HeroStats';
import HeroCTAs from './HeroCTAs';

const COPY = {
  tr: {
    eyebrow: 'Ruhsal Rehberlik',
    headline: ['Meet the stars through', 'modern astrology'],
    tagline:
      'Personal readings shaped by your birth chart and the option to connect with a real astrologer.',
    primaryCTA: 'Explore Consultants',
    secondaryCTA: 'Create Your Chart',
    scrollHint: 'Scroll Down',
  },
  en: {
    eyebrow: 'Spiritual Guidance',
    headline: ['Modern astrology', 'meets the stars'],
    tagline:
      'Personal readings fed by your birth chart and the option to connect to a real astrologer whenever you want.',
    primaryCTA: 'Explore Consultants',
    secondaryCTA: 'Get Your Chart',
    scrollHint: 'Scroll Down',
  },
};

/* Fallback skeletons for Suspense boundaries */
function TrustCardsSkeleton() {
  return (
    <div className="flex flex-col gap-4 w-64">
      <div className="h-40 rounded-2xl bg-white/5 animate-pulse backdrop-blur-xl border border-white/10" />
      <div className="h-20 rounded-2xl bg-white/5 animate-pulse backdrop-blur-xl border border-white/10" />
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="flex flex-wrap gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 w-28 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
      ))}
    </div>
  );
}

export default function HeroNew({ locale = 'tr' }: { locale?: string }) {
  const isTr = locale === 'tr';
  const copy = COPY[isTr ? 'tr' : 'en'];

  const ctaHref = `/${locale}/consultants`;
  const secondaryHref = `/${locale}/birth-chart`;

  return (
    <section
      data-header-overlay="true"
      className="relative min-h-screen flex flex-col overflow-hidden"
    >
      {/* ── Background Image ──────────────────────────────────────── */}
      <Image
        src="/images/hero-bg-main.png"
        alt="GoldMoodAstro hero"
        fill
        sizes="100vw"
        className="object-cover object-center"
        priority
        quality={90}
      />

      {/* ── Gradient Overlays ─────────────────────────────────────── */}
      {/* Left heavy: text area always readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20" />
      {/* Top: header always readable in both light + dark */}
      <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/75 to-transparent" />
      {/* Bottom: page transition */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent" />

      {/* ── Decorative Particles ──────────────────────────────────── */}
      <span
        className="absolute top-[18%] left-[38%] w-2 h-2 rounded-full bg-amber-300/70 animate-ping"
        style={{ animationDuration: '2.6s' }}
      />
      <span
        className="absolute top-[55%] left-[42%] w-1 h-1 rounded-full bg-purple-300/60 animate-ping"
        style={{ animationDuration: '3.4s' }}
      />
      <span
        className="absolute top-[30%] left-[28%] w-1.5 h-1.5 rounded-full bg-amber-200/50 animate-ping"
        style={{ animationDuration: '4.1s' }}
      />

      {/* ── Top accent line ───────────────────────────────────────── */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

      {/* ── Main Layout ───────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-1 flex-col lg:flex-row lg:items-center gap-12 px-6 pt-36 pb-20 sm:px-12 lg:px-20 max-w-[1400px] mx-auto w-full">

        {/* Left: text content */}
        <div className="flex-1 flex flex-col">
          {/* Eyebrow badge */}
          <div className="hero-fade-up mb-8 flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-amber-300 backdrop-blur-sm">
              <Sparkles size={10} className="animate-pulse" />
              {copy.eyebrow}
            </span>
          </div>

          {/* Brand name */}
          <div className="hero-fade-up hero-fade-up-1 mb-4">
            <h1
              className="font-display leading-[0.88] tracking-[0.12em] filter drop-shadow-[0_0_40px_rgba(212,175,55,0.4)]"
              style={{ fontSize: 'clamp(4rem,10vw,9rem)' }}
            >
              <span
                className="block bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, #F5E6C8 0%, #D4AF37 45%, #9B7EC8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                GOLD
              </span>
              <span
                className="block bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, #D4AF37 0%, #F5E6C8 60%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                MOOD
              </span>
            </h1>
            <div className="mt-3 flex items-center gap-3 text-amber-300/70">
              <div className="h-px w-10 bg-amber-400/50" />
              <span className="font-display text-[11px] tracking-[0.55em] uppercase">ASTROLOGY</span>
              <div className="h-px w-10 bg-amber-400/50" />
            </div>
          </div>

          {/* Headline */}
          <h2
            className="hero-fade-up hero-fade-up-2 font-serif font-light text-white leading-[1.2] max-w-xl mb-6"
            style={{ fontSize: 'clamp(1.6rem,3vw,2.8rem)' }}
          >
            {copy.headline[0]}
            <br />
            <em className="not-italic text-amber-400">{copy.headline[1]}</em>
          </h2>

          {/* Tagline */}
          <p
            className="hero-fade-up hero-fade-up-3 font-serif italic text-white/60 max-w-md leading-relaxed mb-10"
            style={{ fontSize: 'clamp(1rem,1.3vw,1.1rem)' }}
          >
            {copy.tagline}
          </p>

          {/* CTA buttons */}
          <HeroCTAs 
            locale={locale} 
            primaryCTA={copy.primaryCTA} 
            secondaryCTA={copy.secondaryCTA}
            ctaHref={ctaHref}
            secondaryHref={secondaryHref}
          />

          {/* Dynamic stats row */}
          <Suspense fallback={<StatsSkeleton />}>
            <HeroStats locale={locale} />
          </Suspense>
        </div>

        {/* Right: floating dynamic trust cards — only on xl screens */}
        <div className="hidden xl:block shrink-0">
          <Suspense fallback={<TrustCardsSkeleton />}>
            <HeroTrustCards locale={locale} />
          </Suspense>
        </div>
      </div>

      {/* ── Scroll indicator ──────────────────────────────────────── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3 text-white/30">
        <span className="font-display text-[9px] tracking-[0.5em] uppercase animate-pulse">
          {copy.scrollHint}
        </span>
        <div className="relative w-px h-12 bg-gradient-to-b from-amber-400/40 to-transparent overflow-hidden">
          <div
            className="absolute top-0 w-full bg-amber-400 animate-[scrollLine_2s_ease-in-out_infinite]"
            style={{ height: '50%' }}
          />
        </div>
      </div>

      {/* ── Bottom accent line ────────────────────────────────────── */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
    </section>
  );
}
