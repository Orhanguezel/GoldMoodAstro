export type RelatedTool = {
  logicalPath: string;
  labelKey: string;
  fallback: { tr: string; en: string; de: string };
};

const TOOLS = {
  compatibility: { logicalPath: '/burclar/uyum', labelKey: 'ui_blog_tool_compatibility', fallback: { tr: '78 Burç Uyumu Kombinasyonu', en: '78 Zodiac Compatibility Combinations', de: '78 Sternzeichen-Kombinationen' } },
  synastry: { logicalPath: '/sinastri', labelKey: 'ui_blog_tool_synastry', fallback: { tr: 'Sinastri Analizi', en: 'Synastry Analysis', de: 'Synastrie-Analyse' } },
  tarot: { logicalPath: '/tarot', labelKey: 'ui_blog_tool_tarot', fallback: { tr: 'Tarot Açılımı', en: 'Tarot Reading', de: 'Tarot-Legung' } },
  zodiac: { logicalPath: '/burclar', labelKey: 'ui_blog_tool_zodiac', fallback: { tr: '12 Burç Rehberi', en: '12 Zodiac Signs Guide', de: 'Leitfaden der 12 Sternzeichen' } },
  daily: { logicalPath: '/daily', labelKey: 'ui_blog_tool_daily', fallback: { tr: 'Günlük Burç Yorumları', en: 'Daily Horoscopes', de: 'Tageshoroskope' } },
  dream: { logicalPath: '/ruya-tabiri', labelKey: 'ui_blog_tool_dream', fallback: { tr: 'Rüya Tabiri', en: 'Dream Interpretation', de: 'Traumdeutung' } },
  numerology: { logicalPath: '/numeroloji', labelKey: 'ui_blog_tool_numerology', fallback: { tr: 'Numeroloji Hesaplama', en: 'Numerology Calculator', de: 'Numerologie-Rechner' } },
  birthChart: { logicalPath: '/birth-chart', labelKey: 'ui_blog_tool_birth_chart', fallback: { tr: 'Doğum Haritası', en: 'Birth Chart', de: 'Geburtshoroskop' } },
} satisfies Record<string, RelatedTool>;

const TOPIC_RULES: Array<{ pattern: RegExp; tools: RelatedTool[] }> = [
  { pattern: /sinastri|synastry|synastrie|burc[-_ ]?uyum|zodiac[-_ ]?compat|sternzeichen[-_ ]?kompat/i, tools: [TOOLS.compatibility, TOOLS.synastry] },
  { pattern: /tarot|arkana|arcana|kart[-_ ]?acilim|kartenlegung/i, tools: [TOOLS.tarot] },
  { pattern: /retro|gezegen|planet|merkur|merkür|venus|venüs|mars|jupiter|saturn/i, tools: [TOOLS.zodiac, TOOLS.daily] },
  { pattern: /ruya|rüya|dream|traum/i, tools: [TOOLS.dream] },
  { pattern: /numeroloji|numerology|numerologie|yasam[-_ ]?yolu|life[-_ ]?path/i, tools: [TOOLS.numerology] },
];

export function relatedToolsForBlog(searchableText: string): RelatedTool[] {
  const match = TOPIC_RULES.find((rule) => rule.pattern.test(searchableText));
  return match?.tools ?? [TOOLS.birthChart];
}
