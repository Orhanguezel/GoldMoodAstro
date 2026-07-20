'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Search, Star } from 'lucide-react';
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';
import { ZODIAC_META, ZODIAC_SIGNS } from '@/lib/zodiac/signs';
import { CELEBRITY_ZODIAC, ct } from '@/lib/zodiac/celebrities';
import type { ZodiacSign } from '@/types/common';

// 2026-07-20: field/note/birthday artik dil sozlugu; filtre de locale'e gore uretiliyor.

export default function CelebrityZodiacPage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_zodiacx' as any);
  const [signFilter, setSignFilter] = React.useState<'all' | ZodiacSign>('all');
  const [fieldFilter, setFieldFilter] = React.useState('all');
  const [query, setQuery] = React.useState('');

  // Alan filtresi locale'e gore uretilir; dil degisince etiketler de degisir.
  const fields = React.useMemo(
    () => Array.from(new Set(CELEBRITY_ZODIAC.map((item) => ct(item.field, locale)))).sort(),
    [locale],
  );

  const filtered = CELEBRITY_ZODIAC.filter((item) => {
    const signMatches = signFilter === 'all' || item.sign === signFilter;
    const fieldMatches = fieldFilter === 'all' || ct(item.field, locale) === fieldFilter;
    const q = query.trim().toLocaleLowerCase(locale === 'tr' ? 'tr-TR' : 'en-US');
    const queryMatches = !q || `${item.name} ${ct(item.field, locale)} ${ZODIAC_META[item.sign].label}`.toLocaleLowerCase(locale === 'tr' ? 'tr-TR' : 'en-US').includes(q);
    return signMatches && fieldMatches && queryMatches;
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
      <div className="mb-10 max-w-3xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-gold/20 bg-brand-gold/10 px-4 py-2 text-sm text-brand-gold">
          <Star className="size-4" />
          {ui('ui_zodiacx_celeb_badge', 'Celebrity sign archive')}
        </div>
        <h2 className="text-4xl font-semibold tracking-normal text-foreground md:text-6xl">
          {ui('ui_zodiacx_celeb_title', 'Astrological themes of familiar names')}
        </h2>
        <p className="mt-5 text-base leading-7 text-muted-foreground md:text-lg">
          {ui('ui_zodiacx_celeb_subtitle', 'This guide, prepared from public birth dates, reads zodiac symbols alongside the creative styles of familiar names.')}
        </p>
      </div>

      <div className="mb-8 grid gap-3 rounded-2xl border border-border/50 bg-surface p-4 md:grid-cols-[1fr_220px_220px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={ui('ui_zodiacx_celeb_search_placeholder', 'Search name, field or sign')}
            className="h-12 w-full rounded-xl border border-border/70 bg-background pl-11 pr-4 text-foreground outline-none focus:border-brand-gold"
          />
        </label>

        <select
          value={signFilter}
          onChange={(event) => setSignFilter(event.target.value as 'all' | ZodiacSign)}
          className="h-12 rounded-xl border border-border/70 bg-background px-4 text-foreground outline-none focus:border-brand-gold"
        >
          <option value="all">{ui('ui_zodiacx_celeb_all_signs', 'All signs')}</option>
          {ZODIAC_SIGNS.map((sign) => (
            <option key={sign.key} value={sign.key}>
              {sign.label}
            </option>
          ))}
        </select>

        <select
          value={fieldFilter}
          onChange={(event) => setFieldFilter(event.target.value)}
          className="h-12 rounded-xl border border-border/70 bg-background px-4 text-foreground outline-none focus:border-brand-gold"
        >
          <option value="all">{ui('ui_zodiacx_celeb_all_fields', 'All fields')}</option>
          {fields.map((field) => (
            <option key={field} value={field}>
              {field}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => {
          const sign = ZODIAC_META[item.sign];
          return (
            <article
              key={item.name}
              className="rounded-2xl border border-border/50 bg-surface p-5 shadow-soft transition hover:border-brand-gold/50"
            >
              <div className="flex items-start gap-4">
                <div
                  className="grid size-14 shrink-0 place-items-center rounded-2xl border text-3xl"
                  style={{ borderColor: `${sign.accent}66`, backgroundColor: `${sign.accent}18` }}
                >
                  {sign.symbol}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{item.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {ct(item.birthday, locale)} · {ct(item.field, locale)}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-brand-gold/20 bg-brand-gold/10 px-3 py-1 text-xs font-semibold text-brand-gold">
                  {sign.label}
                </span>
                <span className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
                  {sign.element}
                </span>
                <span className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
                  {sign.modality}
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">{ct(item.note, locale)}</p>

              <Link
                href={localizePath(locale, `/burclar/${sign.key}`)}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-gold hover:text-brand-gold/80"
              >
                {sign.label} {ui('ui_zodiacx_celeb_read_traits_suffix', 'read traits')}
                <ArrowRight className="size-4" />
              </Link>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border/50 bg-surface p-8 text-center text-muted-foreground">
          {ui('ui_zodiacx_celeb_no_results', 'No records matched these filters.')}
        </div>
      ) : null}
    </section>
  );
}
