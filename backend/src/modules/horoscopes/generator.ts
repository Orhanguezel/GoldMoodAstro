import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { dailyHoroscopes } from './schema';

const SIGNS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
] as const;

export async function generateDailyHoroscopes(dateStr?: string) {
  const date = dateStr || new Date().toISOString().split('T')[0];

  const values = SIGNS.map((sign, index) => ({
    id: randomUUID(),
    date: date as never,
    sign,
    contentTr: `${sign.toUpperCase()} için bugünkü gökyüzü enerjisi dengeli. Önceliğinizi netleştirip küçük ama kararlı bir adım atın.`,
    contentEn: `Today's sky is balanced for ${sign}. Clarify your priority and take one steady step forward.`,
    moodScore: 6 + (index % 4),
    luckyNumber: index + 7,
    luckyColor: 'Gold',
  }));

  await db.insert(dailyHoroscopes).values(values).onDuplicateKeyUpdate({
    set: { updatedAt: new Date() },
  });

  return values;
}
