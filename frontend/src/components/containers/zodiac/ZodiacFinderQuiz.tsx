'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Sparkles } from 'lucide-react';
import { ZODIAC_META, ZODIAC_SIGNS, type ZodiacElement, type ZodiacModality } from '@/lib/zodiac/signs';
import type { ZodiacSign } from '@/types/common';
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';

type QuizAnswer = 'calm' | 'bold' | 'curious' | 'deep';

const MONTHS = [
  { value: 1, label: 'Ocak', days: 31 },
  { value: 2, label: 'February', days: 29 },
  { value: 3, label: 'Mart', days: 31 },
  { value: 4, label: 'Nisan', days: 30 },
  { value: 5, label: 'May', days: 31 },
  { value: 6, label: 'Haziran', days: 30 },
  { value: 7, label: 'Temmuz', days: 31 },
  { value: 8, label: 'August', days: 31 },
  { value: 9, label: 'September', days: 30 },
  { value: 10, label: 'Ekim', days: 31 },
  { value: 11, label: 'November', days: 30 },
  { value: 12, label: 'December', days: 31 },
];

type UiFn = (key: string, fallback: string) => string;

const ANSWERS: Array<{ key: QuizAnswer; labelKey: string; labelTr: string; element: ZodiacElement; modality: ZodiacModality }> = [
  { key: 'bold', labelKey: 'ui_zodiacx_quiz_answer_bold', labelTr: 'I make quick decisions and love new beginnings', element: ZODIAC_META.aries.element, modality: ZODIAC_META.aries.modality },
  { key: 'calm', labelKey: 'ui_zodiacx_quiz_answer_calm', labelTr: 'Trust, order and concrete results feel good to me', element: ZODIAC_META.taurus.element, modality: ZODIAC_META.taurus.modality },
  { key: 'curious', labelKey: 'ui_zodiacx_quiz_answer_curious', labelTr: 'Ideas, conversation and learning keep me alive', element: ZODIAC_META.gemini.element, modality: ZODIAC_META.gemini.modality },
  { key: 'deep', labelKey: 'ui_zodiacx_quiz_answer_deep', labelTr: 'My intuition is strong and emotional connection matters to me', element: ZODIAC_META.scorpio.element, modality: ZODIAC_META.scorpio.modality },
];

function getSunSign(month: number, day: number): ZodiacSign {
  const mmdd = month * 100 + day;
  if (mmdd >= 321 && mmdd <= 419) return 'aries';
  if (mmdd >= 420 && mmdd <= 520) return 'taurus';
  if (mmdd >= 521 && mmdd <= 620) return 'gemini';
  if (mmdd >= 621 && mmdd <= 722) return 'cancer';
  if (mmdd >= 723 && mmdd <= 822) return 'leo';
  if (mmdd >= 823 && mmdd <= 922) return 'virgo';
  if (mmdd >= 923 && mmdd <= 1022) return 'libra';
  if (mmdd >= 1023 && mmdd <= 1121) return 'scorpio';
  if (mmdd >= 1122 && mmdd <= 1221) return 'sagittarius';
  if (mmdd >= 1222 || mmdd <= 119) return 'capricorn';
  if (mmdd >= 120 && mmdd <= 218) return 'aquarius';
  return 'pisces';
}

function getQuizNote(sign: ZodiacSign, answer: QuizAnswer, ui: UiFn) {
  const meta = ZODIAC_META[sign];
  const selected = ANSWERS.find((item) => item.key === answer);
  if (!selected) {
    return `${meta.label} ${ui('ui_zodiacx_quiz_note_default', 'energy')} ${meta.element} ${ui('ui_zodiacx_quiz_note_element_works', 'element and')} ${meta.modality.toLowerCase()} ${ui('ui_zodiacx_quiz_note_modality_works', 'modality work together.')}`;
  }

  const elementMatch = selected.element === meta.element;
  const modalityMatch = selected.modality === meta.modality;
  if (elementMatch && modalityMatch) {
    return `${ui('ui_zodiacx_quiz_note_both_p1', 'Your choice')} ${meta.label} ${ui('ui_zodiacx_quiz_note_both_p2', 'strongly overlaps with your birth sign:')} ${meta.element} ${ui('ui_zodiacx_quiz_note_both_p3', 'element and')} ${meta.modality.toLowerCase()} ${ui('ui_zodiacx_quiz_note_both_p4', 'modality are emphasized together.')}`;
  }
  if (elementMatch) {
    return `${meta.element} ${ui('ui_zodiacx_quiz_note_element_p1', 'element is prominent; in your daily rhythm,')} ${meta.label} ${ui('ui_zodiacx_quiz_note_element_p2', 'sign motivation may be easily visible.')}`;
  }
  if (modalityMatch) {
    return `${meta.modality} ${ui('ui_zodiacx_quiz_note_modality_p1', 'modality stands out;')} ${meta.label} ${ui('ui_zodiacx_quiz_note_modality_p2', 'you carry a tempo similar to how your sign approaches events.')}`;
  }
  return `${ui('ui_zodiacx_quiz_note_none_p1', 'Your Sun sign is')} ${meta.label}; ${ui('ui_zodiacx_quiz_note_none_p2', 'the theme you chose may suggest another strong placement in your chart, such as Moon, Rising or Venus.')}`;
}

