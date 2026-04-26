// backend/src/modules/horoscopes/repository.ts

import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { dailyHoroscopes } from './schema';
import { eq, and } from 'drizzle-orm';

const SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
];

export async function getDailyHoroscope(sign: string, dateStr?: string) {
  const d = dateStr || new Date().toISOString().split('T')[0];
  
  const [row] = await db
    .select()
    .from(dailyHoroscopes)
    .where(and(eq(dailyHoroscopes.date, d as never), eq(dailyHoroscopes.sign, sign as any)));

  if (!row && !dateStr) {
    // If not found and it's for today, maybe we should seed or generate?
    // For now, let's just return a placeholder or seed dummy data for today
    await seedDummyHoroscopes(d);
    return getDailyHoroscope(sign, d);
  }

  return row;
}

async function seedDummyHoroscopes(date: string) {
  const values = SIGNS.map(sign => ({
    id: randomUUID(),
    date: date as never,
    sign: sign as any,
    contentTr: `${sign.toUpperCase()} için bugünkü gökyüzü enerjileri oldukça olumlu. Kendinize vakit ayırın.`,
    contentEn: `The celestial energies for ${sign} today are quite positive. Take some time for yourself.`,
    moodScore: 8,
    luckyNumber: Math.floor(Math.random() * 99) + 1,
    luckyColor: 'Gold',
  }));

  try {
    await db.insert(dailyHoroscopes).values(values).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
  } catch (e) {
    // Ignore duplicate errors
  }
}
