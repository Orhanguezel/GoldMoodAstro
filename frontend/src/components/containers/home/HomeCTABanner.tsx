'use client';

import React from 'react';
import Link from 'next/link';
import { useLocaleShort } from '@/i18n';
import { localizePath } from '@/integrations/shared';

const COPY = {
  tr: {
    title: 'İlk adımı atmaya hazır mısınız?',
    desc: 'Danışmanınızla bugün buluşun. Randevu almak sadece birkaç dakikanızı alır.',
    cta: 'Danışman Bul',
    secondary: 'Nasıl çalışır?',
  },
  en: {
    title: 'Ready to take the first step?',
    desc: 'Connect with your consultant today. Booking takes just a few minutes.',
    cta: 'Find a Consultant',
    secondary: 'How does it work?',
  },
};

export default function HomeCTABanner({ locale: explicitLocale }: { locale?: string }) {
  const locale = useLocaleShort(explicitLocale) || 'tr';
  const copy = COPY[locale as keyof typeof COPY] ?? COPY.tr;

  return (
    <section
      className="py-28 relative overflow-hidden"
      style={{ padding: '7rem 4%' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, var(--color-brand-primary) 0%, transparent 70%)',
          opacity: 0.07,
        }}
      />
      <div className="max-w-[700px] mx-auto text-center relative reveal">
        <h2 className="font-serif text-[clamp(2rem,4.5vw,3.6rem)] font-light leading-[1.15] mb-5">
          {copy.title}
        </h2>
        <p className="text-text-secondary font-light leading-[1.8] text-base mb-10 max-w-[480px] mx-auto">
          {copy.desc}
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href={localizePath(locale, '/consultants')} className="btn-premium">
            <span>{copy.cta}</span>
          </Link>
          <Link href={localizePath(locale, '/#how-it-works')} className="btn-outline-premium">
            {copy.secondary}
          </Link>
        </div>
      </div>
    </section>
  );
}
