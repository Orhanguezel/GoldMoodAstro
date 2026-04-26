'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { useGetConsultantSlotsPublicQuery } from '@/integrations/rtk/public/consultants.public.endpoints';
import type { ConsultantSlotPublic } from '@/integrations/rtk/public/consultants.public.endpoints';
import SlotCalendar from './SlotCalendar';
import SlotGrid from './SlotGrid';

interface Props {
  consultantId: string;
  locale: string;
  onSelect: (slot: ConsultantSlotPublic) => void;
  selectedSlotId?: string;
}

export default function SlotPicker({ consultantId, locale, onSelect, selectedSlotId }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { data: slots = [], isFetching } = useGetConsultantSlotsPublicQuery({
    id: consultantId,
    date: dateStr,
  });

  return (
    <div>
      <SlotCalendar locale={locale} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      <SlotGrid
        locale={locale}
        slots={slots}
        isFetching={isFetching}
        selectedSlotId={selectedSlotId}
        onSelect={onSelect}
      />
    </div>
  );
}
