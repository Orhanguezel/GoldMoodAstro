'use client';

// T29-6 — Sohbet uyarı banner'ı (cross-cutting)
// Müşteri↔danışman mesajlaşma alanlarında kullanılır:
//  - ConsultantDetail "Mesaj Gönder" modalı
//  - Consultant Dashboard "Mesajlar" sekmesi
//  - Booking detail sayfası (T29-5)
//
// Mesaj: "Bu alan kısa not içindir, uzun sohbet için randevu önerin"

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  /** Sıkışık alanlarda küçük variant (chat panel header üstü) */
  compact?: boolean;
  /** Locale (default 'tr') */
  locale?: 'tr' | 'en' | 'de';
  /** Custom mesaj override (varsayılan locale-spesifik metni ezer) */
  message?: string;
  className?: string;
}

const MESSAGES: Record<'tr' | 'en' | 'de', string> = {
  tr: 'Bu alan kısa notlar/sorular içindir. Uzun sohbet için canlı görüşme rezervasyonu yapın. Aşırı kullanım otomatik kapatılabilir.',
  en: 'This space is for short notes/questions only. Book a live session for longer conversations. Excessive use may be auto-restricted.',
  de: 'Dieser Bereich ist für kurze Notizen/Fragen. Buche eine Live-Sitzung für längere Gespräche. Übermäßige Nutzung kann automatisch eingeschränkt werden.',
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
        className={`flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 ${className}`}
        role="note"
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-[var(--gm-text-dim)] leading-relaxed">{text}</p>
      </div>
    );
  }

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 ${className}`}
      role="note"
    >
      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
      <p className="text-[12px] text-[var(--gm-text-dim)] leading-relaxed">{text}</p>
    </div>
  );
}
