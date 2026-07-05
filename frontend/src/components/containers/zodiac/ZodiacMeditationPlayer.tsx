'use client';

import React from 'react';
import Link from 'next/link';
import { Pause, Play, Sparkles, Volume2 } from 'lucide-react';
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';
import { getZodiacAffirmationContent } from '@/lib/zodiac/affirmations';
import { ZODIAC_META } from '@/lib/zodiac/signs';
import type { ZodiacSign } from '@/types/common';
import { useAmbientMixerContext } from '@/context/ambient-mixer';

export default function ZodiacMeditationPlayer({ signKey }: { signKey: ZodiacSign }) {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_extra' as any);
  const { ui: uiZ } = useUiSection('ui_zodiacx' as any);
  const sign = ZODIAC_META[signKey];
  const content = getZodiacAffirmationContent(signKey);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [isAmbientOn, setIsAmbientOn] = React.useState(false);
  
  const { 
    togglePlay, 
    isPlaying: isMixerPlaying, 
    setMasterGain, 
    loadSignPreset,
    masterGain: currentMasterGain 
  } = useAmbientMixerContext();

  React.useEffect(() => {
    loadSignPreset(signKey);
  }, [signKey, loadSignPreset]);

  React.useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speechText = `${content.title}. ${content.meditation} Affirmations. ${content.affirmations.join(' ')}`;

  const handleToggleAmbient = async () => {
    await togglePlay();
    setIsAmbientOn(!isMixerPlaying);
  };

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setMasterGain(0.7); // Reset volume
      return;
    }

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : 'en-US';
    utterance.rate = 0.88;
    utterance.pitch = 0.95;
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      if (isMixerPlaying) setMasterGain(0.2); // Ducking
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      if (isMixerPlaying) setMasterGain(0.7); // Restore volume
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      if (isMixerPlaying) setMasterGain(0.7);
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    
    // Auto-start ambient if it's off
    if (!isMixerPlaying) {
      handleToggleAmbient();
    }
  };

  return (
    <section
      className="zodiac-accent-scope mx-auto max-w-5xl px-4 py-16 md:py-24"
      style={{ '--gm-zodiac-accent': sign.accent } as React.CSSProperties}
    >
      <div className="mb-10 rounded-[2rem] border border-brand-gold/20 bg-surface p-6 shadow-glow md:p-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-center">
          <div
            className="grid size-28 shrink-0 place-items-center rounded-[2rem] border text-6xl"
            style={{ borderColor: `${sign.accent}66`, backgroundColor: `${sign.accent}18` }}
          >
            {sign.symbol}
          </div>
          <div className="flex-1">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-gold/20 bg-brand-gold/10 px-4 py-2 text-sm text-brand-gold">
              <Volume2 className="size-4" />
              {ui('ui_extra_b4_zodiac_voice_affirmation', 'Voice affirmation')}
            </div>
            <h1 className="text-4xl font-semibold tracking-normal text-foreground md:text-5xl">
              {content.title}
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {sign.element} {uiZ('ui_zodiacx_meditation_element_label', 'element and')} {sign.modality.toLowerCase()} {uiZ('ui_zodiacx_meditation_modality_label', 'modality')} {content.focus}.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={toggleSpeech}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gold px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-background transition hover:bg-brand-gold/90 shadow-lg shadow-brand-gold/20"
          >
            {isSpeaking ? <Pause className="size-4" /> : <Play className="size-4" />}
            {isSpeaking ? ui('ui_extra_b4_zodiac_stop_voice', 'Stop voice') : ui('ui_extra_b4_zodiac_listen', 'Listen to meditation')}
          </button>

          <button
            type="button"
            onClick={handleToggleAmbient}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold uppercase tracking-wider transition border ${
              isMixerPlaying 
                ? 'bg-brand-gold/10 border-brand-gold text-brand-gold' 
                : 'bg-surface border-border/60 text-muted-foreground hover:border-brand-gold/40'
            }`}
          >
            <Volume2 className="size-4" />
            {isMixerPlaying ? ui('ui_extra_b4_zodiac_music_off', 'Turn music off') : ui('ui_extra_b4_zodiac_music_on', 'Background music')}
          </button>

          {isMixerPlaying && (
            <div className="flex items-center gap-3 px-4 py-2 bg-surface/50 rounded-xl border border-border/40">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{ui('ui_extra_b4_zodiac_volume', 'Volume')}</span>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={currentMasterGain}
                onChange={(e) => setMasterGain(parseFloat(e.target.value))}
                className="w-24 h-1 bg-brand-gold/20 rounded-lg appearance-none cursor-pointer accent-brand-gold"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <article className="rounded-2xl border border-border/50 bg-surface p-6 md:p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
             <Sparkles size={120} />
          </div>
          <div className="mb-4 flex items-center gap-3 text-brand-gold relative">
            <Sparkles className="size-5" />
            <h2 className="text-xl font-semibold text-foreground">{ui('ui_extra_b4_zodiac_focus_text', '3-minute focus text')}</h2>
          </div>
          <p className="text-lg leading-8 text-muted-foreground relative">{content.meditation}</p>
        </article>

        <aside className="rounded-2xl border border-border/50 bg-surface p-6">
          <h2 className="mb-6 text-xl font-semibold flex items-center gap-2">
             <div className="size-2 rounded-full bg-brand-gold" />
             {ui('ui_extra_b4_zodiac_daily_affirmations', 'Daily affirmations')}
          </h2>
          <div className="space-y-4">
            {content.affirmations.map((affirmation, i) => (
              <div key={i} className="group rounded-xl border border-border/40 bg-background/35 p-5 text-sm leading-6 text-muted-foreground hover:border-brand-gold/30 hover:bg-brand-gold/5 transition-all duration-300">
                <span className="text-brand-gold/40 font-mono text-[10px] block mb-1">0{i+1}</span>
                {affirmation}
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={localizePath(locale, `/burclar/${sign.key}`)}
          className="rounded-xl border border-border/60 px-4 py-3 text-sm font-semibold text-foreground transition hover:border-brand-gold/50 hover:text-brand-gold"
        >
          {sign.label} {ui('ui_extra_b4_zodiac_open_profile', 'open profile')}
        </Link>
        <Link
          href={localizePath(locale, `/burclar/${sign.key}/bugun`)}
          className="rounded-xl border border-border/60 px-4 py-3 text-sm font-semibold text-foreground transition hover:border-brand-gold/50 hover:text-brand-gold"
        >
          {ui('ui_extra_b4_zodiac_read_daily', 'Read daily interpretation')}
        </Link>
      </div>
    </section>
  );
}
