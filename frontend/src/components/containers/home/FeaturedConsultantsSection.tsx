'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Clock } from 'lucide-react';
import { useListConsultantsPublicQuery } from '@/integrations/rtk/public/consultants.public.endpoints';
import { localizePath } from '@/integrations/shared';
import { useLocaleShort } from '@/i18n';

const COPY = {
  tr: {
    label: 'Öne Çıkan Danışmanlar',
    title: 'En yüksek puanlı uzmanlar',
    desc: 'Alanında kanıtlanmış deneyim, gerçek kullanıcı yorumları ile sıralanmış danışmanlarımız.',
    cta: 'Tüm Danışmanları Gör',
    min: 'dk',
    from: 'itibaren',
    noData: 'Danışman bulunamadı.',
  },
  en: {
    label: 'Featured Consultants',
    title: 'Our highest-rated experts',
    desc: 'Consultants ranked by proven experience in their field and authentic user reviews.',
    cta: 'View All Consultants',
    min: 'min',
    from: 'from',
    noData: 'No consultants found.',
  },
};

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= Math.round(rating) ? 'text-brand-secondary fill-brand-secondary' : 'text-border'}
        />
      ))}
    </div>
  );
}

export default function FeaturedConsultantsSection({ locale: explicitLocale }: { locale?: string }) {
  const locale = useLocaleShort(explicitLocale) || 'tr';
  const copy = COPY[locale as keyof typeof COPY] ?? COPY.tr;

  const { data: consultants = [], isLoading } = useListConsultantsPublicQuery(
    { limit: 6, sort: 'rating' },
  );

  return (
    <section className="py-28 lg:py-36" style={{ padding: '7rem 4%' }}>
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center max-w-[600px] mx-auto mb-16 reveal">
          <span className="section-label">{copy.label}</span>
          <h2 className="font-serif text-[clamp(2rem,4vw,3.4rem)] font-light leading-[1.2] mb-5">
            {copy.title}
          </h2>
          <p className="text-text-secondary font-light leading-[1.8] text-base max-w-[560px] mx-auto">
            {copy.desc}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-bg-card border border-border rounded-2xl p-6 h-52 animate-pulse" />
            ))}
          </div>
        ) : consultants.length === 0 ? (
          <p className="text-center text-text-muted py-12">{copy.noData}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {consultants.map((c: any) => {
              const initials = (c.display_name || c.full_name || 'C')
                .split(' ')
                .slice(0, 2)
                .map((w: string) => w[0])
                .join('')
                .toUpperCase();

              return (
                <Link
                  key={c.id}
                  href={localizePath(locale, `/consultants/${c.id}`)}
                  className="group bg-bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 hover:border-brand-primary/50 hover:shadow-glow transition-all duration-300 reveal"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-brand-primary/15 flex items-center justify-center font-serif text-lg text-brand-primary flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-text truncate">{c.display_name || c.full_name}</p>
                      {c.expertise && c.expertise.length > 0 && (
                        <p className="text-xs text-text-muted truncate">{c.expertise.slice(0, 2).join(' · ')}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StarRow rating={Number(c.average_rating) || 0} />
                      <span className="text-xs text-text-muted">
                        {Number(c.average_rating || 0).toFixed(1)}
                        {c.review_count > 0 && ` (${c.review_count})`}
                      </span>
                    </div>
                    {c.session_duration_min && (
                      <div className="flex items-center gap-1 text-xs text-text-muted">
                        <Clock size={11} />
                        {c.session_duration_min} {copy.min}
                      </div>
                    )}
                  </div>

                  {c.session_price && (
                    <p className="text-brand-secondary font-serif text-lg">
                      {copy.from} ₺{Math.round(Number(c.session_price))}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        <div className="text-center mt-12 reveal">
          <Link
            href={localizePath(locale, '/consultants')}
            className="btn-outline-premium"
          >
            {copy.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
