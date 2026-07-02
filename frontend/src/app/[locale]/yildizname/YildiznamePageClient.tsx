'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cinzel, Fraunces } from 'next/font/google';
import { 
  Sparkles, 
  Moon, 
  ChevronRight, 
  User, 
  Heart,
  Calendar,
  ArrowLeft,
  Star
} from 'lucide-react';
import { useReadYildiznameMutation } from '@/integrations/rtk/public/yildizname.public.endpoints';
import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';

import { useUiSection } from '@/i18n';

const cinzel = Cinzel({ subsets: ['latin'] });
const fraunces = Fraunces({ subsets: ['latin'], style: 'italic' });

export default function YildiznamePage() {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const locale = typeof params?.locale === 'string' ? params.locale : 'tr';
  const { ui } = useUiSection('ui_yildizname', locale as any);
  const [step, setStep] = useState<'intro' | 'name' | 'mother' | 'year' | 'loading'>('intro');
  const [formData, setFormData] = useState({ name: '', mother_name: '', birth_year: '' });
  const [loadingPhase, setLoadingPhase] = useState(0);

  const LOADING_PHASES = [
    ui('ui_yildizname_loading_phase_1', 'Stars are aligning...'),
    ui('ui_yildizname_loading_phase_2', 'Ebced values are being calculated...'),
    ui('ui_yildizname_loading_phase_3', 'Letters are turning into numbers...'),
    ui('ui_yildizname_loading_phase_4', 'Your mansion is being determined...'),
    ui('ui_yildizname_loading_phase_5', 'Ancient secrets are opening...')
  ];

  const [readYildizname, { isLoading }] = useReadYildiznameMutation();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'loading') {
      interval = setInterval(() => {
        setLoadingPhase((prev) => (prev + 1) % LOADING_PHASES.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [step]);

  const handleNext = () => {
    if (step === 'name' && !formData.name) return toast.error(ui('ui_yildizname_error_name_required', 'Please enter your name'));
    if (step === 'mother' && !formData.mother_name) return toast.error(ui('ui_yildizname_error_mother_required', 'Please enter your mother’s name'));
    if (step === 'year' && (!formData.birth_year || parseInt(formData.birth_year) < 1900)) return toast.error(ui('ui_yildizname_error_year_invalid', 'Please enter a valid year'));

    if (step === 'name') setStep('mother');
    else if (step === 'mother') setStep('year');
    else if (step === 'year') handleSubmit();
  };

  const handleBack = () => {
    if (step === 'mother') setStep('name');
    else if (step === 'year') setStep('mother');
    else if (step === 'name') setStep('intro');
  };

  const handleSubmit = async () => {
    setStep('loading');
    try {
      const res = await readYildizname({
        name: formData.name,
        mother_name: formData.mother_name,
        birth_year: parseInt(formData.birth_year)
      }).unwrap();
      
      setTimeout(() => {
        router.push(`/tr/yildizname/result/${res.id}`);
      }, 4000);
    } catch (err: any) {
      toast.error(err?.data?.message || ui('ui_yildizname_error_analysis_failed', 'Analysis failed'));
      setStep('year');
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Mystic Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-(--gm-gold)/10 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-(--gm-primary)/10 rounded-full blur-[150px] animate-pulse delay-1000" />
        </div>
      </div>

      <div className="max-w-[var(--gm-w-narrow)] mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="text-center space-y-12"
            >
              <div className="space-y-6">
                <div className="w-24 h-24 bg-(--gm-gold)/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-(--gm-gold) border border-(--gm-gold)/20 shadow-(--gm-shadow-gold)">
                   <Moon className="w-12 h-12" />
                </div>
                <h2 className={`${cinzel.className} text-5xl md:text-7xl text-(--gm-text) tracking-tighter`}>
                  {ui('ui_yildizname_intro_title_line1', 'Yildizname')} <br />
                  <span className="text-(--gm-gold)">{ui('ui_yildizname_intro_title_line2', 'Ebced Secret')}</span>
                </h2>
                <p className={`${fraunces.className} text-(--gm-text-dim) text-xl max-w-[var(--gm-w-form)] mx-auto leading-relaxed`}>
                  {ui('ui_yildizname_intro_desc', "Your name and your mother’s name form your numerical vibration in the universe. Discover your place among the 28 lunar mansions with ancient Ebced calculation.")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-[var(--gm-w-narrow)] mx-auto">
                {[
                  { t: ui('ui_yildizname_feature_1_title', 'Ancient Calculation'), d: ui('ui_yildizname_feature_1_desc', 'A thousand-year-old Ebced system.') },
                  { t: ui('ui_yildizname_feature_2_title', 'Lunar Mansions'), d: ui('ui_yildizname_feature_2_desc', 'You are one of 28 different energy stations.') },
                  { t: ui('ui_yildizname_feature_3_title', 'Spiritual Guide'), d: ui('ui_yildizname_feature_3_desc', 'Your temperament and journey map.') }
                ].map((x, i) => (
                  <div key={i} className="p-6 bg-(--gm-surface)/20 border border-(--gm-border-soft) rounded-3xl">
                    <h4 className="font-bold text-(--gm-gold) mb-1 text-sm uppercase tracking-widest">{x.t}</h4>
                    <p className="text-xs text-(--gm-text-dim) leading-relaxed">{x.d}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep('name')}
                className="px-12 py-6 bg-(--gm-gold) text-(--gm-bg) font-bold rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-(--gm-gold)/20 flex items-center gap-3 mx-auto group"
              >
                {ui('ui_yildizname_intro_start_button', 'START')} <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {(['name', 'mother', 'year'] as const).includes(step as any) && (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="max-w-[var(--gm-w-form)] mx-auto space-y-12"
            >
              <div className="flex items-center gap-4">
                <button onClick={handleBack} className="w-12 h-12 rounded-full border border-(--gm-border-soft) flex items-center justify-center hover:bg-(--gm-surface-high) transition-colors">
                  <ArrowLeft className="w-5 h-5 text-(--gm-text-dim)" />
                </button>
                <div className="flex-1 h-1 bg-(--gm-border-soft) rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: '0%' }}
                    animate={{ width: step === 'name' ? '33%' : step === 'mother' ? '66%' : '100%' }}
                    className="h-full bg-(--gm-gold)"
                  />
                </div>
              </div>

              <div className="space-y-8 bg-(--gm-surface)/30 backdrop-blur-2xl border border-(--gm-border-soft) p-10 rounded-[3rem] shadow-2xl">
                <div className="space-y-2">
                  <h2 className={`${cinzel.className} text-3xl text-(--gm-text)`}>
                    {step === 'name'
                      ? ui('ui_yildizname_step_name_title', 'Your Name')
                      : step === 'mother'
                      ? ui('ui_yildizname_step_mother_title', 'Your Mother’s Name')
                      : ui('ui_yildizname_step_year_title', 'Your Birth Year')}
                  </h2>
                  <p className="text-sm text-(--gm-text-dim) font-serif italic">
                    {step === 'name'
                      ? ui('ui_yildizname_step_name_subtitle', 'The core vibration that calls you.')
                      : step === 'mother'
                      ? ui('ui_yildizname_step_mother_subtitle', 'The spiritual root that carries your lineage.')
                      : ui('ui_yildizname_step_year_subtitle', 'The signature of the time you stepped into the world.')}
                  </p>
                </div>

                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-(--gm-gold) opacity-50">
                    {step === 'name' ? <User className="w-6 h-6" /> : step === 'mother' ? <Heart className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                  </div>
                  <input
                    autoFocus
                    type={step === 'year' ? 'number' : 'text'}
                    value={step === 'name' ? formData.name : step === 'mother' ? formData.mother_name : formData.birth_year}
                    onChange={(e) => setFormData({ ...formData, [step === 'year' ? 'birth_year' : step === 'name' ? 'name' : 'mother_name']: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                    placeholder={step === 'name' ? ui('ui_yildizname_step_name_placeholder', 'Example: Orhan') : step === 'mother' ? ui('ui_yildizname_step_mother_placeholder', 'Example: Fatma') : '1990'}
                    className="w-full bg-(--gm-surface-high)/50 border border-(--gm-border-soft) rounded-[2rem] py-6 pl-16 pr-8 text-2xl font-serif text-(--gm-text) outline-none focus:ring-2 focus:ring-(--gm-gold)/20 focus:border-(--gm-gold)/40 transition-all placeholder:text-(--gm-text-dim)/30"
                  />
                </div>

                <button
                  onClick={handleNext}
                  className="w-full py-6 bg-(--gm-gold) text-(--gm-bg) font-bold rounded-full shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  {step === 'year' ? ui('ui_yildizname_step_submit_button', 'OPEN MY YILDIZNAME') : ui('ui_yildizname_step_continue_button', 'CONTINUE')} <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 space-y-16"
            >
              <div className="relative w-64 h-64">
                {[...Array(28)].map((_, i) => (
                  <motion.div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: 4,
                      height: 4,
                      backgroundColor: 'var(--gm-gold)',
                      borderRadius: '50%',
                      transform: `rotate(${i * (360 / 28)}deg) translateY(-100px)`
                    }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.2, 1, 0.2]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.1
                    }}
                  />
                ))}
                
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: 360 
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                   <div className="w-32 h-32 border-2 border-(--gm-gold)/20 border-t-(--gm-gold) rounded-full shadow-(--gm-shadow-gold)" />
                </motion.div>
                
                <div className="absolute inset-0 flex items-center justify-center text-(--gm-gold)">
                   <Sparkles className="w-12 h-12" />
                </div>
              </div>

              <div className="text-center space-y-6">
                <AnimatePresence mode="wait">
                  <motion.h2 
                    key={loadingPhase}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`${cinzel.className} text-3xl text-(--gm-gold) tracking-widest uppercase`}
                  >
                    {LOADING_PHASES[loadingPhase]}
                  </motion.h2>
                </AnimatePresence>
                <p className="text-(--gm-text-dim) italic font-serif text-lg opacity-60">
                  {ui('ui_yildizname_loading_footer', 'Ancient Ebced calculation is running...')}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
