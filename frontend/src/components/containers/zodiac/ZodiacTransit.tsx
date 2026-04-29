'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Cinzel } from 'next/font/google';
import Image from 'next/image';
import { useGetTransitHoroscopesQuery } from '@/integrations/rtk/hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const cinzel = Cinzel({ subsets: ['latin'] });

const SIGN_LABELS: Record<string, string> = {
  aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
  leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
  sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık',
};

export default function ZodiacTransit() {
  const { month, locale } = useParams();
  const monthStr = month as string; // YYYY-MM

  const { data: horoscopes, isLoading } = useGetTransitHoroscopesQuery({ month: monthStr, locale: locale as string });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-20 px-4 space-y-12">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const [year, monthNum] = monthStr.split('-');
  const dateObj = new Date(parseInt(year), parseInt(monthNum) - 1);
  const monthLabel = dateObj.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 md:py-20">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-20 relative"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-gold text-sm font-bold tracking-widest uppercase mb-6">
          <Calendar className="w-4 h-4" /> AYIN GEÇİŞLERİ
        </div>
        <h1 className={`${cinzel.className} text-4xl md:text-6xl text-foreground mb-6`}>
          {monthLabel} Gökyüzü Raporu
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-serif italic">
          Bu ay gökyüzündeki gezegen geçişlerinin burçlar üzerindeki ana etkilerini keşfedin. Major transitler, yeniay ve dolunay enerjileri burada.
        </p>
      </motion.div>

      {/* Signs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {horoscopes?.map((h, idx) => (
          <motion.div
            key={h.sign}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: (idx % 3) * 0.1 }}
            className="group bg-surface/50 border border-border/40 rounded-[2rem] p-8 hover:border-brand-gold/30 hover:bg-surface transition-all duration-500 shadow-sm hover:shadow-glow flex flex-col"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="relative w-16 h-16 transform group-hover:scale-110 transition-transform duration-500">
                <Image src={`/uploads/zodiac/${h.sign}.png`} alt={h.sign} fill className="object-contain" />
              </div>
              <div>
                <h3 className={`${cinzel.className} text-2xl text-foreground group-hover:text-brand-gold transition-colors`}>
                  {SIGN_LABELS[h.sign]}
                </h3>
                <div className="text-[10px] font-bold text-brand-gold/60 uppercase tracking-widest">
                  AYLIK GEÇİŞ ETKİSİ
                </div>
              </div>
            </div>

            <div className="text-muted-foreground leading-relaxed mb-8 flex-1 line-clamp-6 italic">
              &quot;{locale === 'en' ? h.contentEn || h.contentTr : h.contentTr}&quot;
            </div>

            <Link
              href={`/burclar/${h.sign}`}
              className="mt-auto flex items-center gap-2 text-sm font-bold text-brand-gold hover:text-brand-gold-light transition-colors group/btn"
            >
              DETAYLI BURÇ PROFİLİ <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Missing Data State */}
      {(!horoscopes || horoscopes.length === 0) && (
        <div className="py-20 text-center bg-surface/30 rounded-3xl border border-dashed border-border">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h2 className="text-xl font-medium text-muted-foreground">Bu ay için henüz geçiş raporu hazırlanmadı.</h2>
          <p className="text-muted-foreground/60 mt-2">Raporlar her ayın 25'inde gelecek ay için yayınlanır.</p>
        </div>
      )}

      {/* Footer CTA */}
      <div className="mt-24 p-12 rounded-[3rem] bg-gradient-to-br from-brand-primary/10 to-surface border border-brand-gold/20 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--gm-gold)_0%,_transparent_70%)] opacity-[0.03]" />
        <h2 className={`${cinzel.className} text-3xl mb-4 text-white`}>Daha Derine İnin</h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-10 italic">
          Genel gökyüzü etkileri herkesi farklı etkiler. Kendi doğum haritanız üzerindeki transitleri görmek için premium analizimize göz atın.
        </p>
        <button className="btn-premium py-4 px-12 rounded-full">
          KİŞİSEL TRANSİT HARİTAM
        </button>
      </div>
    </div>
  );
}
