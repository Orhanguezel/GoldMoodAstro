'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Cinzel, Manrope } from 'next/font/google';
import { 
  Sparkles, 
  RotateCcw, 
  Info,
  Coffee,
} from 'lucide-react';
import ShareCard from '@/components/common/ShareCard';
import ConsultantFunnelCTA from '@/components/common/ConsultantFunnelCTA';
import { useGetCoffeeReadingQuery } from '@/integrations/rtk/public/coffee.public.endpoints';
import { useParams, useRouter } from 'next/navigation';

const cinzel = Cinzel({ subsets: ['latin'] });
const manrope = Manrope({ subsets: ['latin'] });

export default function CoffeeResultClient() {
  const { id, locale } = useParams();
  const router = useRouter();
  const { data: res, isLoading, error } = useGetCoffeeReadingQuery(id as string);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-8">
        <div className="w-20 h-20 border-2 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin" />
        <p className="text-muted-foreground font-serif italic tracking-widest animate-pulse">Fincandaki Sırlar Okunuyor...</p>
      </div>
    );
  }

  if (error || !res) {
    return (
      <div className="text-center py-40 space-y-8">
        <h2 className={`${cinzel.className} text-3xl text-foreground`}>Sonuç Bulunamadı</h2>
        <p className="text-muted-foreground">Aradığınız kahve falı kaydı mevcut değil veya bir hata oluştu.</p>
        <button 
          onClick={() => router.push(`/${locale}/kahve-fali`)}
          className="inline-flex items-center gap-2 text-brand-gold font-bold"
        >
          YENİ FAL BAK
        </button>
      </div>
    );
  }

  const result = res.data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 min-h-[80vh] flex flex-col">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-12"
      >
        <div className="text-center space-y-4">
          <h1 className={`${cinzel.className} text-4xl md:text-6xl text-foreground`}>Fincanın Dili</h1>
          <div className="flex flex-wrap justify-center gap-3">
            {result.symbols.map((s: any, i: number) => (
              <span key={i} className="px-4 py-2 bg-brand-gold/10 border border-brand-gold/20 rounded-full text-xs font-bold text-brand-gold tracking-widest uppercase">
                {s.name}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-surface/50 border border-border/40 rounded-[3rem] p-10 md:p-16 shadow-2xl relative overflow-hidden">
          <div className="prose prose-invert max-w-none prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-lg prose-p:mb-6 prose-strong:text-brand-gold">
            {result.interpretation.split('\n').map((line: string, i: number) => (
              <p key={i}>{line}</p>
            ))}
          </div>

          <ConsultantFunnelCTA
            feature="kahve"
            intensity="heavy"
            context={{
              symbols: result.symbols.map((s: any) => s.name).join(', '),
            }}
          />

          <div className="mt-16 pt-10 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-sm text-muted-foreground italic font-serif">
              * Bu analiz Vision AI ve astrolojik semboloji veritabanımız tarafından hazırlanmıştır.
            </div>
            <div className="flex items-center gap-4">
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
                onClick={() => router.push(`/${locale}/kahve-fali`)}
                className="flex items-center gap-3 text-brand-gold font-bold uppercase tracking-widest text-sm hover:text-brand-gold-light transition-colors"
              >
                YENİ FAL <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
