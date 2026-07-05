'use client';

import React, { useState } from 'react';
import { useGetDailyHoroscopeQuery } from '@/integrations/rtk/public/horoscopes.endpoints';
import { useLocaleShort, useUiSection } from '@/i18n';
import { Sparkles, Star, Zap, Info, Calendar } from 'lucide-react';
import { getZodiacMeta, localizeSign } from '@/lib/zodiac/signs';

const SIGNS = [
  { key: 'aries', label: 'Aries', symbol: '♈' },
  { key: 'taurus', label: 'Taurus', symbol: '♉' },
  { key: 'gemini', label: 'Gemini', symbol: '♊' },
  { key: 'cancer', label: 'Cancer', symbol: '♋' },
  { key: 'leo', label: 'Aslan', symbol: '♌' },
  { key: 'virgo', label: 'Virgo', symbol: '♍' },
  { key: 'libra', label: 'Libra', symbol: '♎' },
  { key: 'scorpio', label: 'Scorpio', symbol: '♏' },
  { key: 'sagittarius', label: 'Sagittarius', symbol: '♐' },
  { key: 'capricorn', label: 'Capricorn', symbol: '♑' },
  { key: 'aquarius', label: 'Aquarius', symbol: '♒' },
  { key: 'pisces', label: 'Pisces', symbol: '♓' },
];

