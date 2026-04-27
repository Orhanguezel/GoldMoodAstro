'use client';

import React, { useState } from 'react';
import { Users, Search, Sparkles } from 'lucide-react';

import { useListConsultantsQuery } from '@/integrations/rtk/public/consultants.public.endpoints';
import ConsultantCard from './ConsultantCard';
import ConsultantFilters, { type FilterState } from './ConsultantFilters';
import Banner from '@/components/common/public/Banner';

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
    <div className="space-y-12">
      {/* Filters Section */}
      <div className="bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] rounded-[32px] p-6 md:p-8">
        <div className="flex items-center gap-3 mb-8">
          <Search className="w-5 h-5 text-[var(--gm-gold)]" />
          <h3 className="font-serif text-xl text-[var(--gm-text)]">Arama & Filtreleme</h3>
        </div>
        <ConsultantFilters filters={filters} onChange={setFilters} />
      </div>

      <Banner placement="consultant_list" className="rounded-[32px] overflow-hidden" />

      {/* Grid Section */}
      <div className="relative min-h-[400px]">
        {isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[var(--gm-error)]/10 flex items-center justify-center">
              <span className="text-[var(--gm-error)] text-2xl">!</span>
            </div>
            <h3 className="font-serif text-2xl text-[var(--gm-text)]">Hata Oluştu</h3>
            <p className="text-[var(--gm-text-dim)] max-w-xs">
              {locale === 'tr' ? 'Danışmanlar şu an yüklenemiyor.' : 'Could not load consultants.'}
            </p>
          </div>
        ) : isFetching ? (
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
        ) : consultants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-[var(--gm-surface)] flex items-center justify-center border border-[var(--gm-border-soft)]">
              <Users size={32} className="text-[var(--gm-gold)] opacity-30" />
            </div>
            <h3 className="font-serif text-2xl text-[var(--gm-text)]">Sonuç Bulunamadı</h3>
            <p className="text-[var(--gm-text-dim)] max-w-sm">
              {locale === 'tr' 
                ? 'Seçtiğiniz kriterlere uygun danışman bulunmuyor. Farklı filtreler deneyebilirsiniz.' 
                : 'No consultants match your criteria.'}
            </p>
            <button 
              onClick={() => setFilters({ expertise: '', minPrice: 0, minRating: 0, maxPrice: 0 })}
              className="text-[var(--gm-gold)] font-bold text-xs uppercase tracking-widest border-b border-[var(--gm-gold)] pb-1"
            >
              Filtreleri Temizle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {consultants.map((consultant) => (
              <ConsultantCard key={consultant.id} consultant={consultant} locale={locale} />
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-20 p-12 rounded-[40px] bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] text-center relative overflow-hidden">
        <Sparkles className="w-12 h-12 text-[var(--gm-gold)] opacity-10 absolute top-10 right-10" />
        <h3 className="font-serif text-3xl text-[var(--gm-text)] mb-4">Gezegenlerin Rehberliği</h3>
        <p className="text-[var(--gm-text-dim)] max-w-2xl mx-auto italic font-serif leading-relaxed">
          Tüm danışmanlarımız alanında uzman ve doğrulanmış profillerdir. Kişisel gelişiminize ve ruhsal farkındalığınıza katkı sağlamak için buradayız.
        </p>
      </div>
    </div>
  );
}
