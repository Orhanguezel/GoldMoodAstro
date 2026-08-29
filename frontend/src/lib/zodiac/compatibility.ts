// =============================================================
// FILE: src/lib/zodiac/compatibility.ts
//
// İkili burç uyumu sayfalarının SUNUCUDA üretilen içeriği.
//
// NEDEN VAR: /burclar/uyum/{pair} sayfalarının tamamı istemci bileşeniyle
// çiziliyordu; Google'a giden HTML'de içerik YOKTU ve 144 çiftin tamamı aynı
// başlığı taşıyordu ("İkili Burç Uyumu Analizi"). Sayfa tarayıcıda dolu,
// tarayıcı botunda boş görünüyordu — bu yüzden dizine girmediler.
//
// İÇERİK KURALI (CLAUDE.md): olgu motordan/veriden gelir, üslup editöryeldir.
// Burada olgu = burcun elementi, niteliği, kutbu ve iki burç arasındaki açı
// (zodyak sırasındaki uzaklıktan deterministik olarak hesaplanır). Hiçbir
// iddia elle uydurulmuyor; metin bu olguların üzerine kuruluyor.
// =============================================================
import { ZODIAC_META, ZODIAC_SIGNS } from './signs';
import type { ZodiacSign } from '@/types/common';
import { ZODIAC_SIGN_ORDER } from '@/i18n/localizedRoutes';

type Locale = 'tr' | 'en' | 'de';

const SIGN_ORDER = ZODIAC_SIGN_ORDER;

const SIGN_LABELS: Record<Locale, Record<string, string>> = {
  tr: Object.fromEntries(ZODIAC_SIGNS.map((s) => [s.key, s.label])),
  en: {
    aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer',
    leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio',
    sagittarius: 'Sagittarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces',
  },
  de: {
    aries: 'Widder', taurus: 'Stier', gemini: 'Zwillinge', cancer: 'Krebs',
    leo: 'Löwe', virgo: 'Jungfrau', libra: 'Waage', scorpio: 'Skorpion',
    sagittarius: 'Schütze', capricorn: 'Steinbock', aquarius: 'Wassermann', pisces: 'Fische',
  },
};

const ELEMENT_LABELS: Record<Locale, Record<string, string>> = {
  tr: { 'Ateş': 'Ateş', 'Toprak': 'Toprak', 'Hava': 'Hava', 'Su': 'Su' },
  en: { 'Ateş': 'Fire', 'Toprak': 'Earth', 'Hava': 'Air', 'Su': 'Water' },
  de: { 'Ateş': 'Feuer', 'Toprak': 'Erde', 'Hava': 'Luft', 'Su': 'Wasser' },
};

const MODALITY_LABELS: Record<Locale, Record<string, string>> = {
  tr: { 'Öncü': 'Öncü', 'Sabit': 'Sabit', 'Değişken': 'Değişken' },
  en: { 'Öncü': 'Cardinal', 'Sabit': 'Fixed', 'Değişken': 'Mutable' },
  de: { 'Öncü': 'Kardinal', 'Sabit': 'Fix', 'Değişken': 'Veränderlich' },
};

/** İki burç arasındaki açı — zodyak sırasındaki uzaklıktan hesaplanır. */
type AspectKey = 'conjunction' | 'semisextile' | 'sextile' | 'square' | 'trine' | 'quincunx' | 'opposition';

const ASPECT_BY_DISTANCE: AspectKey[] = [
  'conjunction', 'semisextile', 'sextile', 'square', 'trine', 'quincunx', 'opposition',
];

const ASPECT_LABELS: Record<Locale, Record<AspectKey, string>> = {
  tr: {
    conjunction: 'kavuşum (0°)', semisextile: 'yarım altmışlık (30°)', sextile: 'altmışlık (60°)',
    square: 'kare (90°)', trine: 'üçgen (120°)', quincunx: 'yüz elli (150°)', opposition: 'karşıt (180°)',
  },
  en: {
    conjunction: 'conjunction (0°)', semisextile: 'semi-sextile (30°)', sextile: 'sextile (60°)',
    square: 'square (90°)', trine: 'trine (120°)', quincunx: 'quincunx (150°)', opposition: 'opposition (180°)',
  },
  de: {
    conjunction: 'Konjunktion (0°)', semisextile: 'Halbsextil (30°)', sextile: 'Sextil (60°)',
    square: 'Quadrat (90°)', trine: 'Trigon (120°)', quincunx: 'Quincunx (150°)', opposition: 'Opposition (180°)',
  },
};

