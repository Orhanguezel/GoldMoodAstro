'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Clock, Globe, ArrowRight, ShieldCheck } from 'lucide-react';
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
      href={`/${locale}/consultants/${consultant.slug || consultant.id}`}
      className="group relative flex flex-col bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] rounded-3xl p-8 hover:border-[var(--gm-gold)]/40 hover:shadow-[0_0_50px_rgba(201,169,97,0.05)] transition-all duration-500 overflow-hidden"
    >
      {/* Decorative Gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--gm-gold)] opacity-0 group-hover:opacity-[0.05] blur-[60px] rounded-full transition-opacity duration-700" />
      
      {/* Avatar & Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-2 border-[var(--gm-gold)]/20 p-1 group-hover:border-[var(--gm-gold)] transition-colors duration-500">
            {consultant.avatar_url ? (
              <img src={consultant.avatar_url} alt={consultant.full_name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-[var(--gm-bg-deep)] flex items-center justify-center text-[var(--gm-gold)] font-serif text-2xl">
                {initials}
              </div>
            )}
          </div>
          {consultant.is_available && (
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-[var(--gm-success)] border-4 border-[var(--gm-surface)] rounded-full" />
          )}
        </div>
        
        <div className="text-right">
          <div className="text-[var(--gm-gold)] font-serif text-3xl leading-none">₺{price}</div>
          <div className="text-[var(--gm-muted)] text-[10px] tracking-widest uppercase mt-2">SEANS ÜCRETİ</div>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-serif text-2xl text-[var(--gm-text)] group-hover:text-[var(--gm-gold)] transition-colors">
            {consultant.full_name}
          </h3>
          <ShieldCheck className="w-5 h-5 text-[var(--gm-gold)]" />
        </div>
        
        <p className="text-[var(--gm-gold-dim)] text-xs font-bold tracking-widest uppercase mb-6">
          {consultant.expertise.slice(0, 3).map(e => EXPERTISE_LABELS[e] || e).join(' · ')}
        </p>

        <div className="flex items-center gap-6 mb-8">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-[var(--gm-gold)] fill-[var(--gm-gold)]" />
            <span className="text-[var(--gm-text)] font-bold">{rating.toFixed(1)}</span>
            <span className="text-[var(--gm-text-dim)] text-xs">({consultant.rating_count})</span>
          </div>
          <div className="w-px h-3 bg-[var(--gm-border-soft)]" />
          <div className="flex items-center gap-2 text-[var(--gm-text-dim)] text-xs">
            <Clock className="w-4 h-4" />
            <span>{consultant.session_duration} DK</span>
          </div>
        </div>

        {consultant.bio && (
          <p className="text-[var(--gm-text-dim)] font-serif italic text-sm leading-relaxed mb-8 line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity">
            &ldquo;{consultant.bio}&rdquo;
          </p>
        )}
      </div>

      {/* Action */}
      <div className="mt-auto pt-6 border-t border-[var(--gm-border-soft)] flex items-center justify-between">
        <span className="text-[var(--gm-gold)] font-bold text-[10px] tracking-[0.2em] uppercase">Görüşmeyi Başlat</span>
        <div className="w-10 h-10 rounded-full bg-[var(--gm-gold)]/10 flex items-center justify-center group-hover:bg-[var(--gm-gold)] group-hover:text-[var(--gm-bg-deep)] transition-all duration-500">
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>
    </Link>
  );
}
