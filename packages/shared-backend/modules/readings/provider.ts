import type { NatalChart, TransitChart } from '../astrology';
import type { DailyReadingRow } from './types';
import { safeFallbackReading } from './safety';

function compactRecent(readings: DailyReadingRow[]) {
  return readings.map((r) => ({
    date: String(r.reading_date),
    content: r.content.slice(0, 700),
  }));
}

export async function generateReadingText(args: {
  chart: NatalChart;
  transit: TransitChart;
  recentReadings: DailyReadingRow[];
  attempt: number;
}): Promise<{ content: string; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const sun = args.chart.planets.sun;

  if (!apiKey) {
    return {
      content: safeFallbackReading(sun.sign_label),
      model: 'deterministic-local',
    };
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.8,
      messages: [
        {
          role: 'system',
          content:
            'Türkçe, umut veren, bilgilendirici ve kesin yargılardan kaçınan günlük astroloji yorumu yaz. Ölüm, ağır hastalık, kesin ayrılık, ihanet kesinliği gibi zarar verici ifadeler kullanma.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            natal_sun: sun,
            natal_moon: args.chart.planets.moon,
            transit_aspects: args.transit.aspects_to_natal.slice(0, 10),
            recent_readings: compactRecent(args.recentReadings),
            attempt: args.attempt,
            instruction: '180-260 kelime, önce kısa tema sonra ilişki/iş/özbakım önerisi. Son 30 gün cümlelerini tekrar etme.',
          }),
        },
      ],
    }),
  });

  if (!res.ok) {
    return { content: safeFallbackReading(sun.sign_label), model: 'deterministic-local' };
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content?.trim();
  return {
    content: content || safeFallbackReading(sun.sign_label),
    model,
  };
}
