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
      className="space-y-12 max-w-[var(--gm-w-wide)] mx-auto"
    >
      {/* Header Info */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-3 px-6 py-2 bg-(--gm-gold)/10 border border-(--gm-gold)/20 rounded-full text-(--gm-gold) text-[10px] font-bold tracking-[0.3em] uppercase mb-4">
           <Star className="w-3.5 h-3.5 fill-current" /> {result.name} İçin Analiz
        </div>
        <h1 className={`${cinzel.className} text-5xl md:text-8xl text-(--gm-text) tracking-tighter leading-tight`}>
           Menzilin: <span className="text-(--gm-gold)">{menzil?.name_tr || 'Bilinmiyor'}</span>
        </h1>
        <p className={`${fraunces.className} text-(--gm-text-dim) text-2xl opacity-70`}>
           Arapça: {menzil?.name_ar} — Ebced Sayın: {result.ebced_total}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sol Panel: Kartlar */}
        <div className="w-full lg:w-1/3 space-y-6">
          {/* Menzil Card */}
          <div className="bg-(--gm-surface) backdrop-blur-xl border border-(--gm-border-soft) rounded-[3rem] p-12 text-center space-y-8 shadow-(--gm-shadow-card) relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-(--gm-gold)/5 rounded-full blur-3xl group-hover:bg-(--gm-gold)/10 transition-colors" />
            <div className="w-24 h-24 bg-(--gm-gold)/10 rounded-[2rem] flex items-center justify-center mx-auto border border-(--gm-gold)/20 text-(--gm-gold) shadow-(--gm-shadow-glow)">
               <Sun className="w-12 h-12" />
            </div>
            <div className="space-y-3">
              <h3 className={`${cinzel.className} text-2xl text-(--gm-text)`}>Menzil No</h3>
              <div className="text-7xl font-bold text-(--gm-gold) tracking-tighter">{result.menzil_no}</div>
            </div>
            <p className="text-base text-(--gm-text-dim) italic leading-relaxed px-4 font-serif">
              {menzil?.short_summary}
            </p>
          </div>

          {/* Categories */}
          <div className="bg-(--gm-surface) backdrop-blur-xl border border-(--gm-border-soft) rounded-[2.5rem] p-10 space-y-8 shadow-(--gm-shadow-soft)">
             <h4 className={`${cinzel.className} text-center text-xs tracking-[0.3em] text-(--gm-muted) uppercase`}>Etki Alanları</h4>
             <div className="flex flex-wrap justify-center gap-3">
                {menzil?.category?.map((cat: string, i: number) => (
                  <span key={i} className="px-5 py-2 bg-(--gm-bg-deep)/40 border border-(--gm-border-soft) rounded-full text-[10px] font-bold text-(--gm-gold) tracking-widest uppercase backdrop-blur-md">
                    {cat}
                  </span>
                ))}
             </div>
          </div>

          <button 
            onClick={() => router.push(`/${locale}/yildizname`)}
            className="w-full flex items-center justify-center gap-4 py-6 rounded-full border border-(--gm-border-soft) bg-(--gm-surface) hover:bg-(--gm-surface-high) transition-all text-(--gm-text-dim) text-xs font-bold tracking-[0.2em] group shadow-lg"
          >
            <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" /> YENİ ANALİZ YAP
          </button>
        </div>

        {/* Sağ Panel: Rapor */}
        <div className="w-full lg:w-2/3 space-y-10">
          <div className="bg-(--gm-surface) backdrop-blur-3xl border border-(--gm-border-soft) rounded-[3.5rem] p-10 md:p-20 shadow-(--gm-shadow-card) relative overflow-hidden">
            <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none text-(--gm-gold)">
              <BookOpen className="w-96 h-96" />
            </div>
            
            <div className="space-y-6 relative mb-16">
               <div className="flex items-center gap-3 text-(--gm-gold) mb-2">
                  <Sparkles className="w-6 h-6" />
                  <span className="text-[11px] font-bold tracking-[0.5em] uppercase">Mistik Yıldızname Raporu</span>
               </div>
               <h2 className={`${cinzel.className} text-4xl md:text-5xl text-(--gm-text) leading-tight`}>
                  Kaderin <span className="text-(--gm-gold)">Rakamları</span>
               </h2>
            </div>

            <div className={`${fraunces.className} text-xl md:text-3xl leading-[1.8] text-(--gm-text-dim) space-y-10`}>
              {result.result_text?.split('\n').map((line: string, i: number) => (
                line.trim() ? <p key={i} className="opacity-90">{line}</p> : <div key={i} className="h-6" />
              ))}
            </div>

            {/* Funnel CTA — merkezi (FAZ 28 / T28-3) */}
            <div className="mt-20">
              <ConsultantFunnelCTA
                feature="yildizname"
                intensity="heavy"
                context={{
                  menzil: menzil?.name_tr,
                  menzil_no: result.menzil_no,
                  ebced: result.ebced_total,
                }}
              />
            </div>

            <div className="mt-20 pt-12 border-t border-(--gm-border-soft) flex flex-col sm:flex-row items-center justify-between gap-10">
              <p className="text-[10px] text-(--gm-muted) italic max-w-xs uppercase tracking-[0.2em] text-center sm:text-left leading-relaxed">
                * Bu analiz ebced hesabı ve kadim ay menzilleri geleneğine dayanmaktadır. Gelecek sadece bir tahmindir.
              </p>
              <div className="flex items-center gap-6">
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
