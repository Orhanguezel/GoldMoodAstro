'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Award, CheckCircle, Clock, Globe, Star } from 'lucide-react';

import {
  useGetConsultantQuery,
  type ConsultantSlotPublic,
} from '@/integrations/rtk/public/consultants.public.endpoints';
import SlotPicker from './SlotPicker';

const EXPERTISE_LABELS: Record<string, string> = {
  astrology: 'Astroloji',
  tarot: 'Tarot',
  numerology: 'Numeroloji',
  mood: 'Mood Coaching',
  career: 'Kariyer',
  relationship: 'İlişki',
  birth_chart: 'Doğum Haritası',
};

const LANG_LABELS: Record<string, string> = { tr: 'Türkçe', en: 'İngilizce', de: 'Almanca', ar: 'Arapça' };

type Props = {
  id: string;
  locale: string;
};

export default function ConsultantDetail({ id, locale }: Props) {
  const router = useRouter();
  const { data: consultant, isFetching, isError } = useGetConsultantQuery(id, { skip: !id });
  const [selectedSlot, setSelectedSlot] = useState<ConsultantSlotPublic | null>(null);

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !consultant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-text-muted">{locale === 'tr' ? 'Danışman bulunamadı.' : 'Consultant not found.'}</p>
        <Link href={`/${locale}/consultants`} className="text-brand-primary text-sm hover:underline">
          {locale === 'tr' ? 'Danışmanlara dön' : 'Back to consultants'}
        </Link>
      </div>
    );
  }

  const rating = parseFloat(consultant.rating_avg || '0');
  const price = Math.round(Number(consultant.session_price));
  const initials = (consultant.full_name || 'GS').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  const handleBook = () => {
    if (!selectedSlot) return;
    const q = new URLSearchParams({
      consultantId: consultant.id,
      resourceId: selectedSlot.resource_id,
      slotId: selectedSlot.id,
      date: selectedSlot.slot_date,
      time: selectedSlot.slot_time.slice(0, 5),
      price: String(consultant.session_price),
      duration: String(consultant.session_duration),
      name: consultant.full_name || '',
    });
    router.push(`/${locale}/booking?${q.toString()}`);
  };

  return (
    <main className="min-h-screen py-24 bg-[var(--gm-bg)]" style={{ padding: '6rem 4%' }}>
      <div className="max-w-[1000px] mx-auto">
        <Link
          href={`/${locale}/consultants`}
          className="inline-flex items-center gap-1.5 text-[var(--gm-muted)] text-[11px] tracking-[0.2em] uppercase mb-12 hover:text-[var(--gm-gold)] transition-colors"
        >
          <ArrowLeft size={14} />
          {locale === 'tr' ? 'Danışmanlara Dön' : 'Back to Consultants'}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 items-start">
          <div className="space-y-12">
            {/* Header Card */}
            <div className="reveal">
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-8">
                <div className="w-28 h-28 rounded-full border border-[var(--gm-gold)] p-1 bg-[var(--gm-bg)]">
                  <div className="w-full h-full rounded-full bg-[var(--gm-gold)]/10 flex items-center justify-center text-[var(--gm-gold)] font-display text-3xl">
                    {initials}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
                    <h1 className="font-display text-3xl tracking-tight text-[var(--gm-text)] uppercase">{consultant.full_name}</h1>
                    <CheckCircle size={20} className="text-[var(--gm-gold)]" />
                  </div>
                  <div className="flex flex-wrap justify-center sm:justify-start items-center gap-6 text-[11px] tracking-[0.1em] text-[var(--gm-text-dim)] uppercase">
                    <span className="flex items-center gap-1.5">
                      <Star size={13} className="text-[var(--gm-gold)] fill-[var(--gm-gold)]" />
                      <span className="text-[var(--gm-text)] font-semibold">{rating.toFixed(1)}</span>
                      <span>({consultant.rating_count} {locale === 'tr' ? 'Yorum' : 'Reviews'})</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Award size={13} className="text-[var(--gm-gold)]" />
                      {consultant.total_sessions} {locale === 'tr' ? 'Seans' : 'Sessions'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-[var(--gm-gold)]" />
                      {consultant.session_duration} DK
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            {consultant.bio && (
              <div className="reveal reveal-delay-1">
                <h2 className="font-display text-[10px] tracking-[0.32em] text-[var(--gm-gold-deep)] uppercase mb-6">{locale === 'tr' ? 'Hakkında' : 'About'}</h2>
                <p className="text-[var(--gm-text-dim)] font-serif italic text-lg leading-relaxed">{consultant.bio}</p>
              </div>
            )}

            {/* Expertise & Languages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 reveal reveal-delay-2">
              <div>
                <h2 className="font-display text-[10px] tracking-[0.32em] text-[var(--gm-gold-deep)] uppercase mb-6">{locale === 'tr' ? 'Uzmanlık' : 'Expertise'}</h2>
                <div className="flex flex-wrap gap-2">
                  {(consultant.expertise || []).map((exp) => (
                    <span key={exp} className="px-4 py-2 rounded-full text-[10px] tracking-widest uppercase border border-[var(--gm-gold)]/30 text-[var(--gm-gold-deep)] bg-[var(--gm-gold)]/5">
                      {EXPERTISE_LABELS[exp] || exp}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="font-display text-[10px] tracking-[0.32em] text-[var(--gm-gold-deep)] uppercase mb-6">{locale === 'tr' ? 'Diller' : 'Languages'}</h2>
                <div className="flex flex-wrap gap-2">
                  {(consultant.languages || []).map((lang) => (
                    <span key={lang} className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] tracking-widest uppercase border border-[var(--gm-border-soft)] text-[var(--gm-text-dim)]">
                      <Globe size={11} className="text-[var(--gm-gold)]" />
                      {LANG_LABELS[lang] || lang.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:sticky lg:top-32 reveal reveal-delay-3">
            <div className="bg-[var(--gm-bg)] border border-[var(--gm-gold)]/20 p-8 shadow-card relative">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--gm-gold)]" />
              
              <div className="flex items-baseline justify-between mb-8 pb-6 border-b border-[var(--gm-border-soft)]">
                <div>
                  <span className="font-serif text-3xl text-[var(--gm-gold)]">₺{price}</span>
                  <span className="text-[var(--gm-muted)] text-[10px] tracking-widest uppercase ml-2">/ {consultant.session_duration} DK</span>
                </div>
              </div>

              <h3 className="font-display text-[10px] tracking-[0.32em] text-[var(--gm-gold-deep)] uppercase mb-6">
                {locale === 'tr' ? 'Tarih & Saat Seç' : 'Select Date & Time'}
              </h3>
              
              <SlotPicker consultantId={id} locale={locale} onSelect={setSelectedSlot} selectedSlotId={selectedSlot?.id} />

              <button
                onClick={handleBook}
                disabled={!selectedSlot}
                className="btn-premium w-full justify-center mt-8 py-4"
              >
                {selectedSlot
                  ? `${locale === 'tr' ? 'Randevu Al' : 'Book Session'}`
                  : locale === 'tr' ? 'Saat Seçin' : 'Select a Time'}
              </button>
              
              <p className="text-center text-[9px] tracking-[0.1em] text-[var(--gm-muted)] uppercase mt-6">
                {locale === 'tr' ? 'İncelemeden sonra ödemeye geçeceksiniz' : 'You will proceed to payment after review'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
