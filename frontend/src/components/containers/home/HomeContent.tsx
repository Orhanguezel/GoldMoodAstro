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

type Props = { locale?: string };

export default function HomeContent({ locale }: Props) {
  return (
    <main className="flex flex-col w-full bg-[var(--gm-bg)]">
      {/* 1. Hero */}
      <HeroNew locale={locale} />
      
      {/* Dynamic Banner Slot */}
      <section className="container mx-auto px-4 -mt-10 mb-12 relative z-20">
        <Banner placement="home_hero" count={1} />
      </section>

      <Suspense fallback={<div className="h-screen bg-[var(--gm-bg)]" />}>
        {/* 2. Promises */}
        <PromisesSection locale={locale} />
        
        {/* 3. Features */}
        <FeaturesNew locale={locale} />
        
        {/* 4. Hybrid Model */}
        <HybridModelSection locale={locale} />
        
        {/* 5. Transparency / Pricing */}
        <TransparencySection locale={locale} />
        
        {/* 6. Trust / Privacy */}
        <TrustSection locale={locale} />
        
        {/* 7. Waitlist */}
        <WaitlistSection locale={locale} />
      </Suspense>
    </main>
  );
}
