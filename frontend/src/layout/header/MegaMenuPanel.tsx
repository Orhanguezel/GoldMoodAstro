'use client';

// =============================================================
// FILE: src/layout/header/MegaMenuPanel.tsx
// Premium mega menu — geniş dropdown panel.
// Sol: kategori link'leri (mevcut child menu items)
// Sağ: ilgili expertise astrologları (canlı fetch)
// =============================================================

import React from 'react';
import Link from 'next/link';
import { Star, Sparkles, ArrowRight } from 'lucide-react';

import { useListConsultantsPublicQuery, type ConsultantPublic } from '@/integrations/rtk/public/consultants.public.endpoints';
import { localizePath } from '@/integrations/shared';

type ChildLink = {
  id: string;
  url?: string;
  title?: string;
};

interface Props {
  /** Soldaki link listesi — mevcut menu children */
  links: ChildLink[];
  /** Astrolog filtresi — örn. "astrology" veya "tarot,numerology" */
  expertise?: string;
  /** Sağ panel başlığı — örn. "Astroloji Uzmanları" */
  consultantsHeading?: string;
  /** Görüntülenecek astrolog sayısı */
  limit?: number;
  locale: string;
  /** "Tüm danışmanlar" linkine yönlendirme — örn. ?expertise=astrology */
  allConsultantsLabel?: string;
  allConsultantsExpertise?: string;
  /** Panel başlığı — örn. "Astroloji" */
  panelEyebrow?: string;
}

const isExternalHref = (href: string) =>
  /^https?:\/\//i.test(href) || /^mailto:/i.test(href) || /^tel:/i.test(href) || /^#/i.test(href);

export default function MegaMenuPanel({
  links,
  expertise,
  consultantsHeading = 'Uzman Danışmanlar',
  limit = 4,
  locale,
  allConsultantsLabel = 'Tümünü Gör',
  allConsultantsExpertise,
  panelEyebrow,
}: Props) {
  const hasConsultantsPanel = Boolean(expertise) && limit > 0;
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  const { data: consultants = [], isLoading } = useListConsultantsPublicQuery(
    expertise ? { expertise, limit, sort: 'featured' as const } : { limit, sort: 'featured' as const },
    { skip: !hydrated || !hasConsultantsPanel },
  );

  const consultantsHref = localizePath(
    locale,
    allConsultantsExpertise ? `/consultants?expertise=${encodeURIComponent(allConsultantsExpertise)}` : '/consultants',
  );

  return (
    <div className="w-[min(900px,90vw)] bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] rounded-3xl shadow-[var(--gm-shadow-card)] backdrop-blur-md overflow-hidden">
      {/* Üst aksent çizgi (tema-aware) */}
      <div className="h-1 bg-gradient-to-r from-[var(--gm-primary)] via-[var(--gm-gold)] to-[var(--gm-accent)]" />

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-0">
        {/* SOL: Kategori link listesi */}
        <div className={`p-7 md:p-8 ${hasConsultantsPanel ? 'border-r border-[var(--gm-border-soft)]' : 'md:col-span-2'}`}>
          {panelEyebrow && (
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[var(--gm-primary)] mb-5">
              ✦ {panelEyebrow}
            </p>
          )}
          <ul className="list-none m-0 p-0 space-y-1">
            {links.map((child) => {
              const cUrl = child.url || '#';
              const cHref = isExternalHref(cUrl) ? cUrl : localizePath(locale, cUrl);
              return (
                <li key={child.id}>
                  <Link
                    href={cHref}
                    className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-[14px] text-[var(--gm-text)] hover:bg-[var(--gm-primary)]/8 hover:text-[var(--gm-primary)] transition-all"
                  >
                    <span className="font-serif">{child.title || 'Link'}</span>
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[var(--gm-primary)]" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* SAĞ: İlgili astrologlar */}
        {hasConsultantsPanel && (
        <div className="p-7 md:p-8 bg-[var(--gm-bg-deep)]/40">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.32em] text-[var(--gm-primary)] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              {consultantsHeading}
            </h3>
            <Link
              href={consultantsHref}
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gm-text-dim)] hover:text-[var(--gm-primary)] transition-colors inline-flex items-center gap-1.5"
            >
              {allConsultantsLabel}
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {!hydrated || isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--gm-surface)]/60 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-[var(--gm-bg-deep)]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-[var(--gm-bg-deep)] rounded w-3/4" />
                    <div className="h-2 bg-[var(--gm-bg-deep)] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : consultants.length === 0 ? (
            <p className="text-sm text-[var(--gm-text-dim)] italic font-serif text-center py-6">
              Yakında uzmanlar eklenecek.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 list-none m-0 p-0">
              {consultants.slice(0, limit).map((c: ConsultantPublic) => {
                const slug = c.slug || c.id;
                const href = localizePath(locale, `/consultants/${slug}`);
                const ratingNum = Number(c.rating_avg || 0);
                return (
                  <li key={c.id}>
                    <Link
                      href={href}
                      className="group flex items-center gap-3 p-3 rounded-xl bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] hover:border-[var(--gm-primary)]/40 hover:shadow-[var(--gm-shadow-soft)] transition-all"
                    >
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)]">
                          {c.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={c.avatar_url}
                              alt={c.full_name || 'Consultant'}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--gm-primary)] font-serif font-bold text-sm">
                              {(c.full_name || 'GS').split(' ').map((w) => w[0]).join('').slice(0, 2)}
                            </div>
                          )}
                        </div>
                        {c.is_available === 1 && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[var(--gm-success)] border-2 border-[var(--gm-surface)]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-serif text-[13px] text-[var(--gm-text)] group-hover:text-[var(--gm-primary)] truncate transition-colors">
                          {c.full_name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Star className="w-3 h-3 text-[var(--gm-gold)] fill-[var(--gm-gold)]" />
                          <span className="text-[11px] text-[var(--gm-text-dim)]">{ratingNum.toFixed(1)}</span>
                          <span className="text-[10px] text-[var(--gm-muted)]">·</span>
                          <span className="text-[10px] text-[var(--gm-muted)]">{c.rating_count} yorum</span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
