'use client';

// 2026-07-20: useUiSection/useMemo gibi istemci hook'lari kullaniyor ama direktif yoktu.
// Ana sayfada calisiyordu cunku HomeLayoutRenderer (istemci) icinden dynamic() ile
// yukleniyor; /explore ise dogrudan sunucu bileseninden render edip COKUYORDU
// ("Attempted to call useUiSection() from the server") -> sayfa 'Sunucu Hatasi' veriyordu.
import React from 'react';
import { UserSearch, CalendarCheck, PhoneCall } from 'lucide-react';
import { useUiSection } from '@/i18n';

const STEPS = [
  {
    icon: UserSearch,
    titleKey: 'ui_home_intro_step1_title',
    descKey: 'ui_home_intro_step1_desc',
    title: 'Danışman Seç',
    desc: 'Uzmanlık alanı ve gerçek kullanıcı yorumlarına göre size en uygun rehberi bulun.',
  },
  {
    icon: CalendarCheck,
    titleKey: 'ui_home_intro_step2_title',
    descKey: 'ui_home_intro_step2_desc',
    title: 'Randevu Al',
    desc: 'Danışmanın takviminden size uygun zamanı seçin ve güvenli ödemenizi tamamlayın.',
  },
  {
    icon: PhoneCall,
    titleKey: 'ui_home_intro_step3_title',
    descKey: 'ui_home_intro_step3_desc',
    title: 'Görüşmeyi Başlat',
    desc: 'Randevu saatinde uygulama içi sesli seansa katılın ve rehberliğinizi alın.',
  },
];

export default function HomeIntroSection({ locale = 'tr' }: { locale?: string }) {
  const { ui } = useUiSection('ui_home', locale as any);

  return (
    <section className="py-32 bg-[var(--gm-bg-deep)] border-y border-[var(--gm-border-soft)] relative overflow-hidden">
      {/* Decorative Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--gm-gold)] opacity-[0.03] blur-[120px] pointer-events-none rounded-full" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <span className="font-display text-[10px] tracking-[0.5em] text-[var(--gm-gold-deep)] uppercase mb-4 block">
            {ui('ui_home_intro_eyebrow', 'Süreç')}
          </span>
          <h2 className="font-display text-3xl md:text-5xl text-[var(--gm-text)] mb-6">
            {ui('ui_home_intro_title_1', 'Yolculuğunuz Nasıl')}{' '}
            <span className="text-[var(--gm-gold)]">{ui('ui_home_intro_title_2', 'İşler?')}</span>
          </h2>
          <p className="font-serif italic text-[var(--gm-text-dim)] max-w-2xl mx-auto">
            {ui('ui_home_intro_desc', 'Aradığınız ruhsal rehberliğe ve iç sakinliğe üç adımda ulaşın.')}
          </p>
        </div>

        <div className="relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-[var(--gm-border-soft)] to-transparent -translate-y-12" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative z-10">
            {STEPS.map((step, idx) => (
              <div
                key={idx}
                className="reveal text-center flex flex-col items-center group"
                style={{ transitionDelay: `${idx * 120}ms` }}
              >
                <div className="relative mb-10">
                  {/* Step Number */}
                  <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] text-[var(--gm-gold)] text-[10px] font-bold flex items-center justify-center shadow-md">
                    {idx + 1}
                  </div>

                  {/* Icon Box */}
                  <div className="w-24 h-24 rounded-[2rem] bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] flex items-center justify-center text-[var(--gm-gold)] shadow-xl group-hover:border-[var(--gm-gold)]/40 transition-all duration-500 transform group-hover:rotate-[10deg]">
                    <step.icon size={36} strokeWidth={1.5} />
                  </div>
                </div>

                <h3 className="font-serif text-2xl text-[var(--gm-text)] mb-4 group-hover:text-[var(--gm-gold)] transition-colors">
                  {ui(step.titleKey, step.title)}
                </h3>

                <p className="text-[var(--gm-text-dim)] text-sm leading-relaxed max-w-[280px]">
                  {ui(step.descKey, step.desc)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
