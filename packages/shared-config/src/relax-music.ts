import relaxPresets from '../relax-music/presets.json';

export type RelaxStem = 'pad' | 'rain' | 'wind' | 'water' | 'chimes' | 'forest' | 'binaural' | 'crackle';
export type RelaxElement = 'fire' | 'earth' | 'air' | 'water';
export type RelaxModality = 'cardinal' | 'fixed' | 'mutable';

export interface RelaxPresets {
  version: number;
  stems: RelaxStem[];
  defaults: {
    master_gain: number;
    fade_ms: number;
  };
  elements: Record<RelaxElement, Partial<Record<RelaxStem, number>>>;
  modality: Record<RelaxModality, Partial<Record<RelaxStem, number | string>>>;
  signs: Record<string, { element: RelaxElement; modality: RelaxModality }>;
}

export const RELAX_PRESETS = relaxPresets as RelaxPresets;

/**
 * Resolves the initial (seed) mix for a given zodiac sign.
 * Calculation: Base Element Mix + Modality Adjustments
 */
export function resolveRelaxSeedMix(sign: string): Record<RelaxStem, number> {
  const signConfig = RELAX_PRESETS.signs[sign];
  if (!signConfig) {
    // Fallback to a neutral mix if sign not found
    return RELAX_PRESETS.stems.reduce((acc, stem) => ({ ...acc, [stem]: 0 }), {} as Record<RelaxStem, number>);
  }

  const { element, modality } = signConfig;
  const baseMix = { ...RELAX_PRESETS.elements[element] };
  const modalityAdjust = RELAX_PRESETS.modality[modality];

  const finalMix = {} as Record<RelaxStem, number>;

  for (const stem of RELAX_PRESETS.stems) {
    let val = baseMix[stem] || 0;
    const adjust = modalityAdjust[stem];

    if (typeof adjust === 'string' && adjust.startsWith('+')) {
      val += parseFloat(adjust.substring(1));
    } else if (typeof adjust === 'number') {
      val = adjust;
    }

    finalMix[stem] = Math.min(Math.max(val, 0), 1);
  }

  return finalMix;
}
