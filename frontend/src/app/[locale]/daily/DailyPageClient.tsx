'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/features/auth/auth.store';
import { useGenerateDailyReadingMutation, useListMyBirthChartsQuery } from '@/integrations/rtk/hooks';
import { Sparkles, Calendar, ChevronLeft, ArrowRight } from 'lucide-react';

export default function DailyPageClient() {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale || 'tr';
  const { isAuthenticated } = useAuthStore();
  const { data: charts = [], isLoading: chartsLoading } = useListMyBirthChartsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [generateDaily, { data, isLoading, error }] = useGenerateDailyReadingMutation();

  useEffect(() => {
    if (!isAuthenticated || chartsLoading || !charts[0] || data) return;
    generateDaily({ chart_id: charts[0].id });
  }, [charts, chartsLoading, data, generateDaily, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[var(--gm-bg)] px-6 pb-24 pt-32 flex flex-col items-center justify-center">
        <div className="max-w-xl w-full text-center space-y-8">
          <div className="w-16 h-16 bg-[var(--gm-surface)] rounded-full flex items-center justify-center mx-auto border border-[var(--gm-gold)]">
            <Sparkles className="w-8 h-8 text-[var(--gm-gold)]" />
          </div>
          <h1 className="font-serif text-4xl text-[var(--gm-text)]">Ruhsal bir yolculuğa hazır mısınız?</h1>
          <p className="text-[var(--gm-text-dim)] leading-relaxed">
            Günlük yorum Natal haritanız ve gökyüzü transitleriyle size özel hazırlanır. Başlamak için giriş yapın.
          </p>
          <Link href={`/${locale}/login`} className="btn-premium inline-flex py-4 px-10">
            Hemen Giriş Yap
          </Link>
        </div>
      </main>
    );
  }

  if (!chartsLoading && charts.length === 0) {
    return (
      <main className="min-h-screen bg-[var(--gm-bg)] px-6 pb-24 pt-32 flex flex-col items-center justify-center">
        <div className="max-w-xl w-full text-center space-y-8">
          <div className="w-16 h-16 bg-[var(--gm-surface)] rounded-full flex items-center justify-center mx-auto border border-[var(--gm-gold)]">
            <Calendar className="w-8 h-8 text-[var(--gm-gold)]" />
          </div>
          <h1 className="font-serif text-4xl text-[var(--gm-text)]">Haritanız Henüz Yok</h1>
          <p className="text-[var(--gm-text-dim)] leading-relaxed">
            Kozmik rehberliğimizi alabilmek için önce doğum haritanızı oluşturmalısınız.
          </p>
          <Link href={`/${locale}/birth-chart`} className="btn-premium inline-flex py-4 px-10">
            Harita Oluştur
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--gm-bg)] px-4 pb-24 pt-32">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb */}
        <div className="mb-12 flex items-center gap-4">
          <Link href={`/${locale}`} className="text-[var(--gm-text-dim)] hover:text-[var(--gm-gold)] transition-colors flex items-center gap-2 text-sm uppercase tracking-widest font-bold">
            <ChevronLeft className="w-4 h-4" /> Geri
          </Link>
          <div className="h-px flex-1 bg-[var(--gm-border-soft)]" />
        </div>

        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-px bg-[var(--gm-gold)]" />
            <span className="text-[var(--gm-gold)] font-bold text-xs uppercase tracking-[0.2em]">Kozmik Rehber</span>
          </div>
          <h1 className="font-serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1] text-[var(--gm-text)] mb-6">
            Gökyüzü bugün <br />ne söylüyor?
          </h1>
          <p className="text-[var(--gm-text-dim)] text-lg max-w-2xl font-serif italic">
            Natal haritanızdaki gezegenler, bugünün göksel hareketleriyle dans ediyor.
          </p>
        </div>

        {/* Content */}
        <div className="relative">
          {chartsLoading || isLoading ? (
            <div className="space-y-6">
              <div className="h-4 w-1/4 bg-[var(--gm-surface)] animate-pulse" />
              <div className="h-6 w-full bg-[var(--gm-surface)] animate-pulse" />
              <div className="h-6 w-full bg-[var(--gm-surface)] animate-pulse" />
              <div className="h-6 w-2/3 bg-[var(--gm-surface)] animate-pulse" />
            </div>
          ) : data ? (
            <article className="relative">
              <div className="absolute -left-12 top-0 hidden lg:flex flex-col items-center gap-4">
                <div className="w-1 h-24 bg-gradient-to-b from-[var(--gm-gold)] to-transparent" />
              </div>

              <div className="mb-12 flex items-center gap-4 text-[var(--gm-gold)] font-bold text-sm">
                <Calendar className="w-5 h-5" />
                <span>{new Date().toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>

              <div className="prose prose-invert max-w-none">
                <p className="font-serif text-[1.35rem] leading-[1.7] text-[var(--gm-text)] first-letter:text-6xl first-letter:float-left first-letter:mr-4 first-letter:font-serif first-letter:text-[var(--gm-gold)] whitespace-pre-wrap">
                  {data.reading.content}
                </p>
              </div>

              <div className="mt-20 p-8 rounded-2xl bg-[var(--gm-surface-high)] border border-[var(--gm-border-soft)] flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <h4 className="font-serif text-2xl text-[var(--gm-text)] mb-2">Derinleşmek ister misiniz?</h4>
                  <p className="text-[var(--gm-text-dim)] text-sm">Bu yorum genel enerjileri kapsar. Sorularınız için uzman astrologa danışın.</p>
                </div>
                <Link href={`/${locale}/consultants?topic=daily_reading_${data.reading.id}`} className="btn-premium whitespace-nowrap flex items-center gap-3 py-4 px-8">
                  Astrologa Sor <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="mt-12 text-[10px] uppercase tracking-widest text-[var(--gm-muted)] text-right">
                ID: {data.reading.id.slice(0, 8)} · Güven Skoru: {Math.round(data.similarity_max * 100)}%
              </div>
            </article>
          ) : error ? (
            <div className="p-8 rounded-xl border border-[var(--gm-error)]/30 bg-[var(--gm-error)]/5 text-center">
              <p className="text-[var(--gm-error)]">Yorum oluşturulamadı. Kozmik kanallarda bir sorun var gibi görünüyor.</p>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
