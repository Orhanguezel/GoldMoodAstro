'use client';

import Link from 'next/link';
import { ArrowRight, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth.store';
import { trackEvent } from '@/integrations/telemetry';

type HeroCTAsProps = {
  locale: string;
  primaryCTA: string;
  secondaryCTA: string;
  ctaHref: string;
  secondaryHref: string;
};

export default function HeroCTAs({ locale, primaryCTA, secondaryCTA, ctaHref, secondaryHref }: HeroCTAsProps) {
  const { isAuthenticated } = useAuthStore();
  const registerHref = `/${locale}/register`;
  
  return (
    <div className="hero-fade-up hero-fade-up-4 flex flex-col sm:flex-row gap-4 mb-14">
      {isAuthenticated ? (
        <>
          <Link
            href={ctaHref}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-[#0D0B1E] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(212,175,55,0.6)] min-w-[220px]"
          >
            {primaryCTA}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href={secondaryHref}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/8 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white/85 backdrop-blur-sm transition-all duration-300 hover:border-amber-400/50 hover:bg-white/12 hover:text-white min-w-[220px]"
          >
            {secondaryCTA}
          </Link>
        </>
      ) : (
        <>
          <Link
            href={registerHref}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gm-primary)] px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-[var(--gm-primary-light)] hover:scale-105 hover:shadow-[var(--gm-glow-primary)] min-w-[220px]"
            onClick={() => trackEvent('signup_start').catch(() => {})}
          >
            <UserPlus size={16} className="transition-transform group-hover:scale-110" />
            {locale === 'tr' ? 'Hesap Aç' : 'Sign Up'}
          </Link>
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/8 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white/85 backdrop-blur-sm transition-all duration-300 hover:border-amber-400/50 hover:bg-white/12 hover:text-white min-w-[220px]"
          >
            {primaryCTA}
            <ArrowRight size={16} />
          </Link>
        </>
      )}
    </div>
  );
}
