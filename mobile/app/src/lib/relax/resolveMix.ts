import { RELAX_PRESETS } from './presets';
import type { MixGains, StemId, ZodiacSignKey } from './types';

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function applyModality(base: MixGains, modalityKey: keyof typeof RELAX_PRESETS.modality): MixGains {
  const rules = RELAX_PRESETS.modality[modalityKey];
  const out: MixGains = { ...base };
  for (const [stem, delta] of Object.entries(rules)) {
    const id = stem as StemId;
    const current = out[id] ?? 0;
    if (typeof delta === 'string' && delta.startsWith('+')) {
      out[id] = clamp01(current + Number.parseFloat(delta.slice(1)));
    } else if (typeof delta === 'number') {
      out[id] = clamp01(delta);
    }
  }
  return out;
}

/** Burç → başlangıç stem gain haritası */
export function resolveSeedMix(sign: ZodiacSignKey): MixGains {
  const meta = RELAX_PRESETS.signs[sign];
  if (!meta) return {};
  const base = { ...RELAX_PRESETS.elements[meta.element] };
  return applyModality(base, meta.modality);
}

export function getMasterGain(): number {
  return RELAX_PRESETS.defaults.master_gain;
}

export const RELAX_STEM_IDS = RELAX_PRESETS.stems;
