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

interface Props {
  layout: HomeSection[];
  locale?: string;
}

export default function HomeLayoutRenderer({ layout, locale }: Props) {
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
          <Component
            locale={locale}
            label={section.label}
            config={section.config}
          />
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
