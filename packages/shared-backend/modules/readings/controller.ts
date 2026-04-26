import { computeTransitChart } from '../astrology';
import { createEmbedding, cosineSimilarity } from './embedding';
import { generateReadingText } from './provider';
import { getBirthChartForUser, getTodayReading, insertDailyReading, listRecentReadings } from './repository';
import { isUnsafeReading, safeFallbackReading } from './safety';
import type { GenerateDailyReadingResult } from './types';

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

export async function generateDailyReading(userId: string, chartId: string): Promise<GenerateDailyReadingResult> {
  const date = todayYmd();
  const existing = await getTodayReading(userId, date);
  if (existing) return { reading: existing, reused: true, similarity_max: 0 };

  const chart = await getBirthChartForUser(userId, chartId);
  if (!chart) {
    const error = new Error('birth_chart_not_found');
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  const transit = await computeTransitChart(chart.chart_data, new Date(`${date}T12:00:00.000Z`));
  const recent = await listRecentReadings(userId, 30);
  let selectedContent = '';
  let selectedEmbedding: number[] = [];
  let selectedModel = 'deterministic-local';
  let similarityMax = 1;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const generated = await generateReadingText({
      chart: chart.chart_data,
      transit,
      recentReadings: recent,
      attempt,
    });
    const guarded = isUnsafeReading(generated.content)
      ? safeFallbackReading(chart.chart_data.planets.sun.sign_label)
      : generated.content;
    const embedded = await createEmbedding(guarded);
    const max = recent.reduce((acc, r) => Math.max(acc, cosineSimilarity(embedded.embedding, r.embedding)), 0);

    selectedContent = guarded;
    selectedEmbedding = embedded.embedding;
    selectedModel = generated.model === 'deterministic-local' ? embedded.model : `${generated.model}+${embedded.model}`;
    similarityMax = max;
    if (max <= 0.85) break;
  }

  const reading = await insertDailyReading({
    user_id: userId,
    chart_id: chart.id,
    reading_date: date,
    content: selectedContent,
    embedding: selectedEmbedding,
    transits_snapshot: transit,
    model_used: selectedModel,
  });

  return { reading, reused: false, similarity_max: similarityMax };
}
