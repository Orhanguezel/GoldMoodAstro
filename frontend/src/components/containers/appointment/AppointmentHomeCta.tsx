'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';
import { safeStr, isValidUiText } from '@/integrations/shared';

const FALLBACKS: Record<string, { title: string; desc: string; cta: string; email: string }> = {
  de: {
    title: 'Bereit fuer Ihre persoenliche Auszeit?',
    desc: 'Buchen Sie jetzt Ihren Termin und erleben Sie professionelle energetische Massage bei Ihnen zu Hause.',
    cta: 'Online Termin Buchen',
    email: 'E-Mail Schreiben',
  },
  en: {
    title: 'Ready for your personal timeout?',
    desc: 'Book your appointment now and experience professional energetic massage at your home.',
    cta: 'Book Online',
    email: 'Write Email',
  },
  tr: {
    title: 'Kisisel molaniza hazir misiniz?',
    desc: 'Hemen randevunuzu alin ve evinizde profesyonel enerjetik masaj deneyimleyin.',
    cta: 'Online Randevu Al',
    email: 'E-posta Yaz',
  },
};

export default function AppointmentHomeCta({ locale: explicitLocale }: { locale?: string }) {
  const locale = useLocaleShort(explicitLocale);
  const { ui } = useUiSection('ui_appointment', locale as any);
  const fb = FALLBACKS[locale || 'de'] || FALLBACKS.de;

  const appointmentHref = useMemo(() => localizePath(locale, '/appointment'), [locale]);

  const title = useMemo(() => {
    const key = 'ui_appointment_home_cta_title';
    const v = safeStr(ui(key, ''));
    return isValidUiText(v, key) ? v : fb.title;
  }, [ui, fb.title]);

  const desc = useMemo(() => {
    const key = 'ui_appointment_home_cta_desc';
    const v = safeStr(ui(key, ''));
    return isValidUiText(v, key) ? v : fb.desc;
  }, [ui, fb.desc]);

  return (
    <section className="text-center py-32 relative" style={{ padding: '8rem 4%' }}>
      {/* Top line */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-20" />

      <div className="reveal">
        <span className="section-label mx-auto">
          {ui('ui_appointment_sublabel', locale === 'de' ? 'Kontakt' : locale === 'tr' ? 'Iletisim' : 'Contact')}
        </span>

        <h2 className="font-serif text-[clamp(2rem,4vw,3.4rem)] font-light leading-[1.2] mb-4 max-w-[700px] mx-auto">
          {title}
        </h2>

        <p className="text-text-secondary font-light leading-[1.8] text-base max-w-[560px] mx-auto mb-10">
          {desc}
        </p>

        <div className="flex gap-4 justify-center flex-wrap mb-12">
          <Link href={appointmentHref} className="btn-premium">
            <span>{ui('ui_appointment_home_cta_btn', fb.cta)}</span>
          </Link>
          <a href="mailto:info@energetische-massage-bonn.de" className="btn-outline-premium">
            {fb.email}
          </a>
        </div>

        {/* Contact info */}
        <div className="flex justify-center gap-12 flex-wrap">
          <a href="mailto:info@energetische-massage-bonn.de" className="flex items-center gap-3 text-text-secondary text-[0.88rem] no-underline hover:text-brand-primary transition-colors">
            <div className="w-11 h-11 border border-border-light rounded-full flex items-center justify-center text-[1.1rem] transition-all hover:border-brand-primary hover:bg-brand-light">
              &#9993;
            </div>
            <span>info@energetische-massage-bonn.de</span>
          </a>
          <div className="flex items-center gap-3 text-text-secondary text-[0.88rem]">
            <div className="w-11 h-11 border border-border-light rounded-full flex items-center justify-center text-[1.1rem]">
              &#8859;
            </div>
            <span>Bonn & Umgebung</span>
          </div>
        </div>
      </div>
    </section>
  );
}
