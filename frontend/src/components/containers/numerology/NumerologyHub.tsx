'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cinzel, Manrope } from 'next/font/google';
import { 
  Binary, 
  Sparkles, 
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
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 min-h-[80vh] flex flex-col">
      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto text-brand-gold">
                <Binary className="w-10 h-10" />
              </div>
              <h1 className={`${cinzel.className} text-4xl md:text-6xl text-foreground`}>Numeroloji Analizi</h1>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto italic font-serif leading-relaxed">
                İsminiz ve doğum tarihiniz, ruhunuzun bu hayattaki planını sayılarla fısıldar.
              </p>
            </div>

            <form onSubmit={handleCalculate} className="max-w-md mx-auto space-y-6 bg-surface/30 p-8 rounded-[2.5rem] border border-border/20 shadow-xl">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground tracking-widest uppercase ml-4">Tam İsim (Doğumdaki)</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-gold/50" />
                  <input
                    required
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="Adınız ve Soyadınız"
                    className="w-full bg-surface-high/50 border border-border/20 rounded-2xl py-4 pl-14 pr-6 focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold/50 transition-all text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground tracking-widest uppercase ml-4">Doğum Tarihi</label>
                <div className="relative">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-gold/50" />
                  <input
                    required
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                    className="w-full bg-surface-high/50 border border-border/20 rounded-2xl py-4 pl-14 pr-6 focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold/50 transition-all text-foreground outline-none appearance-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-gold text-bg-base font-bold py-5 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
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
            className="flex-1 flex flex-col items-center justify-center py-20"
          >
            <div className="relative w-40 h-40">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 border border-dashed border-brand-gold/30 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-4 border border-dashed border-brand-gold/20 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="flex flex-col items-center gap-1">
                    <motion.span 
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`${cinzel.className} text-2xl text-brand-gold`}
                    >
                      7...3...9
                    </motion.span>
                    <Binary className="w-8 h-8 text-brand-gold/50" />
                 </div>
              </div>
            </div>
            <div className="mt-16 text-center space-y-4">
              <h2 className={`${cinzel.className} text-3xl text-brand-gold`}>Sayılar Diziliyor...</h2>
              <p className="text-muted-foreground italic font-serif">Kader çarkınızdaki numerolojik kodlar analiz ediliyor.</p>
            </div>
          </motion.div>
        )}

        {step === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12 py-10"
          >
             <div className="text-center space-y-4">
              <h1 className={`${cinzel.className} text-4xl md:text-5xl text-foreground`}>Sayılarınızın Gücü</h1>
              <p className="text-muted-foreground font-serif italic">{formData.full_name}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
               {[
                 { label: 'HAYAT YOLU', value: result.calculation.lifePath, icon: Target, color: 'text-blue-400' },
                 { label: 'KADER SAYISI', value: result.calculation.destiny, icon: Zap, color: 'text-brand-gold' },
                 { label: 'RUH GÜDÜSÜ', value: result.calculation.soulUrge, icon: Heart, color: 'text-rose-400' },
                 { label: 'KİŞİLİK', value: result.calculation.personality, icon: Hash, color: 'text-emerald-400' },
               ].map((item, i) => (
                 <div key={i} className="bg-surface/40 border border-border/20 rounded-3xl p-6 text-center space-y-3 shadow-lg">
                    <item.icon className={`w-6 h-6 mx-auto ${item.color}`} />
                    <div className="text-3xl font-bold text-foreground tracking-tighter">{item.value}</div>
                    <div className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">{item.label}</div>
                 </div>
               ))}
            </div>

            <div className="relative">
               <div className="absolute -inset-4 bg-brand-gold/5 rounded-[4rem] blur-3xl"></div>
               <div className="relative bg-surface/50 border border-border/40 rounded-[3rem] p-10 md:p-16 shadow-2xl overflow-hidden">
                  <div className="prose prose-invert max-w-none prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-lg prose-p:mb-8 prose-strong:text-brand-gold prose-headings:text-brand-gold">
                    {result.interpretation.split('\n').map((line: string, i: number) => (
                      line.trim() ? <p key={i}>{line}</p> : <br key={i} />
                    ))}
                  </div>

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

                  <div className="mt-16 pt-10 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-8">
                    <p className="text-sm text-muted-foreground italic font-serif">
                      * Pisagor numeroloji sistemi temel alınarak yapay zeka tarafından analiz edilmiştir.
                    </p>
                    <div className="flex items-center gap-6">
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
                        className="flex items-center gap-3 text-brand-gold font-bold uppercase tracking-widest text-sm hover:text-brand-gold/80 transition-colors"
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
