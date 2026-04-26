'use client';

import React from 'react';

import type { ConsultantSlotPublic } from '@/integrations/rtk/public/consultants.public.endpoints';

type Props = {
  locale: string;
  slots: ConsultantSlotPublic[];
  isFetching: boolean;
  selectedSlotId?: string;
  onSelect: (slot: ConsultantSlotPublic) => void;
};

export default function SlotGrid({ locale, slots, isFetching, selectedSlotId, onSelect }: Props) {
  if (isFetching) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-bg-surface rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-center text-text-muted text-sm py-6">
        {locale === 'tr' ? 'Bu tarihte müsait slot yok.' : 'No available slots on this date.'}
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
                ? 'bg-brand-primary border-brand-primary text-text shadow-glow'
                : isReserved
                ? 'border-border text-text-muted opacity-35 cursor-not-allowed'
                : 'border-border text-text-muted hover:border-brand-primary/50 hover:text-text'
            }`}
          >
            {time}
          </button>
        );
      })}
    </div>
  );
}
