'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Cinzel, Fraunces } from 'next/font/google';
import { 
  Sparkles, 
  Sun, 
  RefreshCcw,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Star
} from 'lucide-react';
import { useGetYildiznameReadingQuery } from '@/integrations/rtk/public/yildizname.public.endpoints';
import ShareCard from '@/components/common/ShareCard';
import ConsultantFunnelCTA from '@/components/common/ConsultantFunnelCTA';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

const cinzel = Cinzel({ subsets: ['latin'] });
const fraunces = Fraunces({ subsets: ['latin'], style: 'italic' });

export default function YildiznameResultClient() {
  const { id, locale } = useParams();
  const router = useRouter();
  const { data: result, isLoading, error } = useGetYildiznameReadingQuery(id as string);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-8">
        <div className="w-20 h-20 border-2 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin" />
        <p className="text-muted-foreground font-serif italic tracking-widest animate-pulse">Sırlar Yükleniyor...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="text-center py-40 space-y-8">
        <h2 className={`${cinzel.className} text-3xl text-foreground`}>Sonuç Bulunamadı</h2>
        <p className="text-muted-foreground">Aradığınız yıldızname kaydı mevcut değil veya bir hata oluştu.</p>
        <Link href={`/${locale}/yildizname`} className="inline-flex items-center gap-2 text-brand-gold font-bold">
          <ArrowLeft className="w-4 h-4" /> YENİ ANALİZ YAP
        </Link>
      </div>
    );
  }

  const menzil = result.menzil;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 max-w-6xl mx-auto"
    >
      {/* Header Info */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-6 py-2 bg-brand-gold/10 border border-brand-gold/20 rounded-full text-brand-gold text-[10px] font-bold tracking-[0.3em] uppercase mb-4">
           <Star className="w-3 h-3 fill-current" /> {result.name} İçin Analiz
        </div>
        <h1 className={`${cinzel.className} text-5xl md:text-7xl text-foreground tracking-tighter leading-tight`}>
           Menzilin: <span className="text-brand-gold">{menzil?.name_tr || 'Bilinmiyor'}</span>
        </h1>
        <p className="text-muted-foreground text-xl font-serif italic opacity-60">
           Arapça: {menzil?.name_ar} — Ebced Sayın: {result.ebced_total}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sol Panel: Kartlar */}
        <div className="w-full lg:w-1/3 space-y-6">
          {/* Menzil Card */}
          <div className="bg-surface/30 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 text-center space-y-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-gold/5 rounded-full blur-3xl group-hover:bg-brand-gold/10 transition-colors" />
            <div className="w-24 h-24 bg-brand-gold/10 rounded-[2rem] flex items-center justify-center mx-auto border border-brand-gold/20 text-brand-gold shadow-glow-gold">
               <Sun className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h3 className={`${cinzel.className} text-xl text-foreground`}>Menzil No</h3>
              <div className="text-6xl font-bold text-brand-gold tracking-tighter">{result.menzil_no}</div>
            </div>
            <p className="text-sm text-muted-foreground italic leading-relaxed px-4">
              {menzil?.short_summary}
            </p>
          </div>

          {/* Categories */}
          <div className="bg-surface/30 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-xl">
             <h4 className={`${cinzel.className} text-center text-sm tracking-widest text-muted-foreground uppercase`}>Etki Alanları</h4>
             <div className="flex flex-wrap justify-center gap-3">
                {menzil?.category?.map((cat: string, i: number) => (
                  <span key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-brand-gold tracking-widest uppercase">
                    {cat}
                  </span>
                ))}
             </div>
          </div>

          <button 
            onClick={() => router.push(`/${locale}/yildizname`)}
            className="w-full flex items-center justify-center gap-3 py-5 rounded-[2rem] border border-white/5 hover:bg-surface-high transition-all text-muted-foreground text-sm font-bold tracking-widest group shadow-lg"
          >
            <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" /> YENİ ANALİZ YAP
          </button>
        </div>

        {/* Sağ Panel: Rapor */}
        <div className="w-full lg:w-2/3 space-y-8">
          <div className="bg-surface/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 md:p-20 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
              <BookOpen className="w-80 h-80" />
            </div>
            
            <div className="space-y-4 relative mb-12">
               <div className="flex items-center gap-2 text-brand-gold mb-2">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-[10px] font-bold tracking-[0.4em] uppercase">Mistik Yıldızname Raporu</span>
               </div>
               <h2 className={`${cinzel.className} text-4xl text-foreground leading-tight`}>
                  Kaderin <span className="text-brand-gold">Rakamları</span>
               </h2>
            </div>

            <div className={`${fraunces.className} prose prose-invert prose-p:text-muted-foreground prose-p:leading-[1.8] prose-p:text-xl md:prose-p:text-2xl prose-p:mb-8 prose-strong:text-brand-gold`}>
              {result.result_text?.split('\n').map((line: string, i: number) => (
                line.trim() ? <p key={i}>{line}</p> : <div key={i} className="h-4" />
              ))}
            </div>

            {/* Funnel CTA — merkezi (FAZ 28 / T28-3) */}
            <ConsultantFunnelCTA
              feature="yildizname"
              intensity="heavy"
              context={{
                menzil: menzil?.name_tr,
                menzil_no: result.menzil_no,
                ebced: result.ebced_total,
              }}
            />

            <div className="mt-16 pt-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-8">
              <p className="text-[10px] text-muted-foreground/50 italic max-w-xs uppercase tracking-widest text-center sm:text-left">
                * Bu analiz ebced hesabı ve kadim ay menzilleri geleneğine dayanmaktadır. Gelecek sadece bir tahmindir.
              </p>
              <div className="flex items-center gap-4">
                <ShareCard 
                  title="Yıldıznamemi Paylaş"
                  shareText={`GoldMoodAstro'da yıldıznamemi keşfettim ✦\n✧ Menzilim: ${menzil?.name_tr}  •  № Ebced Sayım: ${result.ebced_total}\nSenin kaderinde neler yazıyor?`}
                  variant="yildizname"
                  data={{
                    name: result.name,
                    mother_name: result.mother_name,
                    menzil: menzil?.name_tr,
                    number: result.ebced_total
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
