// =============================================================
// FILE: src/components/containers/appointment/_components/TherapistSelect.tsx
// FINAL — Therapist select (single therapist auto-selected and locked)
// - Ensures selected therapist is always present in options (no "disappearing")
// =============================================================

'use client';

import React, { useId, useMemo } from 'react';
import type { ResourcePublicItemDto } from '@/integrations/shared/resources.types';

import { safeStr, therapistLabelText } from '../_utils/appointmentHelpers';

export type TherapistSelectProps = {
  resources: ResourcePublicItemDto[];
  loading: boolean;
  fetching: boolean;
  error: boolean;
  selectedId: string;
  onChange: (rid: string) => void;

  // optional: availability suffix text
  getSuffix?: (rid: string) => string;

  // optional: filter list (e.g., only available after date picked)
  filteredResources?: ResourcePublicItemDto[];

  t: (key: string, fallback: string) => string;
  disabled?: boolean;
};

export const TherapistSelect: React.FC<TherapistSelectProps> = ({
  resources,
  filteredResources,
  loading,
  fetching,
  error,
  selectedId,
  onChange,
  getSuffix,
  t,
  disabled,
}) => {
  const selectId = useId();
  const rid = safeStr(selectedId);

  const isSingle = resources.length === 1;
  const listBase = filteredResources && filteredResources.length ? filteredResources : resources;

  // ✅ ensure selected therapist always included (prevents "kayboluyor")
  const options = useMemo(() => {
    const out = [...listBase];
    if (rid) {
      const already = out.some((r) => safeStr((r as any)?.id) === rid);
      if (!already) {
        const sel = resources.find((r) => safeStr((r as any)?.id) === rid);
        if (sel) out.unshift(sel);
      }
    }
    return out;
  }, [listBase, resources, rid]);

  const placeholder =
    loading || fetching
      ? t('ui_appointment_resource_loading', 'Terapistler yükleniyor...')
      : t('ui_appointment_resource_placeholder', 'Terapist seçin');

  return (
    <div className="mb-6">
      <label
        htmlFor={selectId}
        className="block text-sm font-bold text-text-primary mb-2 uppercase tracking-wide"
      >
        {t('ui_appointment_resource_label', 'Terapist')}
      </label>
      <div className="relative">
        <select
          id={selectId}
          className="w-full px-4 py-3 bg-bg-card border border-border-light text-text-primary rounded-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          value={rid}
          onChange={(e) => onChange(e.target.value)}
          disabled={!!disabled || isSingle || loading || fetching}
        >
          {/* Tek terapistte placeholder göstermiyoruz, direkt option */}
          {!isSingle ? <option value="">{placeholder}</option> : null}

          {(isSingle ? resources : options).map((r) => {
            const id = safeStr((r as any).id);
            const name = therapistLabelText(r);
            const suffix = getSuffix && id ? safeStr(getSuffix(id)) : '';
            return (
              <option key={id || name} value={id}>
                {suffix ? `${name} • ${suffix}` : name}
              </option>
            );
          })}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {error ? (
        <div className="text-rose-600 text-sm mt-2 font-medium">
          {t('ui_appointment_resource_error', 'Terapistler yüklenemedi.')}
        </div>
      ) : null}

      {!loading && !fetching && !error && resources.length === 0 ? (
        <div className="text-brand-clay text-sm mt-2 font-medium">
          {t(
            'ui_appointment_resource_empty',
            'Şu an terapist bulunamadı. Lütfen daha sonra tekrar deneyin.',
          )}
        </div>
      ) : null}

      {isSingle ? (
        <div className="text-text-secondary text-sm mt-2 italic">
          {t('ui_appointment_single_therapist', 'Terapist otomatik seçildi.')}
        </div>
      ) : null}
    </div>
  );
};
