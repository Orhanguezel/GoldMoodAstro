'use client';

import React, { lazy, Suspense } from 'react';
import Hero from '@/layout/banner/Hero';

const FeaturedConsultantsSection = lazy(() => import('./FeaturedConsultantsSection'));
const ExpertiseCategoriesSection = lazy(() => import('./ExpertiseCategoriesSection'));
const HomeIntroSection = lazy(() => import('./HomeIntroSection'));
const HomeCTABanner = lazy(() => import('./HomeCTABanner'));
const BlogHomeSection = lazy(() => import('@/components/containers/blog/BlogHomeSection'));
const Feedback = lazy(() => import('@/components/containers/feedback/Feedback'));

type Props = { locale?: string };

export default function HomeContent({ locale }: Props) {
  return (
    <main className="flex flex-col w-full">
      <Hero locale={locale} />
      <Suspense fallback={null}>
        <FeaturedConsultantsSection locale={locale} />
        <ExpertiseCategoriesSection locale={locale} />
        <div id="how-it-works">
          <HomeIntroSection locale={locale} />
        </div>
        <Feedback locale={locale} />
        <BlogHomeSection locale={locale} />
        <HomeCTABanner locale={locale} />
      </Suspense>
    </main>
  );
}
