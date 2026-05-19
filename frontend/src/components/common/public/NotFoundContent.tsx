'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, Timer, Star } from 'lucide-react';
import { useUiSection } from '@/i18n';

type Props = {
  locale: string;
  homePath: string;
};

export function NotFoundContent({ locale, homePath }: Props) {
  const { ui } = useUiSection('ui_errors', locale);
  const router = useRouter();
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(homePath);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [homePath, router]);

  const getRedirectText = () => {
    const raw = ui(
      'ui_404_redirect_info',
      '{seconds} saniye içinde ana sayfaya yönlendirileceksiniz.',
    );
    return raw.replace('{seconds}', countdown.toString());
  };

  return (
    /*
     * Kontrast stratejisi: tüm sayfa kendi koyu arka planına sahip.
     * Metin renkleri sabit white/amber — tema değişkenine BAĞIMLI DEĞİL.
     * Böylece hem light hem dark temada garantili okunur.
     */
    <div
      className="relative flex flex-col items-center justify-center min-h-screen px-6 py-20 text-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0D0B1E 0%, #1A1630 50%, #120825 100%)' }}
    >
      {/* ── Decorative glows ─────────────────────────────────────── */}
      <div
        className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(123,94,167,0.18) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-[-10%] left-[-5%] w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.10) 0%, transparent 70%)' }}
      />

      {/* ── Animated star particles ───────────────────────────────── */}
      <span className="absolute top-[15%] left-[20%] w-1.5 h-1.5 rounded-full bg-amber-300/60 animate-ping" style={{ animationDuration: '2.8s' }} />
      <span className="absolute top-[35%] right-[18%] w-1 h-1 rounded-full bg-purple-300/50 animate-ping" style={{ animationDuration: '3.5s' }} />
      <span className="absolute bottom-[25%] left-[30%] w-1.5 h-1.5 rounded-full bg-amber-200/40 animate-ping" style={{ animationDuration: '4.2s' }} />
      <Star size={9} className="absolute top-[28%] right-[28%] text-amber-300/30 fill-amber-300/20 animate-pulse" style={{ animationDuration: '3s' }} />
      <Star size={7} className="absolute bottom-[35%] right-[15%] text-purple-300/25 fill-purple-300/15 animate-pulse" style={{ animationDuration: '4s' }} />

      {/* ── Gold line top ─────────────────────────────────────────── */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-2xl w-full" style={{ animation: 'fadeUp 0.6s ease-out both' }}>

        {/* 404 number */}
        <p
          aria-hidden="true"
          className="select-none leading-[0.85] font-display"
          style={{
            fontSize: 'clamp(8rem,25vw,14rem)',
            background: 'linear-gradient(135deg, #F5E6C8 0%, #D4AF37 40%, #9B7EC8 80%, #7B5EA7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 60px rgba(212,175,55,0.25))',
            animation: 'slideUp 0.8s ease-out 0.1s both',
          }}
        >
          404
        </p>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4 my-6" style={{ animation: 'fadeUp 0.6s ease-out 0.2s both' }}>
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400/50" />
          <Star size={12} className="text-amber-400/60 fill-amber-400/40" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400/50" />
        </div>

        {/* Title */}
        <h1
          className="text-3xl md:text-5xl font-serif font-light text-white mb-4 px-4"
          style={{ animation: 'fadeUp 0.6s ease-out 0.3s both' }}
        >
          {ui('ui_404_title', 'Sayfa Bulunamadı')}
        </h1>

        {/* Subtitle */}
        <p
          className="text-lg text-white/55 font-light leading-relaxed mb-8 max-w-lg mx-auto"
          style={{ animation: 'fadeUp 0.6s ease-out 0.4s both' }}
        >
          {ui(
            'ui_404_subtitle',
            'Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.',
          )}
        </p>

        {/* Countdown badge */}
        <div
          className="inline-flex items-center justify-center gap-2.5 mx-auto mb-10 px-5 py-2.5 rounded-full border border-amber-400/20 bg-amber-400/8 backdrop-blur-sm"
          style={{ animation: 'fadeUp 0.6s ease-out 0.5s both' }}
        >
          <Timer className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
          <span className="text-sm text-amber-300/80 font-medium">{getRedirectText()}</span>
        </div>

        {/* CTA buttons */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          style={{ animation: 'fadeUp 0.6s ease-out 0.6s both' }}
        >
          <button
            onClick={() => router.push(homePath)}
            className="inline-flex items-center justify-center gap-2 min-w-52 px-8 py-4 rounded-full bg-amber-400 text-[#0D0B1E] font-bold text-sm uppercase tracking-[0.18em] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_36px_rgba(212,175,55,0.5)] active:scale-95"
          >
            <Home className="w-4 h-4" />
            {ui('ui_404_back_home', 'Ana Sayfaya Dön')}
          </button>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 min-w-44 px-8 py-4 rounded-full border border-white/20 bg-white/6 text-white/85 font-bold text-sm uppercase tracking-[0.18em] backdrop-blur-sm transition-all duration-300 hover:border-amber-400/40 hover:bg-white/10 hover:text-white active:scale-95 whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            {ui('ui_404_go_back', 'Go Back')}
          </button>
        </div>
      </div>

      {/* ── Bottom accent line ────────────────────────────────────── */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
