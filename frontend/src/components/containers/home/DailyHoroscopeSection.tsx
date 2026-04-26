// frontend/src/components/containers/home/DailyHoroscopeSection.tsx

'use client';

import React, { useState } from 'react';
import { useGetDailyHoroscopeQuery } from '@/integrations/rtk/public/horoscopes.endpoints';
import { useLocaleShort } from '@/i18n';

const SIGNS = [
  { key: 'aries', label: 'Koç', en: 'Aries' },
  { key: 'taurus', label: 'Boğa', en: 'Taurus' },
  { key: 'gemini', label: 'İkizler', en: 'Gemini' },
  { key: 'cancer', label: 'Yengeç', en: 'Cancer' },
  { key: 'leo', label: 'Aslan', en: 'Leo' },
  { key: 'virgo', label: 'Başak', en: 'Virgo' },
  { key: 'libra', label: 'Terazi', en: 'Libra' },
  { key: 'scorpio', label: 'Akrep', en: 'Scorpio' },
  { key: 'sagittarius', label: 'Yay', en: 'Sagittarius' },
  { key: 'capricorn', label: 'Oğlak', en: 'Capricorn' },
  { key: 'aquarius', label: 'Kova', en: 'Aquarius' },
  { key: 'pisces', label: 'Balık', en: 'Pisces' },
];

export default function DailyHoroscopeSection() {
  const locale = useLocaleShort();
  const [selectedSign, setSelectedSign] = useState('aries');
  const { data: horoscope, isFetching } = useGetDailyHoroscopeQuery({ sign: selectedSign });

  const currentSign = SIGNS.find(s => s.key === selectedSign);

  return (
    <section className="py-24 lg:py-32 bg-[var(--gm-bg-deep)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          {/* Left: Sign Selector */}
          <div className="w-full lg:w-1/2 reveal" suppressHydrationWarning>
            <span className="font-display text-[11px] tracking-[0.42em] text-[var(--gm-gold-deep)] uppercase mb-6 block">
              GÜNLÜK KOZMİK HAVA
            </span>
            <h2 className="font-serif text-[clamp(2rem,4vw,3.5rem)] font-light leading-tight text-[var(--gm-text)] mb-12">
              Yıldızlar Bugün <em>Sizin İçin</em> Ne Söylüyor?
            </h2>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {SIGNS.map((sign) => (
                <button
                  key={sign.key}
                  onClick={() => setSelectedSign(sign.key)}
                  className={`py-4 px-2 rounded-sm border transition-all duration-500 text-center ${
                    selectedSign === sign.key 
                    ? 'border-[var(--gm-gold)] bg-[var(--gm-gold)] text-[var(--gm-bg)] shadow-glow' 
                    : 'border-[var(--gm-border-soft)] bg-[var(--gm-bg)] text-[var(--gm-text-dim)] hover:border-[var(--gm-gold)]'
                  }`}
                >
                  <span className="block font-display text-[10px] tracking-widest uppercase">
                    {locale === 'tr' ? sign.label : sign.en}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Interpretation Card */}
          <div className="w-full lg:w-1/2 reveal" style={{ transitionDelay: '200ms' }} suppressHydrationWarning>
            <div className="bg-[var(--gm-bg)] p-10 lg:p-14 border border-[var(--gm-border-soft)] shadow-card relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 font-display text-9xl pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                {currentSign?.key.charAt(0).toUpperCase()}
              </div>
              
              {isFetching ? (
                <div className="py-20 text-center animate-pulse">
                   <div className="w-12 h-12 border-2 border-[var(--gm-gold)] border-t-transparent rounded-full mx-auto mb-4 animate-spin" />
                   <p className="font-display text-[10px] tracking-widest text-[var(--gm-muted)] uppercase">Gökyüzü Okunuyor...</p>
                </div>
              ) : horoscope ? (
                <div>
                   <div className="flex justify-between items-center mb-8 border-b border-[var(--gm-border-soft)] pb-6">
                      <h3 className="font-serif text-3xl text-[var(--gm-gold)] italic">
                        {locale === 'tr' ? currentSign?.label : currentSign?.en}
                      </h3>
                      <span className="font-display text-[10px] tracking-widest text-[var(--gm-muted)] uppercase">
                        {new Date(horoscope.date).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long' })}
                      </span>
                   </div>
                   
                   <p className="text-[var(--gm-text)] font-serif text-lg leading-relaxed mb-10 italic">
                     {locale === 'tr' ? horoscope.contentTr : horoscope.contentEn || horoscope.contentTr}
                   </p>

                   <div className="grid grid-cols-3 gap-8 pt-8 border-t border-[var(--gm-border-soft)]">
                      <div>
                        <span className="block font-display text-[9px] tracking-[0.2em] text-[var(--gm-muted)] uppercase mb-2">MOD</span>
                        <div className="flex gap-1">
                           {[...Array(5)].map((_, i) => (
                             <div key={i} className={`h-1 flex-1 rounded-full ${i < (horoscope.moodScore / 2) ? 'bg-[var(--gm-gold)]' : 'bg-[var(--gm-border-soft)]'}`} />
                           ))}
                        </div>
                      </div>
                      <div>
                        <span className="block font-display text-[9px] tracking-[0.2em] text-[var(--gm-muted)] uppercase mb-1">ŞANSLI SAYI</span>
                        <span className="font-serif text-xl text-[var(--gm-text)]">{horoscope.luckyNumber}</span>
                      </div>
                      <div>
                        <span className="block font-display text-[9px] tracking-[0.2em] text-[var(--gm-muted)] uppercase mb-1">RENK</span>
                        <span className="font-serif text-sm text-[var(--gm-text)] italic">{horoscope.luckyColor}</span>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="py-20 text-center">
                   <p className="text-[var(--gm-text-dim)] font-light italic">Yorum yüklenemedi.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