/** Açının ilişkiye kattığı dinamik — astrolojik karşılığı, kesin sonuç iddiası değil. */
const ASPECT_NOTES: Record<Locale, Record<AspectKey, string>> = {
  tr: {
    conjunction: 'Aynı burçta buluşan bu ikili birbirini kolay tanır; benzerlik yakınlık kurar ama körlük de yaratabilir.',
    semisextile: 'Komşu burçlar birbirini tam anlamaz; ilgi alanları farklıdır, uyum öğrenilerek kurulur.',
    sextile: 'Destekleyici bir açı: ortak dil kurmak kolaydır, ilişki karşılıklı teşvikle büyür.',
    square: 'Gerilim üreten bir açı: sürtünme çoktur ama tam bu yüzden ikisini de değiştirip geliştirir.',
    trine: 'En akıcı açı: aynı elementten geldikleri için birbirlerinin ritmini doğal olarak yakalarlar.',
    quincunx: 'Ayarlama isteyen bir açı: ortak nokta az, uyum ancak bilinçli çabayla kurulur.',
    opposition: 'Karşıt kutuplar: birbirini hem çeker hem zorlar; denge kurulduğunda tamamlayıcı olur.',
  },
  en: {
    conjunction: 'Sharing the same sign, these two recognise each other quickly; similarity builds closeness but can also create blind spots.',
    semisextile: 'Neighbouring signs rarely read each other instantly; interests differ, so harmony is learned rather than given.',
    sextile: 'A supportive angle: common ground comes easily and the relationship grows through mutual encouragement.',
    square: 'A tension-producing angle: friction is frequent, and precisely for that reason it pushes both to grow.',
    trine: 'The smoothest angle: sharing an element, they catch each other’s rhythm naturally.',
    quincunx: 'An angle that asks for adjustment: little overlap, so harmony has to be built consciously.',
    opposition: 'Opposite poles: they attract and challenge in equal measure, and complement each other once balance is found.',
  },
  de: {
    conjunction: 'Im selben Zeichen erkennen sich beide schnell; Ähnlichkeit schafft Nähe, kann aber blinde Flecken erzeugen.',
    semisextile: 'Benachbarte Zeichen verstehen einander selten sofort; die Interessen unterscheiden sich, Harmonie wird erlernt.',
    sextile: 'Ein unterstützender Aspekt: gemeinsame Sprache entsteht leicht, die Beziehung wächst durch gegenseitige Ermutigung.',
    square: 'Ein spannungsreicher Aspekt: Reibung ist häufig — und genau darum treibt er beide zur Entwicklung.',
    trine: 'Der flüssigste Aspekt: durch dasselbe Element treffen beide ganz natürlich denselben Rhythmus.',
    quincunx: 'Ein Aspekt, der Anpassung verlangt: wenig Überschneidung, Harmonie entsteht nur bewusst.',
    opposition: 'Gegenpole: sie ziehen sich an und fordern sich zugleich; im Gleichgewicht ergänzen sie einander.',
  },
};

const COPY: Record<Locale, {
  h1: (a: string, b: string) => string;
  title: (a: string, b: string) => string;
  description: (a: string, b: string, el: string) => string;
  elementLabel: string; modalityLabel: string; aspectLabel: string; rulerLabel: string;
  sameElement: (el: string) => string;
  intro: (a: string, b: string) => string;
  disclaimer: string;
}> = {
  tr: {
    h1: (a, b) => `${a} ve ${b} Burç Uyumu`,
    title: (a, b) => `${a} ve ${b} Burç Uyumu: Element, Nitelik ve Açı`,
    description: (a, b, el) =>
      `${a} ve ${b} arasındaki uyumu element, nitelik ve iki burç arasındaki açı üzerinden inceliyoruz. ${el} Aşk, arkadaşlık ve iş ilişkisinde neyin kolay, neyin çaba istediğini okuyun.`,
    elementLabel: 'Element', modalityLabel: 'Nitelik', aspectLabel: 'Aradaki açı', rulerLabel: 'Yönetici',
    sameElement: (el) => `İki burç da ${el} elementinden geliyor; temel yaklaşımları benzer.`,
    intro: (a, b) =>
      `${a} ile ${b} ilişkisinde neyin doğal aktığını, neyin emek istediğini iki burcun elementi, niteliği ve aralarındaki açı belirler. Aşağıdaki değerlendirme bu üç göstergeye dayanır.`,
    disclaimer:
      'Bu sayfa kişisel farkındalık ve değerlendirme amaçlıdır; kesin sonuç veya garanti içermez. Doğum haritanızın tamamı yalnız güneş burcundan çok daha fazlasını söyler.',
  },
  en: {
    h1: (a, b) => `${a} and ${b} Compatibility`,
    title: (a, b) => `${a} and ${b} Compatibility: Element, Modality and Aspect`,
    description: (a, b, el) =>
      `Compatibility between ${a} and ${b}, read through element, modality and the angle between the two signs. ${el} See what flows easily and what takes effort in love, friendship and work.`,
    elementLabel: 'Element', modalityLabel: 'Modality', aspectLabel: 'Angle between', rulerLabel: 'Ruler',
    sameElement: (el) => `Both signs share the ${el} element, so their basic approach is similar.`,
    intro: (a, b) =>
      `What flows naturally between ${a} and ${b} — and what takes work — is shaped by each sign’s element, modality and the angle between them. The reading below is built on those three markers.`,
    disclaimer:
      'This page is for personal insight and reflection; it makes no guarantees or definitive predictions. A full birth chart says far more than the sun sign alone.',
  },
  de: {
    h1: (a, b) => `${a} und ${b} Partnerhoroskop`,
    title: (a, b) => `${a} und ${b} Kompatibilität: Element, Qualität und Aspekt`,
    description: (a, b, el) =>
      `Die Kompatibilität von ${a} und ${b} — gelesen über Element, Qualität und den Winkel zwischen beiden Zeichen. ${el} Was leicht fließt und was Arbeit verlangt, in Liebe, Freundschaft und Beruf.`,
    elementLabel: 'Element', modalityLabel: 'Qualität', aspectLabel: 'Winkel', rulerLabel: 'Herrscher',
    sameElement: (el) => `Beide Zeichen gehören zum Element ${el}; ihr Grundzugang ähnelt sich.`,
    intro: (a, b) =>
      `Was zwischen ${a} und ${b} natürlich fließt und was Arbeit verlangt, ergibt sich aus Element, Qualität und dem Winkel zwischen beiden Zeichen. Die folgende Einschätzung beruht auf diesen drei Markern.`,
    disclaimer:
      'Diese Seite dient der persönlichen Reflexion; sie enthält keine Garantien oder endgültigen Vorhersagen. Ein vollständiges Geburtshoroskop sagt weit mehr als das Sonnenzeichen allein.',
  },
};

