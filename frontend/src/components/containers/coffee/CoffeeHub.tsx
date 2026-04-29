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

const cinzel = Cinzel({ subsets: ['latin'] });
const fraunces = Fraunces({ subsets: ['latin'], weight: ['400', '700'], style: ['normal', 'italic'] });

export default function CoffeeHub() {
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const newImages = [...images];
      newImages[index] = reader.result as string;
      setImages(newImages);
    };
    reader.readAsDataURL(file);

    // Upload
    try {
      const res = await uploadFile({
        bucket: 'coffee',
        files: file,
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
      setError('Fotoğraf yüklenemedi. Lütfen tekrar deneyin.');
    }
  };

  const handleStartAnalysis = async () => {
    if (imageIds.filter(Boolean).length < 3) return;
    
    setStep('processing');
    setError(null);

    try {
      const res = await readCoffee({
        image_ids: imageIds,
        locale: 'tr'
      }).unwrap();
      setResult(res.data);
      setStep('result');
    } catch (err) {
      console.error('Analysis failed:', err);
      setError('Falınız yorumlanırken bir hata oluştu. Lütfen tekrar deneyin.');
      setStep('upload');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 min-h-[80vh] flex flex-col">
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-12"
          >
            <div className="space-y-6">
              <div className="w-24 h-24 bg-brand-gold/10 rounded-[2rem] flex items-center justify-center mx-auto text-brand-gold">
                <Coffee className="w-12 h-12" />
              </div>
              <h1 className={`${cinzel.className} text-4xl md:text-6xl text-foreground`}>Geleneksel Kahve Falı</h1>
              <p className={`${fraunces.className} text-muted-foreground text-lg max-w-xl mx-auto italic leading-relaxed`}>
                Fincanınızdaki semboller, yapay zekanın vizyonu ve kadim bilgelikle dile geliyor.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-3xl mx-auto">
              {[
                { step: '01', title: 'Fincanı Kapat', desc: 'Kahvenizi içtikten sonra dilek dileyip fincanı tabağa kapatın.' },
                { step: '02', title: '5 Dakika Bekle', desc: 'Telvelerin süzülüp sembollerin oluşması için fincanın soğumasını bekleyin.' },
                { step: '03', title: 'Fotoğrafları Çek', desc: 'Fincanın içinden 2, tabağından 1 net fotoğraf çekip yorumunuzu alın.' },
              ].map((s, i) => (
                <div key={i} className="p-6 bg-surface/30 border border-border/20 rounded-3xl space-y-4">
                  <span className="text-brand-gold font-bold tracking-widest text-xs opacity-40">{s.step}</span>
                  <h3 className={`${cinzel.className} text-lg text-brand-gold`}>{s.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setStep('wait');
                setTimerActive(true);
              }}
              className="px-12 py-6 bg-brand-gold text-bg-base font-bold rounded-full hover:scale-[1.05] active:scale-95 transition-all shadow-glow-gold flex items-center justify-center gap-3 mx-auto"
            >
              FİNCANI KAPATTIM <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {step === 'wait' && (
          <motion.div
            key="wait"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-12 py-10"
          >
            <div className="space-y-6">
              <div className="w-40 h-40 border-2 border-brand-gold/20 rounded-full flex flex-col items-center justify-center mx-auto relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-t-2 border-brand-gold rounded-full"
                />
                <Timer className="w-8 h-8 text-brand-gold mb-2" />
                <span className="text-3xl font-mono text-brand-gold">{formatTime(timeLeft)}</span>
              </div>
              <h2 className={`${cinzel.className} text-3xl text-foreground`}>Telveler Süzülüyor...</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Sembollerin netleşmesi için fincanın tamamen soğuması gerekir. Bu sırada niyetinize odaklanın.
              </p>
            </div>

            <div className="flex flex-col gap-4 max-w-xs mx-auto">
              <button
                onClick={() => setStep('upload')}
                className={`px-8 py-4 rounded-full font-bold transition-all ${
                  timeLeft === 0 
                    ? 'bg-brand-gold text-bg-base shadow-glow-gold' 
                    : 'bg-surface/50 text-muted-foreground border border-border/20'
                }`}
              >
                {timeLeft === 0 ? 'DEVAM ET' : 'BEKLEMEDEN GEÇ'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-12"
          >
            <div className="text-center">
              <h2 className={`${cinzel.className} text-3xl text-foreground mb-4`}>Fotoğrafları Çek</h2>
              <p className="text-muted-foreground">Analiz için 3 adet net fotoğrafa ihtiyacımız var.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Fincan İçi 1', desc: 'Yan duvarlar' },
                { label: 'Fincan İçi 2', desc: 'Taban kısmı' },
                { label: 'Tabak', desc: 'Süzülen izler' }
              ].map((slot, idx) => (
                <div key={idx} className="aspect-[3/4] relative group">
                  {images[idx] ? (
                    <div className="w-full h-full rounded-[2.5rem] overflow-hidden border-2 border-brand-gold/40 relative">
                      <Image src={images[idx]} alt={slot.label} fill className="object-cover" />
                      <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFileChange(e, idx)} className="hidden" />
                        <Camera className="w-8 h-8 text-brand-gold mb-2" />
                        <span className="text-xs font-bold text-white uppercase tracking-widest">DEĞİŞTİR</span>
                      </label>
                      <div className="absolute top-4 right-4 bg-brand-gold rounded-full p-1 shadow-lg">
                        <CheckCircle2 className="w-5 h-5 text-bg-base" />
                      </div>
                    </div>
                  ) : (
                    <label className="w-full h-full rounded-[2.5rem] border-2 border-dashed border-border/40 bg-surface/20 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-brand-gold/40 hover:bg-brand-gold/5 transition-all">
                      <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFileChange(e, idx)} className="hidden" />
                      <div className="w-16 h-16 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                        <Camera className="w-8 h-8" />
                      </div>
                      <div className="text-center">
                        <span className="block text-xs font-bold tracking-widest text-brand-gold uppercase">{slot.label}</span>
                        <span className="block text-[10px] text-muted-foreground mt-1">{slot.desc}</span>
                      </div>
                    </label>
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleStartAnalysis}
              disabled={imageIds.filter(Boolean).length < 3 || isUploading || isProcessing}
              className={`w-full py-6 rounded-full font-bold transition-all flex items-center justify-center gap-3 ${
                imageIds.filter(Boolean).length === 3 
                  ? 'bg-brand-gold text-bg-base shadow-glow-gold hover:scale-[1.02]' 
                  : 'bg-surface text-muted-foreground cursor-not-allowed border border-border/20'
              }`}
            >
              {isUploading ? 'YÜKLENİYOR...' : 'FALIMI YORUMLA'} <Sparkles className="w-5 h-5" />
            </button>
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
                className="absolute inset-0 border-4 border-dashed border-brand-gold/20 rounded-full"
              />
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-4 bg-brand-gold/10 rounded-full flex items-center justify-center"
              >
                <Coffee className="w-16 h-16 text-brand-gold" />
              </motion.div>
            </div>
            
            <div className="mt-16 text-center space-y-4">
              <h2 className={`${cinzel.className} text-3xl text-brand-gold`}>Semboller Okunuyor...</h2>
              <p className={`${fraunces.className} text-muted-foreground italic`}>
                Yapay zeka fincanınızdaki izleri kadim sembollerle eşleştiriyor.
              </p>
              <div className="flex gap-2 justify-center mt-8">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-2 h-2 bg-brand-gold rounded-full"
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
            className="space-y-12 py-10"
          >
             <div className="text-center space-y-6">
              <h1 className={`${cinzel.className} text-4xl md:text-6xl text-foreground`}>Fincanın Dili</h1>
              
              <div className="flex flex-wrap justify-center gap-4">
                {result.symbols.map((s: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="px-6 py-4 bg-surface/40 border border-brand-gold/20 rounded-2xl flex flex-col items-center gap-2 min-w-[120px]"
                  >
                    <span className="text-2xl">{s.icon || '✨'}</span>
                    <span className="text-xs font-bold text-brand-gold uppercase tracking-widest">{s.name}</span>
                    <div className="w-full bg-brand-gold/10 h-1 rounded-full overflow-hidden mt-1">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${s.confidence * 100}%` }}
                        className="h-full bg-brand-gold"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="bg-surface/50 border border-border/40 rounded-[3rem] p-10 md:p-16 shadow-2xl relative overflow-hidden">
               <div className={`${fraunces.className} prose prose-invert max-w-none prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-xl prose-p:mb-8 prose-strong:text-brand-gold`}>
                {result.interpretation.split('\n').map((line: string, i: number) => (
                  <p key={i}>{line}</p>
                ))}
              </div>

              <ConsultantFunnelCTA
                feature="kahve"
                intensity="heavy"
                context={{
                  symbols: result.symbols?.map((s: any) => s.name).join(', '),
                }}
              />

              <div className="mt-16 pt-10 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-sm text-muted-foreground italic font-serif">
                  * Bu analiz Vision AI ve astrolojik semboloji veritabanımız tarafından hazırlanmıştır.
                </div>
                <div className="flex items-center gap-6">
                  <ShareCard 
                    title="Kahve Falımı Paylaş"
                    shareText={`GoldMoodAstro'da kahve falıma baktırdım ✨\nSembollerim: ${result.symbols.map((s: any) => s.name).join(', ')}\nSen de fincanındaki sırları keşfet:`}
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
                    className="flex items-center gap-3 text-brand-gold font-bold uppercase tracking-widest text-xs hover:text-brand-gold-light transition-colors"
                  >
                    YENİ FAL <RotateCcw className="w-4 h-4" />
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
