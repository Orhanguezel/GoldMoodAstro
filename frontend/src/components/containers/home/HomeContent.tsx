'use client';

import React, { lazy, Suspense } from 'react';
import Hero from '@/layout/banner/Hero';
import Banner from '@/components/common/public/Banner';

const DailyHoroscopeSection = lazy(() => import('./DailyHoroscopeSection'));
const FeaturedConsultantsSection = lazy(() => import('./FeaturedConsultantsSection'));
const ExpertiseCategoriesSection = lazy(() => import('./ExpertiseCategoriesSection'));
const HomeIntroSection = lazy(() => import('./HomeIntroSection'));
const PromisesSection = lazy(() => import('./PromisesSection'));
const HybridModelSection = lazy(() => import('./HybridModelSection'));
const HomeCTABanner = lazy(() => import('./HomeCTABanner'));
const BlogHomeSection = lazy(() => import('@/components/containers/blog/BlogHomeSection'));
const Feedback = lazy(() => import('@/components/containers/feedback/Feedback'));

type Props = { locale?: string };

export default function HomeContent({ locale }: Props) {
  return (
    <main className="flex flex-col w-full">
      <Hero locale={locale} />
      
      {/* Dynamic Banner Slot */}
      <section className="container mx-auto px-4 -mt-10 mb-12 relative z-20">
        <Banner placement="home_hero" count={1} />
      </section>

      <Suspense fallback={null}>
        <PromisesSection locale={locale} />
        <DailyHoroscopeSection />
        <FeaturedConsultantsSection locale={locale} />
        <ExpertiseCategoriesSection locale={locale} />
        <div id="how-it-works">
          <HomeIntroSection locale={locale} />
        </div>
        <Feedback locale={locale} />
        <BlogHomeSection locale={locale} />
        <HybridModelSection locale={locale} />
        <HomeCTABanner locale={locale} />
      </Suspense>
    </main>
  );
}
