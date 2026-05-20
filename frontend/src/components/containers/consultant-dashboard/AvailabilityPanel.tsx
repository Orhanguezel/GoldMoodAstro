'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Loader2, Calendar as CalendarIcon, Power } from 'lucide-react';
import { toast } from 'sonner';
import { extractApiError } from '@/integrations/shared';
import {
  useGetMyConsultantAvailabilityQuery,
  useOverrideMyConsultantAvailabilityDayMutation,
  useUpdateMyConsultantAvailabilityMutation,
} from '@/integrations/rtk/private/consultant_self.endpoints';

type Dow = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const DAYS: Array<{ dow: Dow; label: string; short: string }> = [
  { dow: 1, label: 'Pazartesi', short: 'Pzt' },
  { dow: 2, label: 'Salı', short: 'Sal' },
  { dow: 3, label: 'Çarşamba', short: 'Çar' },
  { dow: 4, label: 'Perşembe', short: 'Per' },
  { dow: 5, label: 'Cuma', short: 'Cum' },
  { dow: 6, label: 'Cumartesi', short: 'Cmt' },
  { dow: 7, label: 'Pazar', short: 'Paz' },
];

interface HourRow {
  id?: string;
  dow: Dow;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  capacity: number;
  is_active: number;
}

const PRESETS = [
  { label: 'Hafta içi 09-18', hours: [1, 2, 3, 4, 5].map((d) => ({ dow: d as Dow, start_time: '09:00', end_time: '18:00', slot_minutes: 30, capacity: 1, is_active: 1 })) },
  { label: 'Tam zaman 09-22', hours: [1, 2, 3, 4, 5, 6, 7].map((d) => ({ dow: d as Dow, start_time: '09:00', end_time: '22:00', slot_minutes: 30, capacity: 1, is_active: 1 })) },
  { label: 'Akşam 18-22', hours: [1, 2, 3, 4, 5].map((d) => ({ dow: d as Dow, start_time: '18:00', end_time: '22:00', slot_minutes: 30, capacity: 1, is_active: 1 })) },
];

function normalizeTime(t: string) {
  // "HH:MM:SS" → "HH:MM"
  return t.length >= 5 ? t.substring(0, 5) : t;
}

