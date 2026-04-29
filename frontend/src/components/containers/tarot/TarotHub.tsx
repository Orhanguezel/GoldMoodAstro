'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cinzel, Manrope } from 'next/font/google';
import { 
  Sparkles, 
  RotateCcw, 
  ChevronRight, 
  Layers, 
  Info,
  HelpCircle,
  Share2
} from 'lucide-react';
import Image from 'next/image';
import ShareCard from '@/components/common/ShareCard';
import ConsultantFunnelCTA from '@/components/common/ConsultantFunnelCTA';
import { useDrawTarotMutation } from '@/integrations/rtk/public/tarot.public.endpoints';

const cinzel = Cinzel({ subsets: ['latin'] });
const manrope = Manrope({ subsets: ['latin'] });

const SPREADS = [
  { 
    id: 'one_card', 
    title: 'Tek Kart', 
    desc: 'Hızlı bir rehberlik veya evet/hayır sorusu için.',
    icon: <Layers className="w-5 h-5" />,
    count: 1 
  },
  { 
    id: 'three_card_general', 
    title: 'Üç Kart (Genel)', 
    desc: 'Geçmiş, şimdi ve gelecek dengesini görmek için.',
    icon: <Layers className="w-5 h-5" />,
    count: 3 
  },
  { 
    id: 'three_card_decision', 
    title: 'Karar Açılımı', 
    desc: 'İki seçenek arasında kaldığınızda yol gösterir.',
    icon: <Layers className="w-5 h-5" />,
    count: 3 
  },
  { 
    id: 'celtic_cross', 
    title: 'Kelt Haçı', 
    desc: 'Bir durumun tüm detaylarını ve derinliğini anlamak için (10 kart).',
    icon: <Layers className="w-5 h-5" />,
    count: 10 
  },
];

