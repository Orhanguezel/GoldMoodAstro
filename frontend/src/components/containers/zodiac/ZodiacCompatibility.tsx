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

interface Props {
  signA?: string;
  signB?: string;
}

export default function ZodiacCompatibility({ signA: signAProp, signB: signBProp }: Props = {}) {
  const params = useParams();
  // Önce props (server-side route'tan), yoksa params'tan
  const sA = (signAProp ?? (params?.signA as string)) || '';
  const sB = (signBProp ?? (params?.signB as string)) || '';
  const locale = params?.locale;
  const localePath = typeof locale === 'string' ? locale : 'tr';
  const metaA = getZodiacMeta(sA);
  const metaB = getZodiacMeta(sB);
  const labelA = metaA?.label ?? sA;
  const labelB = metaB?.label ?? sB;

  const { data: reading, isLoading } = useGetCompatibilityQuery(
    { signA: sA, signB: sB, locale: locale as string },
    { skip: !sA || !sB }
  );

  // Component yanlışlıkla başka bir route'tan mount edilmişse (signA/signB eksik) hiç render etme.
  if (!sA || !sB) return null;

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
    <div className="zodiac-compatibility-scope">
      {/* Header / Match Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative mb-16 p-10 md:p-20 rounded-[3rem] bg-gradient-to-br from-(--gm-surface) to-(--gm-bg-deep) border border-(--gm-gold)/30 text-center overflow-hidden shadow-(--gm-shadow-glow)"
      >
        <div className="absolute top-0 left-0 w-64 h-64 bg-(--gm-gold)/5 blur-[100px] rounded-full -ml-32 -mt-32" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-8 md:gap-20 mb-12">
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 md:w-40 md:h-40 mb-6 group-hover:scale-105 transition-transform">
                <Image src={metaA?.image ?? `/uploads/zodiac/${sA}.png`} alt={labelA} fill className="object-contain" />
              </div>
              <span className="text-4xl text-(--gm-gold)/70 mb-2">{metaA?.symbol}</span>
              <span className={`${cinzel.className} text-xl md:text-3xl text-(--gm-text)`}>{labelA}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-(--gm-gold)/10 flex items-center justify-center border border-(--gm-gold)/20 mb-6 shadow-gold">
                <Zap className="w-6 h-6 md:w-8 md:h-8 text-(--gm-gold)" />
              </div>
              <span className="text-[10px] font-bold tracking-[0.3em] text-(--gm-gold)/60 uppercase">UYUMU</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 md:w-40 md:h-40 mb-6 group-hover:scale-105 transition-transform">
                <Image src={metaB?.image ?? `/uploads/zodiac/${sB}.png`} alt={labelB} fill className="object-contain" />
              </div>
              <span className="text-4xl text-(--gm-gold)/70 mb-2">{metaB?.symbol}</span>
              <span className={`${cinzel.className} text-xl md:text-3xl text-(--gm-text)`}>{labelB}</span>
            </div>
          </div>

          <div className="mb-10 flex flex-wrap justify-center gap-3">
            {[metaA, metaB].filter(Boolean).flatMap((meta) => [
              `${meta!.label}: ${meta!.element}`,
              `${meta!.label}: ${meta!.modality}`,
            ]).map((chip) => (
              <span key={chip} className="rounded-full border border-(--gm-border-soft) bg-(--gm-bg-deep)/40 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-(--gm-gold)/80 backdrop-blur-sm">
                {chip}
              </span>
            ))}
          </div>

          <h1 className={`${cinzel.className} text-3xl md:text-6xl mb-8 text-(--gm-text) leading-tight`}>
            {reading.title}
          </h1>
          <p className="text-xl md:text-2xl text-(--gm-text-dim) italic font-serif opacity-90 max-w-4xl mx-auto leading-relaxed">
            &quot;{reading.summary}&quot;
          </p>

          <div className="mt-12 flex justify-center">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
        {[
          { label: 'Aşk', score: reading.love_score, icon: Heart, color: 'text-[var(--gm-error)]' },
          { label: 'Arkadaşlık', score: reading.friendship_score, icon: Star, color: 'text-[var(--gm-warning)]' },
          { label: 'Kariyer', score: reading.career_score, icon: Briefcase, color: 'text-[var(--gm-info)]' },
          { label: 'Tutku', score: reading.sexual_score, icon: Zap, color: 'text-[var(--gm-primary)]' },
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-(--gm-surface) p-8 rounded-3xl border border-(--gm-border-soft) flex flex-col items-center text-center group hover:shadow-(--gm-shadow-soft) transition-all"
          >
            <item.icon className={`w-8 h-8 mb-4 ${item.color}`} />
            <div className="text-[11px] font-bold text-(--gm-muted) uppercase tracking-[0.2em] mb-2">{item.label}</div>
            <div className={`${cinzel.className} text-3xl font-bold text-(--gm-text)`}>{item.score}%</div>
            <div className="w-full h-1.5 bg-(--gm-bg-deep) rounded-full mt-5 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${item.score}%` }} 
                transition={{ duration: 1.5, delay: idx * 0.1 + 0.5, ease: "easeOut" }}
                className={`h-full ${item.color.replace('text-', 'bg-')}`} 
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detailed Analysis */}
      <div className="space-y-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-(--gm-surface) p-8 md:p-16 rounded-[3rem] border border-(--gm-border-soft) shadow-(--gm-shadow-soft)"
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 rounded-full bg-(--gm-gold)/10 flex items-center justify-center">
              <Info className="w-5 h-5 text-(--gm-gold)" />
            </div>
            <h2 className={`${cinzel.className} text-3xl text-(--gm-gold)`}>Derinlemesine Analiz</h2>
          </div>
          
          <div className="text-xl leading-relaxed whitespace-pre-wrap text-(--gm-text) font-serif opacity-90 max-w-none">
            {reading.content}
          </div>
        </motion.div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-(--gm-primary)/10 to-transparent border border-(--gm-gold)/20 p-12 md:p-20 rounded-[3rem] text-center shadow-(--gm-shadow-soft)">
          <h3 className={`${cinzel.className} text-3xl md:text-4xl mb-6 text-(--gm-text)`}>Gerçek uyum sinastri raporundan çıkar.</h3>
          <p className="text-(--gm-text-dim) mb-12 max-w-3xl mx-auto text-lg leading-relaxed font-serif italic">
            Burç uyumu sadece Güneş burçlarıyla sınırlı değildir. Venüs ve Mars yerleşimleriniz asıl hikayeyi anlatır. Kişiye özel sinastri (ilişki haritası) analizi için uzmanlarımıza danışın.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href={`/${localePath}/sinastri?mode=manual`} className="rounded-full bg-(--gm-primary) px-10 py-5 text-xs font-bold uppercase tracking-[0.25em] text-(--gm-bg) hover:bg-(--gm-primary-dark) transition-all shadow-lg hover:scale-105 flex items-center gap-3">
              Sinastri raporu için <Zap className="w-4 h-4" />
            </Link>
            <Link href={`/${localePath}/birth-chart`} className="rounded-full border border-(--gm-border-soft) px-10 py-5 text-xs font-bold uppercase tracking-[0.25em] text-(--gm-text) hover:bg-(--gm-surface) transition-all">
              Doğum Haritası Çıkar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
