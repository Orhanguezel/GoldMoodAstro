'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Clock, ShieldCheck, Phone, Calendar } from 'lucide-react';
import type { ConsultantPublic } from '@/integrations/rtk/public/consultants.public.endpoints';

const EXPERTISE_LABELS: Record<string, string> = {
  astrology: 'Astroloji',
  tarot: 'Tarot',
  numerology: 'Numeroloji',
  mood: 'Mood Coaching',
  career: 'Kariyer',
  relationship: 'İlişki',
  birth_chart: 'Doğum Haritası',
};

interface Props {
  consultant: ConsultantPublic;
  locale: string;
}

export default function ConsultantCard({ consultant, locale }: Props) {
  const rating = parseFloat(consultant.rating_avg || '0');
  const price = Math.round(Number(consultant.session_price));
  const isOnline = !!consultant.is_available;
  const detailHref = `/${locale}/consultants/${consultant.slug || consultant.id}`;
  const initials = (consultant.full_name || 'GS')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="consultant-card group relative flex flex-col bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] rounded-3xl overflow-hidden hover:border-[var(--gm-gold)]/40 hover:shadow-[0_0_50px_rgba(201,169,97,0.08)] transition-all duration-500">
      {/* Decorative Gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--gm-gold)] opacity-0 group-hover:opacity-[0.05] blur-[60px] rounded-full transition-opacity duration-700 pointer-events-none" />

      {/* Big Image (advicemy style) */}
      <Link href={detailHref} className="relative block aspect-square w-full overflow-hidden bg-[var(--gm-bg-deep)]">
        {consultant.avatar_url ? (
          <img
            src={consultant.avatar_url}
            alt={consultant.full_name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--gm-gold)] font-serif text-6xl">
            {initials}
          </div>
        )}

        {/* Online badge */}
        {isOnline && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 bg-[var(--gm-success)] text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Çevrimiçi
          </span>
        )}

        {/* Verified badge */}
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
          <ShieldCheck className="w-3 h-3 text-[var(--gm-gold)]" />
          Onaylı
        </span>
      </Link>

      {/* Info */}
      <div className="flex-1 p-6 pb-4 flex flex-col">
        <Link href={detailHref}>
          <h3 className="font-serif text-xl text-[var(--gm-text)] group-hover:text-[var(--gm-gold)] transition-colors mb-1 truncate">
            {consultant.full_name}
          </h3>
        </Link>

        <p className="text-[var(--gm-gold-dim)] text-[10px] font-bold tracking-widest uppercase mb-4 truncate">
          {consultant.expertise.slice(0, 3).map((e) => EXPERTISE_LABELS[e] || e).join(' · ')}
        </p>

        <div className="flex items-center gap-4 mb-4 text-xs">
          <div
            className="flex items-center gap-2 rounded-full border border-[var(--gm-gold)]/20 bg-[var(--gm-gold)]/10 px-3 py-1.5"
            aria-label={`${rating.toFixed(1)} puan, ${consultant.rating_count} yorum`}
          >
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i <= Math.round(rating)
                      ? 'text-[var(--gm-gold)] fill-[var(--gm-gold)]'
                      : 'text-[var(--gm-border)]'
                  }`}
                />
              ))}
            </div>
            <span className="text-[var(--gm-text)] font-bold">{rating.toFixed(1)}</span>
            <span className="text-[var(--gm-text-dim)]">{consultant.rating_count} yorum</span>
          </div>
          <span className="w-px h-3 bg-[var(--gm-border-soft)]" />
          <div className="flex items-center gap-1.5 text-[var(--gm-text-dim)]">
            <Clock className="w-3.5 h-3.5" />
            <span>{consultant.session_duration} dk</span>
          </div>
        </div>

        <div className="mt-auto pt-3 border-t border-[var(--gm-border-soft)] flex items-baseline justify-between gap-2 mb-4">
          <span className="text-[var(--gm-muted)] text-[10px] tracking-widest uppercase">Seans</span>
          <span className="text-[var(--gm-gold)] font-serif text-2xl leading-none">₺{price}</span>
        </div>

        {/* CTA buttons */}
        <div className="flex gap-2">
          <Link
            href={detailHref}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--gm-gold)]/40 hover:border-[var(--gm-gold)] hover:bg-[var(--gm-gold)]/10 text-[var(--gm-gold)] text-[10px] font-bold uppercase tracking-widest py-2.5 transition-all ${
              !isOnline ? 'col-span-2' : ''
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Randevu Al
          </Link>
          {isOnline && (
            <Link
              href={`${detailHref}?action=instant`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--gm-success)] hover:bg-[var(--gm-success)]/90 text-white text-[10px] font-bold uppercase tracking-widest py-2.5 transition-all shadow-md"
            >
              <Phone className="w-3.5 h-3.5" />
              Hemen Görüş
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