function normLocale(locale?: string): Locale {
  const l = String(locale || 'tr').slice(0, 2).toLowerCase();
  return l === 'en' || l === 'de' ? l : 'tr';
}

export interface PairContent {
  title: string;
  description: string;
  h1: string;
  intro: string;
  aspectNote: string;
  sameElementNote: string | null;
  disclaimer: string;
  facts: Array<{ label: string; a: string; b: string }>;
  aspect: { label: string; value: string };
  labelA: string;
  labelB: string;
}

/**
 * Bir burç çifti için sunucuda üretilen, çifte ÖZGÜ içerik.
 * Tüm veriler ZODIAC_META'dan ve açı hesabından türer.
 */
export function buildPairContent(signA: string, signB: string, locale?: string): PairContent | null {
  const a = signA as ZodiacSign;
  const b = signB as ZodiacSign;
  const metaA = ZODIAC_META[a];
  const metaB = ZODIAC_META[b];
  if (!metaA || !metaB) return null;

  const loc = normLocale(locale);
  const copy = COPY[loc];
  const labelA = SIGN_LABELS[loc][a] ?? metaA.label;
  const labelB = SIGN_LABELS[loc][b] ?? metaB.label;

  const idxA = SIGN_ORDER.indexOf(a);
  const idxB = SIGN_ORDER.indexOf(b);
  const rawDistance = Math.abs(idxA - idxB);
  const distance = Math.min(rawDistance, 12 - rawDistance); // 0..6
  const aspectKey = ASPECT_BY_DISTANCE[distance];

  const elA = ELEMENT_LABELS[loc][metaA.element] ?? metaA.element;
  const elB = ELEMENT_LABELS[loc][metaB.element] ?? metaB.element;
  const sameElementNote = metaA.element === metaB.element ? copy.sameElement(elA) : null;

  return {
    title: copy.title(labelA, labelB),
    description: copy.description(labelA, labelB, sameElementNote ?? '').replace(/\s+/g, ' ').trim().slice(0, 300),
    h1: copy.h1(labelA, labelB),
    intro: copy.intro(labelA, labelB),
    aspectNote: ASPECT_NOTES[loc][aspectKey],
    sameElementNote,
    disclaimer: copy.disclaimer,
    labelA,
    labelB,
    aspect: { label: copy.aspectLabel, value: ASPECT_LABELS[loc][aspectKey] },
    facts: [
      { label: copy.elementLabel, a: elA, b: elB },
      {
        label: copy.modalityLabel,
        a: MODALITY_LABELS[loc][metaA.modality] ?? metaA.modality,
        b: MODALITY_LABELS[loc][metaB.modality] ?? metaB.modality,
      },
      { label: copy.rulerLabel, a: metaA.ruler, b: metaB.ruler },
    ],
  };
}

/** Sitemap ve statik üretim için kanonik çiftler (tekrarsız, 66 kombinasyon). */
export function allSignPairs(): Array<{ a: string; b: string; slug: string }> {
  const out: Array<{ a: string; b: string; slug: string }> = [];
  for (let i = 0; i < SIGN_ORDER.length; i += 1) {
    for (let j = i; j < SIGN_ORDER.length; j += 1) {
      out.push({ a: SIGN_ORDER[i], b: SIGN_ORDER[j], slug: `${SIGN_ORDER[i]}-${SIGN_ORDER[j]}` });
    }
  }
  return out;
}
