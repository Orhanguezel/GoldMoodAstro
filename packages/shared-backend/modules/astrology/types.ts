export type ZodiacSign =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

export type PlanetKey =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto';

export type AspectType = 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';

export type PlanetPlacement = {
  key: PlanetKey;
  name: string;
  symbol: string;
  longitude: number;
  latitude: number;
  distance: number;
  speed: number;
  sign: ZodiacSign;
  sign_label: string;
  degree_in_sign: number;
  house: number;
  retrograde: boolean;
};

export type HouseCusp = {
  house: number;
  longitude: number;
  sign: ZodiacSign;
  sign_label: string;
  degree_in_sign: number;
};

export type ChartAspect = {
  type: AspectType;
  planet_a: PlanetKey;
  planet_b: PlanetKey;
  orb: number;
  exact_angle: number;
};

export type BirthChartInput = {
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  timezoneOffsetMinutes: number;
  houseSystem?: 'equal';
};

export type NatalChart = {
  engine: 'swisseph-wasm';
  version: string;
  input: BirthChartInput;
  julian_day_ut: number;
  planets: Record<PlanetKey, PlanetPlacement>;
  houses: HouseCusp[];
  ascendant: HouseCusp;
  midheaven: HouseCusp;
  aspects: ChartAspect[];
};

export type TransitChart = {
  date: string;
  natal_chart: NatalChart;
  transits: Record<PlanetKey, PlanetPlacement>;
  aspects_to_natal: Array<ChartAspect & { natal_planet: PlanetKey; transit_planet: PlanetKey }>;
};

export type SynastryResult = {
  chart_a: NatalChart;
  chart_b: NatalChart;
  aspects: Array<ChartAspect & { chart_a_planet: PlanetKey; chart_b_planet: PlanetKey }>;
  score: number;
};
