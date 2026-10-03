import type { ConsultantWorkingHour } from '@/types';

export function normalizeWorkingHours(incoming: ConsultantWorkingHour[]): ConsultantWorkingHour[] {
  return incoming.map((hour) => ({
    ...hour,
    dow: Number(hour.dow),
    start_time: String(hour.start_time).slice(0, 5),
    end_time: String(hour.end_time).slice(0, 5),
    slot_minutes: Number(hour.slot_minutes),
    capacity: 1,
    is_active: Number(hour.is_active),
  }));
}

function toMinutes(time: string): number | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

export function validateWorkingHours(hours: ConsultantWorkingHour[]): string | null {
  if (hours.length > 50) return 'tooMany';
  for (const hour of hours) {
    const start = toMinutes(hour.start_time);
    const end = toMinutes(hour.end_time);
    if (start === null || end === null || end <= start) return 'invalidTime';
    if (!Number.isInteger(hour.slot_minutes) || hour.slot_minutes < 1 || hour.slot_minutes > end - start || (end - start) % hour.slot_minutes !== 0) return 'invalidSlot';
  }
  for (const dow of [1, 2, 3, 4, 5, 6, 7]) {
    const active = hours.filter((hour) => hour.dow === dow && hour.is_active === 1);
    for (let i = 0; i < active.length; i += 1) {
      for (let j = i + 1; j < active.length; j += 1) {
        const startA = toMinutes(active[i].start_time)!;
        const endA = toMinutes(active[i].end_time)!;
        const startB = toMinutes(active[j].start_time)!;
        const endB = toMinutes(active[j].end_time)!;
        if (startA < endB && endA > startB) return 'overlap';
      }
    }
  }
  return null;
}
