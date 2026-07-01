'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cinzel, Fraunces } from 'next/font/google';
import {
  CloudMoon,
  Sparkles,
  RotateCcw,
  Send,
  Moon,
  Star,
  Compass,
  ArrowRight
} from 'lucide-react';
import Image from 'next/image';
import { useInterpretDreamMutation } from '@/integrations/rtk/public/dreams.public.endpoints';
import { useUiSection } from '@/i18n';
import ShareCard from '@/components/common/ShareCard';
import ConsultantFunnelCTA from '@/components/common/ConsultantFunnelCTA';
import { toast } from 'sonner';
import Link from 'next/link';

const cinzel = Cinzel({ subsets: ['latin'] });
const fraunces = Fraunces({ subsets: ['latin'], weight: ['400', '700'], style: ['normal', 'italic'] });

export default function DreamHub() {
  const { ui } = useUiSection('ui_dreams');
  const [dreamText, setDreamText] = useState('');
  const [step, setStep] = useState<'input' | 'processing' | 'result'>('input');
  const [result, setResult] = useState<any>(null);
  const [loadingPhase, setLoadingPhase] = useState(0);

  const LOADING_PHASES = [
    ui('ui_dreams_phase1', 'Reading the symbols in your dream...'),
    ui('ui_dreams_phase2', 'Diving into the depths of the subconscious...'),
    ui('ui_dreams_phase3', 'Blending the meanings together...'),
    ui('ui_dreams_phase4', 'Analyzing archetypes...'),
    ui('ui_dreams_phase5', 'Preparing your personal interpretation...')
  ];

  const [interpretDream, { isLoading }] = useInterpretDreamMutation();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'processing') {
      interval = setInterval(() => {
        setLoadingPhase((prev) => (prev + 1) % LOADING_PHASES.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const handleInterpret = async () => {
    if (dreamText.length < 50) {
      toast.error(ui('ui_dreams_too_short', 'Please describe your dream in a little more detail (at least 50 characters).'));
      return;
    }
    
    setStep('processing');
    try {
      const res = await interpretDream({
        dream_text: dreamText,
        locale: 'tr'
      }).unwrap();
      setResult(res.data);
      setStep('result');
    } catch (err: any) {
      console.error('Dream interpretation failed:', err);
      toast.error(err?.data?.message || ui('ui_dreams_interpret_failed', 'An error occurred while interpreting your dream. Please try again.'));
      setStep('input');
    }
  };

  const textStatus = dreamText.length === 0 ? '' :
                   dreamText.length < 50 ? ui('ui_dreams_status_insufficient', 'Not enough') :
                   dreamText.length < 200 ? ui('ui_dreams_status_good', 'Good') : ui('ui_dreams_status_great', 'Great detail!');

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-20 min-h-[80vh] flex flex-col">
      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            {/* Hero photo banner */}
            <div className="relative w-full max-w-4xl mx-auto rounded-[3rem] overflow-hidden shadow-2xl" style={{ height: 360 }}>
              <Image
                src="/images/ruya-tabiri-hero.png"
                alt={ui('ui_dreams_hero_alt', 'Dream Interpretation')}
                fill
                className="object-cover object-top"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/15" />
              <div className="absolute inset-x-0 bottom-0 p-10 text-center">
                <h2 className={`${cinzel.className} text-4xl md:text-6xl text-white tracking-tight drop-shadow-lg`}>{ui('ui_dreams_hero_title', 'The Language of the Subconscious')}</h2>
                <p className={`${fraunces.className} text-white/70 text-lg mt-3 italic`}>
                  {ui('ui_dreams_hero_subtitle', 'Dreams say what the soul cannot say while awake. Explore the hidden language of the subconscious.')}
                </p>
              </div>
              {/* Floating crescent badge */}
              <div className="absolute top-6 right-6 w-14 h-14 rounded-full bg-black/40 border border-white/20 backdrop-blur-sm flex items-center justify-center">
                <Moon className="w-7 h-7 text-amber-300" />
              </div>
            </div>

            <div className="relative group max-w-3xl mx-auto w-full">
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary/30 to-[var(--gm-primary-light)]/30 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-surface/80 backdrop-blur-xl border border-[var(--gm-text)]/5 rounded-[2.5rem] p-6 md:p-10 shadow-2xl">
                <textarea
                  value={dreamText}
                  onChange={(e) => setDreamText(e.target.value)}
                  placeholder={ui('ui_dreams_textarea_placeholder', 'What did you see in your dream? Describe places, people, colors and feelings in at least 50 characters...')}
                  className="w-full h-72 rounded-2xl bg-bg-primary border border-border-light focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-xl font-serif leading-relaxed text-text-primary placeholder:text-text-muted/60 resize-none p-5 outline-none transition-colors"
                />
                <div className="flex flex-col md:flex-row items-center justify-between mt-6 pt-6 border-t border-[var(--gm-text)]/5 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">{ui('ui_dreams_label_character', 'Characters')}</span>
                      <span className={`text-sm font-bold ${dreamText.length < 50 ? 'text-[var(--gm-warning)]' : 'text-brand-primary'}`}>
                        {dreamText.length} / 2000
                      </span>
                    </div>
                    {textStatus && (
                      <div className="flex flex-col border-l border-[var(--gm-text)]/10 pl-4">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">{ui('ui_dreams_label_status', 'Status')}</span>
                        <span className="text-sm font-bold text-foreground">{textStatus}</span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handleInterpret}
                    disabled={dreamText.length < 50 || isLoading}
                    className={`group relative px-10 py-5 rounded-full font-bold transition-all flex items-center gap-3 overflow-hidden ${
                      dreamText.length >= 50 
                        ? 'bg-brand-primary text-(--gm-bg) shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95' 
                        : 'bg-surface-high text-muted-foreground cursor-not-allowed border border-[var(--gm-text)]/5'
                    }`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {ui('ui_dreams_submit', 'INTERPRET MY DREAM')} <Send className={`w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1`} />
                    </span>
                    {dreamText.length >= 50 && (
                      <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--gm-text)]/20 to-transparent skew-x-12"
                      />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { img: '/images/ruya-tabiri-archetype.png', title: ui('ui_dreams_card1_title', 'Archetype Analysis'), desc: ui('ui_dreams_card1_desc', 'Psychological reflections of the figures in your dream.') },
                { img: '/images/ruya-tabiri-symbols.png',   title: ui('ui_dreams_card2_title', 'Symbol Guide'), desc: ui('ui_dreams_card2_desc', 'Matched with 100+ ancient dream symbols.') },
                { img: '/images/ruya-tabiri-hero.png',      title: ui('ui_dreams_card3_title', 'Spiritual Guidance'), desc: ui('ui_dreams_card3_desc', 'Intuitive clues and guidance for what comes next.') },
              ].map((item, i) => (
                <div key={i} className="group relative rounded-[2rem] overflow-hidden shadow-lg hover:scale-[1.02] transition-transform duration-300" style={{ minHeight: 220 }}>
                  <Image src={item.img} alt={item.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/15" />
                  <div className="relative z-10 p-6 flex flex-col justify-end" style={{ minHeight: 220 }}>
                    <h4 className={`${cinzel.className} text-base text-amber-400 mb-2`}>{item.title}</h4>
                    <p className="text-sm text-white/65 leading-relaxed font-serif italic">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center py-20 min-h-[60vh]"
          >
            <div className="relative w-64 h-64">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: [0, (Math.random() - 0.5) * 300],
                    y: [0, (Math.random() - 0.5) * 300],
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    delay: i * 0.2,
                    ease: "easeOut"
                  }}
                  className="absolute left-1/2 top-1/2 text-brand-primary"
                >
                  <Star className="w-4 h-4 fill-current" />
                </motion.div>
              ))}

              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
                }}
                className="absolute inset-0 border-2 border-dashed border-brand-primary/30 rounded-full"
              />
              
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    filter: ['blur(0px)', 'blur(2px)', 'blur(0px)']
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-brand-primary"
                >
                  <Moon className="w-16 h-16 fill-current" />
                </motion.div>
              </div>
            </div>
            
            <div className="mt-16 text-center space-y-6">
              <AnimatePresence mode="wait">
                <motion.h2 
                  key={loadingPhase}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`${cinzel.className} text-3xl md:text-4xl text-brand-primary tracking-wide`}
                >
                  {LOADING_PHASES[loadingPhase]}
                </motion.h2>
              </AnimatePresence>
              <p className={`${fraunces.className} text-muted-foreground italic text-lg opacity-60`}>
                {ui('ui_dreams_processing_note', 'Please do not close the window, your message is being prepared...')}
              </p>
            </div>
          </motion.div>
        )}

        {step === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-16 py-10"
          >
             <div className="text-center space-y-4">
              <span className="text-xs font-bold tracking-[0.3em] text-brand-primary uppercase opacity-60">{ui('ui_dreams_result_eyebrow', 'Subconscious Reflection of Your Dream')}</span>
              <h2 className={`${cinzel.className} text-5xl md:text-7xl text-foreground`}>{ui('ui_dreams_result_title', 'Dream Analysis')}</h2>
            </div>

            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {result.symbols?.map((s: any, i: number) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-surface/30 border border-brand-primary/20 rounded-3xl p-6 flex flex-col items-center text-center group hover:bg-brand-primary/5 transition-colors min-w-[140px]"
                >
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary mb-4 group-hover:scale-110 transition-transform text-2xl">
                    {s.icon || '✨'}
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-1 uppercase tracking-widest text-xs">{s.name}</h3>
                  <div className="w-full bg-brand-primary/10 h-1 rounded-full overflow-hidden mt-2">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.confidence || 0.9) * 100}%` }}
                      className="h-full bg-brand-primary"
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="relative">
               <div className="absolute -inset-10 bg-brand-primary/5 rounded-[5rem] blur-[100px] pointer-events-none"></div>
               <div className="relative bg-surface/40 backdrop-blur-2xl border border-[var(--gm-text)]/5 rounded-[3rem] p-8 md:p-20 shadow-2xl">
                  <div className={`${fraunces.className} prose prose-invert max-w-none prose-p:text-muted-foreground prose-p:leading-[1.8] prose-p:text-xl md:prose-p:text-2xl prose-p:mb-10 prose-strong:text-brand-primary prose-strong:font-bold`}>
                    {result.interpretation.split('\n').map((line: string, i: number) => (
                      line.trim() ? <p key={i}>{line}</p> : <div key={i} className="h-4" />
                    ))}
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-20 p-8 rounded-[2.5rem] bg-gradient-to-br from-brand-primary/10 to-[var(--gm-primary-dark)]/10 border border-brand-primary/20 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                      <Star className="w-32 h-32 text-brand-primary" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="space-y-3 text-center md:text-left">
                        <h4 className={`${cinzel.className} text-2xl text-brand-primary`}>{ui('ui_dreams_tarot_cta_title', 'Today’s Reflection of This Dream')}</h4>
                        <p className="text-muted-foreground text-lg">
                          {ui('ui_dreams_tarot_cta_desc', 'Draw one tarot card to carry the energy of your dream into today; cards often reflect the same theme.')}
                        </p>
                      </div>
                      <Link 
                        href="/tr/tarot?spread=one_card"
                        className="px-8 py-4 bg-brand-primary text-(--gm-bg) rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
                      >
                        {ui('ui_dreams_draw_one_card', 'DRAW 1 CARD')} <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </motion.div>

                  <ConsultantFunnelCTA
                    feature="ruya"
                    intensity="heavy"
                    context={{
                      symbols: result.symbols?.map((s: any) => s.name).join(', '),
                    }}
                  />

                  <div className="mt-20 pt-10 border-t border-[var(--gm-text)]/5 flex flex-col lg:flex-row items-center justify-between gap-10">
                    <div className="flex flex-col gap-2 text-center lg:text-left">
                      <p className="text-sm text-muted-foreground italic font-serif opacity-50">
                        {ui('ui_dreams_ai_disclaimer', '* This interpretation was generated by AI using Jungian archetypes and ancient symbolism.')}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <ShareCard
                        title={ui('ui_dreams_share_title', 'Share My Dream Reading')}
                        shareText={`${ui('ui_dreams_share_text_line1', 'I interpreted my dream on GoldMoodAstro ✨')}\n${ui('ui_dreams_share_text_symbols', 'My symbols:')} ${result.symbols.map((s: any) => s.name).join(', ')}\n${ui('ui_dreams_share_text_line3', 'Discover the hidden message of the subconscious:')}`}
                        variant="dream"
                        data={{
                          symbols: result.symbols.map((s: any) => s.name),
                          excerpt: result.interpretation.slice(0, 150) + '...'
                        }}
                      />
                      <button 
                        onClick={() => {
                          setStep('input');
                          setDreamText('');
                          setResult(null);
                        }}
                        className="flex items-center gap-2 px-6 py-3 rounded-full bg-surface-high hover:bg-surface transition-colors font-bold text-xs uppercase tracking-widest text-brand-primary"
                      >
                        {ui('ui_dreams_interpret_again', 'INTERPRET AGAIN')} <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
