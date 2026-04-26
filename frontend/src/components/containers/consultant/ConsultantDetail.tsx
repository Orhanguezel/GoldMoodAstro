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
    <main className="min-h-screen py-20" style={{ padding: '5rem 4%' }}>
      <div className="max-w-[900px] mx-auto">
        <Link
          href={`/${locale}/consultants`}
          className="inline-flex items-center gap-1.5 text-text-muted text-sm mb-8 hover:text-text transition-colors"
        >
          <ArrowLeft size={14} />
          {locale === 'tr' ? 'Danışmanlara dön' : 'Back to consultants'}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-primary to-accent flex items-center justify-center text-text font-serif text-2xl flex-shrink-0">
                  {initials}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="font-serif text-2xl text-text">{consultant.full_name}</h1>
                    <CheckCircle size={18} className="text-brand-primary" />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
                    <span className="flex items-center gap-1">
                      <Star size={13} className="text-brand-secondary fill-brand-secondary" />
                      <span className="text-brand-secondary font-medium">{rating.toFixed(1)}</span>
                      <span>({consultant.rating_count})</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Award size={13} />
                      {consultant.total_sessions} {locale === 'tr' ? 'seans' : 'sessions'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      {consultant.session_duration} dk
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {consultant.bio && (
              <div className="bg-bg-card border border-border rounded-2xl p-6">
                <h2 className="font-serif text-lg text-text mb-3">{locale === 'tr' ? 'Hakkında' : 'About'}</h2>
                <p className="text-text-muted text-sm leading-relaxed">{consultant.bio}</p>
              </div>
            )}

            <div className="bg-bg-card border border-border rounded-2xl p-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h2 className="font-serif text-base text-text mb-3">{locale === 'tr' ? 'Uzmanlık' : 'Expertise'}</h2>
                <div className="flex flex-wrap gap-2">
                  {(consultant.expertise || []).map((exp) => (
                    <span key={exp} className="px-3 py-1 rounded-full text-xs border border-brand-primary/30 text-brand-primary-light bg-brand-primary/5">
                      {EXPERTISE_LABELS[exp] || exp}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="font-serif text-base text-text mb-3">{locale === 'tr' ? 'Diller' : 'Languages'}</h2>
                <div className="flex flex-wrap gap-2">
                  {(consultant.languages || []).map((lang) => (
                    <span key={lang} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs border border-border text-text-muted">
                      <Globe size={11} />
                      {LANG_LABELS[lang] || lang.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-bg-card border border-border rounded-2xl p-5 sticky top-24">
              <div className="flex items-baseline justify-between mb-5 pb-4 border-b border-border">
                <div>
                  <span className="font-serif text-2xl text-brand-secondary">₺{price}</span>
                  <span className="text-text-muted text-xs ml-1">/ {consultant.session_duration} dk</span>
                </div>
                <span className="text-xs text-success bg-success/10 px-2.5 py-1 rounded-full">
                  {consultant.currency}
                </span>
              </div>

              <h3 className="font-serif text-base text-text mb-4">
                {locale === 'tr' ? 'Tarih & Saat Seç' : 'Select Date & Time'}
              </h3>
              <SlotPicker consultantId={id} locale={locale} onSelect={setSelectedSlot} selectedSlotId={selectedSlot?.id} />

              <button
                onClick={handleBook}
                disabled={!selectedSlot}
                className="mt-5 w-full py-3 rounded-full bg-brand-primary text-text font-medium text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-glow"
              >
                {selectedSlot
                  ? `${locale === 'tr' ? 'Randevu Al' : 'Book'} - ${selectedSlot.slot_time.slice(0, 5)}`
                  : locale === 'tr' ? 'Saat Seçin' : 'Select a Time'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