function normalizeDow(dow: number): Dow {
  return dow === 0 ? 7 : Math.min(7, Math.max(1, dow)) as Dow;
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export default function AvailabilityPanel() {
  const { data, isLoading, refetch } = useGetMyConsultantAvailabilityQuery();
  const [update, { isLoading: isSaving }] = useUpdateMyConsultantAvailabilityMutation();
  const [overrideDay, { isLoading: isOverridingDay }] = useOverrideMyConsultantAvailabilityDayMutation();
  const [hours, setHours] = useState<HourRow[]>([]);
  const [dirty, setDirty] = useState(false);
  const [overrideDate, setOverrideDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (data?.working_hours) {
      setHours(
        data.working_hours.map((h) => ({
          id: h.id,
          dow: normalizeDow(h.dow),
          start_time: normalizeTime(h.start_time),
          end_time: normalizeTime(h.end_time),
          slot_minutes: h.slot_minutes,
          capacity: h.capacity,
          is_active: h.is_active,
        })),
      );
      setDirty(false);
    }
  }, [data]);

  const addRow = (dow: Dow) => {
    setHours((prev) => [...prev, { dow, start_time: '09:00', end_time: '18:00', slot_minutes: 30, capacity: 1, is_active: 1 }]);
    setDirty(true);
  };

  const removeRow = (idx: number) => {
    setHours((prev) => prev.filter((_, i) => i !== idx));
    setDirty(true);
  };

  const patchRow = (idx: number, patch: Partial<HourRow>) => {
    setHours((prev) => prev.map((h, i) => (i === idx ? { ...h, ...patch } : h)));
    setDirty(true);
  };

  const applyPreset = (presetHours: any[]) => {
    setHours(presetHours);
    setDirty(true);
  };

  const handleSave = async () => {
    // 1. Basic validation (start < end)
    const invalidOrder = hours.find((h) => timeToMinutes(h.end_time) <= timeToMinutes(h.start_time));
    if (invalidOrder) {
      const day = DAYS.find((d) => d.dow === invalidOrder.dow)?.label ?? 'Seçili gün';
      toast.error(`${day} için bitiş saati başlangıçtan sonra olmalı.`);
      return;
    }

    // 2. Divisibility validation (slot_minutes should divide duration)
    const invalidDiv = hours.find((h) => {
      const duration = timeToMinutes(h.end_time) - timeToMinutes(h.start_time);
      return duration % h.slot_minutes !== 0;
    });
    if (invalidDiv) {
      const day = DAYS.find((d) => d.dow === invalidDiv.dow)?.label ?? 'Seçili gün';
      toast.error(`${day} için seans süresi (${invalidDiv.slot_minutes} dk) toplam aralığa tam bölünmeli.`);
      return;
    }

    // 3. Overlap validation
    for (const day of DAYS) {
      const dayHours = hours.filter((h) => h.dow === day.dow);
      for (let i = 0; i < dayHours.length; i++) {
        for (let j = i + 1; j < dayHours.length; j++) {
          const h1 = dayHours[i];
          const h2 = dayHours[j];
          const s1 = timeToMinutes(h1.start_time);
          const e1 = timeToMinutes(h1.end_time);
          const s2 = timeToMinutes(h2.start_time);
          const e2 = timeToMinutes(h2.end_time);

          if ((s1 < e2 && e1 > s2)) {
            toast.error(`${day.label} için saat aralıkları çakışıyor: ${h1.start_time}-${h1.end_time} ve ${h2.start_time}-${h2.end_time}`);
            return;
          }
        }
      }
    }

    try {
      await update({ hours }).unwrap();
      toast.success(`${hours.length} saat aralığı kaydedildi`);
      setDirty(false);
      refetch();
    } catch (e: any) {
      toast.error(extractApiError(e, 'Kaydedilemedi'));
    }
  };

  const handleOverrideDay = async (isActive: 0 | 1) => {
    if (!overrideDate) {
      toast.error('Önce bir tarih seç.');
      return;
    }

    try {
      const out = await overrideDay({ date: overrideDate, is_active: isActive }).unwrap();
      const action = isActive === 1 ? 'açıldı' : 'kapatıldı';
      toast.success(`${overrideDate} ${action}. Etkilenen slot: ${out.updated}/${out.planned}`);
    } catch (e: any) {
      if (e?.data?.error?.message === 'slot_has_reservations') {
        toast.error('Bu tarihte rezervasyonlu slot var; gün tamamen kapatılamaz.');
      } else {
        toast.error(extractApiError(e, 'Tarih güncellenemedi'));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-[var(--gm-gold)] animate-spin" />
      </div>
    );
  }

  if (!data?.resource_id) {
    return (
      <div className="text-center py-16 px-4">
        <CalendarIcon className="w-12 h-12 text-[var(--gm-gold)]/30 mx-auto mb-4" />
        <p className="text-[var(--gm-text-dim)] font-serif italic">
          Çalışma saatlerini görmek için önce admin onayı gerekiyor.
        </p>
      </div>
    );
  }

  // Group by dow
  const byDow = new Map<number, Array<{ row: HourRow; idx: number }>>();
  hours.forEach((h, i) => {
    const arr = byDow.get(h.dow) || [];
    arr.push({ row: h, idx: i });
    byDow.set(h.dow, arr);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-serif text-lg text-[var(--gm-text)]">Haftalık Çalışma Saatleri</h2>
          <p className="text-[12px] text-[var(--gm-text-dim)] font-serif italic">
            Danışanlar bu saatlere göre randevu alabilir. Her gün için birden fazla aralık ekleyebilirsin.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={!dirty || isSaving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {dirty ? 'Değişiklikleri Kaydet' : 'Kaydedildi'}
        </button>
      </div>

      {/* Preset shortcuts */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-widest text-[var(--gm-muted)] font-bold">Hızlı Ayarla:</span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p.hours)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--gm-border-soft)] bg-[var(--gm-bg-deep)]/30 text-[10px] font-bold uppercase tracking-widest text-[var(--gm-text)] hover:border-[var(--gm-gold)]/40 hover:text-[var(--gm-gold)]"
          >
            <Power className="w-3 h-3" />
            {p.label}
          </button>
        ))}
        <button
          onClick={() => { setHours([]); setDirty(true); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--gm-error)]/30 bg-[var(--gm-error)]/10 text-[10px] font-bold uppercase tracking-widest text-[var(--gm-error)] hover:bg-[var(--gm-error)]/15"
        >
          <Trash2 className="w-3 h-3" />
          Hepsini Temizle
        </button>
      </div>

      {/* One-off day override */}
      <div className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30 p-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)]">Tek Seferlik Gün</h3>
          <p className="text-[12px] text-[var(--gm-text-dim)] mt-1 font-serif italic">
            Tatil, yoğunluk veya özel durum için seçili tarihin tüm slotlarını kapatıp tekrar açabilirsin.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="date"
            value={overrideDate}
            onChange={(e) => setOverrideDate(e.target.value)}
            className="h-10 bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-xl px-3 text-sm text-[var(--gm-text)]"
          />
          <button
            type="button"
            onClick={() => handleOverrideDay(0)}
            disabled={isOverridingDay}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-[var(--gm-error)]/30 bg-[var(--gm-error)]/10 text-[var(--gm-error)] text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
          >
            {isOverridingDay ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Günü Kapat
          </button>
          <button
            type="button"
            onClick={() => handleOverrideDay(1)}
            disabled={isOverridingDay}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-[var(--gm-gold)]/40 text-[var(--gm-gold)] text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--gm-gold)]/10 disabled:opacity-50"
          >
            <Power className="w-3.5 h-3.5" />
            Günü Aç
          </button>
        </div>
      </div>

      {/* Days grid */}
      <div className="space-y-3">
        {DAYS.map((day) => {
          const items = byDow.get(day.dow) || [];
          return (
            <div key={day.dow} className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-[var(--gm-gold)]/10 text-[var(--gm-gold)] flex items-center justify-center font-serif text-sm font-bold">
                    {day.short}
                  </span>
                  <span className="font-serif text-base text-[var(--gm-text)]">{day.label}</span>
                  {items.length === 0 && (
                    <span className="text-[10px] text-[var(--gm-muted)] italic">— kapalı —</span>
                  )}
                </div>
                <button
                  onClick={() => addRow(day.dow)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--gm-gold)]/40 text-[var(--gm-gold)] text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--gm-gold)]/10"
                >
                  <Plus className="w-3 h-3" />
                  Saat Ekle
                </button>
              </div>
              {items.length > 0 && (
                <div className="space-y-2">
                  {items.map(({ row, idx }) => (
                    <div key={idx} className="flex items-center gap-2 flex-wrap p-2 rounded-xl bg-[var(--gm-bg-deep)]/30">
                      <input
                        type="time"
                        value={row.start_time}
                        onChange={(e) => patchRow(idx, { start_time: e.target.value })}
                        className="h-9 bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-lg px-2 text-sm text-[var(--gm-text)]"
                      />
                      <span className="text-[var(--gm-muted)]">→</span>
                      <input
                        type="time"
                        value={row.end_time}
                        onChange={(e) => patchRow(idx, { end_time: e.target.value })}
                        className="h-9 bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-lg px-2 text-sm text-[var(--gm-text)]"
                      />
                      <span className="text-[10px] text-[var(--gm-muted)] uppercase tracking-widest ml-2">Slot:</span>
                      <select
                        value={row.slot_minutes}
                        onChange={(e) => patchRow(idx, { slot_minutes: Number(e.target.value) })}
                        className="h-9 bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-lg px-2 text-sm text-[var(--gm-text)]"
                      >
                        <option value={15}>15 dk</option>
                        <option value={30}>30 dk</option>
                        <option value={45}>45 dk</option>
                        <option value={60}>60 dk</option>
                        <option value={90}>90 dk</option>
                        <option value={120}>120 dk</option>
                      </select>
                      <label className="inline-flex items-center gap-1.5 text-[11px] text-[var(--gm-text)] ml-2">
                        <input
                          type="checkbox"
                          checked={row.is_active === 1}
                          onChange={(e) => patchRow(idx, { is_active: e.target.checked ? 1 : 0 })}
                          className="w-4 h-4 accent-[var(--gm-gold)]"
                        />
                        Aktif
                      </label>
                      <span className="text-[10px] text-[var(--gm-muted)] uppercase tracking-widest ml-2">Kapasite:</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={row.capacity}
                        onChange={(e) => patchRow(idx, { capacity: Math.max(1, Number(e.target.value) || 1) })}
                        className="h-9 w-20 bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-lg px-2 text-sm text-[var(--gm-text)]"
                      />
                      <button
                        onClick={() => removeRow(idx)}
                        className="ml-auto p-2 text-[var(--gm-error)] hover:bg-[var(--gm-error)]/10 rounded-lg"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {dirty && (
        <div className="sticky bottom-4 mx-auto max-w-[var(--gm-w-form)] p-4 rounded-2xl bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] shadow-2xl flex items-center justify-between gap-4">
          <span className="text-[11px] font-bold">Kaydedilmemiş değişiklikler var.</span>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--gm-bg-deep)] text-[var(--gm-gold)] text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Kaydet
          </button>
        </div>
      )}
    </div>
  );
}
