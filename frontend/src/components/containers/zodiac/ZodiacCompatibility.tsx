'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Cinzel } from 'next/font/google';
import Image from 'next/image';
import { useGetCompatibilityQuery } from '@/integrations/rtk/hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Zap, Briefcase, Star, Info, Share2 } from 'lucide-react';
import ShareCard from '@/components/common/ShareCard';
import { getZodiacMeta } from '@/lib/zodiac/signs';

const cinzel = Cinzel({ subsets: ['latin'] });

export default function ZodiacCompatibility() {
  const { signA, signB, locale } = useParams();
  const sA = signA as string;
  const sB = signB as string;
  const localePath = typeof locale === 'string' ? locale : 'tr';
  const metaA = getZodiacMeta(sA);
  const metaB = getZodiacMeta(sB);
  const labelA = metaA?.label ?? sA;
  const labelB = metaB?.label ?? sB;

  const { data: reading, isLoading } = useGetCompatibilityQuery({ signA: sA, signB: sB, locale: locale as string });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 space-y-12">
        <div className="flex items-center justify-center gap-8">
          <Skeleton className="w-32 h-32 rounded-full" />
          <Skeleton className="w-12 h-12" />
          <Skeleton className="w-32 h-32 rounded-full" />
        </div>
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  if (!reading) {
    return (
      <div className="py-40 text-center">
        <h2 className="text-2xl font-bold">Uyumluluk yorumu bulunamadı.</h2>
        <p className="text-muted-foreground mt-2">Bu kombinasyon için henüz bir analiz üretilmedi.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 md:py-20">
      {/* Header / Match Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative mb-16 p-10 md:p-16 rounded-[3rem] bg-gradient-to-br from-surface to-brand-primary/10 border border-brand-gold/30 text-center overflow-hidden shadow-glow"
      >
        <div className="absolute top-0 left-0 w-64 h-64 bg-brand-gold/5 blur-[100px] rounded-full -ml-32 -mt-32" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-6 md:gap-12 mb-8">
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 md:w-32 md:h-32 mb-4">
                <Image src={metaA?.image ?? `/uploads/zodiac/${sA}.png`} alt={labelA} fill className="object-contain" />
              </div>
              <span className="text-3xl text-brand-gold/70">{metaA?.symbol}</span>
              <span className={`${cinzel.className} text-xl md:text-2xl text-foreground`}>{labelA}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-brand-gold/10 flex items-center justify-center border border-brand-gold/20 mb-4">
                <Zap className="w-5 h-5 md:w-6 md:h-6 text-brand-gold" />
              </div>
              <span className="text-xs font-bold tracking-widest text-brand-gold/60 uppercase">UYUMU</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 md:w-32 md:h-32 mb-4">
                <Image src={metaB?.image ?? `/uploads/zodiac/${sB}.png`} alt={labelB} fill className="object-contain" />
              </div>
              <span className="text-3xl text-brand-gold/70">{metaB?.symbol}</span>
              <span className={`${cinzel.className} text-xl md:text-2xl text-foreground`}>{labelB}</span>
            </div>
          </div>

          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {[metaA, metaB].filter(Boolean).flatMap((meta) => [
              `${meta!.label}: ${meta!.element}`,
              `${meta!.label}: ${meta!.modality}`,
            ]).map((chip) => (
              <span key={chip} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-gold/80">
                {chip}
              </span>
            ))}
          </div>

          <h1 className={`${cinzel.className} text-3xl md:text-5xl mb-6 text-white leading-tight`}>
            {reading.title}
          </h1>
          <p className="text-lg md:text-xl text-brand-gold/80 italic font-serif">
            &quot;{reading.summary}&quot;
          </p>

          <div className="mt-8 flex justify-center">
            <ShareCard 
              title={`${labelA} & ${labelB} Uyumu`}
              shareText={`${labelA} ve ${labelB} burçlarının uyumuna baktım ✨\nLove Score: %${reading.love_score}\nSenin uyumun ne?`}
              variant="synastry"
              data={{
                partnerA: labelA,
                partnerB: labelB,
                scoreLove: reading.love_score,
                scoreAttraction: reading.sexual_score
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Score Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        {[
          { label: 'Aşk', score: reading.love_score, icon: Heart, color: 'text-rose-400' },
          { label: 'Arkadaşlık', score: reading.friendship_score, icon: Star, color: 'text-amber-400' },
          { label: 'Kariyer', score: reading.career_score, icon: Briefcase, color: 'text-blue-400' },
          { label: 'Tutku', score: reading.sexual_score, icon: Zap, color: 'text-purple-400' },
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-surface/50 p-6 rounded-2xl border border-border/40 flex flex-col items-center text-center group hover:bg-surface transition-colors"
          >
            <item.icon className={`w-6 h-6 mb-3 ${item.color}`} />
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{item.label}</div>
            <div className="text-2xl font-bold">{item.score}%</div>
            <div className="w-full h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${item.score}%` }} 
                transition={{ duration: 1, delay: idx * 0.1 + 0.5 }}
                className={`h-full ${item.color.replace('text-', 'bg-')}`} 
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detailed Analysis */}
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-surface/30 p-8 md:p-12 rounded-[2.5rem] border border-border/20"
        >
          <div className="flex items-center gap-3 mb-8">
            <Info className="w-5 h-5 text-brand-gold" />
            <h2 className={`${cinzel.className} text-2xl text-brand-gold`}>Derinlemesine Analiz</h2>
          </div>
          
          <div className="prose prose-invert max-w-none text-lg leading-relaxed whitespace-pre-wrap text-foreground/90">
            {reading.content}
          </div>
        </motion.div>

        {/* CTA */}
        <div className="bg-brand-primary/5 border border-brand-gold/10 p-10 rounded-3xl text-center">
          <h3 className="text-2xl mb-4 font-serif italic text-white">Gerçek uyum sinastri raporundan çıkar.</h3>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Burç uyumu sadece Güneş burçlarıyla sınırlı değildir. Venüs ve Mars yerleşimleriniz asıl hikayeyi anlatır. Kişiye özel sinastri (ilişki haritası) analizi için uzmanlarımıza danışın.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href={`/${localePath}/sinastri?mode=manual`} className="btn-premium py-4 px-10 rounded-full flex items-center gap-3">
              Sinastri raporu için <Zap className="w-4 h-4" />
            </Link>
            <Link href={`/${localePath}/birth-chart`} className="btn-secondary py-4 px-8 rounded-full">
              Doğum Haritası Çıkar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
