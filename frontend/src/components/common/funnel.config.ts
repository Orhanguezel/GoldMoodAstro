// FAZ 28 / T28-3 - Funnel feature -> consultant topic mapping
// frontend/src/components/common/funnel.config.ts

export type FunnelFeature =
  | 'tarot'
  | 'kahve'
  | 'ruya'
  | 'sinastri'
  | 'yildizname'
  | 'numeroloji'
  | 'birth-chart'
  | 'daily';

/**
 * topic = /consultants?topic= URL parameter (FE filter)
 * expertise = backend `?expertise=` parameter, searched in consultants.expertise JSON
 */
export const FUNNEL_CONFIG: Record<
  FunnelFeature,
  { topic: string; expertise: string; headlineTr: string; headlineEn: string }
> = {
  tarot: {
    topic: 'tarot',
    expertise: 'tarot',
    headlineTr: 'Tarot Experts',
    headlineEn: 'Tarot Experts',
  },
  kahve: {
    topic: 'kahve',
    expertise: 'tarot',
    headlineTr: 'Divination Experts',
    headlineEn: 'Divination Experts',
  },
  ruya: {
    topic: 'ruya',
    expertise: 'mood',
    headlineTr: 'Dream & Symbol Experts',
    headlineEn: 'Dream & Symbol Experts',
  },
  sinastri: {
    topic: 'sinastri',
    expertise: 'relationship',
    headlineTr: 'Relationship Astrology Experts',
    headlineEn: 'Relationship Astrology Experts',
  },
  yildizname: {
    topic: 'yildizname',
    expertise: 'astrology',
    headlineTr: 'Yildizname & Classical Astrology Experts',
    headlineEn: 'Yildizname & Classical Astrology Experts',
  },
  numeroloji: {
    topic: 'numeroloji',
    expertise: 'astrology',
    headlineTr: 'Numerology Experts',
    headlineEn: 'Numerology Experts',
  },
  'birth-chart': {
    topic: 'birth-chart',
    expertise: 'birth_chart',
    headlineTr: 'Birth Chart Experts',
    headlineEn: 'Birth Chart Experts',
  },
  daily: {
    topic: 'daily',
    expertise: 'astrology',
    headlineTr: 'Astrology Experts',
    headlineEn: 'Astrology Experts',
  },
};

export function getFunnelConfig(feature: FunnelFeature) {
  return FUNNEL_CONFIG[feature];
}
