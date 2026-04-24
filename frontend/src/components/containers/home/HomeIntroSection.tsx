'use client';

import React from 'react';
import { useLocaleShort, useUiSection } from '@/i18n';

const STEPS: Record<string, Array<{ title: string; desc: string }>> = {
  de: [
    { title: 'Termin wahlen', desc: 'Wahlen Sie online oder telefonisch Ihren Wunschtermin aus.' },
    { title: 'Wir kommen zu Ihnen', desc: 'Unsere Therapeutin kommt mit allem Equipment direkt zu Ihnen nach Hause.' },
    { title: 'Massage geniessen', desc: 'Lehnen Sie sich zuruck und geniessen Sie Ihre professionelle energetische Massage.' },
    { title: 'Nachspuren', desc: 'Nehmen Sie sich Zeit zum Ankommen. Einfache Hinweise fur danach unterstutzen die Wirkung.' },
  ],
  en: [
    { title: 'Choose appointment', desc: 'Select your preferred appointment online or by phone.' },
    { title: 'We come to you', desc: 'Our therapist comes to your home with all equipment.' },
    { title: 'Enjoy massage', desc: 'Sit back and enjoy your professional energetic massage.' },
    { title: 'Aftercare', desc: 'Take time to settle. Simple aftercare suggestions support the effect.' },
  ],
  tr: [
    { title: 'Randevu secin', desc: 'Online veya telefonla istediginiz randevuyu secin.' },
    { title: 'Size geliyoruz', desc: 'Terapistimiz tum ekipmanla evinize gelir.' },
    { title: 'Masajin tadini cikarin', desc: 'Arkaniza yaslanin ve profesyonel enerjetik masajinizin tadini cikarin.' },
    { title: 'Sonrasi', desc: 'Yerlesmeye zaman ayirin. Basit oneriler etkiyi destekler.' },
  ],
};

export default function HomeIntroSection({ locale: explicitLocale }: { locale?: string }) {
  const locale = useLocaleShort(explicitLocale);
  const { ui } = useUiSection('ui_home_intro' as any, locale as any);

  const steps = STEPS[locale || 'de'] || STEPS.de;

  const sectionTitle = ui('ui_home_intro_title',
    locale === 'de' ? 'Massage buchen in 4 Schritten'
    : locale === 'tr' ? '4 adimda masaj randevusu'
    : 'Book massage in 4 steps'
  );

  const sectionDesc = ui('ui_home_intro_desc',
    locale === 'de' ? 'Kein Anfahrtsweg, kein Stress — wir bringen die Entspannung direkt zu Ihnen.'
    : locale === 'tr' ? 'Yol yok, stres yok — rahatlamayi dogrudan size getiriyoruz.'
    : 'No travel, no stress — we bring relaxation directly to you.'
  );

  return (
    <section className="py-28 lg:py-36" style={{ padding: '7rem 4%' }}>
      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="text-center max-w-[600px] mx-auto mb-16 reveal">
          <span className="section-label">
            {ui('ui_home_intro_label', locale === 'de' ? 'So einfach gehts' : locale === 'tr' ? 'Nasil calisir' : 'How it works')}
          </span>
          <h2 className="font-serif text-[clamp(2rem,4vw,3.4rem)] font-light leading-[1.2] mb-5">
            {sectionTitle}
          </h2>
          <p className="text-text-secondary font-light leading-[1.8] text-base max-w-[560px] mx-auto">
            {sectionDesc}
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden lg:block absolute top-8 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-25" />

          {steps.map((step, i) => (
            <div key={i} className={`text-center px-4 relative reveal reveal-delay-${i + 1}`}>
              {/* Step number */}
              <div className="w-16 h-16 border border-brand-primary rounded-full flex items-center justify-center mx-auto mb-6 font-serif text-[1.3rem] text-brand-primary bg-bg-primary relative z-[1] transition-all duration-400 hover:bg-brand-primary hover:text-bg-primary hover:shadow-gold">
                {String(i + 1).padStart(2, '0')}
              </div>

              <h3 className="font-serif text-[1.2rem] font-normal mb-2.5">
                {ui(`ui_home_intro_step${i + 1}_title`, step.title)}
              </h3>
              <p className="text-[0.85rem] text-text-muted leading-[1.7] font-light">
                {ui(`ui_home_intro_step${i + 1}_desc`, step.desc)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
