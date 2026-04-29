'use client';

import React, { lazy, Suspense } from 'react';
import HeroNew from './HeroNew';
import Banner from '@/components/common/public/Banner';

const PromisesSection = lazy(() => import('./PromisesSection'));
const FeaturesNew = lazy(() => import('./FeaturesNew'));
const HybridModelSection = lazy(() => import('./HybridModelSection'));
const TransparencySection = lazy(() => import('./TransparencySection'));
const TrustSection = lazy(() => import('./TrustSection'));
const WaitlistSection = lazy(() => import('./WaitlistSection'));
const ZodiacGridSection = lazy(() => import('./ZodiacGridSection'));

type Props = { locale?: string };

export default function HomeContent({ locale }: Props) {
  return (
    <main className="flex flex-col w-full bg-[var(--gm-bg)]">
      {/* 1. Hero */}
      <HeroNew locale={locale} />

      {/* Hero altı banner — büyük (full width hero) */}
      <section className="container mx-auto px-4 -mt-10 mb-12 relative z-20">
        <Banner placement="home_hero" variant="hero" count={1} />
      </section>

      <Suspense fallback={null}>
        <ZodiacGridSection />
      </Suspense>

      <Suspense fallback={<div className="h-screen bg-[var(--gm-bg)]" />}>
        {/* 2. Promises */}
        <PromisesSection locale={locale} />

        {/* Mid 1 — slim reklam alanı (Promises ↔ Features arası) */}
        <section className="container mx-auto px-4 py-6">
          <Banner placement="home_mid_1" variant="slim" count={1} dismissable />
        </section>

        {/* 3. Features */}
        <FeaturesNew locale={locale} />

        {/* 4. Hybrid Model */}
        <HybridModelSection locale={locale} />

        {/* Mid 2 — slim reklam alanı (Hybrid ↔ Transparency arası) */}
        <section className="container mx-auto px-4 py-6">
          <Banner placement="home_mid_2" variant="slim" count={1} dismissable />
        </section>

        {/* 5. Transparency / Pricing */}
        <TransparencySection locale={locale} />

        {/* 6. Trust / Privacy */}
        <TrustSection locale={locale} />

        {/* Mid 3 — son slim reklam (Trust ↔ Waitlist arası) */}
        <section className="container mx-auto px-4 py-6">
          <Banner placement="home_mid_3" variant="slim" count={1} dismissable />
        </section>

        {/* 7. Waitlist */}
        <WaitlistSection locale={locale} />
      </Suspense>
    </main>
  );
}
