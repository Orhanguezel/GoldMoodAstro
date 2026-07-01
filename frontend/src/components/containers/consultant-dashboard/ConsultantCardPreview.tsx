'use client';

import React from 'react';
import { Star, Clock, ShieldCheck, Phone, Calendar } from 'lucide-react';
import { useUiSection } from '@/i18n';

interface Props {
  fullName: string;
  expertise: string[];
  expertiseLabels?: Record<string, string>;
  avatarUrl?: string;
  ratingAvg?: string;
  ratingCount?: number;
  sessionPrice?: number;
  sessionDuration?: number;
  isAvailable?: boolean;
}

export default function ConsultantCardPreview({
  fullName,
  expertise,
  expertiseLabels = {},
  avatarUrl,
  ratingAvg = '5.0',
  ratingCount = 0,
  sessionPrice = 0,
  sessionDuration = 30,
  isAvailable = true,
}: Props) {
  const { ui } = useUiSection('ui_consultantpanel');
  const rating = parseFloat(ratingAvg);
  const initials = (fullName || 'GS')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="w-full max-w-[320px] mx-auto bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] rounded-3xl overflow-hidden shadow-xl scale-95 origin-top opacity-90">
      <div className="relative aspect-square w-full bg-[var(--gm-bg-deep)]">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--gm-gold)] font-serif text-6xl">
            {initials}
          </div>
        )}

        {isAvailable && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 bg-[var(--gm-success)] text-[var(--gm-text)] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gm-text)] animate-pulse" />
            {ui('ui_consultantpanel_cardpreview_online', 'Online')}
          </span>
        )}

        <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-[var(--gm-bg-deep)]/40 backdrop-blur-sm text-[var(--gm-text)] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
          <ShieldCheck className="w-3 h-3 text-[var(--gm-gold)]" />
          {ui('ui_consultantpanel_cardpreview_verified', 'Verified')}
        </span>
      </div>

      <div className="p-6 pb-4 flex flex-col">
        <h3 className="font-serif text-xl text-[var(--gm-text)] mb-1 truncate">
          {fullName || ui('ui_consultantpanel_cardpreview_name_placeholder', 'Consultant Name')}
        </h3>

        <p className="text-[var(--gm-gold-dim)] text-[10px] font-bold tracking-widest uppercase mb-4 truncate">
          {expertise.length > 0 ? expertise.map((e) => expertiseLabels[e] || e).join(' · ') : ui('ui_consultantpanel_cardpreview_expertise_placeholder', 'Specialties')}
        </p>

        <div className="flex items-center gap-4 mb-4 text-xs">
          <div className="flex items-center gap-2 rounded-full border border-[var(--gm-gold)]/20 bg-[var(--gm-gold)]/10 px-3 py-1.5">
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
            <span className="text-[var(--gm-text-dim)]">{ratingCount} {ui('ui_consultantpanel_cardpreview_reviews', 'reviews')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--gm-text-dim)]">
            <Clock className="w-3.5 h-3.5" />
            <span>{sessionDuration} {ui('ui_consultantpanel_cardpreview_minutes_abbr', 'min')}</span>
          </div>
        </div>

        <div className="mt-auto pt-3 border-t border-[var(--gm-border-soft)] flex items-baseline justify-between gap-2 mb-4">
          <span className="text-[var(--gm-muted)] text-[10px] tracking-widest uppercase">{ui('ui_consultantpanel_cardpreview_session', 'Session')}</span>
          <span className="text-[var(--gm-gold)] font-serif text-2xl leading-none">₺{Math.round(sessionPrice)}</span>
        </div>

        <div className="flex gap-2 opacity-50">
          <div className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--gm-gold)]/40 text-[var(--gm-gold)] text-[10px] font-bold uppercase tracking-widest py-2.5">
            <Calendar className="w-3.5 h-3.5" />
            {ui('ui_consultantpanel_cardpreview_book', 'Book Appointment')}
          </div>
          {isAvailable && (
            <div className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--gm-success)] text-[var(--gm-text)] text-[10px] font-bold uppercase tracking-widest py-2.5">
              <Phone className="w-3.5 h-3.5" />
              {ui('ui_consultantpanel_cardpreview_call_now', 'Call Now')}
            </div>
          )}
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-[var(--gm-bg-deep)]/20 pointer-events-none backdrop-blur-[1px]">
        <span className="bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] text-[8px] font-bold uppercase tracking-[2px] px-3 py-1 rounded-full shadow-lg border border-[var(--gm-gold-light)]/50">
          {ui('ui_consultantpanel_cardpreview_preview', 'Preview')}
        </span>
      </div>
    </div>
  );
}
