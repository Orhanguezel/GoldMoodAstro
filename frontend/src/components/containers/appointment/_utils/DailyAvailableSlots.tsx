// =============================================================
// FILE: src/components/containers/appointment/_components/DailyAvailableSlots.tsx
// FINAL — Daily available sessions list (only available slots)
// - Separate block: shows ONLY available slots for selected therapist + date
// =============================================================

'use client';

import React, { useMemo } from 'react';
import type { ResourceSlotDto } from '@/integrations/shared';

import {
  slotIsActive,
  slotIsAvailable,
  slotTime,
  safeStr,
  isValidYmd,
} from '../_utils/appointmentHelpers';

export type DailyAvailableSlotsProps = {
  date: string; // YYYY-MM-DD
  slots: ResourceSlotDto[];
  loading: boolean;
  fetching: boolean;
  error: boolean;
  selectedTime: string;
  onPickTime: (tm: string) => void;
  onRefresh?: () => void;
  disabled?: boolean;
  t: (key: string, fallback: string) => string;
};

export const DailyAvailableSlots: React.FC<DailyAvailableSlotsProps> = ({
  date,
  slots,
  loading,
  fetching,
  error,
  selectedTime,
  onPickTime,
  onRefresh,
  disabled,
  t,
}) => {
  const d = safeStr(date);

  const available = useMemo(() => {
    // ✅ IMPORTANT: "boş seans" => active + available
    return (slots || [])
      .filter(slotIsActive)
      .filter(slotIsAvailable)
      .sort((a, b) => slotTime(a).localeCompare(slotTime(b)));
  }, [slots]);

  const statusText = useMemo(() => {
    if (!isValidYmd(d)) return t('ui_appointment_daily_pick_date', 'Önce tarih seçin.');
    if (loading || fetching) return t('ui_appointment_slots_loading', 'Saatler yükleniyor...');
    if (error) return t('ui_appointment_slots_error', 'Saatler yüklenemedi.');
    if (!available.length)
      return t('ui_appointment_slots_empty', 'Bu tarihte müsait saat bulunamadı.');
    return '';
  }, [d, loading, fetching, error, available.length, t]);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        {onRefresh ? (
          <button
            type="button"
            className="text-xs text-text-secondary hover:text-brand-primary underline transition-colors"
            onClick={onRefresh}
            disabled={!!disabled || loading || fetching}
          >
            {t('ui_appointment_refresh', 'Yenile')}
          </button>
        ) : null}
      </div>

      {statusText ? (
        <div className="bg-bg-card border border-border-light rounded-sm p-4 text-center text-text-secondary text-sm font-medium">
          {statusText}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {available.map((s) => {
            const time = slotTime(s);
            const selected = safeStr(selectedTime) === time;

            return (
              <button
                key={String((s as any).id || time)}
                type="button"
                className={`
                  relative flex items-center justify-center py-2.5 px-2 rounded-sm border text-sm font-bold transition-all duration-200
                  ${
                    selected
                      ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                      : 'bg-bg-card text-text-primary border-border-light hover:border-brand-primary hover:text-brand-primary hover:bg-bg-card'
                  }
                `}
                onClick={() => onPickTime(time)}
                disabled={!!disabled}
              >
                <span>{time || '-'}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
