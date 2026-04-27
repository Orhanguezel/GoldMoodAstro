import React from 'react';
import { Sparkles, Users } from 'lucide-react';

const COPY = {
  tr: {
    eyebrow: 'HİBRİT MODELİMİZ',
    title: 'AI Zekası, <em>İnsan</em> Sezgisi',
    description: 'Gold Mood, modern teknolojiyi kadim bilgilerle birleştirir. Doğum haritanızı saniyeler içinde analiz eden AI ve derin ruhsal rehberlik sunan gerçek danışmanlar bir arada.',
    ai: {
      title: 'Hızlı & Analitik',
      text: 'AI motorumuz, karmaşık astrolojik verileri saniyeler içinde işler ve günlük yorumunuzu hazırlar.'
    },
    human: {
      title: 'Derin & Sezgisel',
      text: 'Gerçek danışmanlarımız, AI\'nın ötesine geçerek hayatınızdaki özel düğümleri çözer.'
    },
    bridge: 'SİNERJİ',
    stats: [
      { num: '%100', label: 'GİZLİLİK' },
      { num: '7/24', label: 'ERİŞİM' },
      { num: '50+', label: 'UZMAN' }
    ]
  },
  en: {
    eyebrow: 'OUR HYBRID MODEL',
    title: 'AI Intelligence, <em>Human</em> Intuition',
    description: 'Gold Mood combines modern technology with ancient wisdom. AI that analyzes your birth chart in seconds, and real consultants who offer deep spiritual guidance.',
    ai: {
      title: 'Fast & Analytical',
      text: 'Our AI engine processes complex astrological data in seconds and prepares your daily reading.'
    },
    human: {
      title: 'Deep & Intuitive',
      text: 'Our real consultants go beyond AI to resolve the unique knots in your life.'
    },
    bridge: 'SYNERGY',
    stats: [
      { num: '100%', label: 'PRIVACY' },
      { num: '24/7', label: 'ACCESS' },
      { num: '50+', label: 'EXPERTS' }
    ]
  }
};

export default function HybridModelSection({ locale = 'tr' }: { locale?: string }) {
  const copy = COPY[locale as keyof typeof COPY] || COPY.tr;

  return (
    <section className="py-32 px-6 bg-[var(--color-deep)] relative overflow-hidden text-[var(--gm-text-on-dark)]">
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[10%] w-[40%] h-[40%] rounded-full bg-[var(--gm-gold)] opacity-[0.05] blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-[var(--gm-gold)] opacity-[0.03] blur-[120px]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-20 reveal">
          <span className="section-label !text-[var(--gm-gold)] before:bg-[var(--gm-gold)]">{copy.eyebrow}</span>
          <h2 
            className="font-serif text-[clamp(2rem,4.5vw,3.5rem)] italic font-light text-white leading-tight mb-6"
            dangerouslySetInnerHTML={{ __html: copy.title }}
          />
          <p className="text-[var(--gm-text-secondary-dark)] max-w-2xl mx-auto leading-relaxed">
            {copy.description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-stretch gap-8 lg:gap-0 reveal">
          {/* AI Side */}
          <div className="p-12 border border-[var(--gm-gold)]/20 bg-white/5 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-[var(--gm-gold)]/10 flex items-center justify-center text-[var(--gm-gold)] mb-6">
              <Sparkles size={28} />
            </div>
            <h3 className="font-display text-sm tracking-[0.2em] text-[var(--gm-gold)] mb-4 uppercase">{copy.ai.title}</h3>
            <p className="text-sm text-[var(--gm-text-secondary-dark)] leading-relaxed">
              {copy.ai.text}
            </p>
          </div>

          {/* Bridge */}
          <div className="flex flex-row lg:flex-col items-center justify-center py-6 lg:py-0 px-8 relative">
            <div className="hidden lg:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-[var(--gm-gold)]/30" />
            <div className="w-14 h-14 rounded-full border border-[var(--gm-gold)] bg-[var(--color-deep)] flex items-center justify-center relative z-10">
              <span className="font-display text-[9px] tracking-[0.2em] text-[var(--gm-gold)]">{copy.bridge}</span>
            </div>
          </div>

          {/* Human Side */}
          <div className="p-12 border border-[var(--gm-gold)]/20 bg-white/5 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-[var(--gm-gold)]/10 flex items-center justify-center text-[var(--gm-gold)] mb-6">
              <Users size={28} />
            </div>
            <h3 className="font-display text-sm tracking-[0.2em] text-[var(--gm-gold)] mb-4 uppercase">{copy.human.title}</h3>
            <p className="text-sm text-[var(--gm-text-secondary-dark)] leading-relaxed">
              {copy.human.text}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-16 pt-12 border-t border-white/10 reveal">
          {copy.stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="font-display text-3xl text-[var(--gm-gold)] mb-1">{s.num}</div>
              <div className="font-display text-[9px] tracking-[0.3em] text-[var(--gm-text-muted-dark)] uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
