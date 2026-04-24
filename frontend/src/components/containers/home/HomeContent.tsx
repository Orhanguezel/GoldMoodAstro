'use client';

import React, { lazy, Suspense } from 'react';
import Hero from '@/layout/banner/Hero';
import About from '@/components/containers/about/AboutSection';

const ServiceSection = lazy(() => import('@/components/containers/services/ServiceSection'));
const BlogHomeSection = lazy(() => import('@/components/containers/blog/BlogHomeSection'));
const Feedback = lazy(() => import('@/components/containers/feedback/Feedback'));
const AppointmentHomeCta = lazy(() => import('@/components/containers/appointment/AppointmentHomeCta'));
const GutscheinHomeCta = lazy(() => import('@/components/containers/gutschein/GutscheinHomeCta'));
const HomeIntroSection = lazy(() => import('@/components/containers/home/HomeIntroSection'));

type Props = { locale?: string };

export default function HomeContent({ locale }: Props) {
  return (
    <main className="flex flex-col w-full">
      <Hero locale={locale} />
      <About locale={locale} />
      <Suspense fallback={null}>
        <ServiceSection locale={locale} />
        <HomeIntroSection locale={locale} />
        <Feedback locale={locale} />
        <BlogHomeSection locale={locale} />

        <section className="py-28 lg:py-36" style={{ padding: '7rem 4%' }}>
          <GutscheinHomeCta locale={locale} />
        </section>

        <AppointmentHomeCta locale={locale} />
      </Suspense>
    </main>
  );
}
