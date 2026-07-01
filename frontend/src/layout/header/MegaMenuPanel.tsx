'use client';

// =============================================================
// FILE: src/layout/header/MegaMenuPanel.tsx
// Premium mega menu with wide dropdown panel.
// Sol: kategori link'leri (mevcut child menu items)
// Right side: related expertise consultants fetched live.
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
  /** Consultant filter, for example "astrology" or "tarot,numerology". */
  expertise?: string;
  /** Right panel heading, for example "Astrology Experts". */
  consultantsHeading?: string;
  /** Number of consultants to display. */
  limit?: number;
  locale: string;
  /** Optional redirect query for the all consultants link, for example ?expertise=astrology. */
  allConsultantsLabel?: string;
  allConsultantsExpertise?: string;
  /** Panel eyebrow, for example "Astrology". */
  panelEyebrow?: string;
}

const isExternalHref = (href: string) =>
  /^https?:\/\//i.test(href) || /^mailto:/i.test(href) || /^tel:/i.test(href);

const cleanHashLink = (href: string) => {
  if (!href) return href;
  if (href.startsWith('#')) return `/${href.substring(1)}`;
  if (href.startsWith('/#')) return `/${href.substring(2)}`;
  if (href.includes('#')) return `/${href.split('#')[1]}`;
  return href;
};

export default function MegaMenuPanel({
  links,
  expertise,
  consultantsHeading = 'Featured Consultants',
  limit = 4,
  locale,
  allConsultantsLabel = 'See All',
  allConsultantsExpertise,
  panelEyebrow,
}: Props) {
  const hasConsultantsPanel = Boolean(expertise) && limit > 0;
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  const { data: consultants = [], isLoading } = useListConsultantsPublicQuery(
    expertise ? { expertise, limit, sort: 'featured' as const, locale } : { limit, sort: 'featured' as const, locale },
    { skip: !hydrated || !hasConsultantsPanel },
  );

  const consultantsHref = localizePath(
    locale,
    allConsultantsExpertise ? `/consultants?expertise=${encodeURIComponent(allConsultantsExpertise)}` : '/consultants',
  );

  return (
    <div className="w-[min(1000px,95vw)] bg-[var(--gm-surface)]/95 border border-[var(--gm-border-soft)] rounded-[32px] shadow-[var(--gm-shadow-card)] backdrop-blur-xl overflow-hidden ring-1 ring-[var(--gm-text)]/10">
      {/* Premium Accent Line */}
      <div className="h-1 bg-gradient-to-r from-[var(--gm-primary)] via-[var(--gm-gold)] to-[var(--gm-accent)] opacity-80" />

      <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-0">
        {/* SOL: Kategoriler & Linkler */}
        <div className={`p-8 md:p-10 ${hasConsultantsPanel ? 'border-r border-[var(--gm-border-soft)]' : 'md:col-span-2'}`}>
          {panelEyebrow && (
            <div className="flex items-center gap-3 mb-8">
              <span className="w-8 h-[1px] bg-[var(--gm-primary)]/30" />
              <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-[var(--gm-primary)]">
                {panelEyebrow}
              </p>
            </div>
          )}
          
          <ul className="list-none m-0 p-0 space-y-2">
            {links.length > 0 ? links.map((child) => {
              const cUrl = child.url || '#';
              const cHref = isExternalHref(cUrl) ? cUrl : localizePath(locale, cleanHashLink(cUrl));
              return (
                <li key={child.id}>
                  <Link
                    href={cHref}
                    className="group flex items-center justify-between gap-4 px-5 py-4 rounded-2xl text-[15px] text-[var(--gm-text)] hover:bg-[var(--gm-primary)]/10 hover:text-[var(--gm-primary)] transition-all duration-300"
                  >
                    <span className="font-serif tracking-wide">{child.title || 'Kategori'}</span>
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[var(--gm-primary)]" />
                  </Link>
                </li>
              );
            }) : (
              <li className="px-5 py-4 text-sm text-[var(--gm-muted)] italic">No categories yet.</li>
            )}
          </ul>
        </div>

        {/* Right: featured consultants */}
        {hasConsultantsPanel && (
          <div className="p-8 md:p-10 bg-gradient-to-br from-[var(--gm-bg-deep)]/60 to-transparent">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.32em] text-[var(--gm-primary)] flex items-center gap-2.5">
                <Sparkles className="w-4 h-4" />
                {consultantsHeading}
              </h3>
              <Link
                href={consultantsHref}
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gm-text-dim)] hover:text-[var(--gm-gold)] transition-all flex items-center gap-2 group/all"
              >
                {allConsultantsLabel}
                <ArrowRight className="w-3.5 h-3.5 group-hover/all:translate-x-1 transition-transform" />
              </Link>
            </div>

            {!hydrated || isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--gm-surface)]/40 animate-pulse border border-[var(--gm-border-soft)]">
                    <div className="w-14 h-14 rounded-full bg-[var(--gm-bg-deep)]/80" />
                    <div className="flex-1 space-y-2.5">
                      <div className="h-3 bg-[var(--gm-bg-deep)]/80 rounded-full w-3/4" />
                      <div className="h-2 bg-[var(--gm-bg-deep)]/80 rounded-full w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : consultants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-[var(--gm-surface)]/20 rounded-3xl border border-dashed border-[var(--gm-border-soft)]">
                <Sparkles className="w-8 h-8 text-[var(--gm-muted)] mb-3 opacity-20" />
                <p className="text-sm text-[var(--gm-text-dim)] italic font-serif">
                  Experts will be added soon.
                </p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none m-0 p-0">
                {consultants.slice(0, limit).map((c: ConsultantPublic) => {
                  const slug = c.slug || c.id;
                  const href = localizePath(locale, `/consultants/${slug}`);
                  const ratingNum = Number(c.rating_avg || 0);
                  return (
                    <li key={c.id}>
                      <Link
                        href={href}
                        className="group flex items-center gap-4 p-4 rounded-2xl bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] hover:border-[var(--gm-gold)]/40 hover:shadow-[var(--gm-shadow-gold)] transition-all duration-300 hover:-translate-y-0.5"
                      >
                        <div className="relative shrink-0">
                          <div className="w-14 h-14 rounded-full overflow-hidden bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] ring-2 ring-transparent group-hover:ring-[var(--gm-gold)]/20 transition-all">
                            {c.avatar_url ? (
                              <img
                                src={c.avatar_url}
                                alt={c.full_name || 'Consultant'}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[var(--gm-primary)] font-serif font-bold text-base bg-gradient-to-br from-[var(--gm-surface)] to-[var(--gm-bg-deep)]">
                                {(c.full_name || 'GS').split(' ').map((w) => w[0]).join('').slice(0, 2)}
                              </div>
                            )}
                          </div>
                          {c.is_available === 1 && (
                            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[var(--gm-success)] border-2 border-[var(--gm-surface)] shadow-sm" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-serif text-[14px] font-medium text-[var(--gm-text)] group-hover:text-[var(--gm-gold)] truncate transition-colors">
                            {c.full_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-[var(--gm-gold)] fill-[var(--gm-gold)]" />
                              <span className="text-[12px] font-medium text-[var(--gm-text-dim)]">{ratingNum.toFixed(1)}</span>
                            </div>
                            <span className="text-[10px] text-[var(--gm-muted)]">·</span>
                            <span className="text-[11px] text-[var(--gm-muted)] truncate">{c.rating_count} yorum</span>
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
