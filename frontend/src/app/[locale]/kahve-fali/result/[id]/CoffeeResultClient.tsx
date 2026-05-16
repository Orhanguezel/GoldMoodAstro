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
    <div className="flex flex-col">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-16"
      >
        <div className="text-center space-y-8">
          <h1 className={`${cinzel.className} text-5xl md:text-7xl text-(--gm-text) tracking-tight leading-tight`}>Fincanın Dili</h1>
          <div className="flex flex-wrap justify-center gap-4">
            {result.symbols.map((s: any, i: number) => (
              <span key={i} className="px-6 py-2 bg-(--gm-gold)/10 border border-(--gm-gold)/20 rounded-full text-[10px] font-bold text-(--gm-gold) tracking-[0.2em] uppercase backdrop-blur-sm">
                {s.name}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-(--gm-surface) border border-(--gm-border-soft) rounded-[4rem] p-10 md:p-20 shadow-(--gm-shadow-card) relative overflow-hidden">
          <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none text-(--gm-gold)">
            <Coffee className="w-[30rem] h-[30rem]" />
          </div>

          <div className="relative z-10 font-serif text-xl md:text-3xl leading-[1.8] text-(--gm-text-dim) space-y-10">
            {result.interpretation.split('\n').map((line: string, i: number) => (
              line.trim() ? <p key={i} className="opacity-90">{line}</p> : <div key={i} className="h-6" />
            ))}
          </div>

          <div className="mt-20">
            <ConsultantFunnelCTA
              feature="kahve"
              intensity="heavy"
              context={{
                symbols: result.symbols.map((s: any) => s.name).join(', '),
              }}
            />
          </div>

          <div className="mt-20 pt-12 border-t border-(--gm-border-soft) flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="text-[11px] text-(--gm-muted) italic font-serif leading-relaxed max-w-md uppercase tracking-widest opacity-60">
              * Bu analiz Vision AI ve astrolojik semboloji veritabanımız tarafından hazırlanmıştır.
            </div>
            <div className="flex flex-wrap items-center justify-center gap-10">
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
                className="flex items-center gap-4 text-(--gm-gold) font-bold uppercase tracking-[0.2em] text-xs hover:text-(--gm-gold-dim) transition-colors"
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