export default function TarotHub() {
  const [step, setStep] = useState<'select' | 'shuffle' | 'pick' | 'result'>('select');
  const [selectedSpread, setSelectedSpread] = useState(SPREADS[0]);
  const [question, setQuestion] = useState('');
  const [pickedCount, setPickedCount] = useState(0);
  const [drawResult, setDrawResult] = useState<any>(null);

  const [drawTarot, { isLoading }] = useDrawTarotMutation();

  const handleStartShuffle = () => {
    setStep('shuffle');
    setTimeout(() => {
      setStep('pick');
    }, 2000);
  };

  const handlePickCard = async () => {
    const nextCount = pickedCount + 1;
    setPickedCount(nextCount);

    if (nextCount === selectedSpread.count) {
      // All cards picked, trigger API
      try {
        const res = await drawTarot({
          spread_type: selectedSpread.id as any,
          question,
          locale: 'tr'
        }).unwrap();
        setDrawResult(res.data);
        setStep('result');
      } catch (err) {
        console.error('Tarot draw error:', err);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 min-h-[80vh] flex flex-col">
      <AnimatePresence mode="wait">
        {step === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1"
          >
            <div className="text-center mb-16">
              <h1 className={`${cinzel.className} text-4xl md:text-6xl text-foreground mb-6`}>Tarot Rehberliği</h1>
              <p className="text-muted-foreground text-lg italic font-serif">Kozmik sembollerin bilgeliğiyle yolunuzu aydınlatın.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {SPREADS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSpread(s)}
                  className={`p-8 rounded-[2.5rem] text-left border transition-all duration-500 relative overflow-hidden group ${
                    selectedSpread.id === s.id 
                      ? 'bg-surface border-brand-gold shadow-glow' 
                      : 'bg-surface/40 border-border/40 hover:border-brand-gold/30'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
                    selectedSpread.id === s.id ? 'bg-brand-gold text-bg-base' : 'bg-brand-primary/10 text-brand-gold'
                  }`}>
                    {s.icon}
                  </div>
                  <h3 className={`${cinzel.className} text-xl mb-3 ${selectedSpread.id === s.id ? 'text-brand-gold' : 'text-foreground'}`}>
                    {s.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
                </button>
              ))}
            </div>

            <div className="max-w-2xl mx-auto space-y-8 bg-surface/30 p-10 rounded-[3rem] border border-border/20">
              <div className="space-y-4">
                <label className="text-xs font-bold tracking-widest uppercase text-brand-gold/60 ml-2">Odaklandığınız Soru (Opsiyonel)</label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Örn: Kariyerimdeki bu değişim bana ne getirecek?"
                  className="w-full bg-bg-deep/50 border border-border/40 rounded-3xl p-6 text-foreground placeholder:text-muted-foreground/40 focus:border-brand-gold/40 transition-colors resize-none h-32"
                />
              </div>

              <button
                onClick={handleStartShuffle}
                className="w-full py-6 bg-brand-gold text-bg-base font-bold rounded-full hover:scale-[1.02] active:scale-95 transition-all shadow-glow-gold flex items-center justify-center gap-3"
              >
                KARTLARI KARIŞTIR <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'shuffle' && (
          <motion.div
            key="shuffle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center py-20"
          >
            <div className="relative w-48 h-72">
               {[...Array(5)].map((_, i) => (
                 <motion.div
                  key={i}
                  animate={{ 
                    x: [0, (i - 2) * 40, 0],
                    rotate: [0, (i - 2) * 10, 0],
                    zIndex: [i, 5, i]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    delay: i * 0.1
                  }}
                  className="absolute inset-0 bg-surface border-2 border-brand-gold/20 rounded-2xl overflow-hidden shadow-2xl"
                 >
                   <Image src="/uploads/tarot_back.png" alt="Tarot Back" fill className="object-cover opacity-60" />
                 </motion.div>
               ))}
            </div>
            <h2 className={`${cinzel.className} text-3xl mt-16 text-brand-gold animate-pulse`}>Kozmik Enerji Harmanlanıyor...</h2>
            <p className="text-muted-foreground mt-4 italic font-serif">Niyetinize odaklanın.</p>
          </motion.div>
        )}

        {step === 'pick' && (
          <motion.div
            key="pick"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            <div className="text-center mb-12">
              <h2 className={`${cinzel.className} text-3xl text-foreground mb-4`}>
                {selectedSpread.count} Kart Seçin
              </h2>
              <p className="text-brand-gold font-bold tracking-widest uppercase text-xs">
                {pickedCount} / {selectedSpread.count} SEÇİLDİ
              </p>
            </div>

            <div className="flex-1 flex items-center justify-center relative overflow-hidden min-h-[400px]">
              <div className="flex flex-wrap justify-center gap-2 max-w-4xl">
                {[...Array(22)].map((_, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ y: -20, scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handlePickCard}
                    disabled={isLoading}
                    className="w-24 h-40 md:w-32 md:h-52 relative rounded-xl border border-brand-gold/20 overflow-hidden shadow-lg bg-bg-deep group"
                  >
                    <Image src="/uploads/tarot_back.png" alt="Tarot Back" fill className="object-cover group-hover:opacity-100 opacity-80 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                ))}
              </div>
            </div>
            
            {isLoading && (
              <div className="fixed inset-0 bg-bg-base/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                <div className="w-20 h-20 border-4 border-brand-gold border-t-transparent rounded-full animate-spin mb-8" />
                <h3 className={`${cinzel.className} text-2xl text-brand-gold`}>Bilgelik Süzülüyor...</h3>
              </div>
            )}
          </motion.div>
        )}

        {step === 'result' && drawResult && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-16 py-10"
          >
            <div className="text-center">
              <h1 className={`${cinzel.className} text-4xl md:text-6xl text-foreground mb-6`}>Kozmik Yanıt</h1>
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-brand-primary/10 border border-brand-gold/20">
                <HelpCircle className="w-4 h-4 text-brand-gold" />
                <span className="text-muted-foreground italic font-serif">&quot;{question || 'Genel Rehberlik'}&quot;</span>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-5xl mx-auto">
              {drawResult.cards.map((card: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.2 }}
                  className="flex flex-col items-center"
                >
                  <div className="text-xs font-bold tracking-[0.2em] text-brand-gold uppercase mb-6 bg-brand-gold/5 px-4 py-2 rounded-full border border-brand-gold/10">
                    {card.position_name}
                  </div>
                  <div className="relative w-48 h-80 rounded-[2rem] overflow-hidden shadow-2xl border-2 border-brand-gold/30 mb-3 transform transition-transform hover:scale-105 duration-500">
                    {/* Sadece görsel + overlay döner; başlık rotated layer'ın DIŞINDA okunur kalır */}
                    <div
                      className={`absolute inset-0 transition-transform duration-500 ${card.is_reversed ? 'rotate-180' : ''}`}
                    >
                      <Image
                        src={card.image_url || '/uploads/tarot_back.png'}
                        alt={card.name}
                        fill
                        sizes="192px"
                        className={`object-cover ${!card.image_url ? 'grayscale' : ''}`}
                      />
                      <div className="absolute inset-0 bg-brand-primary/20 mix-blend-overlay" />
                    </div>
                  </div>
                  <div className={`text-center px-4 mb-3 ${cinzel.className} text-foreground text-lg`}>
                    {card.name}
                  </div>
                  {card.is_reversed && (
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-widest mb-4">
                      <RotateCcw className="w-3 h-3" /> TERS GELDİ
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Interpretation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="max-w-3xl mx-auto bg-surface/50 border border-border/40 rounded-[3rem] p-10 md:p-16 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-10 opacity-5">
                <Sparkles className="w-40 h-40 text-brand-gold" />
              </div>
              
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                  <Info className="w-6 h-6" />
                </div>
                <h2 className={`${cinzel.className} text-3xl text-foreground`}>Yorumunuz</h2>
              </div>

              <div className={`prose prose-invert max-w-none prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-lg prose-p:mb-6 prose-strong:text-brand-gold ${manrope.className}`}>
                {drawResult.interpretation.split('\n').map((line: string, i: number) => (
                  <p key={i}>{line}</p>
                ))}
              </div>

              <ConsultantFunnelCTA
                feature="tarot"
                intensity="heavy"
                context={{
                  cards: drawResult.cards.map((c: any) => c.name).join(', '),
                  spread: selectedSpread.id,
                  question: question || undefined,
                }}
              />

              <div className="mt-16 pt-10 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-sm text-muted-foreground italic font-serif">
                  * Bu yorum yapay zeka tarafından astrolog onaylı semboller ışığında oluşturulmuştur.
                </div>
                <div className="flex items-center gap-4">
                  <ShareCard 
                    title="Tarot Falımı Paylaş"
                    shareText={`GoldMoodAstro'da tarot falı baktırdım ✨\nKartlarım: ${drawResult.cards.map((c: any) => c.name).join(', ')}\nSen de geleceğine ışık tut:`}
                    variant="tarot"
                    data={{
                      cards: drawResult.cards.map((c: any) => ({
                        name: c.name,
                        image_url: c.image_url || '/uploads/tarot_back.png',
                        is_reversed: c.is_reversed
                      }))
                    }}
                  />
                  <button 
                    onClick={() => {
                      setStep('select');
                      setPickedCount(0);
                      setDrawResult(null);
                    }}
                    className="flex items-center gap-3 text-brand-gold font-bold uppercase tracking-widest text-sm hover:text-brand-gold-light transition-colors"
                  >
                    YENİ AÇILIM <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
