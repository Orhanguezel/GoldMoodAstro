// packages/shared-backend/modules/numerology/fallbackInterpretation.ts
//
// LLM yorumu alınamadığında (sağlayıcı kredisi/anahtarı bitti, zaman aşımı)
// hesaplanan sayılardan kısa, deterministik bir yorum üretir. Hesaplama zaten
// logic.ts'te doğru yapılıyor; LLM yalnız üslup katıyordu — LLM düşünce aracın
// 500 dönmesi gerekmiyor (2026-10-03: üç sağlayıcı da düşüktü, araç tamamen
// çalışmıyordu). Dil: farkındalık ve eğilim; kesin hüküm/vaat yok.

type Lang = 'tr' | 'en' | 'de';
type Calc = { lifePath: number; destiny: number; soulUrge: number; personality: number };

const THEMES: Record<Lang, Record<number, string>> = {
  tr: {
    1: 'başlatma, bağımsızlık ve kendi yolunu çizme',
    2: 'iş birliği, denge ve ilişkilerde incelik',
    3: 'yaratıcı ifade, iletişim ve neşe',
    4: 'düzen, emek ve sağlam temeller kurma',
    5: 'değişim, merak ve özgürlük arayışı',
    6: 'sorumluluk, şefkat ve aidiyet',
    7: 'iç gözlem, araştırma ve anlam arayışı',
    8: 'hedef, yönetim becerisi ve somut sonuçlar',
    9: 'tamamlama, cömertlik ve geniş bakış açısı',
    11: 'sezgi, ilham ve başkalarına yol gösterme',
    22: 'büyük ölçekli planları hayata geçirme',
    33: 'şefkatli rehberlik ve hizmet',
  },
  en: {
    1: 'initiative, independence and forging your own path',
    2: 'cooperation, balance and sensitivity in relationships',
    3: 'creative expression, communication and joy',
    4: 'order, effort and building solid foundations',
    5: 'change, curiosity and the search for freedom',
    6: 'responsibility, care and belonging',
    7: 'reflection, research and the search for meaning',
    8: 'ambition, management and tangible results',
    9: 'completion, generosity and a wide perspective',
    11: 'intuition, inspiration and guiding others',
    22: 'turning large-scale plans into reality',
    33: 'compassionate guidance and service',
  },
  de: {
    1: 'Initiative, Unabhängigkeit und der eigene Weg',
    2: 'Zusammenarbeit, Ausgleich und Feingefühl in Beziehungen',
    3: 'kreativer Ausdruck, Kommunikation und Lebensfreude',
    4: 'Ordnung, Fleiß und ein stabiles Fundament',
    5: 'Wandel, Neugier und der Wunsch nach Freiheit',
    6: 'Verantwortung, Fürsorge und Zugehörigkeit',
    7: 'Innenschau, Forschung und Sinnsuche',
    8: 'Zielstrebigkeit, Organisation und greifbare Ergebnisse',
    9: 'Abschluss, Großzügigkeit und ein weiter Blick',
    11: 'Intuition, Inspiration und andere begleiten',
    22: 'große Pläne in die Realität umsetzen',
    33: 'mitfühlende Begleitung und Dienst',
  },
};

const LABELS: Record<Lang, { lifePath: string; destiny: string; soulUrge: string; personality: string; intro: string; outro: string }> = {
  tr: {
    intro: 'Sayılarınız isim ve doğum tarihinizdeki örüntüleri sembolik olarak özetler:',
    lifePath: 'Hayat yolu sayınız',
    destiny: 'Kader sayınız',
    soulUrge: 'Ruh arzusu sayınız',
    personality: 'Kişilik sayınız',
    outro: 'Bu temaları kesin hükümler olarak değil, kendinizi gözlemlemek için bir başlangıç noktası olarak düşünün.',
  },
  en: {
    intro: 'Your numbers symbolically summarise patterns in your name and birth date:',
    lifePath: 'Your life path number',
    destiny: 'Your destiny number',
    soulUrge: 'Your soul urge number',
    personality: 'Your personality number',
    outro: 'Treat these themes as a starting point for self-reflection rather than fixed verdicts.',
  },
  de: {
    intro: 'Ihre Zahlen fassen Muster in Ihrem Namen und Geburtsdatum symbolisch zusammen:',
    lifePath: 'Ihre Lebenszahl',
    destiny: 'Ihre Schicksalszahl',
    soulUrge: 'Ihre Seelenzahl',
    personality: 'Ihre Persönlichkeitszahl',
    outro: 'Verstehen Sie diese Themen als Ausgangspunkt zur Selbstreflexion, nicht als feste Urteile.',
  },
};

export function buildFallbackInterpretation(calc: Calc, locale: string): string {
  const lang: Lang = locale === 'en' || locale === 'de' ? locale : 'tr';
  const t = LABELS[lang];
  const theme = (n: number) => THEMES[lang][n] ?? '';
  // Teması olmayan değer (ör. harfsiz isimde 0) satır üretmez.
  const line = (label: string, n: number) => (theme(n) ? `${label} ${n}: ${theme(n)}.` : '');
  return [
    t.intro,
    line(t.lifePath, calc.lifePath),
    line(t.destiny, calc.destiny),
    line(t.soulUrge, calc.soulUrge),
    line(t.personality, calc.personality),
    t.outro,
  ].filter(Boolean).join('\n');
}
