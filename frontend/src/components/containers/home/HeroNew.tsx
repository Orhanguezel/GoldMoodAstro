import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

const COPY = {
  tr: {
    eyebrow: 'Ruhsal Rehberlik ✦ GoldMoodAstro',
    title: 'GOLD MOOD',
    subtitle: 'ASTRO',
    headline: 'Yıldızlarla tanışan <em>modern</em> astroloji<br/>— <strong>tuzaksız, tekrarsız, sahici</strong>.',
    tagline: 'Doğum haritanızdan beslenen kişisel yorumlar ve dilediğinizde gerçek bir astrologa bağlanma seçeneği. Bilgeliği keşfedin.',
    primaryCTA: 'Danışmanları Gör',
    secondaryCTA: 'Haritayı Çıkar',
    scrollHint: 'Aşağı Kaydır',
  },
  en: {
    eyebrow: 'Spiritual Guidance ✦ GoldMoodAstro',
    title: 'GOLD MOOD',
    subtitle: 'ASTRO',
    headline: '<em>Modern</em> astrology meets the stars<br/>— <strong>no traps, no repetition, just authentic</strong>.',
    tagline: 'Personal readings fed by your birth chart and the option to connect to a real astrologer whenever you want. Discover wisdom.',
    primaryCTA: 'Explore Consultants',
    secondaryCTA: 'Get Your Chart',
    scrollHint: 'Scroll Down',
  }
};

export default function HeroNew({ locale = 'tr' }: { locale?: string }) {
  const isTr = locale === 'tr';
  const copy = COPY[isTr ? 'tr' : 'en'];

  return (
    <section className="relative min-h-[95vh] flex flex-col items-center justify-center pt-32 pb-32 px-6 text-center overflow-hidden bg-[var(--gm-bg)] border-b border-[var(--gm-border-soft)]">
      
      {/* ─── BACKGROUND DECORATIONS ─── */}
      
      {/* Aura Glows (Mystical Accents) */}
      <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] aura-mint opacity-[0.07] blur-[100px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] aura-cyan opacity-[0.05] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[20%] w-[450px] h-[450px] aura-rose opacity-[0.08] blur-[100px] pointer-events-none" />

      {/* Decorative orbits (Simplified & Refined) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] md:w-[1000px] md:h-[1000px] pointer-events-none opacity-[0.35]">
        <svg viewBox="0 0 280 280" fill="none" className="w-full h-full rotate-slow">
          {/* Main thin orbit */}
          <circle cx="140" cy="140" r="120" stroke="currentColor" className="text-[var(--gm-gold-deep)]" strokeWidth="0.4" strokeDasharray="1 6" />
          {/* Secondary very thin orbit */}
          <circle cx="140" cy="140" r="138" stroke="currentColor" className="text-[var(--gm-gold-deep)]" strokeWidth="0.3" opacity="0.4" />
          {/* Floating planet dots */}
          <circle cx="140" cy="20" r="1.5" fill="var(--gm-gold-deep)" />
          <circle cx="260" cy="140" r="1" fill="var(--gm-gold-deep)" opacity="0.6" />
        </svg>
      </div>

      {/* ─── GOLD BULLION REFLECTION ENERGY ─── */}
      <div className="gold-reflection" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[var(--gm-bg)] to-transparent z-10" />

      {/* ─── CONTENT ─── */}
      <div className="relative z-20 w-full max-w-5xl mx-auto flex flex-col items-center">
        
        {/* Floating Mystical Accent */}
        <div className="mb-10 hero-fade-up flex items-center justify-center">
          <div className="p-3 rounded-full bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] shadow-glow text-[var(--gm-gold)]">
            <Sparkles size={20} className="animate-pulse" />
          </div>
        </div>

        <div className="font-display text-[10px] md:text-[12px] tracking-[0.5em] text-[var(--gm-gold-deep)] uppercase mb-6 md:mb-8 hero-critical">
          {copy.eyebrow}
        </div>

        <div className="relative mb-6 hero-critical">
          {/* Marka adı: tema-bağımsız altın — her preset'te aynı kimlik */}
          <h1
            className="font-display text-[clamp(3.5rem,10vw,8.5rem)] leading-[0.9] tracking-[0.18em] bg-clip-text text-transparent filter drop-shadow-[0_0_30px_rgba(201,169,97,0.35)]"
            style={{
              backgroundImage:
                'linear-gradient(135deg, #E5D0A0 0%, #D4BB7A 25%, #C9A961 55%, #A8884A 85%, #856B3A 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {copy.title}
          </h1>
          <div className="font-display text-[clamp(1.2rem,2.5vw,1.8rem)] tracking-[0.7em] text-[#A8884A] mt-4">
            {copy.subtitle}
          </div>
        </div>

        <h2 
          className="font-serif font-light text-[clamp(1.8rem,4vw,3.2rem)] leading-[1.25] text-[var(--gm-text)] max-w-4xl mx-auto mb-10 hero-critical [&>em]:text-[var(--gm-gold)] [&>em]:italic [&>em]:font-normal [&>strong]:font-serif [&>strong]:font-normal [&>strong]:text-[var(--gm-text)]"
          dangerouslySetInnerHTML={{ __html: copy.headline }}
        />

        <p className="font-serif text-[clamp(1.1rem,1.4vw,1.25rem)] font-light text-[var(--gm-text-dim)] max-w-2xl mx-auto leading-relaxed mb-16 hero-critical opacity-80 italic">
          {copy.tagline}
        </p>

        <div className="flex flex-col sm:flex-row gap-6 items-center justify-center hero-critical w-full sm:w-auto">
          <Link href="/consultants" className="btn-premium min-w-[220px] justify-center group shadow-gold py-5">
            {copy.primaryCTA}
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/birth-chart" className="btn-outline-premium min-w-[220px] justify-center py-5 backdrop-blur-sm bg-[var(--gm-bg)]/30">
            {copy.secondaryCTA}
          </Link>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 font-display text-[10px] tracking-[0.5em] text-[var(--gm-muted)] uppercase flex flex-col items-center gap-4 hero-fade-up hero-fade-up-4 opacity-40">
        <span className="animate-pulse">{copy.scrollHint}</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-[var(--gm-muted)] to-transparent relative">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-[var(--gm-gold)] animate-[scrollLine_2s_ease-in-out_infinite]" />
        </div>
      </div>
    </section>
  );
}
