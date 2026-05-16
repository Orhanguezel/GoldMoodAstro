import type { StemId } from './types';

export const RELAX_STEM_ASSETS: Partial<Record<StemId, number>> = {
  pad: require('../../../assets/sounds/relax/pad.m4a'),
  rain: require('../../../assets/sounds/relax/rain.m4a'),
  wind: require('../../../assets/sounds/relax/wind.m4a'),
  water: require('../../../assets/sounds/relax/water.m4a'),
  chimes: require('../../../assets/sounds/relax/chimes.m4a'),
  forest: require('../../../assets/sounds/relax/forest.m4a'),
  binaural: require('../../../assets/sounds/relax/binaural.m4a'),
  crackle: require('../../../assets/sounds/relax/crackle.m4a'),
};

export function hasRelaxStemAssets(): boolean {
  return Object.keys(RELAX_STEM_ASSETS).length > 0;
}

export function getStemAsset(stem: StemId): number | undefined {
  return RELAX_STEM_ASSETS[stem];
}
