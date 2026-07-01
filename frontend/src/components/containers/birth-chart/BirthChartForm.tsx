'use client';

import { useEffect, useState } from 'react';
import {
  usePreviewBirthChartMutation,
  useCreateBirthChartMutation,
} from '@/integrations/rtk/public/birth_charts.endpoints';
import { useLazySearchGeocodeQuery } from '@/integrations/rtk/public/geocode.endpoints';
import { useAuthStore } from '@/features/auth/auth.store';
import { useUiSection } from '@/i18n';
import type { BirthChart, BirthChartCreateInput, GeocodeResult } from '@/types/common';

export default function BirthChartForm({ onSuccess }: { onSuccess: (data: BirthChart) => void }) {
  const [previewChart, { isLoading: previewing }] = usePreviewBirthChartMutation();
  const [createChart, { isLoading: saving }] = useCreateBirthChartMutation();
  const { isAuthenticated } = useAuthStore();
  const { ui } = useUiSection('ui_misc' as any);
  const isLoading = previewing || saving;
  const [triggerGeocode, { data: geoResult, isFetching: isGeoLoading }] = useLazySearchGeocodeQuery();
  const [selectedPlace, setSelectedPlace] = useState<GeocodeResult | null>(null);
  const [geoQuery, setGeoQuery] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Omit<BirthChartCreateInput, 'pob_lat' | 'pob_lng' | 'pob_label'>>({
    name: '',
    dob: '',
    tob: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (geoQuery.trim().length > 2) triggerGeocode(geoQuery.trim());
    }, 450);
    return () => clearTimeout(timer);
  }, [geoQuery, triggerGeocode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedPlace) {
      setError(ui('ui_misc_birth_chart_select_place', 'Please select the birth place.'));
      return;
    }

    const payload = {
      ...formData,
      pob_lat: selectedPlace.lat,
      pob_lng: selectedPlace.lng,
      pob_label: selectedPlace.label,
    };

    try {
      const res = isAuthenticated
        ? await createChart(payload).unwrap()
        : await previewChart(payload).unwrap();
      onSuccess(res);
    } catch (err: any) {
      const code = err?.data?.error?.message || '';
      if (isAuthenticated && /duplicate|exists|unique/i.test(code)) {
        setError(ui('ui_misc_birth_chart_duplicate', 'You already have a chart with this name. Try a different name.'));
        return;
      }
      setError(ui('ui_misc_birth_chart_calc_failed', 'The chart could not be calculated. Check the information and try again.'));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-xl space-y-6 rounded-3xl border border-[var(--gm-primary)]/20 bg-[var(--gm-surface)] p-6 shadow-[var(--gm-shadow-card)] md:p-8"
    >
      <div className="mb-8 text-center">
        <h3 className="mb-2 font-serif text-2xl text-[var(--gm-primary)]">{ui('ui_misc_birth_chart_heading', 'Your Sky Chart')}</h3>
        <p className="text-sm font-light italic text-[var(--gm-text-dim)]">
          {ui('ui_misc_birth_chart_subtitle', 'Calculate your natal chart for free using your birth information.')}
        </p>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block font-display text-[10px] uppercase tracking-[0.2em] text-[var(--gm-primary)]">
            {ui('ui_misc_birth_chart_name_label', 'Chart name')}
          </span>
          <input
            type="text"
            placeholder={ui('ui_misc_birth_chart_name_placeholder', 'Example: My Chart')}
            className="w-full rounded-xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface-high)] p-3 text-[var(--gm-text)] transition-colors focus:border-[var(--gm-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gm-primary)]/15"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block font-display text-[10px] uppercase tracking-[0.2em] text-[var(--gm-primary)]">
              {ui('ui_misc_birth_chart_dob_label', 'Birth date')}
            </span>
            <input
              type="date"
              className="w-full rounded-xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface-high)] p-3 text-[var(--gm-text)] focus:border-[var(--gm-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gm-primary)]/15"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block font-display text-[10px] uppercase tracking-[0.2em] text-[var(--gm-primary)]">
              {ui('ui_misc_birth_chart_tob_label', 'Birth time')}
            </span>
            <input
              type="time"
              className="w-full rounded-xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface-high)] p-3 text-[var(--gm-text)] focus:border-[var(--gm-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gm-primary)]/15"
              value={formData.tob}
              onChange={(e) => setFormData({ ...formData, tob: e.target.value })}
              required
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block font-display text-[10px] uppercase tracking-[0.2em] text-[var(--gm-primary)]">
            {ui('ui_misc_birth_chart_pob_label', 'Birth place')}
          </span>
          <input
            type="text"
            placeholder={ui('ui_misc_birth_chart_pob_placeholder', 'Search city...')}
            className="w-full rounded-xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface-high)] p-3 text-[var(--gm-text)] focus:border-[var(--gm-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gm-primary)]/15"
            value={geoQuery || selectedPlace?.label || ''}
            onChange={(e) => {
              setGeoQuery(e.target.value);
              setSelectedPlace(null);
            }}
            required
          />
        </label>

        {isGeoLoading && <p className="text-xs text-[var(--gm-text-dim)]">{ui('ui_misc_birth_chart_searching_location', 'Searching location...')}</p>}
        {geoResult && geoQuery.trim().length > 2 && (
          <button
            type="button"
            className="w-full rounded-xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface-high)] p-3 text-left text-xs text-[var(--gm-text-dim)] transition-colors hover:border-[var(--gm-primary)]"
            onClick={() => {
              setSelectedPlace(geoResult);
              setGeoQuery('');
            }}
          >
            {geoResult.label}
          </button>
        )}


      </div>

      {error && <p className="text-sm text-[var(--gm-error)]">{error}</p>}

      <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center rounded-full bg-[var(--gm-primary)] px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-[var(--gm-shadow-card)] transition-all hover:-translate-y-0.5 hover:bg-[var(--gm-primary-dark)] disabled:translate-y-0 disabled:opacity-60">
        {saving
          ? ui('ui_misc_birth_chart_saving', 'Saving...')
          : previewing
          ? ui('ui_misc_birth_chart_calculating', 'Calculating...')
          : isAuthenticated
          ? ui('ui_misc_birth_chart_calc_and_save', 'Calculate and Save Chart')
          : ui('ui_misc_birth_chart_calc', 'Calculate Chart')}
      </button>
      {!isAuthenticated && (
        <p className="text-center text-[11px] text-[var(--gm-muted)]">
          {ui('ui_misc_birth_chart_login_hint', 'If you sign in, your chart will be saved to your profile so you do not need to fill it out again.')}
        </p>
      )}
    </form>
  );
}
