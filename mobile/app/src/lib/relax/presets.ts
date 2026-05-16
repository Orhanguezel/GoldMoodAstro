import type { RelaxPresetsV1 } from './types';

/** FAZ 35 T35-2 — v1 preset (contract ile uyumlu; shared-config gelince taşınır) */
export const RELAX_PRESETS: RelaxPresetsV1 = {
  version: 1,
  stems: ['pad', 'rain', 'wind', 'water', 'chimes', 'forest', 'binaural', 'crackle'],
  defaults: { master_gain: 0.7, fade_ms: 1200 },
  elements: {
    fire: { pad: 0.55, crackle: 0.45, wind: 0.15 },
    earth: { pad: 0.5, forest: 0.45, water: 0.2 },
    air: { pad: 0.45, wind: 0.45, chimes: 0.3 },
    water: { pad: 0.4, water: 0.5, rain: 0.3, binaural: 0.15 },
  },
  modality: {
    cardinal: { chimes: '+0.10' },
    fixed: { pad: '+0.10' },
    mutable: { wind: '+0.10', water: '+0.05' },
  },
  signs: {
    aries: { element: 'fire', modality: 'cardinal' },
    taurus: { element: 'earth', modality: 'fixed' },
    gemini: { element: 'air', modality: 'mutable' },
    cancer: { element: 'water', modality: 'cardinal' },
    leo: { element: 'fire', modality: 'fixed' },
    virgo: { element: 'earth', modality: 'mutable' },
    libra: { element: 'air', modality: 'cardinal' },
    scorpio: { element: 'water', modality: 'fixed' },
    sagittarius: { element: 'fire', modality: 'mutable' },
    capricorn: { element: 'earth', modality: 'cardinal' },
    aquarius: { element: 'air', modality: 'fixed' },
    pisces: { element: 'water', modality: 'mutable' },
  },
};
