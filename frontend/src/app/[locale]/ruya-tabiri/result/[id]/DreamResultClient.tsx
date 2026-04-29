'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Cinzel, Fraunces } from 'next/font/google';
import { 
  Sparkles, 
  RotateCcw, 
  Star,
} from 'lucide-react';
import ShareCard from '@/components/common/ShareCard';
import ConsultantFunnelCTA from '@/components/common/ConsultantFunnelCTA';
import { useGetDreamReadingQuery } from '@/integrations/rtk/public/dreams.public.endpoints';
import { useParams, useRouter } from 'next/navigation';

const cinzel = Cinzel({ subsets: ['latin'] });
const fraunces = Fraunces({ subsets: ['latin'], style: 'italic' });

export default function DreamResultClient() {
  const { id, locale } = useParams();
  const router = useRouter();
  const { data: res, isLoading, error } = useGetDreamReadingQuery(id as string);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-8">
        <div className="w-20 h-20 border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
        <p className="text-muted-foreground font-serif italic tracking-widest animate-pulse">Rüyanın Sırları Çözülüyor...</p>
      </div>
    );
  }

  if (error || !res) {
    return (
      <div className="text-center py-40 space-y-8">
        <h2 className={`${cinzel.className} text-3xl text-foreground`}>Sonuç Bulunamadı</h2>
        <p className="text-muted-foreground">Aradığınız rüya kaydı mevcut değil veya bir hata oluştu.</p>
        <button 
          onClick={() => router.push(`/${locale}/ruya-tabiri`)}
          className="inline-flex items-center gap-2 text-brand-primary font-bold"
        >
          YENİ RÜYA YORUMLA
        </button>
      </div>
    );
  }

  const result = res.data;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-20 min-h-[80vh] flex flex-col">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-16"
      >
        <div className="text-center space-y-4">
          <span className="text-xs font-bold tracking-[0.3em] text-brand-primary uppercase opacity-60">Rüyanın Bilinçaltı Yansıması</span>
          <h1 className={`${cinzel.className} text-5xl md:text-7xl text-foreground`}>Rüya Analizi</h1>
        </div>

        {/* Symbols Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {result.symbols?.map((s: any, i: number) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface/30 border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center group hover:bg-brand-primary/5 transition-colors"
            >
              <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-foreground text-lg mb-1">{s.name}</h3>
              <div className="text-[10px] font-bold text-brand-primary/60 uppercase tracking-widest mb-3">
                %{Math.round((s.confidence || 0.9) * 100)} Güven
              </div>
              {s.meaning && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 italic">
                  "{s.meaning}"
                </p>
              )}
            </motion.div>
          ))}
        </div>

        <div className="relative bg-surface/40 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-8 md:p-20 shadow-2xl">
          <div className={`${fraunces.className} prose prose-invert max-w-none prose-p:text-muted-foreground prose-p:leading-[1.8] prose-p:text-xl md:prose-p:text-2xl prose-p:mb-10 prose-strong:text-brand-primary prose-strong:font-bold`}>
            {result.interpretation.split('\n').map((line: string, i: number) => (
              line.trim() ? <p key={i}>{line}</p> : <div key={i} className="h-4" />
            ))}
          </div>

          <ConsultantFunnelCTA
            feature="ruya"
            intensity="heavy"
            context={{
              symbols: result.symbols.map((s: any) => s.name).join(', '),
            }}
          />

          <div className="mt-20 pt-10 border-t border-white/5 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="flex flex-col gap-2 text-center lg:text-left">
              <p className="text-sm text-muted-foreground italic font-serif opacity-50">
                * Bu yorum Jung arketipleri ve kadim semboloji ile harmanlanarak yapay zeka tarafından üretilmiştir.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <ShareCard 
                title="Rüya Yorumumu Paylaş"
                shareText={`GoldMoodAstro'da rüyamı yorumlattım ✨\nSembollerim: ${result.symbols.map((s: any) => s.name).join(', ')}\nBilinçaltının gizli mesajını keşfet:`}
                variant="dream"
                data={{
                  symbols: result.symbols.map((s: any) => s.name),
                  excerpt: result.interpretation.slice(0, 150) + '...'
                }}
              />
              <button 
                onClick={() => router.push(`/${locale}/ruya-tabiri`)}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-surface-high hover:bg-surface transition-colors font-bold text-sm uppercase tracking-widest text-brand-primary"
              >
                YENİ RÜYA YORUMLA <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
