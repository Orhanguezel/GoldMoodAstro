import SwissEph from 'swisseph-wasm';
import { DateTime } from 'luxon';
import type {
  AspectType,
  BirthChartInput,
  ChartAspect,
  HouseCusp,
  NatalChart,
  PlanetKey,
  PlanetPlacement,
  ZodiacSign,
} from './types';

const SIGNS: Array<{ key: ZodiacSign; label: string }> = [
  { key: 'aries', label: 'Aries' },
  { key: 'taurus', label: 'Taurus' },
  { key: 'gemini', label: 'Gemini' },
  { key: 'cancer', label: 'Cancer' },
  { key: 'leo', label: 'Leo' },
  { key: 'virgo', label: 'Virgo' },
  { key: 'libra', label: 'Libra' },
  { key: 'scorpio', label: 'Scorpio' },
  { key: 'sagittarius', label: 'Sagittarius' },
  { key: 'capricorn', label: 'Capricorn' },
  { key: 'aquarius', label: 'Aquarius' },
  { key: 'pisces', label: 'Pisces' },
];

const PLANETS: Array<{ key: PlanetKey; name: string; symbol: string; swe: keyof SwissEph }> = [
  { key: 'sun', name: 'Sun', symbol: '☉', swe: 'SE_SUN' },
  { key: 'moon', name: 'Moon', symbol: '☽', swe: 'SE_MOON' },
  { key: 'mercury', name: 'Mercury', symbol: '☿', swe: 'SE_MERCURY' },
  { key: 'venus', name: 'Venus', symbol: '♀', swe: 'SE_VENUS' },
  { key: 'mars', name: 'Mars', symbol: '♂', swe: 'SE_MARS' },
  { key: 'jupiter', name: 'Jupiter', symbol: '♃', swe: 'SE_JUPITER' },
  { key: 'saturn', name: 'Saturn', symbol: '♄', swe: 'SE_SATURN' },
  { key: 'uranus', name: 'Uranus', symbol: '♅', swe: 'SE_URANUS' },
  { key: 'neptune', name: 'Neptune', symbol: '♆', swe: 'SE_NEPTUNE' },
  { key: 'pluto', name: 'Pluto', symbol: '♇', swe: 'SE_PLUTO' },
];

const ASPECTS: Array<{ type: AspectType; angle: number; orb: number }> = [
  { type: 'conjunction', angle: 0, orb: 8 },
  { type: 'sextile', angle: 60, orb: 5 },
  { type: 'square', angle: 90, orb: 6 },
  { type: 'trine', angle: 120, orb: 6 },
  { type: 'opposition', angle: 180, orb: 8 },
];

let instancePromise: Promise<SwissEph> | null = null;

async function getSwissEph() {
  if (!instancePromise) {
    instancePromise = (async () => {
      const swe = new SwissEph();
      await swe.initSwissEph();
      return swe;
    })();
  }
  return instancePromise;
}

function norm(degrees: number) {
  return ((degrees % 360) + 360) % 360;
}

function angularDistance(a: number, b: number) {
  const diff = Math.abs(norm(a) - norm(b));
  return diff > 180 ? 360 - diff : diff;
}

function signFor(longitude: number) {
  const normalized = norm(longitude);
  const index = Math.floor(normalized / 30);
  const sign = SIGNS[index] ?? SIGNS[0];
  return {
    sign: sign.key,
    sign_label: sign.label,
    degree_in_sign: Number((normalized % 30).toFixed(4)),
  };
}

/**
 * Doğum tarihi/saati + zaman dilimi → UTC Julian Day için (year, month, day, hour decimal).
 * Öncelik:
 *   1. tzIana (IANA string, DST-safe) — luxon DateTime.fromObject
 *   2. timezoneOffsetMinutes (legacy, sabit offset)
 *   3. UTC (offset 0)
 *
 * Saat bilinmiyorsa (tobKnown === false) → 12:00 (yerel öğle) kullanılır.
 * chart_data tarafında bu durum için `tob_unknown` flag çağıran fonksiyonda set edilir.
 */
