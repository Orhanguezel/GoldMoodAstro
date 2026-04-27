// =============================================================
// Natal chart için hibrit yorum üretici.
// Kullanım:
//   POST /api/v1/birth-charts/:id/reading
//   → astrology_kb'den ilgili altın metinleri çeker
//   → llm_prompts'tan natal_overview template'ini yükler
//   → Anthropic/OpenAI ile yorum üretir
//   → safety + similarity kontrolü
// =============================================================
import { generate, fetchKbForChart, formatKbExcerpts } from '@goldmood/shared-backend/modules/llm';

const SIGN_LABELS_TR: Record<string, string> = {
  aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
  leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
  sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık',
};

function tr(sign?: string) {
  return (sign && SIGN_LABELS_TR[sign]) || sign || '—';
}

export async function generateNatalReading(args: {
  chart: any; // computeNatalChart çıktısı (chart_data)
  name: string;
  locale?: string;
}) {
  const { chart, name, locale = 'tr' } = args;

  const sun = chart?.planets?.sun;
  const moon = chart?.planets?.moon;
  const asc = chart?.ascendant;

  // İlgili altın metinleri çek
  const excerpts = await fetchKbForChart({ chart, locale });
  const kbExcerpts = formatKbExcerpts(excerpts);

  // Önemli açıları kısaca formatla
  const keyAspects = (chart?.aspects || [])
    .filter((a: any) => typeof a.orb === 'number' && a.orb < 5)
    .slice(0, 8)
    .map((a: any) => `- ${a.planet_a} ${a.type} ${a.planet_b} (orb ${Number(a.orb).toFixed(1)}°)`)
    .join('\n') || '(önemli açı yok)';

  // LLM'i çağır
  const result = await generate({
    promptKey: 'natal_overview',
    locale,
    vars: {
      name,
      sun_sign: tr(sun?.sign),
      sun_house: sun?.house ?? '—',
      moon_sign: tr(moon?.sign),
      moon_house: moon?.house ?? '—',
      ascendant_sign: tr(asc?.sign),
      kb_excerpts: kbExcerpts,
      key_aspects: keyAspects,
    },
  });

  return {
    content: result.content,
    model: result.model,
    provider: result.provider,
    promptKey: result.promptKey,
    attempts: result.attempts,
    kbCount: excerpts.length,
    safetyFlags: result.safetyFlags,
  };
}
