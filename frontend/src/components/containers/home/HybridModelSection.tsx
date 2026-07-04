import React from 'react';
import { Sparkles, Users } from 'lucide-react';
import { useUiSection } from '@/i18n';

const COPY = {
  tr: {
    eyebrow: 'HİBRİT MODELİMİZ',
    title: 'Yapay Zeka Hızı, <em>İnsan</em> Sezgisi',
    description: 'GoldMoodAstro modern teknolojiyi kadim sembolik rehberlikle birleştirir. Yapay zeka haritanızı hızlıca analiz eder; gerçek danışmanlar ise kişisel bağlamınızı derinleştirir.',
    ai: {
      title: 'Hızlı ve Analitik',
      text: 'Yapay zeka motoru astrolojik verileri saniyeler içinde işler ve günlük yorumunuz için zemin hazırlar.'
    },
    human: {
      title: 'Derin ve Sezgisel',
      text: 'Gerçek danışmanlar hayatınızdaki benzersiz düğümleri anlamak için yapay zekanın ötesine geçer.'
    },
    bridge: 'UYUM',
    stats: [
      { num: '100%', label: 'GİZLİLİK' },
      { num: '24/7', label: 'ERİŞİM' },
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
  const { ui } = useUiSection('ui_home', locale as any);
  const fb = locale === 'tr' ? COPY.tr : COPY.en;
  const copy = {
    eyebrow: ui('ui_home_hybrid_eyebrow', fb.eyebrow),
    title: ui('ui_home_hybrid_title', fb.title),
    description: ui('ui_home_hybrid_description', fb.description),
    ai: {
      title: ui('ui_home_hybrid_ai_title', fb.ai.title),
      text: ui('ui_home_hybrid_ai_text', fb.ai.text),
    },
    human: {
      title: ui('ui_home_hybrid_human_title', fb.human.title),
      text: ui('ui_home_hybrid_human_text', fb.human.text),
    },
    bridge: ui('ui_home_hybrid_bridge', fb.bridge),
    stats: [
      { num: fb.stats[0].num, label: ui('ui_home_hybrid_stat_privacy', fb.stats[0].label) },
      { num: fb.stats[1].num, label: ui('ui_home_hybrid_stat_access', fb.stats[1].label) },
      { num: fb.stats[2].num, label: ui('ui_home_hybrid_stat_experts', fb.stats[2].label) },
    ],
  };

  return (
    <section className="py-32 px-6 bg-[var(--gm-bg-deep)] relative overflow-hidden text-[var(--gm-text)] border-y border-[var(--gm-border-soft)]">
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[10%] w-[40%] h-[40%] rounded-full bg-[var(--gm-gold)] opacity-[0.06] blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-[var(--gm-gold)] opacity-[0.04] blur-[120px]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-20 reveal">
          <span className="section-label !text-[var(--gm-gold-deep)] before:bg-[var(--gm-gold)]">{copy.eyebrow}</span>
          <h2
            className="font-serif text-[clamp(2rem,4.5vw,3.5rem)] italic font-light text-[var(--gm-text)] leading-tight mb-6"
            dangerouslySetInnerHTML={{ __html: copy.title }}
          />
          <p className="text-[var(--gm-text-dim)] max-w-2xl mx-auto leading-relaxed">
            {copy.description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-stretch gap-8 lg:gap-0 reveal">
          {/* AI Side */}
          <div className="p-12 border border-[var(--gm-gold)]/30 bg-[var(--gm-surface)]/70 text-center flex flex-col items-center rounded-sm">
            <div className="w-14 h-14 rounded-full bg-[var(--gm-gold)]/15 flex items-center justify-center text-[var(--gm-gold-deep)] mb-6">
              <Sparkles size={28} />
            </div>
            <h3 className="font-display text-sm tracking-[0.2em] text-[var(--gm-gold-deep)] mb-4 uppercase">{copy.ai.title}</h3>
            <p className="text-sm text-[var(--gm-text-dim)] leading-relaxed">
              {copy.ai.text}
            </p>
          </div>

          {/* Bridge */}
          <div className="flex flex-row lg:flex-col items-center justify-center py-6 lg:py-0 px-8 relative">
            <div className="hidden lg:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-[var(--gm-gold)]/40" />
            <div className="w-14 h-14 rounded-full border border-[var(--gm-gold)] bg-[var(--gm-bg-deep)] flex items-center justify-center relative z-10">
              <span className="font-display text-[9px] tracking-[0.2em] text-[var(--gm-gold-deep)]">{copy.bridge}</span>
            </div>
          </div>

          {/* Human Side */}
          <div className="p-12 border border-[var(--gm-gold)]/30 bg-[var(--gm-surface)]/70 text-center flex flex-col items-center rounded-sm">
            <div className="w-14 h-14 rounded-full bg-[var(--gm-gold)]/15 flex items-center justify-center text-[var(--gm-gold-deep)] mb-6">
              <Users size={28} />
            </div>
            <h3 className="font-display text-sm tracking-[0.2em] text-[var(--gm-gold-deep)] mb-4 uppercase">{copy.human.title}</h3>
            <p className="text-sm text-[var(--gm-text-dim)] leading-relaxed">
              {copy.human.text}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-16 pt-12 border-t border-[var(--gm-border-soft)] reveal">
          {copy.stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="font-display text-3xl text-[var(--gm-gold-deep)] mb-1">{s.num}</div>
              <div className="font-display text-[9px] tracking-[0.3em] text-[var(--gm-muted)] uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
