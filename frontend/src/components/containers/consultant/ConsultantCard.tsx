'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Clock, Globe } from 'lucide-react';
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
  const initials = (consultant.full_name || 'GS')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      href={`/${locale}/consultants/${consultant.id}`}
      className="group block bg-[var(--gm-bg)] border border-[var(--gm-border-soft)] p-7 hover:border-[var(--gm-gold)]/50 hover:shadow-glow transition-all duration-500 reveal"
    >
      {/* Avatar */}
      <div className="flex items-center gap-5 mb-6">
        <div className="w-16 h-16 rounded-full border border-[var(--gm-gold)] p-0.5">
          <div className="w-full h-full rounded-full bg-[var(--gm-gold)]/10 flex items-center justify-center text-[var(--gm-gold)] font-display text-xl">
            {initials}
          </div>
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-[15px] tracking-wide text-[var(--gm-text)] leading-tight truncate uppercase group-hover:text-[var(--gm-gold)] transition-colors">
            {consultant.full_name || '—'}
          </h3>
          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <Star size={11} className="text-[var(--gm-gold)] fill-[var(--gm-gold)]" />
            <span className="text-[var(--gm-text)] text-xs font-semibold">{rating.toFixed(1)}</span>
            <span className="text-[var(--gm-muted)] text-[10px] tracking-widest uppercase">({consultant.rating_count})</span>
          </div>
        </div>
      </div>

      {/* Bio */}
      {consultant.bio && (
        <p className="text-[var(--gm-text-dim)] font-serif italic text-[15px] leading-relaxed mb-6 line-clamp-2">
          &ldquo;{consultant.bio}&rdquo;
        </p>
      )}

      {/* Expertise chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(consultant.expertise || []).slice(0, 2).map((exp) => (
          <span
            key={exp}
            className="px-3 py-1 rounded-full text-[9px] tracking-widest uppercase border border-[var(--gm-gold)]/30 text-[var(--gm-gold-deep)] bg-[var(--gm-gold)]/5"
          >
            {EXPERTISE_LABELS[exp] || exp}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-5 border-t border-[var(--gm-border-soft)]">
        <div className="flex items-center gap-3 text-[var(--gm-muted)] text-[10px] tracking-widest uppercase">
          <span className="flex items-center gap-1.5">
            <Clock size={11} />
            {consultant.session_duration} DK
          </span>
          {consultant.languages?.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Globe size={11} />
              {consultant.languages[0].toUpperCase()}
            </span>
          )}
        </div>
        <div className="text-[var(--gm-gold)] font-serif text-xl">
          ₺{price}
        </div>
      </div>
    </Link>
  );
}
