/**
 * HeroNew — Premium full-screen hero with real photographic background.
 * Replaces the vector/CSS-only version. Keep HeroNew.legacy.tsx as fallback.
 *
 * Contrast strategy: all text = fixed white/amber (no theme vars).
 * Works in both light and dark themes because the image fills the section.
 */
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Star, Sparkles, Users, Award } from 'lucide-react';

const COPY = {
  tr: {
    eyebrow: 'Ruhsal Rehberlik',
    title: ['GOLD', 'MOOD'],
    subtitle: 'ASTROLOGY',
    headline: 'Yıldızlarla tanışan\nmodern astroloji',
    tagline:
      'Doğum haritanızdan beslenen kişisel yorumlar ve gerçek bir astrologa bağlanma seçeneği.',
    primaryCTA: 'Danışmanları Keşfet',
    secondaryCTA: 'Haritanı Çıkar',
    scrollHint: 'Aşağı Kaydır',
    stats: [
      { val: '500+', label: 'Aktif Kullanıcı' },
      { val: '20+', label: 'Uzman Danışman' },
      { val: '4.9★', label: 'Ortalama Puan' },
    ],
  },
  en: {
    eyebrow: 'Spiritual Guidance',
    title: ['GOLD', 'MOOD'],
    subtitle: 'ASTROLOGY',
    headline: 'Modern astrology\nmeets the stars',
    tagline:
      'Personal readings fed by your birth chart and the option to connect to a real astrologer whenever you want.',
    primaryCTA: 'Explore Consultants',
    secondaryCTA: 'Get Your Chart',
    scrollHint: 'Scroll Down',
    stats: [
      { val: '500+', label: 'Active Users' },
      { val: '20+', label: 'Expert Consultants' },
      { val: '4.9★', label: 'Average Rating' },
    ],
  },
};

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
      {/* Top: header always readable */}
      <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/75 to-transparent" />
      {/* Bottom: page transition */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent" />

      {/* ── Decorative Particles ──────────────────────────────────── */}
      <span className="absolute top-[18%] left-[38%] w-2 h-2 rounded-full bg-amber-300/70 animate-ping" style={{ animationDuration: '2.6s' }} />
      <span className="absolute top-[55%] left-[42%] w-1 h-1 rounded-full bg-purple-300/60 animate-ping" style={{ animationDuration: '3.4s' }} />
      <span className="absolute top-[30%] left-[28%] w-1.5 h-1.5 rounded-full bg-amber-200/50 animate-ping" style={{ animationDuration: '4.1s' }} />
      <Star size={10} className="absolute top-[22%] left-[52%] text-amber-300/40 fill-amber-300/30 animate-pulse" style={{ animationDuration: '3s' }} />
      <Star size={7} className="absolute top-[68%] left-[35%] text-purple-300/30 fill-purple-300/20 animate-pulse" style={{ animationDuration: '4.5s' }} />

      {/* ── Top accent line ───────────────────────────────────────── */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

      {/* ── Main Content ──────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-6 pt-36 pb-20 sm:px-12 lg:px-20 max-w-[1400px] mx-auto w-full">

        {/* Eyebrow badge */}
        <div className="hero-fade-up mb-8 flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-amber-300 backdrop-blur-sm">
            <Sparkles size={10} className="animate-pulse" />
            {copy.eyebrow}
          </span>
        </div>

        {/* Brand name */}
        <div className="hero-fade-up hero-fade-up-1 mb-4 max-w-2xl">
          <h1
            className="font-display leading-[0.88] tracking-[0.12em] filter drop-shadow-[0_0_40px_rgba(212,175,55,0.4)]"
            style={{ fontSize: 'clamp(4rem,12vw,10rem)' }}
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
              {copy.title[0]}
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
              {copy.title[1]}
            </span>
          </h1>
          <div className="mt-3 flex items-center gap-3 text-amber-300/70">
            <div className="h-px w-10 bg-amber-400/50" />
            <span className="font-display text-[11px] tracking-[0.55em] uppercase">{copy.subtitle}</span>
            <div className="h-px w-10 bg-amber-400/50" />
          </div>
        </div>

        {/* Headline */}
        <h2
          className="hero-fade-up hero-fade-up-2 font-serif font-light text-white leading-[1.2] max-w-xl mb-6"
          style={{ fontSize: 'clamp(1.6rem,3.5vw,3rem)' }}
        >
          {copy.headline.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {i === 1 ? <em className="not-italic text-amber-400">{line}</em> : line}
              {i === 0 && <br />}
            </React.Fragment>
          ))}
        </h2>

        {/* Tagline */}
        <p className="hero-fade-up hero-fade-up-3 font-serif italic text-white/60 max-w-md leading-relaxed mb-10" style={{ fontSize: 'clamp(1rem,1.3vw,1.15rem)' }}>
          {copy.tagline}
        </p>

        {/* CTA buttons */}
        <div className="hero-fade-up hero-fade-up-4 flex flex-col sm:flex-row gap-4 mb-16">
          <Link
            href={ctaHref}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-[#0D0B1E] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(212,175,55,0.6)] min-w-[220px]"
          >
            {copy.primaryCTA}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href={secondaryHref}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/8 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white/85 backdrop-blur-sm transition-all duration-300 hover:border-amber-400/50 hover:bg-white/12 hover:text-white min-w-[220px]"
          >
            {copy.secondaryCTA}
          </Link>
        </div>

        {/* Stats row — glassmorphism cards */}
        <div className="hero-fade-up flex flex-wrap gap-4">
          {copy.stats.map(({ val, label }) => (
            <div
              key={label}
              className="flex flex-col gap-0.5 rounded-2xl border border-white/10 bg-white/6 px-5 py-3 backdrop-blur-md"
            >
              <span className="font-display text-xl font-semibold text-amber-400">{val}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/45">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right side floating card (trust indicator) ───────────── */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-4 z-10">
        {/* Floating trust card */}
        <div className="w-60 rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center">
              <Award size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-400">Onaylı Danışman</p>
              <p className="text-[10px] text-white/40 mt-0.5">Doğrulanmış profiller</p>
            </div>
          </div>
          <div className="flex -space-x-2 mb-3">
            {['#7B5EA7', '#D4AF37', '#5A4E87', '#9B7EC8'].map((color, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-black/40 flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: color }}
              >
                {['F', 'M', 'P', 'Z'][i]}
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-black/40 bg-white/10 flex items-center justify-center text-[9px] font-bold text-white/60">
              +16
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={11} className="text-amber-400 fill-amber-400" />
            ))}
            <span className="text-[10px] text-white/50 ml-1">4.9/5</span>
          </div>
        </div>

        {/* Floating live session indicator */}
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-900/30 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">{isTr ? 'Canlı Görüşme' : 'Live Session'}</p>
              <p className="text-[9px] text-white/40">{isTr ? '8 danışman aktif' : '8 consultants online'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scroll indicator ──────────────────────────────────────── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3 text-white/30">
        <span className="font-display text-[9px] tracking-[0.5em] uppercase animate-pulse">{copy.scrollHint}</span>
        <div className="relative w-px h-12 bg-gradient-to-b from-amber-400/40 to-transparent overflow-hidden">
          <div className="absolute top-0 w-full bg-amber-400 animate-[scrollLine_2s_ease-in-out_infinite]" style={{ height: '50%' }} />
        </div>
      </div>

      {/* ── Bottom accent line ────────────────────────────────────── */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
    </section>
  );
}
