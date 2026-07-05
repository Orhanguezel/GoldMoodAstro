import 'server-only';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8094/api').replace(/\/$/, '');

export const VALID_ZODIAC_SIGNS = new Set([
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
]);

export const zodiacLabels: Record<string, string> = {
  aries: 'Aries',
  taurus: 'Taurus',
  gemini: 'Gemini',
  cancer: 'Cancer',
  leo: 'Leo',
  virgo: 'Virgo',
  libra: 'Libra',
  scorpio: 'Scorpio',
  sagittarius: 'Sagittarius',
  capricorn: 'Capricorn',
  aquarius: 'Aquarius',
  pisces: 'Pisces',
};

export const zodiacLabelsTr: Record<string, string> = {
  aries: 'Koç',
  taurus: 'Boğa',
  gemini: 'İkizler',
  cancer: 'Yengeç',
  leo: 'Aslan',
  virgo: 'Başak',
  libra: 'Terazi',
  scorpio: 'Akrep',
  sagittarius: 'Yay',
  capricorn: 'Oğlak',
  aquarius: 'Kova',
  pisces: 'Balık',
};

export type ZodiacPageInfo = {
  title: string;
  short_summary: string;
  content: string;
  sections: Array<{
    id: string;
    key2: string;
    title: string;
    content: string;
  }>;
};

export function buildZodiacFallbackInfo(sign: string, label: string, locale = 'en'): ZodiacPageInfo {
  const isTr = locale === 'tr';
  return {
    title: isTr ? `${label} Burcu Rehberi` : `${label} Zodiac Traits`,
    short_summary: isTr
      ? `${label} burcu karakter, ilişki, kariyer ve yaşam ritmi alanlarında kendine özgü güçlü yanlar ve gelişim alanları taşır.`
      : `${label} is a strong astrological archetype with its own motivations across character, relationships, career and spiritual care.`,
    content: isTr
      ? `${label} burcu temel motivasyonları, ilişki dilini, karar alma kalıplarını ve gündelik enerji ritmini anlamak için bir başlangıç sunar. Bu okuma sabit bir kişilik tanımı değildir; yükselen, Ay, Venüs, Mars ve ev yerleşimleriyle birlikte daha kişisel hale gelir.`
      : `${label} helps explain core life motivations, relationship style, decision patterns and daily energy rhythm through the Sun sign. This reading is not a fixed personality definition; it becomes deeper and more personal when read with the rising sign, Moon sign, Venus, Mars and house placements in the birth chart.`,
    sections: [
      {
        id: `${sign}-personality-fallback`,
        key2: 'personality',
        title: isTr ? `${label} Karakteri` : `${label} Personality`,
        content: isTr
          ? `${label} karakteri kişinin enerjisini nasıl kullandığını, hangi ihtiyaçların bağ kurma biçimini etkilediğini ve gölge tarafların hangi farkındalıkla yumuşayabileceğini anlatır.`
          : `${label} personality highlights how someone uses their energy and which needs shape their connections. When strengths are used consciously, they bring clarity, productivity and inner direction; shadow patterns can be explored with more awareness.`,
      },
      {
        id: `${sign}-love-fallback`,
        key2: 'love',
        title: isTr ? `${label} Aşk ve Uyum` : `${label} Love and Compatibility`,
        content: isTr
          ? `${label} ilişkilerde yalnızca Güneş burcuyla değerlendirilmez. Ay duygusal güveni, Venüs sevgi dilini, Mars arzu ve çatışma stilini, yükselen burç ise ilk teması gösterir. En sağlıklı ilişki okuması iki doğum haritasının birlikte incelenmesiyle yapılır.`
          : `${label} compatibility should not be judged by Sun sign alone. In relationships, the Moon shows emotional safety, Venus shows love language, Mars shows desire and conflict style, and the rising sign shows first contact. The healthiest reading compares both complete birth charts.`,
      },
      {
        id: `${sign}-career-fallback`,
        key2: 'career',
        title: isTr ? `${label} Kariyer ve Yön` : `${label} Career and Direction`,
        content: isTr
          ? `${label} kariyer okuması motivasyon, odak ve çalışma ritmini anlamak için kullanışlıdır. Doğru ortam bu burcun güçlü yanlarını görünür kılar; zorlayıcı dönemler plan, sınır ve tempo ayarı ihtiyacını gösterebilir.`
          : `${label} is a useful starting point for understanding motivation, focus and working style. The right environment makes this sign strengths visible, while challenging cycles can point to planning, boundaries and rhythm adjustments.`,
      },
      {
        id: `${sign}-health-fallback`,
        key2: 'health',
        title: isTr ? `${label} Sağlık ve Yaşam Ritmi` : `${label} Wellness and Life Rhythm`,
        content: isTr
          ? `${label} için sağlık ve yaşam ritmi yorumu tıbbi tavsiye yerine farkındalık sağlar. Dinlenme, stres yönetimi, beden sinyallerini dinleme ve günlük ritmi sadeleştirme bu bölümün ana odağıdır.`
          : `${label} wellness guidance is framed as self-awareness, not medical advice. Rest, stress regulation, listening to body signals and simplifying daily rhythm are the main focus of this section.`,
      },
    ],
  };
}

export async function fetchZodiacInfoServer(sign: string, locale: string) {
  try {
    const res = await fetch(`${API_BASE}/zodiac/${sign}?locale=${locale}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json ?? null;
  } catch {
    return null;
  }
}
