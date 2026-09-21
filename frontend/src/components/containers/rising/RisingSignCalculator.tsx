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
import { useAuthStore } from '@/features/auth/auth.store';
import { useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';
import { SIGN_LABELS } from '@/lib/zodiac/pair';
import { getZodiacMeta, localizeSign } from '@/lib/zodiac/signs';

const cinzel = Cinzel({ subsets: ['latin'] });

function formatDegree(value: number | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '';
  const degree = Math.floor(value);
  const minutes = Math.round((value - degree) * 60);
  return `${degree}° ${String(minutes).padStart(2, '0')}′`;
}

export default function RisingSignCalculator({ locale = 'tr' }: { locale?: string }) {
  const { ui } = useUiSection('ui_extra' as any);
  const [result, setResult] = useState<BirthChart | null>(null);
  const { isAuthenticated } = useAuthStore();
  const { data: myCharts } = useListMyBirthChartsQuery(undefined, {
    skip: !isAuthenticated,
  });

  useEffect(() => {
    if (!result && myCharts && myCharts.length > 0) {
      setResult(myCharts[0]);
    }
  }, [myCharts, result]);

  const sunSign = result?.chart_data.planets.sun.sign;
  const moonSign = result?.chart_data.planets.moon.sign;
  const risingSign = result?.chart_data.ascendant.sign;
  const risingDegree = formatDegree(result?.chart_data.ascendant.degree_in_sign);
  const risingMeta = getZodiacMeta(risingSign);
  const risingRuler = risingMeta ? localizeSign(risingMeta, locale).ruler : '';
  const signLabel = (sign: string | undefined) => sign ? (SIGN_LABELS[locale]?.[sign] || SIGN_LABELS.en[sign] || sign) : '';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-surface p-8 md:p-12 rounded-[2.5rem] border border-border/40 shadow-soft"
          >
            <BirthChartForm analyticsSource="rising_sign" onSuccess={(c) => setResult(c)} />
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { type: ui('ui_extra_b4_sun_sign_label', 'Sun sign'), sign: sunSign, icon: '☀️' },
                { type: ui('ui_extra_b4_rising_sign_label', 'Rising sign'), sign: risingSign, icon: '🌅', highlight: true },
                { type: ui('ui_extra_b4_moon_sign_label', 'Moon sign'), sign: moonSign, icon: '🌙' },
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
                      alt={signLabel(item.sign)}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className={`${cinzel.className} text-2xl`}>{signLabel(item.sign)}</h3>
                  {item.highlight && risingDegree ? (
                    <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-border/40 pt-4 text-left text-xs">
                      <div>
                        <dt className="text-muted-foreground">{ui('ui_extra_b4_rising_degree_label', 'Ascendant degree')}</dt>
                        <dd className="mt-1 font-bold text-foreground">{risingDegree}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">{ui('ui_extra_b4_rising_ruler_label', 'Ruling planet')}</dt>
                        <dd className="mt-1 font-bold text-foreground">{risingRuler}</dd>
                      </div>
                    </dl>
                  ) : null}
                </motion.div>
              ))}
            </div>

            {/* Detailed Rising Insight */}
            <div className="bg-surface p-8 md:p-12 rounded-[2.5rem] border border-border/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Sparkles className="w-32 h-32 text-brand-gold" />
              </div>
              
              <h2 className={`${cinzel.className} text-3xl mb-6 text-brand-gold`}>{ui('ui_extra_b4_rising_insight_title_prefix', 'Rising')} {signLabel(risingSign)} {ui('ui_extra_b4_rising_insight_title_suffix', 'Effect')}</h2>
              <div className="prose prose-invert max-w-none text-lg text-muted-foreground leading-relaxed">
                <p>
                  {ui('ui_extra_b4_rising_insight_p1_a', 'Your rising sign is the sign rising on the horizon at your birth moment and represents the mask you present to the outside world.')}{' '}
                  {ui('ui_extra_b4_rising_insight_p1_b', 'As a')} <strong>{signLabel(risingSign)}</strong> {ui('ui_extra_b4_rising_insight_p1_c', 'rising, people notice these sign qualities when they first meet you.')}
                </p>
                <p>
                  {ui('ui_extra_b4_rising_insight_p2', 'Your outlook on life, physical presence and first reactions are shaped by this sign’s energy. This is your cosmic front window.')}
                </p>
              </div>

              <div className="mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-6">
                <button 
                  onClick={() => setResult(null)}
                  className="text-sm font-bold text-muted-foreground hover:text-brand-gold transition-colors uppercase tracking-widest"
                >
                  {ui('ui_extra_b4_rising_recalc', 'Calculate Again')}
                </button>

                <div className="flex gap-4">
                  <button className="btn-secondary py-3 px-6 rounded-full flex items-center gap-2 text-sm">
                    <Share2 className="w-4 h-4" /> {ui('ui_extra_b4_rising_share', 'Share')}
                  </button>
                  <Link href={localizePath(locale, '/birth-chart')} className="btn-premium py-3 px-8 rounded-full flex items-center gap-2 text-sm">
                    {ui('ui_extra_b4_rising_full_chart', 'View Full Chart')} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-brand-primary/5 border border-brand-gold/10 p-8 rounded-3xl text-center">
              <h4 className="text-xl mb-4 font-serif italic text-foreground">{ui('ui_extra_b4_rising_cta_title', 'You are more than a rising sign...')}</h4>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                {ui('ui_extra_b4_rising_cta_desc', 'The placements of planets across the 12 houses and their aspects draw the roadmap of your potential. Explore your chart in depth with our expert astrologers.')}
              </p>
              <Link href={localizePath(locale, '/consultants')} className="text-brand-gold font-bold uppercase tracking-[0.2em] text-sm hover:underline">
                {ui('ui_extra_b4_rising_cta_link', 'Get Analysis From Experts →')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
