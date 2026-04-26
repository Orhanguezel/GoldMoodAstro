import { computeNatalChart, findAspectBetween } from './compute';
import type { BirthChartInput, NatalChart, PlanetKey, TransitChart } from './types';

export async function computeTransitChart(
  natalChart: NatalChart,
  date = new Date(),
): Promise<TransitChart> {
  const isoDate = date.toISOString().slice(0, 10);
  const transitInput: BirthChartInput = {
    ...natalChart.input,
    date: isoDate,
    time: date.toISOString().slice(11, 19),
    timezoneOffsetMinutes: 0,
  };
  const transit = await computeNatalChart(transitInput);
  const aspects: TransitChart['aspects_to_natal'] = [];

  for (const [transitKey, transitPlanet] of Object.entries(transit.planets) as Array<
    [PlanetKey, (typeof transit.planets)[PlanetKey]]
  >) {
    for (const [natalKey, natalPlanet] of Object.entries(natalChart.planets) as Array<
      [PlanetKey, (typeof natalChart.planets)[PlanetKey]]
    >) {
      const aspect = findAspectBetween(transitPlanet.longitude, natalPlanet.longitude);
      if (!aspect) continue;
      aspects.push({
        ...aspect,
        planet_a: transitKey,
        planet_b: natalKey,
        transit_planet: transitKey,
        natal_planet: natalKey,
      });
    }
  }

  return {
    date: isoDate,
    natal_chart: natalChart,
    transits: transit.planets,
    aspects_to_natal: aspects.sort((a, b) => a.orb - b.orb),
  };
}
