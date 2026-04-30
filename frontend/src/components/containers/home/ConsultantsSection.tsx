'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, TrendingUp, Clock3, Wifi, Star } from 'lucide-react';
import { useListConsultantsPublicQuery } from '@/integrations/rtk/public/consultants.public.endpoints';
import ConsultantCard from '@/components/containers/consultant/ConsultantCard';

type SortKey = 'featured' | 'popular' | 'new' | 'online';
type IconKey = 'sparkles' | 'trending' | 'clock' | 'wifi' | 'star';

const ICON_MAP: Record<IconKey, React.ElementType> = {
  sparkles: Sparkles,
  trending: TrendingUp,
  clock: Clock3,
  wifi: Wifi,
  star: Star,
};

interface Props {
  locale?: string;
  label?: string;
  config?: {
    sort?: SortKey;
    limit?: number;
    icon?: IconKey;
    onlineOnly?: boolean;
    subtitle?: string;
  } | null;
}

export default function ConsultantsSection({ locale = 'tr', label, config }: Props) {
  const sort = config?.sort ?? 'featured';
  const limit = config?.limit ?? 6;
  const onlineOnly = config?.onlineOnly === true || sort === 'online';
  const Icon = ICON_MAP[config?.icon ?? 'sparkles'];

  const { data, isLoading } = useListConsultantsPublicQuery({
    sort,
    limit,
    ...(onlineOnly ? { onlineOnly: true } : {}),
  });

  const items = data ?? [];

  // Carousel
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows, items.length]);

  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    // Bir kart genişliği kadar kaydır (ilk child'ın offsetWidth + gap)
    const firstCard = el.querySelector<HTMLElement>('[data-carousel-item]');
    const cardW = firstCard ? firstCard.offsetWidth + 24 /* gap-6 */ : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * cardW, behavior: 'smooth' });
  };

  if (!isLoading && items.length === 0) return null;

  const subtitle =
    config?.subtitle ||
    (sort === 'popular'
      ? 'En çok seans veren, deneyimli isimler'
      : sort === 'new'
        ? 'Platforma yeni katılan astrologlar'
        : sort === 'online'
          ? 'Şu an müsait, hemen bağlanabilirsiniz'
          : 'En yüksek puan ve seans sayısına sahip uzmanlar');

  const title = label || 'Danışmanlar';

  return (
    <section className="container mx-auto px-4 py-16 md:py-20">
      <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-[var(--gm-gold)]/10 flex items-center justify-center text-[var(--gm-gold)]">
              <Icon className="w-5 h-5" />
            </span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-[var(--gm-text)] tracking-tight">
            {title}
          </h2>
          <p className="text-[var(--gm-text-dim)] font-serif italic max-w-xl">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Carousel oklar — sadece desktop'ta */}
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              disabled={!canPrev}
              aria-label="Önceki"
              className="w-10 h-10 rounded-full border border-[var(--gm-border-soft)] flex items-center justify-center text-[var(--gm-text)] hover:border-[var(--gm-gold)] hover:bg-[var(--gm-gold)]/10 hover:text-[var(--gm-gold)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              disabled={!canNext}
              aria-label="Sonraki"
              className="w-10 h-10 rounded-full border border-[var(--gm-border-soft)] flex items-center justify-center text-[var(--gm-text)] hover:border-[var(--gm-gold)] hover:bg-[var(--gm-gold)]/10 hover:text-[var(--gm-gold)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <Link
            href={`/${locale}/consultants?sort=${sort}`}
            className="group inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--gm-gold)] hover:text-[var(--gm-gold-light)] transition-colors"
          >
            Tümünü Gör
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[420px] rounded-3xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/40 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div
          ref={scrollerRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.slice(0, limit).map((c) => (
            <div
              key={c.id}
              data-carousel-item
              className="snap-start shrink-0 w-[85%] sm:w-[60%] md:w-[calc((100%-3rem)/3)] lg:w-[calc((100%-3rem)/3)]"
            >
              <ConsultantCard consultant={c} locale={locale} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
