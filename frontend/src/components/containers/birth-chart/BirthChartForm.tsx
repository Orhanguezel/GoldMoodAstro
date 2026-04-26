'use client';

import { useEffect, useState } from 'react';
import { usePreviewBirthChartMutation } from '@/integrations/rtk/public/birth_charts.endpoints';
import { useLazySearchGeocodeQuery } from '@/integrations/rtk/public/geocode.endpoints';
import type { BirthChart, BirthChartCreateInput, GeocodeResult } from '@/types/common';

export default function BirthChartForm({ onSuccess }: { onSuccess: (data: BirthChart) => void }) {
  const [previewChart, { isLoading }] = usePreviewBirthChartMutation();
  const [triggerGeocode, { data: geoResult, isFetching: isGeoLoading }] = useLazySearchGeocodeQuery();
  const [selectedPlace, setSelectedPlace] = useState<GeocodeResult | null>(null);
  const [geoQuery, setGeoQuery] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Omit<BirthChartCreateInput, 'pob_lat' | 'pob_lng' | 'pob_label'>>({
    name: '',
    dob: '',
    tob: '',
    tz_offset: 180,
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
      setError('Lütfen doğum yerini seçin.');
      return;
    }

    try {
      const res = await previewChart({
        ...formData,
        pob_lat: selectedPlace.lat,
        pob_lng: selectedPlace.lng,
        pob_label: selectedPlace.label,
      }).unwrap();
      onSuccess(res);
    } catch {
      setError('Harita hesaplanamadı. Bilgileri kontrol edip tekrar deneyin.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-xl space-y-6 rounded-sm border border-[var(--gm-border-soft)] bg-[var(--gm-bg-deep)] p-6 shadow-soft md:p-8"
    >
      <div className="mb-8 text-center">
        <h3 className="mb-2 font-serif text-2xl text-[var(--gm-gold)]">Gökyüzü Haritanız</h3>
        <p className="text-sm font-light italic text-[var(--gm-text-dim)]">
          Doğum bilgilerinizle natal haritanızı ücretsiz hesaplayın.
        </p>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block font-display text-[10px] uppercase tracking-[0.2em] text-[var(--gm-gold)]">
            Harita adı
          </span>
          <input
            type="text"
            placeholder="Örn: Benim Haritam"
            className="w-full rounded-sm border border-[var(--gm-border-soft)] bg-[var(--gm-bg)] p-3 text-[var(--gm-text)] transition-colors focus:border-[var(--gm-gold)] focus:outline-none"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block font-display text-[10px] uppercase tracking-[0.2em] text-[var(--gm-gold)]">
              Doğum tarihi
            </span>
            <input
              type="date"
              className="w-full rounded-sm border border-[var(--gm-border-soft)] bg-[var(--gm-bg)] p-3 text-[var(--gm-text)] focus:border-[var(--gm-gold)] focus:outline-none"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block font-display text-[10px] uppercase tracking-[0.2em] text-[var(--gm-gold)]">
              Doğum saati
            </span>
            <input
              type="time"
              className="w-full rounded-sm border border-[var(--gm-border-soft)] bg-[var(--gm-bg)] p-3 text-[var(--gm-text)] focus:border-[var(--gm-gold)] focus:outline-none"
              value={formData.tob}
              onChange={(e) => setFormData({ ...formData, tob: e.target.value })}
              required
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block font-display text-[10px] uppercase tracking-[0.2em] text-[var(--gm-gold)]">
            Doğum yeri
          </span>
          <input
            type="text"
            placeholder="Şehir ara..."
            className="w-full rounded-sm border border-[var(--gm-border-soft)] bg-[var(--gm-bg)] p-3 text-[var(--gm-text)] focus:border-[var(--gm-gold)] focus:outline-none"
            value={geoQuery || selectedPlace?.label || ''}
            onChange={(e) => {
              setGeoQuery(e.target.value);
              setSelectedPlace(null);
            }}
            required
          />
        </label>

        {isGeoLoading && <p className="text-xs text-[var(--gm-text-dim)]">Konum aranıyor...</p>}
        {geoResult && geoQuery.trim().length > 2 && (
          <button
            type="button"
            className="w-full rounded-sm border border-[var(--gm-border-soft)] bg-[var(--gm-surface)] p-3 text-left text-xs text-[var(--gm-text-dim)] transition-colors hover:border-[var(--gm-gold)]"
            onClick={() => {
              setSelectedPlace(geoResult);
              setGeoQuery('');
            }}
          >
            {geoResult.label}
          </button>
        )}

        <label className="block">
          <span className="mb-2 block font-display text-[10px] uppercase tracking-[0.2em] text-[var(--gm-gold)]">
            Saat dilimi offseti
          </span>
          <input
            type="number"
            className="w-full rounded-sm border border-[var(--gm-border-soft)] bg-[var(--gm-bg)] p-3 text-[var(--gm-text)] focus:border-[var(--gm-gold)] focus:outline-none"
            value={formData.tz_offset}
            onChange={(e) => setFormData({ ...formData, tz_offset: Number(e.target.value || 0) })}
            min={-840}
            max={840}
            required
          />
        </label>
      </div>

      {error && <p className="text-sm text-[var(--gm-error)]">{error}</p>}

      <button type="submit" disabled={isLoading} className="btn-premium w-full py-4 text-sm tracking-[0.2em] disabled:opacity-60">
        {isLoading ? 'Hesaplanıyor...' : 'Haritayı Hesapla'}
      </button>
    </form>
  );
}
