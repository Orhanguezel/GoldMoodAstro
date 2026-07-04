import type { ZodiacSignMeta } from '@/lib/zodiac/signs';
import { localizeSign } from '@/lib/zodiac/signs';

export type ZodiacFaqItem = {
  question: string;
  answer: string;
};

type ZodiacFaqCopy = {
  titleSuffix: string;
  q1: (label: string) => string;
  a1: (label: string) => string;
  q2: (label: string) => string;
  a2: (label: string) => string;
  q3: (label: string) => string;
  a3: (label: string) => string;
};

const FAQ_COPY: Record<'tr' | 'en' | 'de', ZodiacFaqCopy> = {
  tr: {
    titleSuffix: 'Burcu Hakkında Sorular',
    q1: (label) => `${label} burcu nedir?`,
    a1: (label) =>
      `${label} burcu, güneşin ${label} arketipinden geçtiği dönemde doğan kişilerin temel enerji, motivasyon ve davranış eğilimlerini anlatan astrolojik profildir.`,
    q2: (label) => `${label} burcu özellikleri nelerdir?`,
    a2: (label) =>
      `${label} burcu karakter, ilişki, kariyer ve gündelik motivasyon alanlarında kendine özgü güçlü yanlar ve gelişim alanları taşır.`,
    q3: (label) => `${label} burcu uyumu nasıl yorumlanır?`,
    a3: (label) =>
      `${label} burcu uyumu yalnızca güneş burcuyla değil; Ay, Venüs, Mars, yükselen burç ve haritadaki ilişki evleriyle birlikte değerlendirilmelidir.`,
  },
  en: {
    titleSuffix: 'Sign Questions',
    q1: (label) => `What is the ${label} sign?`,
    a1: (label) =>
      `${label} is an astrological profile describing the core energy, motivation and behavioral tendencies of people born while the Sun moves through this archetype.`,
    q2: (label) => `What are ${label} traits?`,
    a2: (label) =>
      `${label} carries distinctive strengths and growth areas in character, relationships, career and daily motivation.`,
    q3: (label) => `How is ${label} compatibility interpreted?`,
    a3: (label) =>
      `${label} compatibility should be evaluated not only with the Sun sign but also with the Moon, Venus, Mars, rising sign and relationship houses.`,
  },
  de: {
    titleSuffix: 'Sternzeichen Fragen',
    q1: (label) => `Was ist das Sternzeichen ${label}?`,
    a1: (label) =>
      `${label} ist ein astrologisches Profil, das grundlegende Energie, Motivation und Verhaltenstendenzen beschreibt.`,
    q2: (label) => `Welche Eigenschaften hat ${label}?`,
    a2: (label) =>
      `${label} trägt eigene Stärken und Entwicklungsbereiche in Charakter, Beziehungen, Beruf und Alltagsmotivation.`,
    q3: (label) => `Wie wird die Kompatibilität von ${label} gedeutet?`,
    a3: (label) =>
      `Die Kompatibilität von ${label} sollte nicht nur mit dem Sonnenzeichen, sondern auch mit Mond, Venus, Mars, Aszendent und Beziehungshäusern betrachtet werden.`,
  },
};

function faqLocale(locale?: string): 'tr' | 'en' | 'de' {
  const l = String(locale ?? 'tr').toLowerCase().split(/[-_]/)[0];
  if (l === 'en' || l === 'de') return l;
  return 'tr';
}

export function buildZodiacFaq(meta: ZodiacSignMeta, locale?: string, shortSummary?: string | null) {
  const l = faqLocale(locale);
  const copy = FAQ_COPY[l];
  const label = localizeSign(meta, l).label;
  const summary = String(shortSummary ?? '').trim();

  const items: ZodiacFaqItem[] = [
    { question: copy.q1(label), answer: copy.a1(label) },
    { question: copy.q2(label), answer: summary || copy.a2(label) },
    { question: copy.q3(label), answer: copy.a3(label) },
  ];

  return {
    title: `${label} ${copy.titleSuffix}`,
    items,
  };
}
