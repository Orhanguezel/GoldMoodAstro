/**
 * Günün gökyüzü — içerik üretiminin OLGU katmanı.
 *
 * Neden var: sosyal içerik metinleri elle yazılıyordu ("Koç, Aslan ve Yay yükselenler
 * görünürlük alanında..."). Bu element gruplamasıydı, hesap değil — okuyucunun
 * izleyebileceği bir mantığı yoktu. Burası aynı Swiss Ephemeris motorundan
 * (computeNatalChart) ölçülebilir olguları çıkarır; metin bu olgulardan türetilir.
 *
 * Buradaki hiçbir fonksiyon yorum üretmez, yalnızca OLGU döner. Yorum katmanı
 * (hangi kelimeyle anlatılacağı) çağıran tarafın işi.
 */
import { computeNatalChart } from './compute';
import type { PlanetKey, ZodiacSign } from './types';

/** Konum, gökyüzü olgusu için önemsiz (gezegen boylamları yere göre değişmez);
 *  ev hesabı için değil, yalnız determinizm için sabit bir referans kullanıyoruz. */
const REFERENCE_PLACE = { latitude: 41.0082, longitude: 28.9784, tzIana: 'Europe/Istanbul' };

export const SIGN_ORDER: ZodiacSign[] = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

export const SIGN_TR: Record<ZodiacSign, string> = {
  aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
  leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
  sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık',
};

export const PLANET_TR: Record<PlanetKey, string> = {
  sun: 'Güneş', moon: 'Ay', mercury: 'Merkür', venus: 'Venüs', mars: 'Mars',
  jupiter: 'Jüpiter', saturn: 'Satürn', uranus: 'Uranüs', neptune: 'Neptün', pluto: 'Plüton',
};

/** Whole-sign ev sistemi: yükselen burcu 1. ev kabul edilir.
 *  Sosyal içerikte doğum SAATİ bilinmiyor; whole-sign saat gerektirmez,
 *  bu yüzden "yükselenine göre" anlatım için doğru araç budur. */
export const HOUSE_AREA_TR: Record<number, string> = {
  1: 'kimlik ve görünürlük',
  2: 'para ve öz değer',
  3: 'iletişim ve yakın çevre',
  4: 'ev, aile ve kökler',
  5: 'yaratıcılık, aşk ve keyif',
  6: 'iş düzeni ve sağlık',
  7: 'ilişkiler ve ortaklıklar',
  8: 'derinleşme ve ortak kaynaklar',
  9: 'ufuk, öğrenme ve yolculuk',
  10: 'kariyer ve toplumsal rol',
  11: 'arkadaşlık ve hedefler',
  12: 'içe dönüş ve dinlenme',
};

export type MoonPhase = 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous'
  | 'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';

export const MOON_PHASE_TR: Record<MoonPhase, string> = {
  new: 'Yeniay',
  waxing_crescent: 'Büyüyen hilal',
  first_quarter: 'İlk dördün',
  waxing_gibbous: 'Büyüyen ay',
  full: 'Dolunay',
  waning_gibbous: 'Küçülen ay',
  last_quarter: 'Son dördün',
  waning_crescent: 'Küçülen hilal',
};

export type DaySky = {
  date: string;
  /** Güneş-Ay açısı (0-360). 0 yeniay, 180 dolunay. */
  moonPhaseAngle: number;
  moonPhase: MoonPhase;
  /** Faz "tam" mı (yeniay/dolunay/dördün noktasına <= 6° yakın)? */
  moonPhaseExact: boolean;
  sun: { sign: ZodiacSign; degree: number; longitude: number };
  moon: { sign: ZodiacSign; degree: number; longitude: number };
  /** Retro gezegenler (Ay ve Güneş retro olmaz). */
  retrogrades: PlanetKey[];
  /** Günün en sıkı 3 açısı (orb'a göre). */
  tightAspects: Array<{ a: PlanetKey; b: PlanetKey; type: string; orb: number }>;
};

function normalize360(value: number): number {
  return ((value % 360) + 360) % 360;
}

