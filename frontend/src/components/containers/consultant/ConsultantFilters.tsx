'use client';

import React, { useState, useCallback } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

const EXPERTISE_OPTIONS = [
  { value: '', label: 'Tümü' },
  { value: 'astrology', label: 'Astroloji' },
  { value: 'tarot', label: 'Tarot' },
  { value: 'numerology', label: 'Numeroloji' },
  { value: 'mood', label: 'Mood Coaching' },
  { value: 'career', label: 'Kariyer' },
  { value: 'relationship', label: 'İlişki' },
  { value: 'birth_chart', label: 'Doğum Haritası' },
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

  const set = useCallback(
    (patch: Partial<FilterState>) => onChange({ ...filters, ...patch }),
    [filters, onChange],
  );

  return (
    <div className="mb-8">
      {/* Expertise quick-filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        {EXPERTISE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => set({ expertise: opt.value })}
            className={`px-4 py-1.5 rounded-full text-sm transition-all border ${
              filters.expertise === opt.value
                ? 'bg-brand-primary border-brand-primary text-text'
                : 'border-border text-text-muted hover:border-brand-primary/50 hover:text-text'
            }`}
          >
            {opt.label}
          </button>
        ))}

        <button
          onClick={() => setOpen((v) => !v)}
          className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-border text-text-muted hover:border-brand-primary/50 text-sm transition-all"
        >
          <SlidersHorizontal size={14} />
          Filtrele
        </button>
      </div>

      {/* Advanced filters panel */}
      {open && (
        <div className="mt-4 p-4 bg-bg-card border border-border rounded-xl grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="consultant-filter-min-price" className="block text-xs text-text-muted mb-1">Min. Fiyat (₺)</label>
            <select
              id="consultant-filter-min-price"
              value={filters.minPrice}
              onChange={(e) => set({ minPrice: Number(e.target.value) })}
              className="w-full bg-bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text"
            >
              {[0, 250, 500, 1000, 2000].map((v) => (
                <option key={v} value={v}>
                  {v === 0 ? 'Tümü' : `₺${v}+`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="consultant-filter-min-rating" className="block text-xs text-text-muted mb-1">Min. Puan</label>
            <select
              id="consultant-filter-min-rating"
              value={filters.minRating}
              onChange={(e) => set({ minRating: Number(e.target.value) })}
              className="w-full bg-bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text"
            >
              {[0, 3, 3.5, 4, 4.5].map((v) => (
                <option key={v} value={v}>
                  {v === 0 ? 'Tümü' : `${v}+`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="consultant-filter-max-price" className="block text-xs text-text-muted mb-1">Maks. Fiyat (₺)</label>
            <select
              id="consultant-filter-max-price"
              value={filters.maxPrice}
              onChange={(e) => set({ maxPrice: Number(e.target.value) })}
              className="w-full bg-bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text"
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
