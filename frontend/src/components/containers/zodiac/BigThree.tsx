'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cinzel } from 'next/font/google';
import BirthChartForm from '@/components/containers/birth-chart/BirthChartForm';
import { BirthChart } from '@/types/common';
import Image from 'next/image';
import { toPng } from 'html-to-image';
import { Download, Share2, RefreshCcw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ShareCard from '@/components/common/ShareCard';

import { useBrand } from '@/hooks/useBrand';
import { useUiSection } from '@/i18n';
import { useAuthStore } from '@/features/auth/auth.store';
import {
  useListMyBirthChartsQuery,
  useDeleteBirthChartMutation,
} from '@/integrations/rtk/public/birth_charts.endpoints';

const cinzel = Cinzel({ subsets: ['latin'] });

const SIGN_LABELS: Record<string, string> = {
  aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer',
  leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio',
  sagittarius: 'Sagittarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces',
};

export default function BigThree() {
  const { brand } = useBrand();
  const { ui } = useUiSection('ui_zodiacx' as any);
  const [result, setResult] = useState<BirthChart | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { isAuthenticated } = useAuthStore();
  const { data: savedCharts } = useListMyBirthChartsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [deleteChart] = useDeleteBirthChartMutation();

  useEffect(() => {
    if (isAuthenticated && !result && savedCharts && savedCharts.length > 0) {
      const latest = savedCharts[0];
      if (latest) setResult(latest);
    }
  }, [isAuthenticated, savedCharts, result]);

  const handleResetForNewSearch = async () => {
    if (!isAuthenticated || !result?.id) {
      setResult(null);
      return;
    }
    const confirmDelete = window.confirm(
      ui('ui_zodiacx_bigthree_confirm_delete', 'Your saved birth chart will be deleted and a new calculation will open. Continue?'),
    );
    if (!confirmDelete) return;
    try {
      await deleteChart(result.id).unwrap();
      toast.success(ui('ui_zodiacx_bigthree_delete_success', 'Record deleted, new calculation opened'));
      setResult(null);
    } catch {
      toast.error(ui('ui_zodiacx_bigthree_delete_error', 'Record could not be deleted'));
    }
  };

  const sunSign = result?.chart_data.planets.sun.sign;
  const moonSign = result?.chart_data.planets.moon.sign;
  const risingSign = result?.chart_data.ascendant.sign;

  const handleExport = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      // Use bg_base token or fallback
      const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--gm-bg-deep').trim() || 'rgb(26, 22, 48)';
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, backgroundColor: bgColor });
      const link = document.createElement('a');
      link.download = `goldmood-buyuk-uclu-${result?.name}.png`;
      link.href = dataUrl;
      link.click();
      toast.success(ui('ui_zodiacx_bigthree_image_success', 'Image created successfully!'));
    } catch (err) {
      console.error(err);
      toast.error(ui('ui_zodiacx_bigthree_image_error', 'An error occurred while creating the image.'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    // 2026-07-20: ic ice PageContainer kaldirildi; sayfa (page.tsx) zaten
    // PageContainer sagliyor. Cift sarmalama layout bozuyordu (sinastri ile ayni yapi).
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <p className="text-lg text-muted-foreground italic max-w-2xl mx-auto">
          {ui('ui_zodiacx_bigthree_intro', 'Create and share your cosmic identity card with your Sun, Moon and Rising signs.')}
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
            className="flex flex-col items-center gap-12"
          >
            {/* Exportable Card */}
            <div 
              ref={cardRef}
              className="relative w-full max-w-[480px] aspect-[4/5] bg-[var(--gm-bg-deep)] p-10 rounded-[2.5rem] border-[3px] border-brand-gold/30 overflow-hidden shadow-2xl flex flex-col items-center justify-between"
            >
              {/* Decorative elements for export */}
              <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/10 via-transparent to-brand-gold/5" />
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-primary/10 blur-[80px] rounded-full" />
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand-gold/10 blur-[80px] rounded-full" />

              {/* Header */}
              <div className="relative text-center">
                <div className="text-[var(--gm-gold)] font-bold text-[10px] tracking-[0.4em] uppercase mb-1">
                  {brand.name.toUpperCase()}
                </div>
                <div className="h-px w-12 bg-brand-gold/40 mx-auto mb-4" />
                <h2 className={`${cinzel.className} text-3xl text-[var(--gm-text)]`}>{result.name}</h2>
              </div>

              {/* Signs */}
              <div className="relative w-full space-y-8">
                {[
                  { label: ui('ui_zodiacx_bigthree_sun', 'SUN'), sign: sunSign, icon: '☀️' },
                  { label: ui('ui_zodiacx_bigthree_rising', 'RISING'), sign: risingSign, icon: '🌅', major: true },
                  { label: ui('ui_zodiacx_bigthree_moon', 'MOON'), sign: moonSign, icon: '🌙' },
                ].map((item, i) => (
                  <div key={item.label} className="flex items-center justify-between group">
                    <div className="flex-1 text-right pr-6">
                      <div className="text-[9px] font-bold text-brand-gold/60 tracking-widest uppercase mb-1">{item.label}</div>
                      <div className={`${cinzel.className} text-xl text-[var(--gm-text)]`}>{SIGN_LABELS[item.sign!] || item.sign}</div>
                    </div>
                    <div className={`relative ${item.major ? 'w-20 h-20' : 'w-16 h-16'} flex-shrink-0 border border-brand-gold/20 rounded-full bg-[var(--gm-text)]/5 flex items-center justify-center`}>
                      <Image
                        src={`/uploads/zodiac/${item.sign}.png`}
                        alt=""
                        width={item.major ? 60 : 48}
                        height={item.major ? 60 : 48}
                        className="object-contain"
                      />
                    </div>
                    <div className="flex-1 pl-6">
                      <div className="text-2xl opacity-60">{item.icon}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="relative text-center">
                <p className="text-[10px] text-muted-foreground tracking-widest italic mb-2">
                  &quot;{brand.tagline}&quot;
                </p>
                <div className="text-[9px] text-brand-gold/40 font-bold tracking-widest uppercase">
                  {brand.domain}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="btn-premium py-4 px-10 rounded-full flex items-center gap-3 disabled:opacity-50"
              >
                {isExporting ? <Sparkles className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                {ui('ui_zodiacx_bigthree_download', 'Download as Image')}
              </button>

              <ShareCard
                title={ui('ui_zodiacx_bigthree_share_title', 'Share My Big Three Card')}
                shareText={`${result.name} ${ui('ui_zodiacx_bigthree_share_text', 'as my Big Three card ✨\nDiscover your cosmic identity too:')}`}
                variant="birth-chart"
                data={{
                  sun: SIGN_LABELS[sunSign!] || sunSign,
                  moon: SIGN_LABELS[moonSign!] || moonSign,
                  rising: SIGN_LABELS[risingSign!] || risingSign
                }}
              />

              <button
                onClick={handleResetForNewSearch}
                className="p-4 rounded-full bg-surface border border-border/40 hover:text-brand-gold transition-colors"
                title={isAuthenticated ? ui('ui_zodiacx_bigthree_delete_recalc', 'Delete and Calculate Again') : ui('ui_zodiacx_bigthree_recalc', 'Calculate Again')}
              >
                <RefreshCcw className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
