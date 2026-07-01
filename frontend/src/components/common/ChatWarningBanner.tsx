'use client';

// T29-6 - Chat warning banner (cross-cutting)
// Used in client-consultant messaging areas:
//  - ConsultantDetail message modal
//  - Consultant Dashboard "Mesajlar" sekmesi
//  - Booking detail page (T29-5)
//
// Message: this area is for short notes; suggest booking for long conversations.

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  /** Small variant for tight areas above chat panel headers. */
  compact?: boolean;
  /** Locale (default 'tr') */
  locale?: 'tr' | 'en' | 'de';
  /** Custom message override. */
  message?: string;
  className?: string;
}

const MESSAGES: Record<'tr' | 'en' | 'de', string> = {
  tr: 'This area is for short notes or questions. Book a live session for longer conversations. Excessive use may be disabled automatically.',
  en: 'This space is for short notes/questions only. Book a live session for longer conversations. Excessive use may be auto-restricted.',
  de: 'This area is for short notes or questions. Book a live session for longer conversations. Excessive use may be disabled automatically.',
};

export default function ChatWarningBanner({
  compact = false,
  locale = 'tr',
  message,
  className = '',
}: Props) {
  const text = message || MESSAGES[locale] || MESSAGES.tr;

  if (compact) {
    return (
      <div
        className={`flex items-start gap-2 p-2.5 rounded-xl bg-[var(--gm-warning)]/10 border border-[var(--gm-warning)]/30 ${className}`}
        role="note"
      >
        <AlertTriangle className="w-3.5 h-3.5 text-[var(--gm-warning)] shrink-0 mt-0.5" />
        <p className="text-[10px] text-[var(--gm-text-dim)] leading-relaxed">{text}</p>
      </div>
    );
  }

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-2xl bg-[var(--gm-warning)]/10 border border-[var(--gm-warning)]/30 ${className}`}
      role="note"
    >
      <AlertTriangle className="w-5 h-5 text-[var(--gm-warning)] shrink-0 mt-0.5" />
      <p className="text-[12px] text-[var(--gm-text-dim)] leading-relaxed">{text}</p>
    </div>
  );
}
