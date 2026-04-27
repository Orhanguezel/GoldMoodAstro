'use client';

import React from 'react';
import { useLocaleShort, useUiSection } from '@/i18n';

const STEPS: Record<string, Array<{ title: string; desc: string; target: string }>> = {
  tr: [
    { title: 'Danışman Seç', desc: 'Uzmanlık alanlarına, puanlarına ve gerçek kullanıcı yorumlarına göre size en uygun danışmanı bulun.', target: 'ADIM 01' },
    { title: 'Randevu Al', desc: 'Danışmanın takviminden size uygun müsait bir slot seçin ve ödemenizi güvenle tamamlayın.', target: 'ADIM 02' },
    { title: 'Görüşmeyi Başlat', desc: 'Randevu saati geldiğinde uygulama üzerinden sesli görüşmenizi anında başlatın.', target: 'ADIM 03' },
  ],
  en: [
    { title: 'Choose Consultant', desc: 'Find the best consultant for you based on expertise, ratings, and authentic user reviews.', target: 'STEP 01' },
    { title: 'Book Appointment', desc: 'Select a convenient slot from the consultant\'s calendar and complete your payment securely.', target: 'STEP 02' },
    { title: 'Start Session', desc: 'When the appointment time arrives, start your voice session instantly through the app.', target: 'STEP 03' },
  ],
};

export default function HomeIntroSection({ locale: explicitLocale }: { locale?: string }) {
  const locale = useLocaleShort(explicitLocale);
  const { ui } = useUiSection('ui_home_intro' as any, locale as any);

  const steps = STEPS[locale || 'tr'] || STEPS.tr;

  const sectionTitle = ui('ui_home_intro_title',
    locale === 'tr' ? 'Gold Mood <em>Değerleri</em>' : 'Gold Mood <em>Values</em>'
  );

  return (
    <section className="py-28 lg:py-40 bg-[var(--gm-bg)] border-t border-[var(--gm-border-soft)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-20 lg:mb-28 reveal">
          <span className="font-display text-[11px] tracking-[0.42em] text-[var(--gm-gold-deep)] uppercase mb-6 block">
            {ui('ui_home_intro_label', locale === 'tr' ? 'NASIL ÇALIŞIR?' : 'HOW IT WORKS?')}
          </span>
          <h2 
            className="font-serif text-[clamp(2.2rem,4vw,3.8rem)] font-light leading-[1.15] text-[var(--gm-text)]"
            dangerouslySetInnerHTML={{ __html: ui('ui_home_intro_title', locale === 'tr' ? '3 Adımda <em>Danışmanlık</em>' : '3 Steps to <em>Consultation</em>') }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 border border-[var(--gm-border-soft)] bg-[var(--gm-border-soft)] gap-px overflow-hidden rounded-sm shadow-soft">
          {steps.map((step, i) => (
            <div key={i} className="group bg-[var(--gm-bg)] p-12 lg:p-16 transition-colors duration-500 hover:bg-[var(--gm-bg-deep)] reveal" style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="font-display text-6xl lg:text-7xl text-[var(--gm-gold)] opacity-30 mb-8 transition-opacity duration-500 group-hover:opacity-50">
                {(i + 1).toString().padStart(2, '0')}
              </div>
              <h3 className="font-serif text-2xl lg:text-3xl text-[var(--gm-text)] mb-4 tracking-tight leading-tight">
                {ui(`ui_home_intro_step${i + 1}_title`, step.title)}
              </h3>
              <p className="text-[var(--gm-text-dim)] font-light leading-relaxed mb-8">
                {ui(`ui_home_intro_step${i + 1}_desc`, step.desc)}
              </p>
              <div className="font-display text-[10px] tracking-[0.32em] text-[var(--gm-muted)] uppercase">
                {ui(`ui_home_intro_step${i + 1}_target`, step.target)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
