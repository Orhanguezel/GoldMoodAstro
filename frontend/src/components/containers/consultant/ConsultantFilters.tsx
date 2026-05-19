'use client';

import React, { useState, useCallback } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useListServiceCategoriesPublicQuery } from '@/integrations/rtk/public/service_categories.public.endpoints';

const EXPERTISE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'astrology', label: 'Astrology' },
  { value: 'tarot', label: 'Tarot' },
  { value: 'numerology', label: 'Numerology' },
  { value: 'mood', label: 'Mood Coaching' },
  { value: 'career', label: 'Career' },
  { value: 'relationship', label: 'Relationship' },
  { value: 'birth_chart', label: 'Birth Chart' },
];

export interface FilterState {
  expertise: string;
  minPrice: number;
  minRating: number;
  maxPrice: number;
}

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export default function ConsultantFilters({ filters, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const { data: serviceCategories = [] } = useListServiceCategoriesPublicQuery();
  const expertiseOptions = serviceCategories.length
    ? [{ value: '', label: 'All' }, ...serviceCategories.map((category) => ({ value: category.slug, label: category.name }))]
    : EXPERTISE_OPTIONS;

  const set = useCallback(
    (patch: Partial<FilterState>) => onChange({ ...filters, ...patch }),
    [filters, onChange],
  );

  return (
    <div className="mb-12">
      {/* Expertise quick-filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        {expertiseOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => set({ expertise: opt.value })}
            className={`px-5 py-2 rounded-full text-[10px] tracking-widest uppercase transition-all border ${
              filters.expertise === opt.value
                ? 'bg-[var(--gm-gold)] border-[var(--gm-gold)] text-[var(--gm-bg)] shadow-gold'
                : 'border-[var(--gm-border-soft)] text-[var(--gm-muted)] hover:border-[var(--gm-gold)] hover:text-[var(--gm-gold)]'
            }`}
          >
            {opt.label}
          </button>
        ))}

        <button
          onClick={() => setOpen((v) => !v)}
          className={`ml-auto flex items-center gap-2 px-5 py-2 rounded-full border transition-all text-[10px] tracking-widest uppercase ${
            open 
              ? 'bg-[var(--gm-bg-deep)] border-[var(--gm-gold)] text-[var(--gm-gold)]' 
              : 'border-[var(--gm-border-soft)] text-[var(--gm-muted)] hover:border-[var(--gm-gold)]'
          }`}
        >
          <SlidersHorizontal size={14} />
          {open ? 'FİLTRELERİ KAPAT' : 'FİLTRELE'}
        </button>
      </div>

      {open && (
        <div className="mt-6 p-8 bg-[var(--gm-bg)] border border-[var(--gm-gold)]/20 shadow-card grid grid-cols-1 gap-8 sm:grid-cols-3 reveal">
          <div>
            <label htmlFor="consultant-filter-min-price" className="block text-[10px] tracking-widest uppercase text-[var(--gm-muted)] mb-3">Min. Fiyat (₺)</label>
            <select
              id="consultant-filter-min-price"
              value={filters.minPrice}
              onChange={(e) => set({ minPrice: Number(e.target.value) })}
              className="w-full bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-sm px-4 py-3 text-sm text-[var(--gm-text)] focus:outline-none focus:border-[var(--gm-gold)]"
            >
              {[0, 250, 500, 1000, 2000].map((v) => (
                <option key={v} value={v}>
                  {v === 0 ? 'Tümü' : `₺${v}+`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="consultant-filter-min-rating" className="block text-[10px] tracking-widest uppercase text-[var(--gm-muted)] mb-3">Min. Puan</label>
            <select
              id="consultant-filter-min-rating"
              value={filters.minRating}
              onChange={(e) => set({ minRating: Number(e.target.value) })}
              className="w-full bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-sm px-4 py-3 text-sm text-[var(--gm-text)] focus:outline-none focus:border-[var(--gm-gold)]"
            >
              {[0, 3, 3.5, 4, 4.5].map((v) => (
                <option key={v} value={v}>
                  {v === 0 ? 'Tümü' : `${v}+`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="consultant-filter-max-price" className="block text-[10px] tracking-widest uppercase text-[var(--gm-muted)] mb-3">Maks. Fiyat (₺)</label>
            <select
              id="consultant-filter-max-price"
              value={filters.maxPrice}
              onChange={(e) => set({ maxPrice: Number(e.target.value) })}
              className="w-full bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-sm px-4 py-3 text-sm text-[var(--gm-text)] focus:outline-none focus:border-[var(--gm-gold)]"
            >
              {[0, 500, 1000, 2000, 5000].map((v) => (
                <option key={v} value={v}>
                  {v === 0 ? 'Tümü' : `₺${v}'e kadar`}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
