export const revalidate = 3600;
import ZodiacDetail from '@/components/containers/zodiac/ZodiacDetail';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/seo/server';
import JsonLd from '@/seo/JsonLd';

type Props = {
  params: Promise<{ sign: string; locale: string }>;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8094/api').replace(/\/$/, '');
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');

const VALID_SIGNS = new Set([
  'aries','taurus','gemini','cancer','leo','virgo','libra','scorpio',
  'sagittarius','capricorn','aquarius','pisces',
]);

type ZodiacPageInfo = {
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

type DailyHoroscopeServer = {
  id: string;
  date?: string;
  period_start_date?: string;
  sign: string;
  locale?: string;
  content?: string;
  contentTr?: string;
  mood_score?: number | null;
  moodScore?: number | null;
  lucky_number?: number | null;
  luckyNumber?: number | null;
  lucky_color?: string | null;
  luckyColor?: string | null;
};

const signLabels: Record<string, Record<string, string>> = {
  tr: {
    aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
    leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
    sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık',
  },
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

function shortLocale(locale: string) {
  const l = locale.toLowerCase().split('-')[0];
  return l === 'de' || l === 'en' ? l : 'tr';
}

function signLabel(sign: string, locale: string) {
  const l = shortLocale(locale);
  return signLabels[l]?.[sign] ?? signLabels.en[sign] ?? sign;
}

function formatDate(date: Date, locale: string) {
  const l = shortLocale(locale);
  const intlLocale = l === 'de' ? 'de-DE' : l === 'en' ? 'en-US' : 'tr-TR';
  return date.toLocaleDateString(intlLocale, { day: 'numeric', month: 'long', year: 'numeric' });
}

function dailyTitle(label: string, dateText: string, locale: string) {
  const l = shortLocale(locale);
  if (l === 'de') return `${label} Tageshoroskop — ${dateText}`;
  if (l === 'en') return `${label} Daily Horoscope — ${dateText}`;
  return `${label} Burcu Günlük Yorumu — ${dateText}`;
}

function dailyDescription(label: string, dateText: string, locale: string) {
  const l = shortLocale(locale);
  if (l === 'de') return `${dateText} ${label} Tageshoroskop: Liebe, Geld, Stimmung und spirituelle Hinweise.`;
  if (l === 'en') return `${dateText} daily horoscope for ${label}: love, money, mood and spiritual guidance.`;
  return `${dateText} ${label} burcu günlük yorumu: aşk, para, ruh hali ve spiritüel rehberlik.`;
}

function buildFallbackInfo(sign: string, label: string, locale: string): ZodiacPageInfo {
  const l = shortLocale(locale);
  if (l === 'tr') {
    return {
      title: `${label} Burcu`,
      short_summary: `${label} burcu için karakter, ilişki, kariyer ve günlük enerji temalarını özetleyen astrolojik rehber.`,
      content: `${label} burcu; motivasyon, ilişki tarzı, karar alma biçimi ve günlük enerji ritmini anlamak için güçlü bir başlangıç noktasıdır. Daha kişisel yorum için yükselen burç, Ay burcu, Venüs, Mars ve ev yerleşimleri birlikte değerlendirilmelidir.`,
      sections: [],
    };
  }
  return {
    title: `${label} Zodiac`,
    short_summary: `${label} zodiac guide for character, relationships, career and daily energy themes.`,
    content: `${label} is a useful starting point for understanding motivation, relationship style, decisions and daily energy rhythm. A personal reading becomes deeper when the rising sign, Moon sign, Venus, Mars and house placements are considered together.`,
    sections: [],
  };
}

async function fetchSignInfoServer(sign: string, locale: string) {
  try {
    const res = await fetch(`${API_BASE}/zodiac/${sign}?locale=${encodeURIComponent(locale)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json ?? null;
  } catch {
    return null;
  }
}

async function fetchTodayServer(sign: string, locale: string): Promise<DailyHoroscopeServer | null> {
  try {
    const res = await fetch(`${API_BASE}/horoscopes/today?sign=${encodeURIComponent(sign)}&locale=${encodeURIComponent(locale)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data ?? json ?? null;
    if (!data) return null;
    return {
      ...data,
      date: data.date ?? data.period_start_date,
      contentTr: data.contentTr ?? data.content,
      moodScore: data.moodScore ?? data.mood_score,
      luckyNumber: data.luckyNumber ?? data.lucky_number,
      luckyColor: data.luckyColor ?? data.lucky_color,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sign, locale } = await params;
  const label = signLabel(sign, locale);
  const today = formatDate(new Date(), locale);
  const ogImageUrl = `https://goldmoodastro.com/${locale}/burclar/${sign}/bugun/opengraph-image`;

  return buildPageMetadata({
    locale,
    pageKey: `burclar-${sign}-bugun`,
    pathname: `/burclar/${sign}/bugun`,
    fallback: {
      title: dailyTitle(label, today, locale),
      description: dailyDescription(label, today, locale),
      ogImage: ogImageUrl,
    },
  });
}

import PageContainer from '@/components/common/PageContainer';

export default async function SignDailyPage({ params }: Props) {
  const { sign, locale } = await params;
  if (!VALID_SIGNS.has(sign)) notFound();

  const label = signLabel(sign, locale);
  const localeKey = shortLocale(locale);
  const [info, today] = await Promise.all([
    fetchSignInfoServer(sign, locale),
    fetchTodayServer(sign, locale),
  ]);
  const pagePath = `/${locale}/burclar/${sign}/bugun`;
  const pageUrl = `${SITE_URL}${pagePath}`;
  const todayDate = today?.date ?? new Date().toISOString().slice(0, 10);
  const reviewDate = formatDate(new Date(todayDate), locale);
  const reviewer = {
    name: 'Pınar Demircioğlu',
    jobTitle:
      localeKey === 'en'
        ? 'Founder and editorial reviewer'
        : localeKey === 'de'
          ? 'Gründerin und redaktionelle Prüferin'
          : 'Kurucu ve editoryal inceleme sorumlusu',
    url: `${SITE_URL}/${locale}/about`,
  };
  const reviewLabels = {
    eyebrow:
      localeKey === 'en'
        ? 'Editorial review'
        : localeKey === 'de'
          ? 'Redaktionelle Prüfung'
          : 'Editoryal inceleme',
    reviewedBy:
      localeKey === 'en'
        ? 'Reviewed by'
        : localeKey === 'de'
          ? 'Geprüft von'
          : 'İnceleyen',
    note:
      localeKey === 'en'
        ? `${label} daily horoscope is reviewed for responsible language, symbolic context and non-deterministic guidance.`
        : localeKey === 'de'
          ? `Das ${label} Tageshoroskop wird auf verantwortungsvolle Sprache, symbolischen Kontext und nicht-deterministische Hinweise geprüft.`
          : `${label} burcu günlük yorumu; sorumlu dil, sembolik bağlam ve deterministik olmayan rehberlik ilkeleriyle kontrol edilir.`,
  };
  const reviewSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${SITE_URL}/#pinar-demircioglu`,
        name: reviewer.name,
        jobTitle: reviewer.jobTitle,
        url: reviewer.url,
        worksFor: { '@id': `${SITE_URL}/#org` },
      },
      {
        '@type': 'Article',
        '@id': `${pageUrl}#daily-horoscope`,
        headline: dailyTitle(label, reviewDate, locale),
        url: pageUrl,
        datePublished: todayDate,
        dateModified: todayDate,
        inLanguage: localeKey,
        author: { '@id': `${SITE_URL}/#org` },
        reviewedBy: { '@id': `${SITE_URL}/#pinar-demircioglu` },
        publisher: { '@id': `${SITE_URL}/#org` },
      },
    ],
  };

  return (
    <PageContainer width="full" pad="none" className="bg-(--gm-bg)">
      <JsonLd id="daily-horoscope-review" data={reviewSchema} />
      <ZodiacDetail
        initialTab="daily"
        initialInfo={info ?? buildFallbackInfo(sign, label, locale)}
        initialToday={today}
      />
      <section className="mx-auto mt-12 max-w-4xl rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) px-6 py-5 shadow-(--gm-shadow-soft)">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-(--gm-gold)">
          {reviewLabels.eyebrow}
        </p>
        <p className="mt-3 text-base font-semibold text-(--gm-text)">
          {reviewLabels.reviewedBy}: <a href={reviewer.url} className="text-(--gm-gold) hover:text-(--gm-gold-light)">{reviewer.name}</a>
          <span className="font-normal text-(--gm-text-dim)"> · {reviewer.jobTitle} · {reviewDate}</span>
        </p>
        <p className="mt-2 text-sm leading-relaxed text-(--gm-text-dim)">
          {reviewLabels.note}
        </p>
      </section>
    </PageContainer>
  );
}
