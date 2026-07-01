'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cinzel, Fraunces } from 'next/font/google';
import { 
  Camera, 
  Sparkles, 
  ChevronRight, 
  RotateCcw,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Timer
} from 'lucide-react';
import Image from 'next/image';
import ShareCard from '@/components/common/ShareCard';
import ConsultantFunnelCTA from '@/components/common/ConsultantFunnelCTA';
import { useReadCoffeeMutation } from '@/integrations/rtk/public/coffee.public.endpoints';
import { useUploadFileMutation } from '@/integrations/rtk/public/storage_public.endpoints';
import { PhotoCaptureInput, type PrepareImageResult } from '@/components/common/image-capture';
import { useUiSection } from '@/i18n';

const cinzel = Cinzel({ subsets: ['latin'] });
const fraunces = Fraunces({ subsets: ['latin'], weight: ['400', '700'], style: ['normal', 'italic'] });

export default function CoffeeHub() {
  const { ui } = useUiSection('ui_coffee');
  const [step, setStep] = useState<'intro' | 'wait' | 'upload' | 'processing' | 'result'>('intro');
  const [images, setImages] = useState<string[]>([]); // base64 for preview
  const [imageIds, setImageIds] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [timerActive, setTimerActive] = useState(false);

  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();
  const [readCoffee, { isLoading: isProcessing }] = useReadCoffeeMutation();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePicked = async (result: PrepareImageResult, index: number) => {
    const { file: processedFile } = result;

    setError(null);

    try {
      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImages = [...images];
        newImages[index] = reader.result as string;
        setImages(newImages);
      };
      reader.readAsDataURL(processedFile);

      // Upload with a unique path so repeated mobile filenames stay distinct.
      const uniqueSuffix =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID().slice(0, 8)
          : Math.random().toString(36).slice(2, 10);
      const res = await uploadFile({
        bucket: 'coffee',
        files: processedFile,
        path: `coffee/${Date.now()}-${index}-${uniqueSuffix}`,
        upsert: true,
      }).unwrap();
      
      const uploaded = res.items[0];
      if (uploaded?.url || uploaded?.path) {
        const newIds = [...imageIds];
        newIds[index] = uploaded.path || uploaded.url;
        setImageIds(newIds);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError(ui('ui_coffee_upload_failed', 'Could not upload the photo. Please try again.'));
    }
  };

  const handleStartAnalysis = async () => {
    const distinctIds = [...new Set(imageIds.filter(Boolean))];
    if (distinctIds.length < 3) {
      setError(ui('ui_coffee_select_three', 'Please select 3 different photos.'));
      return;
    }

    setStep('processing');
    setError(null);

    try {
      const res = await readCoffee({
        image_ids: distinctIds,
        locale: 'tr'
      }).unwrap();
      setResult(res.data);
      setStep('result');
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(ui('ui_coffee_analysis_failed', 'An error occurred while reading your cup. Please try again.'));
      setStep('upload');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col py-10 md:py-20">
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-16"
          >
            {/* Hero photo */}
            <div className="relative w-full max-w-3xl mx-auto rounded-[3rem] overflow-hidden shadow-2xl" style={{ height: 340 }}>
              <Image
                src="/images/kahve-fali-3.png"
                alt={ui('ui_coffee_hero_alt', 'Coffee Reading')}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-10 text-center">
                <h2 className={`${cinzel.className} text-4xl md:text-6xl text-white tracking-tight drop-shadow-lg`}>{ui('ui_coffee_hero_title', 'Traditional Coffee Reading')}</h2>
                <p className={`${fraunces.className} text-white/70 text-lg mt-3 italic`}>
                  {ui('ui_coffee_hero_subtitle', 'The symbols in your cup come to life through AI vision and ancient wisdom.')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-4xl mx-auto">
              {[
                { step: '01', title: ui('ui_coffee_step1_title', 'Turn the Cup Over'), desc: ui('ui_coffee_step1_desc', 'After drinking your coffee, make a wish and turn the cup onto the saucer.'), img: '/images/kahve-fali-1.png' },
                { step: '02', title: ui('ui_coffee_step2_title', 'Wait 5 Minutes'), desc: ui('ui_coffee_step2_desc', 'Let the cup cool so the grounds can settle and the symbols can form.'), img: '/images/kahve-fali-2.png' },
                { step: '03', title: ui('ui_coffee_step3_title', 'Take Photos'), desc: ui('ui_coffee_step3_desc', 'Take 2 clear photos inside the cup and 1 of the saucer to receive your reading.'), img: '/images/kahve-fali-3.png' },
              ].map((s, i) => (
                <div key={i} className="group relative rounded-[2.5rem] overflow-hidden shadow-(--gm-shadow-soft) hover:scale-[1.02] transition-transform duration-300" style={{ minHeight: 280 }}>
                  {/* Photo background */}
                  <Image
                    src={s.img}
                    alt={s.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
                  {/* Content */}
                  <div className="relative z-10 p-8 flex flex-col justify-end h-full" style={{ minHeight: 280 }}>
                    <span className="text-amber-400/60 font-bold tracking-[0.3em] text-[10px] uppercase mb-2">{s.step}</span>
                    <h3 className={`${cinzel.className} text-xl text-amber-400 mb-3`}>{s.title}</h3>
                    <p className="text-white/65 text-sm leading-relaxed font-serif italic">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setStep('wait');
                setTimerActive(true);
              }}
              className="px-16 py-6 bg-(--gm-gold) text-(--gm-bg-deep) font-bold rounded-full hover:scale-[1.05] active:scale-95 transition-all shadow-(--gm-shadow-gold) flex items-center justify-center gap-3 mx-auto tracking-[0.2em] text-xs"
            >
              {ui('ui_coffee_closed_cup_cta', 'I TURNED THE CUP OVER')} <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {step === 'wait' && (
          <motion.div
            key="wait"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-16 py-10"
          >
            <div className="space-y-8">
              <div className="w-48 h-48 border-2 border-(--gm-gold)/20 rounded-full flex flex-col items-center justify-center mx-auto relative bg-(--gm-surface)/30 shadow-(--gm-shadow-glow)">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-t-2 border-(--gm-gold) rounded-full"
                />
                <Timer className="w-10 h-10 text-(--gm-gold) mb-3" />
                <span className="text-4xl font-mono text-(--gm-gold) tracking-tighter">{formatTime(timeLeft)}</span>
              </div>
              <h2 className={`${cinzel.className} text-4xl text-(--gm-text)`}>{ui('ui_coffee_wait_title', 'The Grounds Are Settling...')}</h2>
              <p className="text-(--gm-text-dim) max-w-md mx-auto font-serif italic text-lg opacity-70">
                {ui('ui_coffee_wait_desc', 'The cup needs to cool completely for the symbols to become clearer. Focus on your intention while you wait.')}
              </p>
            </div>

            <div className="flex flex-col gap-4 max-w-xs mx-auto">
              <button
                onClick={() => setStep('upload')}
                className={`px-10 py-5 rounded-full font-bold transition-all tracking-[0.2em] text-xs ${
                  timeLeft === 0 
                    ? 'bg-(--gm-gold) text-(--gm-bg-deep) shadow-(--gm-shadow-gold)' 
                    : 'bg-(--gm-surface) text-(--gm-muted) border border-(--gm-border-soft)'
                }`}
              >
                {timeLeft === 0 ? ui('ui_coffee_continue', 'CONTINUE') : ui('ui_coffee_skip_wait', 'SKIP WAITING')}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-16"
          >
            <div className="text-center space-y-6">
              <h2 className={`${cinzel.className} text-4xl text-(--gm-text)`}>{ui('ui_coffee_upload_title', 'Take Photos')}</h2>
              <div className="max-w-xl mx-auto p-8 rounded-[2rem] bg-(--gm-gold)/5 border border-(--gm-gold)/20 space-y-4">
                <p className="text-[10px] font-bold text-(--gm-gold) uppercase tracking-[0.4em]">{ui('ui_coffee_tips_label', 'For a Clear Shot:')}</p>
                <p className="text-sm text-(--gm-text-dim) leading-relaxed font-serif italic opacity-80">
                  {ui('ui_coffee_tips_desc', 'Hold the cup steady, use good light, take close shots inside the cup and photograph the saucer separately. Clear photos make the reading stronger.')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: ui('ui_coffee_slot1_label', 'Cup Interior 1'), desc: ui('ui_coffee_slot1_desc', 'Side walls') },
                { label: ui('ui_coffee_slot2_label', 'Cup Interior 2'), desc: ui('ui_coffee_slot2_desc', 'Bottom area') },
                { label: ui('ui_coffee_slot3_label', 'Saucer'), desc: ui('ui_coffee_slot3_desc', 'Settled traces') }
              ].map((slot, idx) => (
                <div key={idx} className="aspect-[3/4] relative group">
                  <PhotoCaptureInput
                    capture="environment"
                    offerGalleryChoice={true}
                    onPicked={(res) => handlePicked(res, idx)}
                    onError={(code) => setError(code === 'not_an_image' ? ui('ui_coffee_not_an_image', 'Please select an image file.') : ui('ui_coffee_image_too_large', 'The image is too large or could not be uploaded.'))}
                    prepareOptions={{
                      maxEdge: 1600,
                      quality: 0.8,
                      targetMaxKB: 600
                    }}
                    className="w-full h-full"
                  >
                    {images[idx] ? (
                      <div className="w-full h-full rounded-[3rem] overflow-hidden border-2 border-(--gm-gold)/40 relative shadow-(--gm-shadow-soft)">
                        <Image src={images[idx]} alt={slot.label} fill className="object-cover" />
                        <div className="absolute inset-0 bg-[var(--gm-bg-deep)]/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                          <Camera className="w-10 h-10 text-(--gm-gold) mb-3" />
                          <span className="text-[10px] font-bold text-[var(--gm-text)] uppercase tracking-[0.3em]">{ui('ui_coffee_change_photo', 'CHANGE PHOTO')}</span>
                        </div>
                        <div className="absolute top-6 right-6 bg-(--gm-gold) rounded-full p-2 shadow-(--gm-shadow-gold)">
                          <CheckCircle2 className="w-6 h-6 text-(--gm-bg-deep)" />
                        </div>
                        {/* Guide mask overlay */}
                        <div className="absolute inset-0 border-[40px] border-[var(--gm-bg-deep)]/20 pointer-events-none rounded-[3rem]">
                           <div className="w-full h-full border border-dashed border-(--gm-gold)/30 rounded-2xl" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-[3rem] border-2 border-dashed border-(--gm-border-soft) bg-(--gm-surface)/40 flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-(--gm-gold)/40 hover:bg-(--gm-gold)/5 transition-all shadow-lg">
                        <div className="w-20 h-20 rounded-[1.5rem] bg-(--gm-gold)/10 flex items-center justify-center text-(--gm-gold) group-hover:scale-110 transition-transform">
                          <Camera className="w-10 h-10" />
                        </div>
                        <div className="text-center space-y-2">
                          <span className="block text-xs font-bold tracking-[0.3em] text-(--gm-gold) uppercase">{slot.label}</span>
                          <span className="block text-[11px] text-(--gm-muted) font-serif italic opacity-60">{slot.desc}</span>
                        </div>
                      </div>
                    )}
                  </PhotoCaptureInput>
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-(--gm-error)/10 border border-(--gm-error)/20 text-(--gm-error) p-6 rounded-[2rem] flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                <AlertCircle className="w-6 h-6" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <button
              onClick={handleStartAnalysis}
              disabled={imageIds.filter(Boolean).length < 3 || isUploading || isProcessing}
              className={`w-full py-7 rounded-full font-bold transition-all flex items-center justify-center gap-4 tracking-[0.25em] text-xs ${
                imageIds.filter(Boolean).length === 3 
                  ? 'bg-(--gm-gold) text-(--gm-bg-deep) shadow-(--gm-shadow-gold) hover:scale-[1.02]' 
                  : 'bg-(--gm-surface) text-(--gm-muted) cursor-not-allowed border border-(--gm-border-soft)'
              }`}
            >
              {isUploading ? ui('ui_coffee_uploading', 'PHOTOS ARE UPLOADING...') : ui('ui_coffee_analyze_cta', 'READ MY CUP NOW')} <Sparkles className="w-5 h-5" />
            </button>
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
                className="absolute inset-0 border-4 border-dashed border-(--gm-gold)/20 rounded-full"
              />
              <motion.div
                animate={{ 
                  scale: [1, 1.15, 1],
                  opacity: [0.3, 0.8, 0.3]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-6 bg-(--gm-gold)/10 rounded-full flex items-center justify-center shadow-(--gm-shadow-glow)"
              >
                <Coffee className="w-20 h-20 text-(--gm-gold)" />
              </motion.div>
            </div>
            
            <div className="mt-20 text-center space-y-6">
              <h2 className={`${cinzel.className} text-4xl text-(--gm-gold) tracking-widest`}>{ui('ui_coffee_processing_title', 'Reading the Symbols...')}</h2>
              <p className={`${fraunces.className} text-(--gm-text-dim) text-xl italic opacity-70`}>
                {ui('ui_coffee_processing_desc', 'AI is matching the traces in your cup with ancient symbols.')}
              </p>
              <div className="flex gap-3 justify-center mt-10">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -12, 0], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    className="w-3 h-3 bg-(--gm-gold) rounded-full shadow-(--gm-shadow-gold)"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-16 py-10"
          >
             <div className="text-center space-y-8">
              <h2 className={`${cinzel.className} text-5xl md:text-7xl text-(--gm-text) tracking-tight leading-tight`}>{ui('ui_coffee_result_title', 'The Language of Your Cup')}</h2>
              
              <div className="flex flex-wrap justify-center gap-6">
                {result.symbols.map((s: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="px-8 py-6 bg-(--gm-surface) border border-(--gm-border-soft) rounded-[2rem] flex flex-col items-center gap-3 min-w-[150px] shadow-(--gm-shadow-soft) hover:border-(--gm-gold)/40 transition-colors"
                  >
                    <span className="text-4xl filter drop-shadow-md">{s.icon || '✨'}</span>
                    <span className="text-[10px] font-bold text-(--gm-gold) uppercase tracking-[0.3em]">{s.name}</span>
                    <div className="w-full bg-(--gm-bg-deep)/50 h-1.5 rounded-full overflow-hidden mt-2">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${s.confidence * 100}%` }}
                        className="h-full bg-(--gm-gold) shadow-(--gm-shadow-glow)"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="bg-(--gm-surface) border border-(--gm-border-soft) rounded-[4rem] p-10 md:p-20 shadow-(--gm-shadow-card) relative overflow-hidden">
               <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none text-(--gm-gold)">
                 <Coffee className="w-[30rem] h-[30rem]" />
               </div>

               <div className={`${fraunces.className} relative z-10 text-xl md:text-3xl leading-[1.8] text-(--gm-text-dim) space-y-12`}>
                {result.interpretation.split('\n').map((line: string, i: number) => (
                  line.trim() ? <p key={i} className="opacity-90">{line}</p> : <div key={i} className="h-6" />
                ))}
              </div>

              <div className="mt-20">
                <ConsultantFunnelCTA
                  feature="kahve"
                  intensity="heavy"
                  context={{
                    symbols: result.symbols?.map((s: any) => s.name).join(', '),
                  }}
                />
              </div>

              <div className="mt-20 pt-12 border-t border-(--gm-border-soft) flex flex-col lg:flex-row items-center justify-between gap-12">
                <div className="text-[11px] text-(--gm-muted) italic font-serif leading-relaxed max-w-md uppercase tracking-widest opacity-60">
                  {ui('ui_coffee_disclaimer', '* This analysis was prepared by Vision AI and our astrological symbolism database.')}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-10">
                  <ShareCard
                    title={ui('ui_coffee_share_title', 'Share My Coffee Reading')}
                    shareText={`${ui('ui_coffee_share_text_intro', 'I had my coffee cup read on GoldMoodAstro ✨')}\n${ui('ui_coffee_share_text_symbols', 'My symbols:')} ${result.symbols.map((s: any) => s.name).join(', ')}\n${ui('ui_coffee_share_text_outro', 'Discover the secrets in your cup too:')}`}
                    variant="coffee"
                    data={{
                      symbols: result.symbols.map((s: any) => s.name),
                      summary: result.interpretation.slice(0, 150) + '...'
                    }}
                  />
                  <button 
                    onClick={() => {
                      setStep('intro');
                      setImages([]);
                      setImageIds([]);
                      setResult(null);
                      setTimeLeft(300);
                    }}
                    className="flex items-center gap-4 text-(--gm-gold) font-bold uppercase tracking-[0.2em] text-xs hover:text-(--gm-gold-dim) transition-colors"
                  >
                    {ui('ui_coffee_new_reading', 'NEW READING')} <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
