import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { localizePath } from '@/integrations/shared';

export default function HomeBecomeConsultantBanner({ locale = 'tr' }: { locale?: string }) {
  return (
    <section className="py-24 container mx-auto px-6">
      <div 
        className="relative rounded-[3rem] overflow-hidden bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] p-8 md:p-16 text-center"
      >
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[60%] bg-[var(--gm-gold)] opacity-[0.05] blur-[100px] rounded-full" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[60%] bg-[var(--gm-primary)] opacity-[0.05] blur-[100px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--gm-gold)]/30 bg-[var(--gm-gold)]/5 text-[var(--gm-gold)] text-[10px] font-bold uppercase tracking-widest mb-8">
            <Sparkles size={12} />
            Yol Gösteren Olun
          </div>
          
          <h2 className="font-display text-3xl md:text-5xl text-[var(--gm-text)] mb-6 leading-tight">
            Bilgeliğinizi Paylaşın, <br /> 
            <span className="text-[var(--gm-gold)]">Danışmanımız Olun</span>
          </h2>
          
          <p className="font-serif italic text-[var(--gm-text-dim)] text-lg mb-12">
            Astroloji, tarot veya ruhsal rehberlik alanında uzmansanız, GoldMoodAstro ailesine katılarak binlerce kişiye ışık tutabilirsiniz.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href={localizePath(locale, '/become-consultant')}
              className="btn-premium px-10 py-4 group shadow-gold/20"
            >
              Hemen Başvur
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href={localizePath(locale, '/about')}
              className="text-[var(--gm-text-dim)] hover:text-[var(--gm-gold)] font-bold text-[10px] uppercase tracking-widest transition-colors px-6"
            >
              Süreç Hakkında Bilgi Al
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
