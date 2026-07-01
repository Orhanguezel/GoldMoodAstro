'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/features/auth/auth.store';
import { useGenerateDailyReadingMutation, useListMyBirthChartsQuery } from '@/integrations/rtk/hooks';
import { Sparkles, Calendar, ArrowRight } from 'lucide-react';
import { useUiSection } from '@/i18n';

import PageContainer from '@/components/common/PageContainer';

export default function DailyPageClient() {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale || 'tr';
  const { ui } = useUiSection('ui_daily');
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
      <PageContainer className="min-h-screen bg-(--gm-bg) flex flex-col items-center justify-center" verticalPadding="large">
        <div className="max-w-[var(--gm-w-form)] w-full text-center space-y-8">
          <div className="w-16 h-16 bg-(--gm-surface) rounded-full flex items-center justify-center mx-auto border border-(--gm-gold)">
            <Sparkles className="w-8 h-8 text-(--gm-gold)" />
          </div>
          <h2 className="font-serif text-4xl text-(--gm-text)">{ui('ui_daily_guest_title', 'Ready for a spiritual journey?')}</h2>
          <p className="text-(--gm-text-dim) leading-relaxed">
            {ui('ui_daily_guest_desc', 'Your daily reading is prepared for you using your natal chart and sky transits. Sign in to begin.')}
          </p>
          <Link href={`/${locale}/login`} className="btn-premium inline-flex py-4 px-10">
            {ui('ui_daily_guest_login_cta', 'Sign In Now')}
          </Link>
        </div>
      </PageContainer>
    );
  }

  if (!chartsLoading && charts.length === 0) {
    return (
      <PageContainer className="min-h-screen bg-(--gm-bg) flex flex-col items-center justify-center" verticalPadding="large">
        <div className="max-w-[var(--gm-w-form)] w-full text-center space-y-8">
          <div className="w-16 h-16 bg-(--gm-surface) rounded-full flex items-center justify-center mx-auto border border-(--gm-gold)">
            <Calendar className="w-8 h-8 text-(--gm-gold)" />
          </div>
          <h2 className="font-serif text-4xl text-(--gm-text)">{ui('ui_daily_no_chart_title', 'You Do Not Have a Chart Yet')}</h2>
          <p className="text-(--gm-text-dim) leading-relaxed">
            {ui('ui_daily_no_chart_desc', 'Create your birth chart first to receive cosmic guidance.')}
          </p>
          <Link href={`/${locale}/birth-chart`} className="btn-premium inline-flex py-4 px-10">
            {ui('ui_daily_no_chart_cta', 'Create Chart')}
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="min-h-screen bg-(--gm-bg)" verticalPadding="large">
      <div className="mx-auto max-w-[var(--gm-w-readable)]">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-px bg-(--gm-gold)" />
            <span className="text-(--gm-gold) font-bold text-xs uppercase tracking-[0.2em]">{ui('ui_daily_eyebrow', 'Cosmic Guide')}</span>
          </div>
          <h2
            className="font-serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1] text-(--gm-text) mb-6"
            dangerouslySetInnerHTML={{ __html: ui('ui_daily_heading', 'What is the sky <br />saying today?') }}
          />
          <p className="text-(--gm-text-dim) text-lg max-w-[var(--gm-w-narrow)] font-serif italic">
            {ui('ui_daily_subheading', 'The planets in your natal chart dance with today’s celestial movements.')}
          </p>
        </div>

        {/* Content */}
        <div className="relative">
          {chartsLoading || isLoading ? (
            <div className="space-y-6">
              <div className="h-4 w-1/4 bg-(--gm-surface) animate-pulse" />
              <div className="h-6 w-full bg-(--gm-surface) animate-pulse" />
              <div className="h-6 w-full bg-(--gm-surface) animate-pulse" />
              <div className="h-6 w-2/3 bg-(--gm-surface) animate-pulse" />
            </div>
          ) : data ? (
            <article className="relative">
              <div className="absolute -left-12 top-0 hidden lg:flex flex-col items-center gap-4">
                <div className="w-1 h-24 bg-gradient-to-b from-(--gm-gold) to-transparent" />
              </div>

              <div className="mb-12 flex items-center gap-4 text-(--gm-gold) font-bold text-sm">
                <Calendar className="w-5 h-5" />
                <span>{new Date().toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>

              <div className="prose prose-invert max-w-none">
                <p className="font-serif text-[1.35rem] leading-[1.7] text-(--gm-text) first-letter:text-6xl first-letter:float-left first-letter:mr-4 first-letter:font-serif first-letter:text-(--gm-gold) whitespace-pre-wrap">
                  {data.reading.content}
                </p>
              </div>

              <div className="mt-20 p-8 rounded-2xl bg-(--gm-surface-high) border border-(--gm-border-soft) flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <h4 className="font-serif text-2xl text-(--gm-text) mb-2">{ui('ui_daily_deepen_title', 'Want to go deeper?')}</h4>
                  <p className="text-(--gm-text-dim) text-sm">{ui('ui_daily_deepen_desc', 'This reading covers general energies. Ask an expert astrologer for your questions.')}</p>
                </div>
                <Link href={`/${locale}/consultants?topic=daily_reading_${data.reading.id}`} className="btn-premium whitespace-nowrap flex items-center gap-3 py-4 px-8">
                  {ui('ui_daily_ask_astrologer_cta', 'Ask an Astrologer')} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="mt-12 text-[10px] uppercase tracking-widest text-(--gm-muted) text-right">
                ID: {data.reading.id.slice(0, 8)} · {ui('ui_daily_confidence_label', 'Confidence Score')}: {Math.round(data.similarity_max * 100)}%
              </div>
            </article>
          ) : error ? (
            <div className="p-8 rounded-xl border border-(--gm-error)/30 bg-(--gm-error)/5 text-center">
              <p className="text-(--gm-error)">{ui('ui_daily_error', 'The reading could not be generated. There seems to be an issue with the cosmic channels.')}</p>
            </div>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}
