'use client';

import React, { useState } from 'react';
import { Users } from 'lucide-react';

import { useListConsultantsQuery } from '@/integrations/rtk/public/consultants.public.endpoints';
import ConsultantCard from './ConsultantCard';
import ConsultantFilters, { type FilterState } from './ConsultantFilters';

type Props = {
  locale: string;
  initialExpertise?: string;
};

export default function ConsultantList({ locale, initialExpertise = '' }: Props) {
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
    Object.keys(queryParams).length ? queryParams : undefined,
  );

  return (
    <>
      <ConsultantFilters filters={filters} onChange={setFilters} />

      {isError ? (
        <div className="text-center py-20 text-text-muted">
          {locale === 'tr' ? 'Danışmanlar yüklenemedi.' : 'Could not load consultants.'}
        </div>
      ) : isFetching ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 bg-bg-card border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : consultants.length === 0 ? (
        <div className="text-center py-20">
          <Users size={40} className="mx-auto mb-4 text-text-muted opacity-40" />
          <p className="text-text-muted">
            {locale === 'tr' ? 'Kriterlere uygun danışman bulunamadı.' : 'No consultants match your criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {consultants.map((consultant) => (
            <ConsultantCard key={consultant.id} consultant={consultant} locale={locale} />
          ))}
        </div>
      )}
    </>
  );
}
