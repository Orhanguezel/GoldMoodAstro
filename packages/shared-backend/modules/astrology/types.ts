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
  date: string;                       // 'YYYY-MM-DD'
  time?: string;                      // 'HH:MM[:SS]' — opsiyonel; bilinmiyorsa null/undefined
  tobKnown?: boolean;                 // false → noon (12:00) fallback + chart_data.tob_unknown=true
  latitude: number;
  longitude: number;
  /** Tercih edilen: IANA timezone string (DST-safe). Örn: 'Europe/Istanbul' */
  tzIana?: string;
  /** Legacy fallback: sabit dakika offset (DST yok). tzIana varsa görmezden gelinir. */
  timezoneOffsetMinutes?: number;
  /** House system seçimi (FAZ 8.5'te placidus/koch eklenebilir). Default: equal */
  houseSystem?: 'equal' | 'placidus' | 'koch' | 'whole_sign' | 'campanus' | 'porphyry';
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
