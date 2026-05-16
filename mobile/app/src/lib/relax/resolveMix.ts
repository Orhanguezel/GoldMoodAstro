import { resolveRelaxSeedMix, RELAX_PRESETS } from '@goldmood/shared-config/relax-music';
import type { MixGains, ZodiacSignKey } from './types';

/** Burç → başlangıç stem gain haritası */
export function resolveSeedMix(sign: ZodiacSignKey): MixGains {
  return resolveRelaxSeedMix(sign) as MixGains;
}

export function getMasterGain(): number {
  return RELAX_PRESETS.defaults.master_gain;
}

export const RELAX_STEM_IDS = RELAX_PRESETS.stems;
