'use client';

import React from 'react';
import { addDays, format, isSameDay } from 'date-fns';
import { tr as dateFnsTr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  locale: string;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
};

export default function SlotCalendar({ locale, selectedDate, onSelectDate }: Props) {
  const [weekOffset, setWeekOffset] = React.useState(0);
  const today = new Date();
  const weekStart = addDays(today, weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dateLocale = locale === 'tr' ? dateFnsTr : undefined;

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
          disabled={weekOffset === 0}
          className="p-1.5 rounded-lg border border-border disabled:opacity-30 hover:border-brand-primary/50 transition-colors"
        >
          <ChevronLeft size={16} className="text-text-muted" />
        </button>
        <span className="text-sm text-text-muted">
          {format(weekStart, 'MMMM yyyy', { locale: dateLocale })}
        </span>
        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          className="p-1.5 rounded-lg border border-border hover:border-brand-primary/50 transition-colors"
        >
          <ChevronRight size={16} className="text-text-muted" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-6">
        {days.map((day) => {
          const isPast = day < today && !isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          return (
            <button
              key={day.toISOString()}
              disabled={isPast}
              onClick={() => onSelectDate(day)}
              className={`flex flex-col items-center py-2 rounded-xl transition-all text-xs border ${
                isSelected
                  ? 'bg-brand-primary border-brand-primary text-text'
                  : isPast
                  ? 'border-border text-text-muted opacity-30 cursor-not-allowed'
                  : 'border-border text-text-muted hover:border-brand-primary/50'
              }`}
            >
              <span className="uppercase text-[10px] mb-0.5">
                {format(day, 'EEE', { locale: dateLocale })}
              </span>
              <span className="font-serif text-base">{format(day, 'd')}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
