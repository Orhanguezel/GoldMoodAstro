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
      className="group block bg-bg-card border border-border rounded-2xl p-6 hover:border-brand-primary/40 hover:shadow-glow transition-all duration-300"
    >
      {/* Avatar */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-primary to-accent flex items-center justify-center text-text font-serif text-lg flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <h3 className="font-serif text-text text-lg leading-snug truncate group-hover:text-brand-primary transition-colors">
            {consultant.full_name || '—'}
          </h3>
          {/* Rating */}
          <div className="flex items-center gap-1 mt-1">
            <Star size={13} className="text-brand-secondary fill-brand-secondary" />
            <span className="text-brand-secondary text-sm font-medium">{rating.toFixed(1)}</span>
            <span className="text-text-muted text-xs">({consultant.rating_count})</span>
          </div>
        </div>
      </div>

      {/* Bio */}
      {consultant.bio && (
        <p className="text-text-muted text-sm leading-relaxed mb-4 line-clamp-2">{consultant.bio}</p>
      )}

      {/* Expertise chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(consultant.expertise || []).slice(0, 3).map((exp) => (
          <span
            key={exp}
            className="px-2.5 py-0.5 rounded-full text-xs border border-brand-primary/30 text-brand-primary-light bg-brand-primary/5"
          >
            {EXPERTISE_LABELS[exp] || exp}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-1 text-text-muted text-xs">
          <Clock size={12} />
          <span>{consultant.session_duration} dk</span>
          {consultant.languages?.length > 0 && (
            <>
              <span className="mx-1">·</span>
              <Globe size={12} />
              <span>{consultant.languages.join(', ').toUpperCase()}</span>
            </>
          )}
        </div>
        <div className="text-brand-secondary font-serif text-lg">
          ₺{price}
        </div>
      </div>
    </Link>
  );
}
