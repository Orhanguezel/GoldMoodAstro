'use client';

import React from 'react';
import Link from 'next/link';
import { useLocaleShort } from '@/i18n';
import { localizePath } from '@/integrations/shared';

const CATEGORIES = {
  tr: [
    { key: 'astrology', title: 'Astroloji', desc: 'Doğum haritası, gezegenler ve hayat analizi.' },
    { key: 'tarot', title: 'Tarot', desc: 'Kartlar aracılığıyla içgüdüsel rehberlik.' },
    { key: 'numerology', title: 'Numeroloji', desc: 'Sayıların gizemi ile kişisel yol haritanız.' },
    { key: 'mood-coaching', title: 'Mood Coaching', desc: 'Enerji, duygu dengesi ve ruhsal farkındalık.' },
    { key: 'career', title: 'Kariyer', desc: 'Kozmik perspektifle kariyer ve hedef rehberliği.' },
    { key: 'relationship', title: 'İlişki Danışmanlığı', desc: 'Uyum analizi ve duygu rehberliği.' },
  ],
  en: [
    { key: 'astrology', title: 'Astrology', desc: 'Birth chart, planets, and life path analysis.' },
    { key: 'tarot', title: 'Tarot', desc: 'Intuitive guidance through the cards.' },
    { key: 'numerology', title: 'Numerology', desc: 'Your personal roadmap through the mystery of numbers.' },
    { key: 'mood-coaching', title: 'Mood Coaching', desc: 'Energy, emotional balance, and spiritual awareness.' },
    { key: 'career', title: 'Career', desc: 'Career and goal guidance from a cosmic perspective.' },
    { key: 'relationship', title: 'Relationship Guidance', desc: 'Compatibility analysis and emotional guidance.' },
  ],
};

const COPY = {
  tr: {
    label: 'DENEYİM ALANLARI',
    title: 'Ruhsal <em>Keşif</em> Yolculuğu',
    desc: 'Hangi alan size daha yakın? Uzmanlarımızla derinleşin.',
    cta: 'Tüm Danışmanları Gör',
  },
  en: {
    label: 'EXPERTISE AREAS',
    title: 'Spiritual <em>Discovery</em> Journey',
    desc: 'Which area resonates with you? Deepen your journey with our experts.',
    cta: 'Browse All Consultants',
  },
};

export default function ExpertiseCategoriesSection({ locale: explicitLocale }: { locale?: string }) {
  const locale = useLocaleShort(explicitLocale) || 'tr';
  const copy = COPY[locale as keyof typeof COPY] ?? COPY.tr;
  const cats = CATEGORIES[locale as keyof typeof CATEGORIES] ?? CATEGORIES.tr;

  return (
    <section className="py-28 lg:py-40 bg-[var(--gm-bg)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-20 lg:mb-28 reveal">
          <span className="font-display text-[11px] tracking-[0.42em] text-[var(--gm-gold-deep)] uppercase mb-6 block">
            {copy.label}
          </span>
          <h2 
            className="font-serif text-[clamp(2.2rem,4vw,3.8rem)] font-light leading-[1.15] text-[var(--gm-text)]"
            dangerouslySetInnerHTML={{ __html: copy.title }}
          />
          <p className="text-[var(--gm-text-dim)] font-light leading-relaxed mt-6">
            {copy.desc}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border border-[var(--gm-border-soft)] bg-[var(--gm-border-soft)] gap-px overflow-hidden rounded-sm shadow-soft">
          {cats.map((cat, i) => (
            <Link
              key={i}
              href={`${localizePath(locale, '/consultants')}?expertise=${encodeURIComponent(cat.key)}`}
              className="group bg-[var(--gm-bg)] p-12 lg:p-14 transition-all duration-500 hover:bg-[var(--gm-bg-deep)] reveal flex flex-col items-center text-center"
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              <div className="w-16 h-16 mb-8 rounded-full border border-[var(--gm-border-soft)] flex items-center justify-center text-[var(--gm-gold)] transition-transform duration-500 group-hover:scale-110 group-hover:border-[var(--gm-gold)]">
                 <span className="font-display text-xl uppercase">{cat.key.charAt(0)}</span>
              </div>
              <h3 className="font-serif text-2xl text-[var(--gm-text)] mb-4 tracking-tight group-hover:text-[var(--gm-gold)] transition-colors">
                {cat.title}
              </h3>
              <p className="text-[var(--gm-text-dim)] font-light text-sm leading-relaxed mb-8">
                {cat.desc}
              </p>
              <div className="mt-auto pt-4 border-t border-[var(--gm-border-soft)] w-full font-display text-[9px] tracking-[0.32em] text-[var(--gm-gold-deep)] uppercase opacity-0 translate-y-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                DANIŞMANLARI İNCELE
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-20 reveal">
          <Link href={localizePath(locale, '/consultants')} className="btn-outline-premium">
            {copy.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
