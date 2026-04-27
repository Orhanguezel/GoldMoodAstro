'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Award, CheckCircle, Clock, Globe, Star, ShieldCheck, Sparkles, Calendar } from 'lucide-react';

import {
  useGetConsultantQuery,
  type ConsultantSlotPublic,
} from '@/integrations/rtk/public/consultants.public.endpoints';
import ReviewList from '@/components/common/public/ReviewList';
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--gm-bg)]">
        <div className="w-12 h-12 border-2 border-[var(--gm-gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !consultant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[var(--gm-bg)]">
        <div className="w-20 h-20 rounded-full bg-[var(--gm-surface)] flex items-center justify-center border border-[var(--gm-border-soft)]">
          <span className="text-3xl text-[var(--gm-gold)] opacity-30">!</span>
        </div>
        <h2 className="font-serif text-3xl text-[var(--gm-text)]">Danışman Bulunamadı</h2>
        <Link href={`/${locale}/consultants`} className="btn-premium py-3 px-8">
          Tüm Danışmanlar
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
    <main className="min-h-screen bg-[var(--gm-bg)] pb-24 pt-32">
      <div className="mx-auto max-w-7xl px-6">
        
        <Link
          href={`/${locale}/consultants`}
          className="inline-flex items-center gap-2 text-[var(--gm-text-dim)] hover:text-[var(--gm-gold)] transition-colors text-sm font-bold uppercase tracking-widest mb-12"
        >
          <ArrowLeft className="w-4 h-4" /> Tüm Danışmanlar
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16 items-start">
          
          {/* Main Content */}
          <div className="space-y-16">
            
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-10">
              <div className="relative">
                <div className="w-40 h-40 rounded-full border-2 border-[var(--gm-gold)] p-1.5 bg-[var(--gm-bg)]">
                  {consultant.avatar_url ? (
                    <img src={consultant.avatar_url} alt={consultant.full_name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[var(--gm-bg-deep)] flex items-center justify-center text-[var(--gm-gold)] font-serif text-5xl">
                      {initials}
                    </div>
                  )}
                </div>
                {consultant.is_available && (
                  <div className="absolute bottom-4 right-4 w-6 h-6 bg-[var(--gm-success)] border-4 border-[var(--gm-bg)] rounded-full" />
                )}
              </div>
              
              <div className="flex-1 text-center md:text-left pb-4">
                <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                  <h1 className="font-serif text-[clamp(2.5rem,5vw,4rem)] leading-tight text-[var(--gm-text)]">{consultant.full_name}</h1>
                  <ShieldCheck className="w-8 h-8 text-[var(--gm-gold)]" />
                </div>
                
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-8">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-[var(--gm-gold)] fill-[var(--gm-gold)]" />
                    <span className="text-[var(--gm-text)] font-bold text-xl">{rating.toFixed(1)}</span>
                    <span className="text-[var(--gm-text-dim)] text-sm">({consultant.rating_count} Yorum)</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--gm-text-dim)] text-sm">
                    <Award className="w-5 h-5 text-[var(--gm-gold)]" />
                    <span className="font-bold">{consultant.total_sessions}</span>
                    <span>Seans</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--gm-text-dim)] text-sm">
                    <Clock className="w-5 h-5 text-[var(--gm-gold)]" />
                    <span className="font-bold">{consultant.session_duration}</span>
                    <span>Dakika</span>
                  </div>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[var(--gm-gold)]" />
                <h2 className="font-serif text-2xl text-[var(--gm-text)]">Ruhsal Yolculuk & Deneyim</h2>
              </div>
              <p className="text-[var(--gm-text-dim)] font-serif italic text-[1.35rem] leading-relaxed opacity-90 first-letter:text-5xl first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-[var(--gm-gold)]">
                {consultant.bio || 'Bu danışman henüz bir açıklama eklememiş.'}
              </p>
            </div>

            {/* Skills & Lang */}
            <div className="grid md:grid-cols-2 gap-12">
              <div className="bg-[var(--gm-bg-deep)]/50 border border-[var(--gm-border-soft)] rounded-3xl p-8">
                <h3 className="text-[10px] font-bold text-[var(--gm-gold-dim)] tracking-[0.2em] uppercase mb-6">Uzmanlık Alanları</h3>
                <div className="flex flex-wrap gap-3">
                  {(consultant.expertise || []).map((exp) => (
                    <span key={exp} className="px-5 py-2.5 rounded-full text-[11px] font-bold tracking-widest uppercase border border-[var(--gm-gold)]/30 text-[var(--gm-gold)] bg-[var(--gm-gold)]/5">
                      {EXPERTISE_LABELS[exp] || exp}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-[var(--gm-bg-deep)]/50 border border-[var(--gm-border-soft)] rounded-3xl p-8">
                <h3 className="text-[10px] font-bold text-[var(--gm-gold-dim)] tracking-[0.2em] uppercase mb-6">Danışmanlık Dilleri</h3>
                <div className="flex flex-wrap gap-3">
                  {(consultant.languages || []).map((lang) => (
                    <span key={lang} className="flex items-center gap-3 px-5 py-2.5 rounded-full text-[11px] font-bold tracking-widest uppercase border border-[var(--gm-border-soft)] text-[var(--gm-text-dim)] bg-[var(--gm-surface)]">
                      <Globe className="w-4 h-4 text-[var(--gm-gold)]" />
                      {LANG_LABELS[lang] || lang.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Sticky Sidebar */}
          <div className="lg:sticky lg:top-32 w-full">
            <div className="bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] rounded-[40px] p-10 shadow-[0_0_80px_rgba(201,169,97,0.05)] relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[var(--gm-gold)] to-[var(--gm-gold-dim)]" />
              
              <div className="flex items-end justify-between mb-10 pb-8 border-b border-[var(--gm-border-soft)]">
                <div>
                  <p className="text-[var(--gm-gold-dim)] text-[10px] font-bold tracking-[0.2em] uppercase mb-2">Seans Ücreti</p>
                  <span className="font-serif text-5xl text-[var(--gm-gold)]">₺{price}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[var(--gm-text)] font-serif text-lg italic opacity-70">{consultant.session_duration} Dakika</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-4 h-4 text-[var(--gm-gold)]" />
                  <h3 className="text-[10px] font-bold text-[var(--gm-gold-dim)] tracking-[0.2em] uppercase">
                    Saat & Slot Seçimi
                  </h3>
                </div>
                
                <div className="min-h-[200px]">
                  <SlotPicker consultantId={id} locale={locale} onSelect={setSelectedSlot} selectedSlotId={selectedSlot?.id} />
                </div>

                <button
                  onClick={handleBook}
                  disabled={!selectedSlot}
                  className="w-full group relative py-5 rounded-full bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] font-bold text-base tracking-widest uppercase overflow-hidden hover:shadow-[0_0_50px_rgba(201,169,97,0.2)] transition-all disabled:opacity-50"
                >
                  <span className="relative z-10">
                    {selectedSlot ? 'RANDEVU AL' : 'SAAT SEÇİN'}
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </button>
                
                <p className="text-center text-[10px] font-medium tracking-[0.1em] text-[var(--gm-muted)] uppercase italic">
                  * Ödeme bir sonraki adımda Iyzipay üzerinden alınacaktır.
                </p>
              </div>
            </div>

            {/* Trust Info */}
            <div className="mt-8 flex flex-col items-center gap-4 px-6">
              <div className="flex items-center gap-3 text-[10px] font-bold text-[var(--gm-gold-dim)] tracking-[0.2em] uppercase">
                <ShieldCheck className="w-4 h-4 text-[var(--gm-success)]" />
                <span>Onaylı Uzman Profil</span>
              </div>
            </div>

          </div>

        </div>

        <section className="mt-16 max-w-4xl">
          <ReviewList
            targetType="consultant"
            targetId={consultant.id}
            locale={locale}
            titleOverride="Değerlendirmeler"
          />
        </section>
      </div>
    </main>
  );
}
