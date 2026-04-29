'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Cinzel, Manrope } from 'next/font/google';
import { 
  Sparkles, 
  RotateCcw, 
  Info,
  HelpCircle,
} from 'lucide-react';
import Image from 'next/image';
import ShareCard from '@/components/common/ShareCard';
import ConsultantFunnelCTA from '@/components/common/ConsultantFunnelCTA';
import { useGetTarotReadingQuery } from '@/integrations/rtk/public/tarot.public.endpoints';
import { useParams, useRouter } from 'next/navigation';

const cinzel = Cinzel({ subsets: ['latin'] });
const manrope = Manrope({ subsets: ['latin'] });

export default function TarotResultClient() {
  const { id, locale } = useParams();
  const router = useRouter();
  const { data: res, isLoading, error } = useGetTarotReadingQuery(id as string);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-8">
        <div className="w-20 h-20 border-2 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin" />
        <p className="text-muted-foreground font-serif italic tracking-widest animate-pulse">Kozmik Sırlar Süzülüyor...</p>
      </div>
    );
  }

  if (error || !res) {
    return (
      <div className="text-center py-40 space-y-8">
        <h2 className={`${cinzel.className} text-3xl text-foreground`}>Sonuç Bulunamadı</h2>
        <p className="text-muted-foreground">Aradığınız tarot kaydı mevcut değil veya bir hata oluştu.</p>
        <button 
          onClick={() => router.push(`/${locale}/tarot`)}
          className="inline-flex items-center gap-2 text-brand-gold font-bold"
        >
          YENİ AÇILIM YAP
        </button>
      </div>
    );
  }

  const drawResult = res.data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 min-h-[80vh] flex flex-col">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-16"
      >
        <div className="text-center">
          <h1 className={`${cinzel.className} text-4xl md:text-6xl text-foreground mb-6`}>Kozmik Yanıt</h1>
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-brand-primary/10 border border-brand-gold/20">
            <HelpCircle className="w-4 h-4 text-brand-gold" />
            <span className="text-muted-foreground italic font-serif">&quot;{drawResult.question || 'Genel Rehberlik'}&quot;</span>
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
              <div className={`relative w-48 h-80 rounded-[2rem] overflow-hidden shadow-2xl border-2 border-brand-gold/30 mb-8 transform transition-transform hover:scale-105 duration-500 ${card.is_reversed ? 'rotate-180' : ''}`}>
                <Image src={card.image_url || "/uploads/tarot_back.png"} alt={card.name} fill className={`object-cover ${!card.image_url ? 'grayscale' : ''}`} />
                <div className="absolute inset-0 bg-brand-primary/20 mix-blend-overlay" />
                <div className="absolute bottom-6 left-0 w-full text-center px-4">
                    <span className={`${cinzel.className} text-white text-lg drop-shadow-md`}>{card.name}</span>
                </div>
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
              spread: drawResult.spread_type,
              question: drawResult.question,
              cards: drawResult.cards.map((c: any) => c.name).join(', '),
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
                onClick={() => router.push(`/${locale}/tarot`)}
                className="flex items-center gap-3 text-brand-gold font-bold uppercase tracking-widest text-sm hover:text-brand-gold-light transition-colors"
              >
                YENİ AÇILIM <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
