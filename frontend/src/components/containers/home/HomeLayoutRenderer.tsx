'use client';

import React, { Suspense } from 'react';
import HeroNew from './HeroNew';
import BannerSlot from './BannerSlot';
import type { HomeSection } from './fetchHomeLayout.server';

import FeaturesNew from './FeaturesNew';
import HybridModelSection from './HybridModelSection';
import TransparencySection from './TransparencySection';
import TrustSection from './TrustSection';
import ConsultantsSection from './ConsultantsSection';
import WelcomeBannerSection from './WelcomeBannerSection';
import ExpertiseCategoriesSection from './ExpertiseCategoriesSection';
import HomeIntroSection from './HomeIntroSection';
import HomeTestimonialsSection from './HomeTestimonialsSection';
import HomeBecomeConsultantBanner from './HomeBecomeConsultantBanner';
import BirthChartBanner from './BirthChartBanner';
import PremiumMembershipBanner from './PremiumMembershipBanner';
import FirstSessionDiscountBanner from './FirstSessionDiscountBanner';
import WelcomePremiumBanner from './WelcomePremiumBanner';
import AppDownloadSection from './AppDownloadSection';

// Yeni component eklemek için: import + bu map'e key ekle.
const REGISTRY: Record<string, any> = {
  HeroNew,
  BannerSlot,
  PromisesSection: HomeIntroSection,
  FeaturesNew,
  HybridModelSection,
  TransparencySection,
  TrustSection,
  WaitlistSection: HomeBecomeConsultantBanner,
  ZodiacGridSection: ExpertiseCategoriesSection,
  ConsultantsSection,
  HomeIntroSection,
  WelcomeBannerSection,
  HomeTestimonialsSection,
  HomeBecomeConsultantBanner,
  BirthChartBanner,
  PremiumMembershipBanner,
  FirstSessionDiscountBanner,
  WelcomePremiumBanner,
  AppDownloadSection,
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
