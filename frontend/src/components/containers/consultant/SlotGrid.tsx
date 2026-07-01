'use client';

import React from 'react';

import type { ConsultantSlotPublic } from '@/integrations/rtk/public/consultants.public.endpoints';
import { useUiSection } from '@/i18n';

type Props = {
  locale: string;
  slots: ConsultantSlotPublic[];
  isFetching: boolean;
  selectedSlotId?: string;
  onSelect: (slot: ConsultantSlotPublic) => void;
};

export default function SlotGrid({ locale, slots, isFetching, selectedSlotId, onSelect }: Props) {
  const { ui } = useUiSection('ui_consultantbrowse' as any, locale);
  if (isFetching) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-(--gm-surface) rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-center text-(--gm-muted) text-sm py-6">
        {ui('ui_consultantbrowse_no_slots', 'No available slots on this date.')}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot) => {
        const time = slot.slot_time?.slice(0, 5) ?? '';
        const isSelected = slot.id === selectedSlotId;
        const isReserved = Number(slot.reserved_count || 0) >= Number(slot.capacity || 1);
        return (
          <button
            key={slot.id}
            disabled={isReserved}
            onClick={() => onSelect(slot)}
            className={`py-2 rounded-xl text-sm font-medium border transition-all ${
              isSelected
                ? 'bg-(--gm-gold) border-(--gm-gold) text-(--gm-bg-deep) shadow-(--gm-shadow-gold)'
                : isReserved
                ? 'border-(--gm-border-soft) text-(--gm-muted) opacity-35 cursor-not-allowed'
                : 'border-(--gm-border-soft) text-(--gm-muted) hover:border-(--gm-gold)/50 hover:text-(--gm-text)'
            }`}
          >
            {time}
          </button>
        );
      })}
    </div>
  );
}
