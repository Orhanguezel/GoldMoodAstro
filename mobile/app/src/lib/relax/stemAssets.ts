import type { StemId } from './types';

/**
 * T35-1 stem dosyaları eklendiğinde buraya require edilir:
 * pad: require('../../../assets/sounds/relax/pad.m4a'),
 */
export const RELAX_STEM_ASSETS: Partial<Record<StemId, number>> = {};

export function hasRelaxStemAssets(): boolean {
  return Object.keys(RELAX_STEM_ASSETS).length > 0;
}

export function getStemAsset(stem: StemId): number | undefined {
  return RELAX_STEM_ASSETS[stem];
}
