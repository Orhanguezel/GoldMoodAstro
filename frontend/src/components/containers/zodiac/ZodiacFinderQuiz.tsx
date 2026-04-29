'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Sparkles } from 'lucide-react';
import { ZODIAC_META, ZODIAC_SIGNS, type ZodiacElement, type ZodiacModality } from '@/lib/zodiac/signs';
import type { ZodiacSign } from '@/types/common';
import { useLocaleShort } from '@/i18n';
import { localizePath } from '@/integrations/shared';

type QuizAnswer = 'calm' | 'bold' | 'curious' | 'deep';

const MONTHS = [
  { value: 1, label: 'Ocak', days: 31 },
  { value: 2, label: 'Şubat', days: 29 },
  { value: 3, label: 'Mart', days: 31 },
  { value: 4, label: 'Nisan', days: 30 },
  { value: 5, label: 'Mayıs', days: 31 },
  { value: 6, label: 'Haziran', days: 30 },
  { value: 7, label: 'Temmuz', days: 31 },
  { value: 8, label: 'Ağustos', days: 31 },
  { value: 9, label: 'Eylül', days: 30 },
  { value: 10, label: 'Ekim', days: 31 },
  { value: 11, label: 'Kasım', days: 30 },
  { value: 12, label: 'Aralık', days: 31 },
];

const ANSWERS: Array<{ key: QuizAnswer; label: string; element: ZodiacElement; modality: ZodiacModality }> = [
  { key: 'bold', label: 'Hızlı karar alır, yeni başlangıçları severim', element: 'Ateş', modality: 'Öncü' },
  { key: 'calm', label: 'Güven, düzen ve somut sonuçlar bana iyi gelir', element: 'Toprak', modality: 'Sabit' },
  { key: 'curious', label: 'Fikirler, sohbet ve öğrenme beni canlı tutar', element: 'Hava', modality: 'Değişken' },
  { key: 'deep', label: 'Sezgilerim güçlüdür, duygusal bağ benim için önemlidir', element: 'Su', modality: 'Sabit' },
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

function getQuizNote(sign: ZodiacSign, answer: QuizAnswer) {
  const meta = ZODIAC_META[sign];
  const selected = ANSWERS.find((item) => item.key === answer);
  if (!selected) {
    return `${meta.label} enerjin ${meta.element} elementi ve ${meta.modality.toLowerCase()} niteliğiyle çalışır.`;
  }

  const elementMatch = selected.element === meta.element;
  const modalityMatch = selected.modality === meta.modality;
  if (elementMatch && modalityMatch) {
    return `Seçimin ${meta.label} doğanla güçlü biçimde örtüşüyor: ${meta.element} elementi ve ${meta.modality.toLowerCase()} nitelik aynı anda vurgulanıyor.`;
  }
  if (elementMatch) {
    return `${meta.element} elementin belirgin; günlük ritminde ${meta.label} burcunun temel motivasyonu kolayca görünür olabilir.`;
  }
  if (modalityMatch) {
    return `${meta.modality} niteliğin öne çıkıyor; ${meta.label} burcunun olaylara yaklaşım tarzıyla benzer bir tempo taşıyorsun.`;
  }
  return `Güneş burcun ${meta.label}; seçtiğin tema ise haritanda Ay, yükselen veya Venüs gibi başka bir yerleşimin güçlü olabileceğini düşündürür.`;
}

export default function ZodiacFinderQuiz() {
  const locale = useLocaleShort();
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
          İnteraktif burç keşfi
        </div>
        <h1 className="text-4xl font-semibold tracking-normal text-foreground md:text-6xl">
          Burcunu öğren, enerjini hızlıca yorumla
        </h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground md:text-lg">
          Doğum gününü seç; güneş burcunu, elementini ve sana yakın temaları anında gör.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="rounded-2xl border border-border/50 bg-surface p-5 shadow-soft md:p-7">
          <div className="mb-6 flex items-center gap-3">
            <CalendarDays className="size-5 text-brand-gold" />
            <h2 className="text-xl font-semibold">Doğum günün</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Ay</span>
              <select
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
                className="h-12 w-full rounded-xl border border-border/70 bg-background px-4 text-foreground outline-none focus:border-brand-gold"
              >
                {MONTHS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Gün</span>
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
            <h3 className="text-sm font-semibold uppercase tracking-widest text-brand-gold">Sana en yakın ifade</h3>
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
                  {item.label}
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
              {sign.element} elementi · {sign.modality} nitelik · Yönetici: {sign.ruler}
            </p>
          </div>

          <p className="mt-6 rounded-xl border border-border/50 bg-background/35 p-4 text-sm leading-6 text-muted-foreground">
            {getQuizNote(signKey, answer)}
          </p>

          <div className="mt-6 grid gap-3">
            <Link
              href={localizePath(locale, `/burclar/${sign.key}`)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gold px-4 py-3 text-sm font-semibold text-background transition hover:bg-brand-gold/90"
            >
              {sign.label} profilini aç
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href={localizePath(locale, `/burclar/${sign.key}/bugun`)}
              className="inline-flex items-center justify-center rounded-xl border border-border/60 px-4 py-3 text-sm font-semibold text-foreground transition hover:border-brand-gold/50"
            >
              Günlük yorumunu oku
            </Link>
          </div>
        </aside>
      </div>

      <div className="mt-10 rounded-2xl border border-border/50 bg-surface/70 p-5">
        <h2 className="mb-4 text-lg font-semibold">Yakın temalar</h2>
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
