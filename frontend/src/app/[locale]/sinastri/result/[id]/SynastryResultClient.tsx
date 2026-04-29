'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Cinzel } from 'next/font/google';
import { 
  Sparkles, 
  Star,
  ShieldCheck,
  ChevronLeft,
  Heart
} from 'lucide-react';
import { useGetSynastryReadingByIdQuery } from '@/integrations/rtk/hooks';
import ShareCard from '@/components/common/ShareCard';
import ConsultantFunnelCTA from '@/components/common/ConsultantFunnelCTA';
import { useParams, useRouter } from 'next/navigation';

const cinzel = Cinzel({ subsets: ['latin'] });

export default function SynastryResultClient() {
  const { id, locale } = useParams();
  const router = useRouter();
  const { data: res, isLoading, error } = useGetSynastryReadingByIdQuery(id as string);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-12">
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-32 h-32 border-4 border-brand-gold/20 border-t-brand-gold rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Heart className="w-8 h-8 text-brand-gold fill-brand-gold animate-pulse" />
          </div>
        </div>
        <p className="text-muted-foreground font-serif italic tracking-widest animate-pulse">Kader Bağları Çözümleniyor...</p>
      </div>
    );
  }

  if (error || !res) {
    return (
      <div className="text-center py-40 space-y-8">
        <h2 className={`${cinzel.className} text-3xl text-foreground`}>Sonuç Bulunamadı</h2>
        <p className="text-muted-foreground">Aradığınız aşk uyumu kaydı mevcut değil veya bir hata oluştu.</p>
        <button 
          onClick={() => router.push(`/${locale}/sinastri`)}
          className="inline-flex items-center gap-2 text-brand-gold font-bold"
        >
          YENİ UYUM ANALİZİ
        </button>
      </div>
    );
  }

  const result = res.data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col lg:flex-row gap-10"
      >
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="bg-surface/30 border border-border/20 rounded-[2.5rem] p-8 text-center space-y-6 backdrop-blur-xl">
            <h3 className={`${cinzel.className} text-xl text-foreground tracking-widest`}>Uyum Skoru</h3>
            <div className="relative inline-block">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-border/10" />
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * (result.result?.score ?? 0)) / 100} className="text-brand-primary" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-brand-primary">%{result.result?.score ?? 0}</div>
            </div>
            <div className="text-sm font-serif italic text-muted-foreground">
               Sen & {result.partner_data?.name ?? 'Partner'}
            </div>
          </div>
          
          <div className="bg-surface/30 border border-border/20 rounded-[2.5rem] p-8 space-y-6 backdrop-blur-xl">
            <h4 className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.3em] mb-4">ÖNEMLİ AÇILAR</h4>
            <div className="space-y-4">
              {result.result?.aspects?.slice(0, 8).map((a: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-high/30 border border-border/10">
                  <div className="text-xs font-bold text-foreground uppercase">{a.planet_a} & {a.planet_b}</div>
                  <div className="text-[10px] text-brand-primary font-bold uppercase">{a.type}</div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => router.push(`/${locale}/sinastri`)}
            className="w-full flex items-center justify-center gap-3 py-5 rounded-[2.5rem] border border-white/5 hover:bg-surface-high transition-all text-muted-foreground text-sm font-bold tracking-widest group shadow-lg"
          >
            <ChevronLeft className="w-4 h-4" /> YENİ ANALİZ YAP
          </button>
        </div>

        <div className="w-full lg:w-2/3 bg-surface/30 border border-border/20 rounded-[3rem] p-10 md:p-14 space-y-10 relative overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
            <Sparkles className="w-64 h-64 text-brand-primary" />
          </div>
          
          <div className="space-y-6 relative">
            <div className="flex items-center gap-2 text-brand-primary">
              <Star className="w-5 h-5 fill-brand-primary" />
              <span className="text-[10px] font-bold tracking-[0.4em] uppercase">Derin Analiz</span>
            </div>
            <h2 className={`${cinzel.className} text-4xl text-foreground leading-tight`}>
              Kozmik <span className="text-brand-primary">Bağlantı</span> Raporu
            </h2>
            <p className="text-muted-foreground font-serif italic text-lg leading-relaxed">
              Yıldızların rehberliğinde hazırlanan özel uyum analiziniz:
            </p>
          </div>

          <div className="prose prose-invert prose-brand max-w-none">
            <div className="text-foreground/90 leading-relaxed font-serif whitespace-pre-wrap italic text-lg opacity-90">
              {result.result?.interpretation}
            </div>
          </div>

          <ConsultantFunnelCTA
            feature="sinastri"
            intensity="heavy"
            context={{
              score: result.result?.score,
              partner: result.partner_data?.name,
            }}
          />

          <div className="pt-10 border-t border-border/10 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3 text-muted-foreground/60">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-bold tracking-widest uppercase">Güvenli ve Gizli Analiz</span>
            </div>
            <ShareCard 
              title="Aşk Uyumumuzu Paylaş"
              shareText={`GoldMoodAstro'da aşk uyumumuzu ölçtüm ✨\n❤️ Uyum Skoru: %${result.result?.score}\nPartnerimle olan kozmik bağımızı keşfet:`}
              variant="synastry"
              data={{
                partnerA: 'Sen',
                partnerB: result.partner_data?.name ?? 'Partner',
                scoreLove: result.result?.score,
                scoreAttraction: result.result?.score // Reusing for now
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
