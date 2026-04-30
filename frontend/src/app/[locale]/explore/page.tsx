import type { Metadata } from 'next';
import DailyHoroscopeSection from '@/components/containers/home/DailyHoroscopeSection';
import ExpertiseCategoriesSection from '@/components/containers/home/ExpertiseCategoriesSection';
import FeaturedConsultantsSection from '@/components/containers/home/FeaturedConsultantsSection';
import HomeIntroSection from '@/components/containers/home/HomeIntroSection';
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
    title: locale === 'tr' ? 'Keşfet | GoldMoodAstro' : 'Explore | GoldMoodAstro',
    description:
      locale === 'tr'
        ? 'Danışmanları, uzmanlık alanlarını ve günlük astroloji içeriklerini keşfedin.'
        : 'Explore consultants, expertise areas, and daily astrology content.',
  };
}

export default async function ExplorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isTr = locale === 'tr';

  return (
    <main className="bg-[var(--gm-bg)] text-[var(--gm-text)] pt-32">
      <section className="px-6 pt-32 pb-20 border-b border-[var(--gm-border-soft)]">
        <div className="max-w-5xl mx-auto text-center">
          <span className="section-label">{isTr ? 'KEŞFET' : 'EXPLORE'}</span>
          <h1 className="font-serif text-[clamp(2.8rem,6vw,5.5rem)] font-light leading-[1.05] mt-6 mb-8">
            {isTr ? 'Danışmanlık akışını keşfet' : 'Explore the guidance flow'}
          </h1>
          <p className="max-w-2xl mx-auto text-[var(--gm-text-dim)] font-light leading-relaxed mb-10">
            {isTr
              ? 'Uzmanlık kategorilerini inceleyin, öne çıkan danışmanlara göz atın ve size uygun randevu akışını seçin.'
              : 'Browse expertise categories, featured consultants, and the booking flow that fits your needs.'}
          </p>
          <a href={localizePath(locale, '/consultants')} className="btn-premium inline-flex">
            {isTr ? 'Danışmanları Gör' : 'View Consultants'}
          </a>
        </div>
      </section>
      <ExpertiseCategoriesSection locale={locale} />
      <FeaturedConsultantsSection locale={locale} />
      <HomeIntroSection />
      <DailyHoroscopeSection />
    </main>
  );
}
