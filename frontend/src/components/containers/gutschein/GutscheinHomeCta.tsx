'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';

const FALLBACKS: Record<string, { title: string; desc: string; btn: string }> = {
  de: {
    title: 'Entspannung verschenken',
    desc: 'Bereiten Sie jemandem eine Freude mit einem Gutschein fuer unsere energetische Massage. Das perfekte Geschenk fuer jeden Anlass.',
    btn: 'Gutschein Kaufen',
  },
  en: {
    title: 'Gift relaxation',
    desc: 'Give someone special the gift of our energetic massage voucher. The perfect present for any occasion.',
    btn: 'Buy Voucher',
  },
  tr: {
    title: 'Rahatlama hediye edin',
    desc: 'Sevdiklerinize enerjetik masaj hediye ceki ile mutluluk verin. Her ozel gun icin mukemmel bir hediye.',
    btn: 'Hediye Ceki Al',
  },
};

export default function GutscheinHomeCta({ locale: explicitLocale }: { locale?: string }) {
  const locale = useLocaleShort(explicitLocale);
  const { ui } = useUiSection('ui_gutschein' as any, locale as any);
  const fb = FALLBACKS[locale || 'de'] || FALLBACKS.de;

  const gutscheinHref = useMemo(() => localizePath(locale, '/gutschein'), [locale]);

  return (
    <div className="max-w-[1100px] mx-auto reveal">
      <div className="grid grid-cols-1 lg:grid-cols-2 bg-bg-card border border-border-light overflow-hidden">
        {/* Left: Visual */}
        <div
          className="relative flex items-center justify-center p-16 min-h-[300px] lg:min-h-0"
          style={{ background: 'linear-gradient(135deg, rgba(201,169,110,0.12), rgba(201,169,110,0.03))' }}
        >
          <div className="relative">
            <span className="text-[5rem] block animate-bounce" style={{ animationDuration: '3s' }}>
              🎁
            </span>
          </div>
        </div>

        {/* Right: Content */}
        <div className="p-10 lg:p-14 flex flex-col justify-center">
          <span className="section-label">{ui('ui_gutschein_label', locale === 'de' ? 'Verschenken' : locale === 'tr' ? 'Hediye' : 'Gift')}</span>
          <h3 className="font-serif text-[2.2rem] font-light mb-4">
            {ui('ui_gutschein_title', fb.title)}
          </h3>
          <p className="text-text-secondary leading-[1.8] font-light mb-8">
            {ui('ui_gutschein_desc', fb.desc)}
          </p>
          <Link href={gutscheinHref} className="btn-premium self-start">
            <span>🎁 &nbsp;{ui('ui_gutschein_btn', fb.btn)}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
