/** FAZ 28 — Okuma sonrası danışman funnel (web funnel.config ile uyumlu) */

export type FunnelFeature =
  | 'tarot'
  | 'kahve'
  | 'ruya'
  | 'sinastri'
  | 'yildizname'
  | 'numeroloji'
  | 'birth-chart'
  | 'daily';

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

/** connect sekmesi `filter` chip id */
export const FUNNEL_TOPIC_TO_CONNECT_FILTER: Record<FunnelFeature, string> = {
  tarot: 'tarot',
  kahve: 'tarot',
  ruya: 'mood',
  sinastri: 'relationship',
  yildizname: 'astrology',
  numeroloji: 'numerology',
  'birth-chart': 'astrology',
  daily: 'astrology',
};

export function getFunnelConfig(feature: FunnelFeature) {
  return FUNNEL_CONFIG[feature];
}

export function normalizeFunnelTopic(raw: string | string[] | undefined): FunnelFeature | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (!s || !(s in FUNNEL_CONFIG)) return null;
  return s as FunnelFeature;
}
