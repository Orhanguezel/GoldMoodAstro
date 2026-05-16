'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cinzel } from 'next/font/google';
import { 
  Binary, 
  ChevronRight, 
  RotateCcw,
  User,
  Calendar,
  Hash,
  Heart,
  Target,
  Zap
} from 'lucide-react';
import { useCalculateNumerologyMutation } from '@/integrations/rtk/public/numerology.public.endpoints';
import ShareCard from '@/components/common/ShareCard';
import ConsultantFunnelCTA from '@/components/common/ConsultantFunnelCTA';

const cinzel = Cinzel({ subsets: ['latin'] });

export default function NumerologyHub() {
  const [formData, setFormData] = useState({ full_name: '', birth_date: '' });
  const [step, setStep] = useState<'input' | 'processing' | 'result'>('input');
  const [result, setResult] = useState<any>(null);

  const [calculate, { isLoading }] = useCalculateNumerologyMutation();

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.birth_date) return;
    
    setStep('processing');

    try {
      const res = await calculate({
        ...formData,
        locale: 'tr'
      }).unwrap();
      setResult(res.data);
      setStep('result');
    } catch (err) {
      console.error('Numerology calculation failed:', err);
      setStep('input');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 md:py-24 flex flex-col">
      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-16"
          >
            <div className="text-center space-y-8">
              <div className="w-24 h-24 bg-(--gm-gold)/10 rounded-full flex items-center justify-center mx-auto text-(--gm-gold) border border-(--gm-gold)/20 shadow-(--gm-shadow-glow)">
                <Binary className="w-12 h-12" />
              </div>
              <h1 className={`${cinzel.className} text-5xl md:text-7xl text-(--gm-text) tracking-tight`}>Numeroloji Analizi</h1>
              <p className="text-(--gm-text-dim) text-xl max-w-2xl mx-auto italic font-serif leading-relaxed opacity-80">
                İsminiz ve doğum tarihiniz, ruhunuzun bu hayattaki planını sayılarla fısıldar.
              </p>
            </div>

            <form onSubmit={handleCalculate} className="max-w-lg mx-auto space-y-10 bg-(--gm-surface) p-10 md:p-12 rounded-[3rem] border border-(--gm-border-soft) shadow-(--gm-shadow-card) relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-(--gm-gold)/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-4 relative">
                <label htmlFor="numerology-full-name" className="text-[10px] font-bold text-(--gm-muted) tracking-[0.3em] uppercase ml-4">Tam İsim (Doğumdaki)</label>
                <div className="relative">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-(--gm-gold)/50" />
                  <input
                    id="numerology-full-name"
                    required
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="Adınız ve Soyadınız"
                    className="w-full bg-(--gm-bg-deep)/50 border border-(--gm-border-soft) rounded-[1.5rem] py-5 pl-16 pr-6 focus:ring-2 focus:ring-(--gm-gold)/20 focus:border-(--gm-gold)/50 transition-all text-(--gm-text) outline-none font-serif text-lg"
                  />
                </div>
              </div>

              <div className="space-y-4 relative">
                <label htmlFor="numerology-birth-date" className="text-[10px] font-bold text-(--gm-muted) tracking-[0.3em] uppercase ml-4">Doğum Tarihi</label>
                <div className="relative">
                  <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-(--gm-gold)/50" />
                  <input
                    id="numerology-birth-date"
                    required
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                    className="w-full bg-(--gm-bg-deep)/50 border border-(--gm-border-soft) rounded-[1.5rem] py-5 pl-16 pr-6 focus:ring-2 focus:ring-(--gm-gold)/20 focus:border-(--gm-gold)/50 transition-all text-(--gm-text) outline-none appearance-none font-serif text-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-(--gm-gold) text-(--gm-bg-deep) font-bold py-6 rounded-full shadow-(--gm-shadow-gold) hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group tracking-[0.2em] text-xs"
              >
                HESAPLA & YORUMLA <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center py-24"
          >
            <div className="relative w-48 h-48">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 border-2 border-dashed border-(--gm-gold)/30 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-6 border border-dashed border-(--gm-gold)/20 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="flex flex-col items-center gap-2">
                    <motion.span 
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`${cinzel.className} text-3xl text-(--gm-gold) tracking-[0.2em]`}
                    >
                      7...3...9
                    </motion.span>
                    <Binary className="w-10 h-10 text-(--gm-gold)/50" />
                 </div>
              </div>
            </div>
            <div className="mt-20 text-center space-y-6">
              <h2 className={`${cinzel.className} text-4xl text-(--gm-gold) tracking-widest`}>Sayılar Diziliyor...</h2>
              <p className="text-(--gm-text-dim) italic font-serif text-xl opacity-70">Kader çarkınızdaki numerolojik kodlar analiz ediliyor.</p>
            </div>
          </motion.div>
        )}

        {step === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-16 py-10"
          >
             <div className="text-center space-y-4">
              <h1 className={`${cinzel.className} text-5xl md:text-6xl text-(--gm-text) tracking-tight`}>Sayılarınızın Gücü</h1>
              <p className="text-(--gm-text-dim) font-serif italic text-2xl opacity-60">{formData.full_name}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
               {[
                 { label: 'HAYAT YOLU', value: result.calculation.lifePath, icon: Target, color: 'text-[var(--gm-info)]' },
                 { label: 'KADER SAYISI', value: result.calculation.destiny, icon: Zap, color: 'text-(--gm-gold)' },
                 { label: 'RUH GÜDÜSÜ', value: result.calculation.soulUrge, icon: Heart, color: 'text-[var(--gm-error)]' },
                 { label: 'KİŞİLİK', value: result.calculation.personality, icon: Hash, color: 'text-[var(--gm-success)]' },
               ].map((item, i) => (
                 <div key={i} className="bg-(--gm-surface) border border-(--gm-border-soft) rounded-[2.5rem] p-10 text-center space-y-4 shadow-(--gm-shadow-soft) hover:border-(--gm-gold)/40 transition-colors group">
                    <item.icon className={`w-8 h-8 mx-auto ${item.color} group-hover:scale-110 transition-transform`} />
                    <div className="text-5xl font-bold text-(--gm-text) tracking-tighter">{item.value}</div>
                    <div className="text-[10px] font-bold text-(--gm-muted) tracking-[0.3em] uppercase">{item.label}</div>
                 </div>
               ))}
            </div>

            <div className="relative">
               <div className="absolute -inset-10 bg-(--gm-gold)/5 rounded-[5rem] blur-3xl"></div>
               <div className="relative bg-(--gm-surface) border border-(--gm-border-soft) rounded-[4rem] p-10 md:p-20 shadow-(--gm-shadow-card) overflow-hidden">
                  <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none text-(--gm-gold)">
                    <Binary className="w-96 h-96" />
                  </div>

                  <div className="relative z-10 font-serif text-xl md:text-2xl leading-[1.8] text-(--gm-text-dim) space-y-10">
                    {result.interpretation.split('\n').map((line: string, i: number) => (
                      line.trim() ? <p key={i} className="opacity-90">{line}</p> : <div key={i} className="h-6" />
                    ))}
                  </div>

                  <div className="mt-20">
                    <ConsultantFunnelCTA
                      feature="numeroloji"
                      intensity="heavy"
                      context={{
                        lifePath: result.calculation.lifePath,
                        destiny: result.calculation.destiny,
                        soulUrge: result.calculation.soulUrge,
                        personality: result.calculation.personality,
                      }}
                    />
                  </div>

                  <div className="mt-20 pt-12 border-t border-(--gm-border-soft) flex flex-col lg:flex-row items-center justify-between gap-12">
                    <p className="text-[11px] text-(--gm-muted) italic font-serif leading-relaxed max-w-md uppercase tracking-widest opacity-60">
                      * Pisagor numeroloji sistemi temel alınarak yapay zeka tarafından analiz edilmiştir.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-10">
                      <ShareCard 
                        title="Numeroloji Analizimi Paylaş"
                        shareText={`GoldMoodAstro'da numeroloji analizimi yaptım ✨\nHayat Yolu: ${result.calculation.lifePath} • Kader: ${result.calculation.destiny}\nSenin sayıların ne diyor?`}
                        variant="numerology"
                        data={{
                          lifePath: result.calculation.lifePath,
                          destiny: result.calculation.destiny,
                          soulUrge: result.calculation.soulUrge,
                          personality: result.calculation.personality
                        }}
                      />
                      <button 
                        onClick={() => {
                          setStep('input');
                          setFormData({ full_name: '', birth_date: '' });
                          setResult(null);
                        }}
                        className="flex items-center gap-4 text-(--gm-gold) font-bold uppercase tracking-[0.2em] text-xs hover:text-(--gm-gold-dim) transition-colors"
                      >
                        YENİ HESAPLAMA <RotateCcw className="w-4 h-4" />
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
