'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import HeroNew from './HeroNew';
import type { HomeSection } from './fetchHomeLayout.server';

// Yeni component eklemek için: import + bu map'e key ekle.
const REGISTRY: Record<string, any> = {
  HeroNew,
  BannerSlot: dynamic(() => import('./BannerSlot'), { loading: () => null }),
  PromisesSection: dynamic(() => import('./HomeIntroSection'), { loading: () => null }),
  FeaturesNew: dynamic(() => import('./FeaturesNew'), { loading: () => null }),
  HybridModelSection: dynamic(() => import('./HybridModelSection'), { loading: () => null }),
  TransparencySection: dynamic(() => import('./TransparencySection'), { loading: () => null }),
  TrustSection: dynamic(() => import('./TrustSection'), { loading: () => null }),
  WaitlistSection: dynamic(() => import('./HomeBecomeConsultantBanner'), { loading: () => null }),
  ZodiacGridSection: dynamic(() => import('./ExpertiseCategoriesSection'), { loading: () => null }),
  ConsultantsSection: dynamic(() => import('./ConsultantsSection'), { loading: () => null }),
  HomeIntroSection: dynamic(() => import('./HomeIntroSection'), { loading: () => null }),
  WelcomeBannerSection: dynamic(() => import('./WelcomeBannerSection'), { loading: () => null }),
  HomeTestimonialsSection: dynamic(() => import('./HomeTestimonialsSection'), { loading: () => null }),
  HomeBecomeConsultantBanner: dynamic(() => import('./HomeBecomeConsultantBanner'), { loading: () => null }),
  BirthChartBanner: dynamic(() => import('./BirthChartBanner'), { loading: () => null }),
  PremiumMembershipBanner: dynamic(() => import('./PremiumMembershipBanner'), { loading: () => null }),
  FirstSessionDiscountBanner: dynamic(() => import('./FirstSessionDiscountBanner'), { loading: () => null }),
  WelcomePremiumBanner: dynamic(() => import('./WelcomePremiumBanner'), { loading: () => null }),
  AppDownloadSection: dynamic(() => import('./AppDownloadSection'), { loading: () => null }),
};

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

interface Props {
  layout: HomeSection[];
  locale?: string;
}

export default function HomeLayoutRenderer({ layout, locale }: Props) {
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get('section');

  useEffect(() => {
    if (sectionParam) {
      // Small delay to ensure dynamic content is painted
      const timer = setTimeout(() => {
        const targetId = sectionParam;
        const element = document.getElementById(targetId);
        
        if (element) {
          const headerOffset = 100;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [sectionParam]);

  return (
    <>
      {layout.map((section) => {
        const Component = REGISTRY[section.component_key];
        if (!Component) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[HomeLayoutRenderer] Unknown component_key: ${section.component_key} (slug: ${section.slug})`);
          }
          return null;
        }

        const isHero = section.component_key === 'HeroNew';

        const node = (
          <div id={section.slug} className="scroll-mt-32">
            <Component
              locale={locale}
              label={section.label}
              config={section.config}
            />
          </div>
        );

        if (isHero) {
          // Hero hızlı SSR — Suspense'siz
          return <React.Fragment key={section.id}>{node}</React.Fragment>;
        }

        return (
          <Suspense key={section.id} fallback={null}>
            {node}
          </Suspense>
        );
      })}
    </>
  );
}
