'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Users, Search } from 'lucide-react';


import { useListConsultantsQuery } from '@/integrations/rtk/public/consultants.public.endpoints';
import type { ConsultantPublic } from '@/integrations/rtk/public/consultants.public.endpoints';
import { useListServiceCategoriesPublicQuery } from '@/integrations/rtk/public/service_categories.public.endpoints';
import ConsultantCard from './ConsultantCard';
import ConsultantFilters, { type FilterState } from './ConsultantFilters';
import Banner from '@/components/common/public/Banner';
import { DiscountPromoBanner, BecomeConsultantBanner } from '@/components/common/public/PromoBanners';
import { useUiSection } from '@/i18n';


type Props = {
  locale: string;
  initialExpertise?: string;
  initialData?: ConsultantPublic[];
};

export default function ConsultantList({ locale, initialExpertise = '', initialData = [] }: Props) {
  const { ui } = useUiSection('ui_consultantbrowse' as any, locale);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    expertise: initialExpertise,
    minPrice: 0,
    minRating: 0,
    maxPrice: 0,
  });

  const queryParams = {
    ...(filters.expertise ? { expertise: filters.expertise } : {}),
    ...(filters.minPrice > 0 ? { minPrice: filters.minPrice } : {}),
    ...(filters.minRating > 0 ? { minRating: filters.minRating } : {}),
    ...(filters.maxPrice > 0 ? { maxPrice: filters.maxPrice } : {}),
  };

  const { data: consultants = [], isFetching, isError } = useListConsultantsQuery(
    { ...queryParams, locale },
  );
  const { data: serviceCategories = [] } = useListServiceCategoriesPublicQuery();
  const expertiseLabels = useMemo(
    () => Object.fromEntries(serviceCategories.map((category) => [category.slug, category.name])),
    [serviceCategories],
  );
  const isInitialFilterState =
    filters.expertise === initialExpertise &&
    filters.minPrice === 0 &&
    filters.minRating === 0 &&
    filters.maxPrice === 0;
  const visibleConsultants = consultants.length > 0 ? consultants : (isInitialFilterState ? initialData : []);
  const showSkeleton = isFetching && visibleConsultants.length === 0;

  const scrollToResults = useCallback(() => {
    window.requestAnimationFrame(() => {
      const el = resultsRef.current;
      if (!el) return;
      const headerOffset = 112;
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });
  }, []);

  const handleFilterChange = useCallback((nextFilters: FilterState) => {
    setFilters(nextFilters);
    scrollToResults();
  }, [scrollToResults]);

  return (
    <div className="space-y-12">
      {/* Filters Section */}
      <div className="bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] rounded-[32px] p-6 md:p-8">
        <div className="flex items-center gap-3 mb-8">
          <Search className="w-5 h-5 text-[var(--gm-gold)]" />
          <h2 className="font-serif text-xl text-[var(--gm-text)]">{ui('ui_consultantbrowse_search_filter_title', 'Search & Filters')}</h2>
        </div>
        <ConsultantFilters filters={filters} onChange={handleFilterChange} />
      </div>

      <DiscountPromoBanner locale={locale} />

      {/* Grid Section */}
      <div id="consultants-results" ref={resultsRef} className="relative min-h-[400px] scroll-mt-28">
        {isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[var(--gm-error)]/10 flex items-center justify-center">
              <span className="text-[var(--gm-error)] text-2xl">!</span>
            </div>
            <h3 className="font-serif text-2xl text-[var(--gm-text)]">{ui('ui_consultantbrowse_error_title', 'An Error Occurred')}</h3>
            <p className="text-[var(--gm-text-dim)] max-w-xs">
              {ui('ui_consultantbrowse_error_load', 'Consultants cannot be loaded right now.')}
            </p>
          </div>
        ) : showSkeleton ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[420px] bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] rounded-[32px] animate-pulse flex flex-col p-8 gap-6">
                <div className="flex justify-between">
                  <div className="w-20 h-20 rounded-full bg-[var(--gm-bg-deep)]" />
                  <div className="w-24 h-8 bg-[var(--gm-bg-deep)] rounded-lg" />
                </div>
                <div className="h-8 w-2/3 bg-[var(--gm-bg-deep)] rounded-lg" />
                <div className="h-4 w-1/2 bg-[var(--gm-bg-deep)] rounded-lg" />
                <div className="h-20 w-full bg-[var(--gm-bg-deep)] rounded-lg" />
                <div className="mt-auto h-12 w-full bg-[var(--gm-bg-deep)] rounded-full" />
              </div>
            ))}
          </div>
        ) : visibleConsultants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-[var(--gm-surface)] flex items-center justify-center border border-[var(--gm-border-soft)]">
              <Users size={32} className="text-[var(--gm-gold)] opacity-30" />
            </div>
            <h3 className="font-serif text-2xl text-[var(--gm-text)]">{ui('ui_consultantbrowse_empty_title', 'No Results Found')}</h3>
            <p className="text-[var(--gm-text-dim)] max-w-sm">
              {ui('ui_consultantbrowse_empty_desc', 'No consultants match your selected criteria. You can try different filters.')}
            </p>
            <button
              onClick={() => handleFilterChange({ expertise: '', minPrice: 0, minRating: 0, maxPrice: 0 })}
              className="text-[var(--gm-gold)] font-bold text-xs uppercase tracking-widest border-b border-[var(--gm-gold)] pb-1"
            >
              {ui('ui_consultantbrowse_clear_filters', 'Clear Filters')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {visibleConsultants.map((consultant) => (
              <ConsultantCard key={consultant.id} consultant={consultant} locale={locale} expertiseLabels={expertiseLabels} />
            ))}
          </div>
        )}
      </div>

      {/* Become Consultant CTA Banner */}
      <BecomeConsultantBanner locale={locale} className="mt-8" />
    </div>
  );
}
