'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Cinzel, Manrope } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import { useGetSignInfoQuery, useGetTodayHoroscopeQuery } from '@/integrations/rtk/hooks';
import { ZodiacSign } from '@/types/common';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Heart, Briefcase, Info, Sparkles, ArrowRight, Volume2 } from 'lucide-react';
import ShareCard from '@/components/common/ShareCard';
import { getZodiacMeta } from '@/lib/zodiac/signs';

const cinzel = Cinzel({ subsets: ['latin'] });
const manrope = Manrope({ subsets: ['latin'] });

export default function ZodiacDetail({ initialTab = 'overview' }: { initialTab?: string }) {
  const { sign, locale } = useParams();
  const signKey = sign as ZodiacSign;
  const meta = getZodiacMeta(signKey) || {
    key: signKey,
    label: signKey,
    date: '',
    symbol: '',
    element: 'Ateş' as const,
    modality: 'Öncü' as const,
    polarity: 'Yang' as const,
    ruler: '',
    accent: '#D4AF37',
    image: `/uploads/zodiac/${signKey}.png`,
  };

  const { data: info, isLoading: isInfoLoading } = useGetSignInfoQuery({ sign: signKey, locale: locale as string });
  const { data: today, isLoading: isTodayLoading } = useGetTodayHoroscopeQuery({ sign: signKey });

  if (isInfoLoading || isTodayLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 space-y-8">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-12 w-1/2 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="py-40 text-center">
        <h2 className="text-2xl font-bold">Burç bilgisi bulunamadı.</h2>
      </div>
    );
  }

  return (
    <div
      className="zodiac-accent-scope max-w-5xl mx-auto py-12 px-4 md:py-20"
      style={{ '--gm-zodiac-accent': meta.accent } as React.CSSProperties}
    >
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-16 p-8 md:p-12 rounded-[2rem] bg-surface border border-border/40 overflow-hidden shadow-glow"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 blur-[100px] rounded-full -mr-20 -mt-20" />
        
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 relative">
          <div className="relative w-48 h-48 md:w-64 md:h-64 flex-shrink-0 animate-float">
            <Image
              src={meta.image}
              alt={info.title}
              fill
              className="object-contain"
              priority
            />
          </div>
          
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <span className="text-4xl">{meta.symbol}</span>
              <span className="text-sm font-bold tracking-[0.2em] text-brand-gold uppercase">
                {meta.date}
              </span>
            </div>
            <h1 className={`${cinzel.className} text-4xl md:text-6xl mb-4 text-foreground`}>
              {meta.label}
            </h1>
            <div className="mb-5 flex flex-wrap justify-center gap-2 md:justify-start">
              {[meta.element, meta.modality, meta.polarity, meta.ruler].filter(Boolean).map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                  style={{ backgroundColor: `${meta.accent}18`, color: meta.accent }}
                >
                  {item}
                </span>
              ))}
            </div>
            <p className="text-lg md:text-xl text-muted-foreground italic leading-relaxed">
              &quot;{info.short_summary}&quot;
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content Tabs */}
      <Tabs defaultValue={initialTab} className="space-y-8">
        <TabsList className="w-full justify-start overflow-x-auto bg-transparent border-b border-border h-auto p-0 gap-8 rounded-none">
          <TabsTrigger value="overview" className="px-0 py-4 bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-brand-gold rounded-none gap-2 text-base">
            <Info className="w-4 h-4" /> Genel Bakış
          </TabsTrigger>
          <TabsTrigger value="daily" className="px-0 py-4 bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-brand-gold rounded-none gap-2 text-base">
            <Sparkles className="w-4 h-4" /> Günlük Yorum
          </TabsTrigger>
          {info.sections?.map(s => (
            <TabsTrigger key={s.id} value={s.key2} className="px-0 py-4 bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-brand-gold rounded-none gap-2 text-base">
              {s.key2 === 'love' && <Heart className="w-4 h-4" />}
              {s.key2 === 'career' && <Briefcase className="w-4 h-4" />}
              {s.key2 === 'personality' && <Star className="w-4 h-4" />}
              {s.title}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="prose prose-invert max-w-none bg-surface/50 p-8 rounded-3xl border border-border/30"
          >
            <div className="text-lg leading-relaxed whitespace-pre-wrap text-foreground/90">
              {info.content}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="daily" className="mt-0">
          {today && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-surface to-brand-primary/5 p-8 md:p-12 rounded-[2.5rem] border border-brand-gold/20 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Sparkles className="w-24 h-24 text-brand-gold" />
              </div>
              
              <div className="relative">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px flex-1 bg-brand-gold/20" />
                  <span className={`${cinzel.className} text-brand-gold text-lg tracking-widest uppercase`}>
                    {new Date(today.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <div className="h-px flex-1 bg-brand-gold/20" />
                </div>

                <div className="text-xl md:text-2xl leading-relaxed text-foreground mb-10 text-center font-medium">
                  {today.contentTr}
                </div>

                <div className="flex justify-center mb-10">
                   <ShareCard 
                     title={`${meta.label} Burcu Günlük Yorumu`}
                     shareText={`${meta.label} burcu için bugünkü yorumum ✨\n"${today.contentTr.slice(0, 100)}..."\nSenin burcun bugün ne diyor?`}
                     variant="horoscope"
                     data={{
                       sign: meta.label,
                       date: new Date(today.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }),
                       symbol: meta.symbol,
                       content: today.contentTr
                     }}
                   />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-2xl bg-black/20 border border-white/5 text-center">
                    <div className="text-brand-gold text-sm font-bold mb-2 uppercase tracking-tighter">Günün Modu</div>
                    <div className="text-3xl font-bold">{today.moodScore}/10</div>
                  </div>
                  <div className="p-6 rounded-2xl bg-black/20 border border-white/5 text-center">
                    <div className="text-brand-gold text-sm font-bold mb-2 uppercase tracking-tighter">Şanslı Sayı</div>
                    <div className="text-3xl font-bold">{today.luckyNumber}</div>
                  </div>
                  <div className="p-6 rounded-2xl bg-black/20 border border-white/5 text-center">
                    <div className="text-brand-gold text-sm font-bold mb-2 uppercase tracking-tighter">Şanslı Renk</div>
                    <div className="text-3xl font-bold">{today.luckyColor}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </TabsContent>

        {info.sections?.map(s => (
          <TabsContent key={s.id} value={s.key2} className="mt-0">
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-surface/50 p-8 rounded-3xl border border-border/30"
            >
              <h3 className={`${cinzel.className} text-2xl mb-6 text-brand-gold`}>{s.title}</h3>
              <div className="text-lg leading-relaxed whitespace-pre-wrap text-foreground/90">
                {s.content}
              </div>
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Internal Linking CTA */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link 
          href={`/burclar/${signKey}-koc-uyumu`} // default example, better to have a selector or link to a hub
          className="p-8 rounded-3xl bg-surface/40 border border-border/40 hover:border-brand-gold/40 transition-all group shadow-sm"
        >
          <div className="flex items-center gap-4 mb-4">
            <Heart className="w-6 h-6 text-rose-400" />
            <h4 className={`${cinzel.className} text-xl text-foreground`}>Burç Uyumu</h4>
          </div>
          <p className="text-muted-foreground text-sm mb-6">
            {meta.label} burcunun diğer burçlarla olan aşk ve karakter uyumunu detaylıca inceleyin.
          </p>
          <div className="text-brand-gold text-xs font-bold tracking-widest uppercase flex items-center gap-2">
            UYUMU KEŞFET <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link 
          href="/birth-chart"
          className="p-8 rounded-3xl bg-brand-primary/5 border border-brand-gold/20 hover:border-brand-gold/40 transition-all group shadow-sm"
        >
          <div className="flex items-center gap-4 mb-4">
            <Sparkles className="w-6 h-6 text-brand-gold" />
            <h4 className={`${cinzel.className} text-xl text-foreground`}>Doğum Haritası</h4>
          </div>
          <p className="text-muted-foreground text-sm mb-6">
            Sadece Güneş burcunuzdan ibaret değilsiniz. Tüm gezegen yerleşimlerinizi ücretsiz hesaplayın.
          </p>
          <div className="text-brand-gold text-xs font-bold tracking-widest uppercase flex items-center gap-2">
            HARİTANI ÇIKAR <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href={`/burclar/${signKey}/meditasyon`}
          className="p-8 rounded-3xl bg-surface/40 border border-border/40 hover:border-brand-gold/40 transition-all group shadow-sm"
        >
          <div className="flex items-center gap-4 mb-4">
            <Volume2 className="w-6 h-6 text-brand-gold" />
            <h4 className={`${cinzel.className} text-xl text-foreground`}>Meditasyon</h4>
          </div>
          <p className="text-muted-foreground text-sm mb-6">
            {meta.label} burcuna özel kısa meditasyon ve günlük affirmasyonları sesli dinleyin.
          </p>
          <div className="text-brand-gold text-xs font-bold tracking-widest uppercase flex items-center gap-2">
            DİNLE <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