function parseDateTime(input: BirthChartInput) {
  const [year, month, day] = input.date.split('-').map(Number);

  // tobKnown=false ise noon (12:00) fallback. tobKnown undefined ise time'a güven.
  const tobKnown = input.tobKnown !== false;
  const timeStr = tobKnown && input.time ? input.time : '12:00:00';
  const [hour = 0, minute = 0, second = 0] = timeStr.split(':').map(Number);

  // Timezone resolution
  const iana = input.tzIana?.trim();
  if (iana) {
    // luxon: yerel saatten UTC'ye DST-safe çevir
    const local = DateTime.fromObject(
      { year, month, day, hour, minute, second },
      { zone: iana },
    );
    if (!local.isValid) {
      throw new Error(`invalid_iana_timezone: ${iana} (${local.invalidReason})`);
    }
    const utc = local.toUTC();
    return {
      year: utc.year,
      month: utc.month,
      day: utc.day,
      hourDecimal: utc.hour + utc.minute / 60 + utc.second / 3600,
    };
  }

  // Legacy: offset minutes
  const offsetMin = input.timezoneOffsetMinutes ?? 0;
  const utcMinutes = hour * 60 + minute + second / 60 - offsetMin;
  // Güne taşma kontrolü (basit — UTC'de farklı bir gün olabilir)
  const totalDayMinutes = utcMinutes;
  if (totalDayMinutes < 0 || totalDayMinutes >= 24 * 60) {
    // Tarihi günlük sapma ile düzelt
    const adjustedDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    adjustedDate.setUTCMinutes(adjustedDate.getUTCMinutes() - offsetMin);
    return {
      year: adjustedDate.getUTCFullYear(),
      month: adjustedDate.getUTCMonth() + 1,
      day: adjustedDate.getUTCDate(),
      hourDecimal: adjustedDate.getUTCHours() + adjustedDate.getUTCMinutes() / 60 + adjustedDate.getUTCSeconds() / 3600,
    };
  }
  return { year, month, day, hourDecimal: utcMinutes / 60 };
}

function equalHouseCusps(ascendantLongitude: number): HouseCusp[] {
  return Array.from({ length: 12 }, (_, index) => {
    const longitude = norm(ascendantLongitude + index * 30);
    return {
      house: index + 1,
      longitude: Number(longitude.toFixed(4)),
      ...signFor(longitude),
    };
  });
}

function houseFor(longitude: number, ascendantLongitude: number) {
  return Math.floor(norm(longitude - ascendantLongitude) / 30) + 1;
}

function calculateAspects(planets: Record<PlanetKey, PlanetPlacement>): ChartAspect[] {
  const entries = Object.values(planets);
  const aspects: ChartAspect[] = [];

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];
      const distance = angularDistance(a.longitude, b.longitude);
      const match = ASPECTS.find((aspect) => Math.abs(distance - aspect.angle) <= aspect.orb);
      if (!match) continue;
      aspects.push({
        type: match.type,
        planet_a: a.key,
        planet_b: b.key,
        orb: Number(Math.abs(distance - match.angle).toFixed(4)),
        exact_angle: match.angle,
      });
    }
  }

  return aspects.sort((a, b) => a.orb - b.orb);
}

export function findAspectBetween(
  longitudeA: number,
  longitudeB: number,
): Pick<ChartAspect, 'type' | 'orb' | 'exact_angle'> | null {
  const distance = angularDistance(longitudeA, longitudeB);
  const match = ASPECTS.find((aspect) => Math.abs(distance - aspect.angle) <= aspect.orb);
  if (!match) return null;
  return {
    type: match.type,
    orb: Number(Math.abs(distance - match.angle).toFixed(4)),
    exact_angle: match.angle,
  };
}

export async function computeNatalChart(input: BirthChartInput): Promise<NatalChart> {
  const swe = await getSwissEph();
  const { year, month, day, hourDecimal } = parseDateTime(input);
  const julianDay = swe.julday(year, month, day, hourDecimal);
  const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SPEED;

  const sun = swe.calc_ut(julianDay, swe.SE_SUN, flags);
  const ascendantLongitude = norm(Number(sun[0]) + 90 + input.longitude / 2);
  const houses = equalHouseCusps(ascendantLongitude);

  const planets = {} as Record<PlanetKey, PlanetPlacement>;
  for (const planet of PLANETS) {
    const sweId = swe[planet.swe] as number;
    const pos = swe.calc_ut(julianDay, sweId, flags);
    const longitude = norm(Number(pos[0]));
    planets[planet.key] = {
      key: planet.key,
      name: planet.name,
      symbol: planet.symbol,
      longitude: Number(longitude.toFixed(6)),
      latitude: Number(Number(pos[1] ?? 0).toFixed(6)),
      distance: Number(Number(pos[2] ?? 0).toFixed(6)),
      speed: Number(Number(pos[3] ?? 0).toFixed(6)),
      ...signFor(longitude),
      house: houseFor(longitude, ascendantLongitude),
      retrograde: Number(pos[3] ?? 0) < 0,
    };
  }

  const midheavenLongitude = norm(ascendantLongitude + 270);
  return {
    engine: 'swisseph-wasm',
    version: swe.version(),
    input: { ...input, houseSystem: 'equal' },
    julian_day_ut: Number(julianDay.toFixed(6)),
    planets,
    houses,
    ascendant: houses[0],
    midheaven: {
      house: 10,
      longitude: Number(midheavenLongitude.toFixed(4)),
      ...signFor(midheavenLongitude),
    },
    aspects: calculateAspects(planets),
  };
}

export { calculateAspects, signFor };
