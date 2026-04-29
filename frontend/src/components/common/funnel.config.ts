// FAZ 28 / T28-3 — Funnel feature → consultant topic mapping
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
 * topic = /consultants?topic= URL parametresi (FE filter)
 * expertise = backend `?expertise=` parametresi (consultants.expertise JSON içinde aranır)
 */
export const FUNNEL_CONFIG: Record<
  FunnelFeature,
  { topic: string; expertise: string; headlineTr: string; headlineEn: string }
> = {
  tarot: {
    topic: 'tarot',
    expertise: 'tarot',
    headlineTr: 'Tarot Uzmanları',
    headlineEn: 'Tarot Experts',
  },
  kahve: {
    topic: 'kahve',
    expertise: 'tarot',
    headlineTr: 'Fal Uzmanları',
    headlineEn: 'Divination Experts',
  },
  ruya: {
    topic: 'ruya',
    expertise: 'mood',
    headlineTr: 'Rüya & Sembol Uzmanları',
    headlineEn: 'Dream & Symbol Experts',
  },
  sinastri: {
    topic: 'sinastri',
    expertise: 'relationship',
    headlineTr: 'İlişki Astrolojisi Uzmanları',
    headlineEn: 'Relationship Astrology Experts',
  },
  yildizname: {
    topic: 'yildizname',
    expertise: 'astrology',
    headlineTr: 'Yıldızname & Klasik Astroloji Uzmanları',
    headlineEn: 'Yildizname & Classical Astrology Experts',
  },
  numeroloji: {
    topic: 'numeroloji',
    expertise: 'astrology',
    headlineTr: 'Numeroloji Uzmanları',
    headlineEn: 'Numerology Experts',
  },
  'birth-chart': {
    topic: 'birth-chart',
    expertise: 'birth_chart',
    headlineTr: 'Doğum Haritası Uzmanları',
    headlineEn: 'Birth Chart Experts',
  },
  daily: {
    topic: 'daily',
    expertise: 'astrology',
    headlineTr: 'Astroloji Uzmanları',
    headlineEn: 'Astrology Experts',
  },
};

export function getFunnelConfig(feature: FunnelFeature) {
  return FUNNEL_CONFIG[feature];
}
