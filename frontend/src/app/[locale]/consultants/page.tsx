import type { Metadata } from 'next';
import Link from 'next/link';

import ConsultantList from '@/components/containers/consultant/ConsultantList';
import { FUNNEL_CONFIG, type FunnelFeature } from '@/components/common/funnel.config';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ expertise?: string; topic?: string }>;
};
import { buildMetadataFromSeo, fetchSeoObject, fetchSeoPageObject, mergeSeoPageIntoSeo } from '@/seo/server';
import { normPath } from '@/integrations/shared';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  let seo = await fetchSeoObject(locale);
  const pageSeo = await fetchSeoPageObject(locale, 'consultants');
  seo = mergeSeoPageIntoSeo(seo, pageSeo);

  return buildMetadataFromSeo(seo, { locale, pathname: normPath('/consultants') });
}

export default async function ConsultantsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : {};
  const isTr = locale === 'tr';

  // T28-4 — topic → expertise mapping (funnel'dan gelen yönlendirmeler)
  const topic = (sp.topic || '').trim() as FunnelFeature;
  const topicCfg = topic && topic in FUNNEL_CONFIG ? FUNNEL_CONFIG[topic] : null;
  const initialExpertise = (sp.expertise || topicCfg?.expertise || '').trim();

  const headline = topicCfg
    ? (isTr ? topicCfg.headlineTr : topicCfg.headlineEn)
    : (isTr ? 'Danışmanları Keşfet' : 'Explore Consultants');

  return (
    <main className="min-h-screen py-20" style={{ padding: '5rem 4%' }}>
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-10">
          <span className="section-label">{isTr ? 'Uzman Danışmanlar' : 'Expert Consultants'}</span>
          <h1 className="font-serif text-[clamp(2rem,4vw,3rem)] font-light text-text mt-2">
            {headline}
          </h1>
          <p className="text-text-muted mt-2 text-sm">
            {topicCfg
              ? (isTr
                  ? `${headline} arasından sana uygun olanı seç. Sesli/görüntülü görüşme + uygulama içi mesajlaşma.`
                  : `Pick the right expert from our ${headline.toLowerCase()}. Voice/video sessions + in-app messaging.`)
              : (isTr
                  ? 'Astroloji, tarot, numeroloji ve daha fazlasında onaylı uzmanlar.'
                  : 'Verified experts in astrology, tarot, numerology and more.')}
          </p>
          {topicCfg && (
            <Link
              href={`/${locale}/consultants`}
              className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-text-muted hover:text-brand-gold transition-colors"
            >
              ← {isTr ? 'Tüm danışmanları gör' : 'Show all consultants'}
            </Link>
          )}
        </div>

        <ConsultantList locale={locale} initialExpertise={initialExpertise} />
      </div>
    </main>
  );
}
