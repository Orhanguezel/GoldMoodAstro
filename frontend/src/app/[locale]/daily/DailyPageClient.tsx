'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/features/auth/auth.store';
import { useGenerateDailyReadingMutation, useListMyBirthChartsQuery } from '@/integrations/rtk/hooks';

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
      <main className="min-h-screen bg-[var(--gm-bg)] px-4 pb-24 pt-32">
        <div className="mx-auto max-w-2xl rounded-sm border border-[var(--gm-border-soft)] bg-[var(--gm-surface)] p-8 text-center">
          <span className="section-label mb-4">Bugünün Yorumu</span>
          <h1 className="mb-4 font-serif text-4xl text-[var(--gm-text)]">Giriş gerekli</h1>
          <p className="mb-8 text-[var(--gm-text-dim)]">
            Günlük yorum için kayıtlı doğum haritanıza erişmemiz gerekiyor.
          </p>
          <Link href={`/${locale}/login`} className="btn-premium inline-flex">
            Giriş Yap
          </Link>
        </div>
      </main>
    );
  }

  if (!chartsLoading && charts.length === 0) {
    return (
      <main className="min-h-screen bg-[var(--gm-bg)] px-4 pb-24 pt-32">
        <div className="mx-auto max-w-2xl rounded-sm border border-[var(--gm-border-soft)] bg-[var(--gm-surface)] p-8 text-center">
          <span className="section-label mb-4">Bugünün Yorumu</span>
          <h1 className="mb-4 font-serif text-4xl text-[var(--gm-text)]">Önce harita oluşturun</h1>
          <p className="mb-8 text-[var(--gm-text-dim)]">
            Günlük yorum natal haritanız ve bugünün transitleriyle hazırlanır.
          </p>
          <Link href={`/${locale}/birth-chart`} className="btn-premium inline-flex">
            Harita Oluştur
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--gm-bg)] px-4 pb-24 pt-32">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10">
          <span className="section-label mb-4">Bugünün Yorumu</span>
          <h1 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-light text-[var(--gm-text)]">
            Gökyüzü bugün ne söylüyor?
          </h1>
        </div>

        <section className="rounded-sm border border-[var(--gm-border-soft)] bg-[var(--gm-surface)] p-6 md:p-10">
          {chartsLoading || isLoading ? (
            <p className="text-[var(--gm-text-dim)]">Yorum hazırlanıyor...</p>
          ) : data ? (
            <>
              <div className="mb-6 text-sm text-[var(--gm-gold)]">
                {String(data.reading.reading_date).slice(0, 10)}
              </div>
              <p className="whitespace-pre-wrap font-serif text-xl leading-9 text-[var(--gm-text)]">
                {data.reading.content}
              </p>
              <div className="mt-8 border-t border-[var(--gm-border-soft)] pt-5 text-xs text-[var(--gm-muted)]">
                Model: {data.reading.model_used || 'local'} · Benzerlik: {Math.round(data.similarity_max * 100)}%
              </div>
            </>
          ) : error ? (
            <p className="text-[var(--gm-error)]">Yorum oluşturulamadı. Daha sonra tekrar deneyin.</p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
