import type { Metadata } from 'next';
import DailyHoroscopeSection from '@/components/containers/home/DailyHoroscopeSection';
import ExpertiseCategoriesSection from '@/components/containers/home/ExpertiseCategoriesSection';
import FeaturedConsultantsSection from '@/components/containers/home/FeaturedConsultantsSection';
import HomeIntroSection from '@/components/containers/home/HomeIntroSection';
import PageContainer from '@/components/common/PageContainer';
import { normPath, localizePath } from '@/integrations/shared';
import { buildMetadataFromSeo, fetchSeoObject } from '@/seo/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const base = await buildMetadataFromSeo(await fetchSeoObject(locale), {
    locale,
    pathname: normPath('/explore'),
  });

  return {
    ...base,
    title: 'Explore | GoldMoodAstro',
    description:
      locale === 'tr'
        ? 'Discover consultants, expertise areas and daily astrology content.'
        : 'Explore consultants, expertise areas, and daily astrology content.',
  };
}

export default async function ExplorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // 2026-07-20: bu blok koda Ingilizce gomuluydu. Ustelik `isTr ? ... : ...`
  // yazilmisti ama TURKCE DAL DA INGILIZCEYDI — yani kosul hicbir ise yaramiyordu.
  const COPY: Record<string, { label: string; title: string; desc: string; cta: string }> = {
    tr: {
      label: 'KEŞFET',
      title: 'Rehberlik akışını keşfedin',
      desc: 'Uzmanlık alanlarına göz atın, öne çıkan danışmanları inceleyin ve size uyan randevu akışını seçin.',
      cta: 'Danışmanları Gör',
    },
    en: {
      label: 'EXPLORE',
      title: 'Explore the guidance flow',
      desc: 'Browse expertise categories, featured consultants, and the booking flow that fits your needs.',
      cta: 'View Consultants',
    },
    de: {
      label: 'ENTDECKEN',
      title: 'Den Beratungsablauf entdecken',
      desc: 'Sehen Sie sich Fachgebiete an, entdecken Sie ausgewählte Beraterinnen und Berater und wählen Sie den passenden Buchungsablauf.',
      cta: 'Beratung ansehen',
    },
  };
  const copy = COPY[locale] ?? COPY.en;

  return (
    <PageContainer as="main" width="full" pad="none" withHeaderOffset className="bg-(--gm-bg) text-(--gm-text)">
      <section className="px-6 pt-32 pb-20 border-b border-[var(--gm-border-soft)]">
        <div className="max-w-[var(--gm-w-content)] mx-auto text-center">
          <span className="section-label">{copy.label}</span>
          <h1 className="font-serif text-[clamp(2.8rem,6vw,5.5rem)] font-light leading-[1.05] mt-6 mb-8">
            {copy.title}
          </h1>
          <p className="max-w-[var(--gm-w-narrow)] mx-auto text-[var(--gm-text-dim)] font-light leading-relaxed mb-10">
            {copy.desc}
          </p>
          <a href={localizePath(locale, '/consultants')} className="btn-premium inline-flex">
            {copy.cta}
          </a>
        </div>
      </section>
      <ExpertiseCategoriesSection locale={locale} />
      <FeaturedConsultantsSection locale={locale} />
      <HomeIntroSection />
      <DailyHoroscopeSection />
    </PageContainer>
  );
}
