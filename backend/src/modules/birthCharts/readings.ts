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

const SIGN_LABELS: Record<string, Record<string, string>> = {
  tr: {
    aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
    leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
    sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık',
  },
  en: {
    aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer',
    leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio',
    sagittarius: 'Sagittarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces',
  },
  de: {
    aries: 'Widder', taurus: 'Stier', gemini: 'Zwillinge', cancer: 'Krebs',
    leo: 'Löwe', virgo: 'Jungfrau', libra: 'Waage', scorpio: 'Skorpion',
    sagittarius: 'Schütze', capricorn: 'Steinbock', aquarius: 'Wassermann', pisces: 'Fische',
  },
};

function signLabel(sign: string | undefined, locale: string) {
  if (!sign) return '—';
  const normalized = locale.toLowerCase().split('-')[0];
  return SIGN_LABELS[normalized]?.[sign] ?? SIGN_LABELS.tr[sign] ?? sign;
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
      sun_sign: signLabel(sun?.sign, locale),
      sun_house: sun?.house ?? '—',
      moon_sign: signLabel(moon?.sign, locale),
      moon_house: moon?.house ?? '—',
      ascendant_sign: signLabel(asc?.sign, locale),
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