export default function ZodiacFinderQuiz() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_zodiacx' as any);
  const [month, setMonth] = React.useState(3);
  const [day, setDay] = React.useState(21);
  const [answer, setAnswer] = React.useState<QuizAnswer>('bold');

  const monthMeta = MONTHS.find((item) => item.value === month) ?? MONTHS[0];
  const normalizedDay = Math.min(day, monthMeta.days);
  const signKey = getSunSign(month, normalizedDay);
  const sign = ZODIAC_META[signKey];
  const closeSigns = ZODIAC_SIGNS.filter(
    (item) => item.key !== signKey && (item.element === sign.element || item.modality === sign.modality),
  ).slice(0, 3);

  React.useEffect(() => {
    if (day > monthMeta.days) setDay(monthMeta.days);
  }, [day, monthMeta.days]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <div className="mb-10 max-w-3xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-gold/20 bg-brand-gold/10 px-4 py-2 text-sm text-brand-gold">
          <Sparkles className="size-4" />
          {ui('ui_zodiacx_quiz_badge', 'Interactive sign discovery')}
        </div>
        <h2 className="text-4xl font-semibold tracking-normal text-foreground md:text-6xl">
          {ui('ui_zodiacx_quiz_title', 'Find your sign and quickly interpret your energy')}
        </h2>
        <p className="mt-5 text-base leading-7 text-muted-foreground md:text-lg">
          {ui('ui_zodiacx_quiz_subtitle', 'Choose your birthday and instantly see your Sun sign, element and nearby themes.')}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="rounded-2xl border border-border/50 bg-surface p-5 shadow-soft md:p-7">
          <div className="mb-6 flex items-center gap-3">
            <CalendarDays className="size-5 text-brand-gold" />
            <h2 className="text-xl font-semibold">{ui('ui_zodiacx_quiz_birthday', 'Your birthday')}</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">{ui('ui_zodiacx_quiz_month', 'Ay')}</span>
              <select
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
                className="h-12 w-full rounded-xl border border-border/70 bg-background px-4 text-foreground outline-none focus:border-brand-gold"
              >
                {MONTHS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {ui(`ui_zodiacx_month_${item.value}`, item.label)}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">{ui('ui_zodiacx_quiz_day', 'Day')}</span>
              <select
                value={normalizedDay}
                onChange={(event) => setDay(Number(event.target.value))}
                className="h-12 w-full rounded-xl border border-border/70 bg-background px-4 text-foreground outline-none focus:border-brand-gold"
              >
                {Array.from({ length: monthMeta.days }, (_, index) => index + 1).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-8 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-brand-gold">{ui('ui_zodiacx_quiz_closest_expression', 'Closest expression to you')}</h3>
            <div className="grid gap-3">
              {ANSWERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setAnswer(item.key)}
                  className={`rounded-xl border p-4 text-left text-sm transition ${
                    answer === item.key
                      ? 'border-brand-gold bg-brand-gold/10 text-foreground'
                      : 'border-border/60 bg-background/40 text-muted-foreground hover:border-brand-gold/50'
                  }`}
                >
                  {ui(item.labelKey, item.labelTr)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside
          className="zodiac-accent-scope rounded-2xl border border-brand-gold/25 bg-surface p-6 shadow-glow"
          style={{ '--gm-zodiac-accent': sign.accent } as React.CSSProperties}
        >
          <div className="text-center">
            <div className="mx-auto mb-4 grid size-24 place-items-center rounded-full border border-brand-gold/25 bg-brand-gold/10 text-5xl">
              {sign.symbol}
            </div>
            <p className="text-sm uppercase tracking-widest text-brand-gold">{sign.date}</p>
            <h2 className="mt-2 text-4xl font-semibold">{sign.label}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {sign.element} {ui('ui_zodiacx_quiz_element_label', 'element ·')} {sign.modality} {ui('ui_zodiacx_quiz_modality_label', 'modality · Ruler:')} {sign.ruler}
            </p>
          </div>

          <p className="mt-6 rounded-xl border border-border/50 bg-background/35 p-4 text-sm leading-6 text-muted-foreground">
            {getQuizNote(signKey, answer, ui)}
          </p>

          <div className="mt-6 grid gap-3">
            <Link
              href={localizePath(locale, `/burclar/${sign.key}`)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gold px-4 py-3 text-sm font-semibold text-background transition hover:bg-brand-gold/90"
            >
              {sign.label} {ui('ui_zodiacx_open_profile_suffix', 'open profile')}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href={localizePath(locale, `/burclar/${sign.key}/bugun`)}
              className="inline-flex items-center justify-center rounded-xl border border-border/60 px-4 py-3 text-sm font-semibold text-foreground transition hover:border-brand-gold/50"
            >
              {ui('ui_zodiacx_read_daily', 'Read daily interpretation')}
            </Link>
          </div>
        </aside>
      </div>

      <div className="mt-10 rounded-2xl border border-border/50 bg-surface/70 p-5">
        <h2 className="mb-4 text-lg font-semibold">{ui('ui_zodiacx_close_themes', 'Nearby themes')}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {closeSigns.map((item) => (
            <Link
              key={item.key}
              href={localizePath(locale, `/burclar/${item.key}`)}
              className="rounded-xl border border-border/50 bg-background/35 p-4 transition hover:border-brand-gold/50"
            >
              <div className="text-2xl">{item.symbol}</div>
              <div className="mt-2 font-semibold">{item.label}</div>
              <div className="text-sm text-muted-foreground">{item.element} · {item.modality}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
