import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const COPY = {
  tr: {
    eyebrow: 'Yakında ✦ Türkiye',
    title: 'GOLD MOOD',
    subtitle: 'ASTRO',
    headline: 'Yıldızlarla tanışan <em>modern</em> astroloji<br/>— <strong>tuzaksız, tekrarsız, sahici</strong>.',
    tagline: 'Doğum haritanızdan beslenen kişisel yorumlar, dilediğinizde gerçek bir astrologa bağlanma seçeneği. Şeffaf abonelik, gizliliğe saygı.',
    primaryCTA: 'Ön Kayıt Ol',
    secondaryCTA: 'Deneyimi keşfet',
    scrollHint: 'Aşağı Kaydır',
  },
  en: {
    eyebrow: 'Coming Soon ✦ Global',
    title: 'GOLD MOOD',
    subtitle: 'ASTRO',
    headline: '<em>Modern</em> astrology meets the stars<br/>— <strong>no traps, no repetition, just authentic</strong>.',
    tagline: 'Personal readings fed by your birth chart, with the option to connect to a real astrologer whenever you want. Transparent subscription, respect for privacy.',
    primaryCTA: 'Pre-Register',
    secondaryCTA: 'Discover the experience',
    scrollHint: 'Scroll Down',
  }
};

export default function HeroNew({ locale = 'tr' }: { locale?: string }) {
  const isTr = locale === 'tr';
  const copy = COPY[isTr ? 'tr' : 'en'];

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-20 px-6 text-center overflow-hidden bg-[var(--gm-bg)] border-b border-[var(--gm-border-soft)]">
      
      {/* Decorative orbits */}
      <div className="absolute top-1/2 left-1/2 -translate-x-[70%] -translate-y-1/2 w-[560px] h-[560px] md:w-[800px] md:h-[800px] pointer-events-none opacity-40">
        <svg viewBox="0 0 280 280" fill="none" className="w-full h-full rotate-slow">
          <circle cx="140" cy="140" r="100" stroke="var(--gm-gold)" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.5"/>
          <circle cx="140" cy="140" r="135" stroke="var(--gm-gold)" strokeWidth="0.5" opacity="0.3"/>
          <circle cx="140" cy="40" r="4" fill="var(--gm-gold)"/>
          <circle cx="240" cy="140" r="3" fill="var(--gm-gold-deep)"/>
          <circle cx="60" cy="180" r="2" fill="var(--gm-gold)" opacity="0.7"/>
        </svg>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-[30%] -translate-y-[40%] w-[440px] h-[440px] md:w-[600px] md:h-[600px] pointer-events-none opacity-30">
        <svg viewBox="0 0 220 220" fill="none" className="w-full h-full rotate-slow" style={{ animationDirection: 'reverse', animationDuration: '60s' }}>
          <circle cx="110" cy="110" r="80" stroke="var(--gm-gold)" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.4"/>
          <circle cx="110" cy="110" r="105" stroke="var(--gm-gold)" strokeWidth="0.5" opacity="0.25"/>
          <circle cx="190" cy="110" r="3" fill="var(--gm-gold)"/>
          <circle cx="50" cy="80" r="2" fill="var(--gm-gold-deep)" opacity="0.7"/>
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
        <div className="font-display text-[9px] md:text-[11px] tracking-[0.4em] text-[var(--gm-gold-deep)] uppercase mb-8 md:mb-12 hero-fade-up">
          {copy.eyebrow}
        </div>

        <h1 className="font-display text-[clamp(3rem,8vw,7rem)] leading-none tracking-[0.15em] text-[var(--gm-gold)] mb-2 hero-fade-up" style={{ animationDelay: '0.2s' }}>
          {copy.title}
        </h1>
        
        <div className="font-display text-[clamp(1rem,2vw,1.5rem)] tracking-[0.6em] text-[var(--gm-gold-deep)] mb-10 hero-fade-up" style={{ animationDelay: '0.4s' }}>
          {copy.subtitle}
        </div>

        <h2 
          className="font-serif font-light text-[clamp(1.5rem,3.5vw,2.5rem)] leading-[1.3] text-[var(--gm-text)] mb-8 hero-fade-up [&>em]:text-[var(--gm-gold)] [&>em]:italic [&>strong]:font-serif [&>strong]:font-normal"
          style={{ animationDelay: '0.6s' }}
          dangerouslySetInnerHTML={{ __html: copy.headline }}
        />

        <p className="font-serif text-[clamp(1rem,1.2vw,1.1rem)] font-light text-[var(--gm-text-dim)] max-w-2xl mx-auto leading-relaxed mb-12 hero-fade-up italic" style={{ animationDelay: '0.8s' }}>
          {copy.tagline}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center hero-fade-up w-full sm:w-auto" style={{ animationDelay: '1s' }}>
          <Link href="#waitlist" className="btn-premium w-full sm:w-auto justify-center group">
            {copy.primaryCTA}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="#features" className="btn-outline-premium w-full sm:w-auto justify-center">
            {copy.secondaryCTA}
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-display text-[9px] tracking-[0.4em] text-[var(--gm-muted)] uppercase flex flex-col items-center gap-2 hero-fade-up opacity-50" style={{ animationDelay: '1.2s' }}>
        <span className="animate-pulse">{copy.scrollHint}</span>
        <div className="w-[1px] h-8 bg-gradient-to-b from-[var(--gm-muted)] to-transparent" />
      </div>
    </section>
  );
}