function classifyPhase(angle: number): { phase: MoonPhase; exact: boolean } {
  const a = normalize360(angle);
  const near = (target: number) => Math.min(Math.abs(a - target), 360 - Math.abs(a - target));
  if (near(0) <= 6) return { phase: 'new', exact: true };
  if (near(180) <= 6) return { phase: 'full', exact: true };
  if (near(90) <= 6) return { phase: 'first_quarter', exact: true };
  if (near(270) <= 6) return { phase: 'last_quarter', exact: true };
  if (a < 90) return { phase: 'waxing_crescent', exact: false };
  if (a < 180) return { phase: 'waxing_gibbous', exact: false };
  if (a < 270) return { phase: 'waning_gibbous', exact: false };
  return { phase: 'waning_crescent', exact: false };
}

/** Verilen gün için (12:00 yerel) ölçülebilir gökyüzü olguları. */
export async function getDaySky(dateStr: string): Promise<DaySky> {
  const chart = await computeNatalChart({
    date: dateStr,
    time: '12:00:00',
    ...REFERENCE_PLACE,
  });

  const sun = chart.planets.sun;
  const moon = chart.planets.moon;
  const angle = normalize360(moon.longitude - sun.longitude);
  const { phase, exact } = classifyPhase(angle);

  return {
    date: dateStr,
    moonPhaseAngle: angle,
    moonPhase: phase,
    moonPhaseExact: exact,
    sun: { sign: sun.sign, degree: sun.degree_in_sign, longitude: sun.longitude },
    moon: { sign: moon.sign, degree: moon.degree_in_sign, longitude: moon.longitude },
    retrogrades: (Object.keys(chart.planets) as PlanetKey[]).filter((key) => chart.planets[key].retrograde),
    tightAspects: chart.aspects
      .slice()
      .sort((x, y) => x.orb - y.orb)
      .slice(0, 3)
      .map((aspect) => ({ a: aspect.planet_a, b: aspect.planet_b, type: aspect.type, orb: aspect.orb })),
  };
}

/**
 * Bir burçtaki olayın, her yükselen burcu için hangi eve düştüğü (whole-sign).
 * "Yeniay Aslan'da" → Koç yükselen için 5. ev, Oğlak yükselen için 8. ev...
 *
 * İçeriğin okunabilir mantığı buradan çıkıyor: okuyucu kendi yükselenini bulup
 * neden o alanın öne çıktığını takip edebiliyor.
 */
export function houseForRising(eventSign: ZodiacSign, risingSign: ZodiacSign): number {
  const eventIndex = SIGN_ORDER.indexOf(eventSign);
  const risingIndex = SIGN_ORDER.indexOf(risingSign);
  return ((eventIndex - risingIndex + 12) % 12) + 1;
}

/** Olayın 12 yükselen için ev dağılımı — ev numarasına göre gruplanmış. */
export function houseMapByRising(eventSign: ZodiacSign): Array<{
  house: number;
  area: string;
  risingSigns: ZodiacSign[];
}> {
  const byHouse = new Map<number, ZodiacSign[]>();
  for (const rising of SIGN_ORDER) {
    const house = houseForRising(eventSign, rising);
    byHouse.set(house, [...(byHouse.get(house) ?? []), rising]);
  }
  return [...byHouse.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([house, risingSigns]) => ({ house, area: HOUSE_AREA_TR[house]!, risingSigns }));
}

/** İnsan okunur tek satır: "Yeniay • Aslan 19° • Satürn, Neptün, Plüton retro" */
export function describeDaySky(sky: DaySky): string {
  const phase = MOON_PHASE_TR[sky.moonPhase];
  const lunation = sky.moonPhase === 'new' || sky.moonPhase === 'full'
    ? `${SIGN_TR[sky.moon.sign]} ${sky.moon.degree.toFixed(0)}°`
    : `Ay ${SIGN_TR[sky.moon.sign]}, Güneş ${SIGN_TR[sky.sun.sign]}`;
  const retro = sky.retrogrades.length
    ? ` • ${sky.retrogrades.map((key) => PLANET_TR[key]).join(', ')} retro`
    : '';
  return `${phase} • ${lunation}${retro}`;
}
