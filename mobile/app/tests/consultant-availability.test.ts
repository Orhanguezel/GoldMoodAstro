import { describe, expect, test } from 'bun:test';
import { normalizeWorkingHours, validateWorkingHours } from '../src/lib/consultantAvailability';
import type { ConsultantWorkingHour } from '../src/types';

const row = (dow: number, start_time: string, end_time: string): ConsultantWorkingHour => ({
  dow, start_time, end_time, slot_minutes: 30, capacity: 1, is_active: 1,
});

describe('consultant availability bulk replace', () => {
  test('keeps multiple ranges for the same day when loading web data', () => {
    const hours = normalizeWorkingHours([row(1, '09:00:00', '12:00:00'), row(1, '13:00:00', '18:00:00')]);
    expect(hours).toHaveLength(2);
    expect(hours.map((hour) => hour.start_time)).toEqual(['09:00', '13:00']);
    expect(validateWorkingHours(hours)).toBeNull();
  });

  test('rejects overlapping ranges and invalid slot lengths before replace', () => {
    expect(validateWorkingHours([row(1, '09:00', '12:00'), row(1, '11:30', '17:30')])).toBe('overlap');
    expect(validateWorkingHours([{ ...row(2, '09:00', '10:00'), slot_minutes: 45 }])).toBe('invalidSlot');
  });
});
