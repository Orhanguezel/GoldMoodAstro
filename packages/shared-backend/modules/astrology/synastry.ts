import { findAspectBetween } from './compute';
import type { NatalChart, PlanetKey, SynastryResult } from './types';

const SCORE_BY_ASPECT = {
  conjunction: 8,
  sextile: 6,
  square: -3,
  trine: 7,
  opposition: 1,
} as const;

export function computeSynastry(chartA: NatalChart, chartB: NatalChart): SynastryResult {
  const aspects: SynastryResult['aspects'] = [];

  for (const [keyA, planetA] of Object.entries(chartA.planets) as Array<
    [PlanetKey, (typeof chartA.planets)[PlanetKey]]
  >) {
    for (const [keyB, planetB] of Object.entries(chartB.planets) as Array<
      [PlanetKey, (typeof chartB.planets)[PlanetKey]]
    >) {
      const aspect = findAspectBetween(planetA.longitude, planetB.longitude);
      if (!aspect) continue;
      aspects.push({
        ...aspect,
        planet_a: keyA,
        planet_b: keyB,
        chart_a_planet: keyA,
        chart_b_planet: keyB,
      });
    }
  }

  const rawScore = aspects.reduce((sum, aspect) => sum + SCORE_BY_ASPECT[aspect.type], 50);
  const score = Math.max(0, Math.min(100, rawScore));
  return {
    chart_a: chartA,
    chart_b: chartB,
    aspects: aspects.sort((a, b) => a.orb - b.orb),
    score,
  };
}
