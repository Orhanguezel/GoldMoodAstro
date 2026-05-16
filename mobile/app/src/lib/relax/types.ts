export type StemId =
  | 'pad'
  | 'rain'
  | 'wind'
  | 'water'
  | 'chimes'
  | 'forest'
  | 'binaural'
  | 'crackle';

export type ElementKey = 'fire' | 'earth' | 'air' | 'water';
export type ModalityKey = 'cardinal' | 'fixed' | 'mutable';

export type ZodiacSignKey =
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

export type MixGains = Partial<Record<StemId, number>>;

export interface RelaxPresetsV1 {
  version: 1;
  stems: StemId[];
  defaults: { master_gain: number; fade_ms: number };
  elements: Record<ElementKey, MixGains>;
  modality: Record<ModalityKey, Record<string, string | number>>;
  signs: Record<ZodiacSignKey, { element: ElementKey; modality: ModalityKey }>;
}
