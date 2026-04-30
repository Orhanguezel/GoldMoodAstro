'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cinzel } from 'next/font/google';
import BirthChartForm from '@/components/containers/birth-chart/BirthChartForm';
import { BirthChart } from '@/types/common';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, ArrowRight, Share2 } from 'lucide-react';
import { useListMyBirthChartsQuery } from '@/integrations/rtk/public/birth_charts.endpoints';

const cinzel = Cinzel({ subsets: ['latin'] });

const SIGN_LABELS: Record<string, string> = {
  aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
  leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
  sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık',
};

export default function RisingSignCalculator() {
  const [result, setResult] = useState<BirthChart | null>(null);
  const { data: myCharts } = useListMyBirthChartsQuery();

  useEffect(() => {
    if (!result && myCharts && myCharts.length > 0) {
      setResult(myCharts[0]);
    }
  }, [myCharts, result]);

  const sunSign = result?.chart_data.planets.sun.sign;
  const moonSign = result?.chart_data.planets.moon.sign;
  const risingSign = result?.chart_data.ascendant.sign;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className={`${cinzel.className} text-4xl md:text-6xl mb-6 text-brand-gold`}>
          Yükselen Burç Hesaplayıcı
        </h1>
        <p className="text-lg text-muted-foreground italic max-w-2xl mx-auto">
          Doğduğunuz anın gökyüzü haritasını çıkararak yükselen burcunuzu ve kozmik kimliğinizin temel taşlarını keşfedin.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-surface p-8 md:p-12 rounded-[2.5rem] border border-border/40 shadow-soft"
          >
            <BirthChartForm onSuccess={(c) => setResult(c)} />
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* The Big Three Result */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { type: 'Güneş Burcu', sign: sunSign, icon: '☀️' },
                { type: 'Yükselen Burç', sign: risingSign, icon: '🌅', highlight: true },
                { type: 'Ay Burcu', sign: moonSign, icon: '🌙' },
              ].map((item, idx) => (
                <motion.div
                  key={item.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-8 rounded-[2rem] text-center border transition-all duration-500 ${
                    item.highlight 
                    ? 'bg-gradient-to-br from-brand-gold/10 to-brand-primary/10 border-brand-gold/30 shadow-glow' 
                    : 'bg-surface border-border/40'
                  }`}
                >
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <div className="text-xs font-bold tracking-[0.2em] text-brand-gold uppercase mb-2">{item.type}</div>
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    <Image
                      src={`/uploads/zodiac/${item.sign}.png`}
                      alt={SIGN_LABELS[item.sign!] || ''}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className={`${cinzel.className} text-2xl`}>{SIGN_LABELS[item.sign!] || item.sign}</h3>
                </motion.div>
              ))}
            </div>

            {/* Detailed Rising Insight */}
            <div className="bg-surface p-8 md:p-12 rounded-[2.5rem] border border-border/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Sparkles className="w-32 h-32 text-brand-gold" />
              </div>
              
              <h2 className={`${cinzel.className} text-3xl mb-6 text-brand-gold`}>Yükselen {SIGN_LABELS[risingSign!] || risingSign} Etkisi</h2>
              <div className="prose prose-invert max-w-none text-lg text-muted-foreground leading-relaxed">
                <p>
                  Yükselen burcunuz, doğduğunuz an ufuk çizgisinde yükselen burçtur ve dış dünyaya sunduğunuz maskenizi temsil eder. 
                  Bir <strong>{SIGN_LABELS[risingSign!] || risingSign}</strong> yükselen olarak, insanlar sizi ilk tanıdıklarında bu burcun özelliklerini görürler.
                </p>
                <p>
                  Hayata bakış açınız, fiziksel görünümünüz ve ilk tepkileriniz bu burcun enerjisiyle şekillenir. 
                  Bu sizin kozmik vitrininizdir.
                </p>
              </div>

              <div className="mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-6">
                <button 
                  onClick={() => setResult(null)}
                  className="text-sm font-bold text-muted-foreground hover:text-brand-gold transition-colors uppercase tracking-widest"
                >
                  Yeniden Hesapla
                </button>

                <div className="flex gap-4">
                  <button className="btn-secondary py-3 px-6 rounded-full flex items-center gap-2 text-sm">
                    <Share2 className="w-4 h-4" /> Paylaş
                  </button>
                  <Link href="/birth-chart" className="btn-premium py-3 px-8 rounded-full flex items-center gap-2 text-sm">
                    Tam Haritanı İncele <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-brand-primary/5 border border-brand-gold/10 p-8 rounded-3xl text-center">
              <h4 className="text-xl mb-4 font-serif italic text-foreground">Sadece bir yükselen değilsiniz...</h4>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Gezegenlerin 12 evdeki yerleşimi ve aralarındaki açılar, kaderinizin yol haritasını çizer. Uzman astrologlarımızla seans yaparak haritanızın derinliklerini keşfedin.
              </p>
              <Link href="/consultants" className="text-brand-gold font-bold uppercase tracking-[0.2em] text-sm hover:underline">
                Uzmanlardan Analiz Alın →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