export default function DailyHoroscopeSection() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_daily');
  const [selectedSign, setSelectedSign] = useState('aries');
  const { data: horoscope, isFetching } = useGetDailyHoroscopeQuery({ sign: selectedSign, locale });

  const signs = React.useMemo(() => SIGNS.map((sign) => {
    const meta = getZodiacMeta(sign.key);
    return {
      ...sign,
      label: meta ? localizeSign(meta, locale).label : sign.label,
    };
  }), [locale]);
  const currentSign = signs.find(s => s.key === selectedSign);
  const localeTag = locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : 'en-US';
  const horoscopeDate = horoscope?.date ?? horoscope?.period_start_date;
  const horoscopeContent = horoscope?.content ?? horoscope?.contentTr ?? horoscope?.contentEn ?? '';
  const moodScore = Number(horoscope?.mood_score ?? horoscope?.moodScore ?? 0);
  const luckyNumber = horoscope?.lucky_number ?? horoscope?.luckyNumber ?? '-';
  const luckyColor = horoscope?.lucky_color ?? horoscope?.luckyColor ?? '-';

  return (
    <section className="py-24 lg:py-40 bg-[var(--gm-bg)] overflow-hidden relative">
      {/* Decorative Elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[var(--gm-gold)] opacity-[0.03] blur-[120px] rounded-full" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[var(--gm-gold)] opacity-[0.03] blur-[120px] rounded-full" />

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="flex flex-col lg:flex-row gap-20 items-start">
          
          {/* Left: Content & Sign Grid */}
          <div className="w-full lg:w-5/12">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-8 h-px bg-[var(--gm-gold)]" />
              <span className="text-[var(--gm-gold)] font-bold text-xs uppercase tracking-[0.2em]">{ui('ui_daily_horoscope_eyebrow', 'Sky Movements')}</span>
            </div>

            <h2
              className="font-serif text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] text-[var(--gm-text)] mb-8"
              dangerouslySetInnerHTML={{ __html: ui('ui_daily_horoscope_heading', 'What do the stars <br /><em>say for you</em> today?') }}
            />

            <p className="text-[var(--gm-text-dim)] text-lg mb-12 max-w-md font-serif italic">
              {ui('ui_daily_horoscope_subheading', 'Discover your sign daily energy and cosmic guidance.')}
            </p>

            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-3">
              {signs.map((sign) => (
                <button
                  key={sign.key}
                  onClick={() => setSelectedSign(sign.key)}
                  className={`group relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-500 border ${
                    selectedSign === sign.key 
                    ? 'bg-[var(--gm-gold)] border-[var(--gm-gold)] text-[var(--gm-bg-deep)] scale-105 shadow-[0_0_40px_rgba(201,169,97,0.3)]' 
                    : 'bg-[var(--gm-surface)] border-[var(--gm-border-soft)] text-[var(--gm-text-dim)] hover:border-[var(--gm-gold)] hover:text-[var(--gm-gold)]'
                  }`}
                >
                  <span className="text-2xl mb-1 font-serif">{sign.symbol}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">{sign.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Interpretation Card */}
          <div className="w-full lg:w-7/12">
            <div className="relative group">
              {/* Outer Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[var(--gm-gold)] to-[var(--gm-gold-dim)] rounded-[40px] opacity-20 blur group-hover:opacity-30 transition duration-1000" />
              
              <div className="relative bg-[var(--gm-surface)] rounded-[32px] border border-[var(--gm-border-soft)] p-8 md:p-16 overflow-hidden">
                {/* Sign Watermark */}
                <div className="absolute -top-10 -right-10 text-[20rem] font-serif text-[var(--gm-gold)] opacity-[0.03] select-none pointer-events-none group-hover:scale-110 transition-transform duration-[2000ms]">
                  {currentSign?.symbol}
                </div>

                {isFetching ? (
                  <div className="py-24 text-center">
                    <div className="w-12 h-12 border-2 border-[var(--gm-gold)] border-t-transparent rounded-full mx-auto mb-6 animate-spin" />
                    <p className="font-serif text-[var(--gm-text-dim)] italic tracking-widest">{ui('ui_daily_horoscope_loading', 'The planets are aligning...')}</p>
                  </div>
                ) : horoscope ? (
                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 pb-8 border-b border-[var(--gm-border-soft)]">
                      <div className="flex items-center gap-6">
                        <span className="w-20 h-20 rounded-full bg-[var(--gm-bg-deep)] flex items-center justify-center text-5xl text-[var(--gm-gold)] border border-[var(--gm-gold)]/20">
                          {currentSign?.symbol}
                        </span>
                        <div>
                          <h3 className="font-serif text-4xl text-[var(--gm-text)]">{currentSign?.label}</h3>
                          <p className="text-[var(--gm-gold-dim)] text-xs font-bold tracking-[0.2em] uppercase mt-1">{ui('ui_daily_horoscope_today_label', 'Today Reading')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[var(--gm-text-dim)] font-serif italic text-sm">
                        <Calendar className="w-4 h-4 text-[var(--gm-gold)]" />
                        {horoscopeDate ? new Date(horoscopeDate).toLocaleDateString(localeTag, { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                      </div>
                    </div>

                    <p className="text-[var(--gm-text)] font-serif text-[1.35rem] leading-[1.8] mb-12 italic opacity-90 first-letter:text-5xl first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-[var(--gm-gold)]">
                      {horoscopeContent}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 rounded-2xl bg-[var(--gm-bg-deep)]/50 border border-[var(--gm-border-soft)]">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="w-3 h-3 text-[var(--gm-gold)]" />
                          <span className="font-bold text-[10px] tracking-widest text-[var(--gm-gold)] uppercase">{ui('ui_daily_horoscope_mood_label', 'Mood')}</span>
                        </div>
                        <div className="flex gap-1.5">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full ${i < (moodScore / 2) ? 'bg-[var(--gm-gold)]' : 'bg-[var(--gm-surface-high)]'}`} />
                          ))}
                        </div>
                      </div>
                      <div className="md:border-l border-[var(--gm-border-soft)] md:pl-8">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-3 h-3 text-[var(--gm-gold)]" />
                          <span className="font-bold text-[10px] tracking-widest text-[var(--gm-gold)] uppercase">{ui('ui_daily_horoscope_lucky_number_label', 'Lucky Number')}</span>
                        </div>
                        <span className="font-serif text-2xl text-[var(--gm-text)]">{luckyNumber}</span>
                      </div>
                      <div className="md:border-l border-[var(--gm-border-soft)] md:pl-8">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-3 h-3 text-[var(--gm-gold)]" />
                          <span className="font-bold text-[10px] tracking-widest text-[var(--gm-gold)] uppercase">{ui('ui_daily_horoscope_lucky_color_label', 'Lucky Color')}</span>
                        </div>
                        <span className="font-serif text-lg text-[var(--gm-text)] italic capitalize">{luckyColor}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-24 text-center">
                    <Info className="w-12 h-12 text-[var(--gm-text-dim)] opacity-20 mx-auto mb-4" />
                    <p className="text-[var(--gm-text-dim)] font-light italic">{ui('ui_daily_horoscope_unavailable', 'Cosmic data is currently unavailable.')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
