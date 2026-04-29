'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Search, Star } from 'lucide-react';
import { useLocaleShort } from '@/i18n';
import { localizePath } from '@/integrations/shared';
import { ZODIAC_META, ZODIAC_SIGNS } from '@/lib/zodiac/signs';
import type { ZodiacSign } from '@/types/common';

type CelebrityZodiac = {
  name: string;
  sign: ZodiacSign;
  birthday: string;
  field: string;
  note: string;
};

const CELEBRITIES: CelebrityZodiac[] = [
  { name: 'Mustafa Kemal Atatürk', sign: 'taurus', birthday: '19 Mayıs', field: 'Liderlik', note: 'Toprak elementiyle kararlılık, strateji ve kalıcı etki teması öne çıkar.' },
  { name: 'Tarkan', sign: 'libra', birthday: '17 Ekim', field: 'Müzik', note: 'Terazi vurgusu sahne estetiği, uyum ve güçlü sosyal çekimle okunur.' },
  { name: 'Sezen Aksu', sign: 'cancer', birthday: '13 Temmuz', field: 'Müzik', note: 'Yengeç enerjisi duygu hafızası, sezgi ve içten anlatımla birleşir.' },
  { name: 'Barış Manço', sign: 'capricorn', birthday: '2 Ocak', field: 'Müzik', note: 'Oğlak teması üretkenlik, disiplin ve kuşaklar arası iz bırakma isteğini taşır.' },
  { name: 'Frida Kahlo', sign: 'cancer', birthday: '6 Temmuz', field: 'Sanat', note: 'Yengeç sembolizmi kişisel hikayeyi güçlü, koruyucu ve yoğun bir dile dönüştürür.' },
  { name: 'Albert Einstein', sign: 'pisces', birthday: '14 Mart', field: 'Bilim', note: 'Balık enerjisi sezgisel düşünme, hayal gücü ve soyut bağlantılar kurma becerisiyle anılır.' },
  { name: 'Beyoncé', sign: 'virgo', birthday: '4 Eylül', field: 'Müzik', note: 'Başak vurgusu detay, çalışma disiplini ve kusursuzluk arayışını görünür kılar.' },
  { name: 'Taylor Swift', sign: 'sagittarius', birthday: '13 Aralık', field: 'Müzik', note: 'Yay teması anlatı kurma, özgürlük ve geniş kitlelerle bağ kurma arzusunu büyütür.' },
  { name: 'Rihanna', sign: 'pisces', birthday: '20 Şubat', field: 'Müzik / Girişim', note: 'Balık doğası yaratıcılık, sezgi ve farklı alanları akışkan biçimde birleştirme verir.' },
  { name: 'Leonardo DiCaprio', sign: 'scorpio', birthday: '11 Kasım', field: 'Sinema', note: 'Akrep yoğunluğu dönüşüm, derinlik ve güçlü karakterlere çekilme temalarını destekler.' },
  { name: 'Madonna', sign: 'leo', birthday: '16 Ağustos', field: 'Müzik', note: 'Aslan enerjisi sahne ışığı, cesur ifade ve kendini yeniden yaratma gücüyle parlar.' },
  { name: 'Steve Jobs', sign: 'pisces', birthday: '24 Şubat', field: 'Teknoloji', note: 'Balık sezgisi vizyon, sadeleştirme ve soyut fikri deneyime dönüştürme tarafını vurgular.' },
];

const fields = Array.from(new Set(CELEBRITIES.map((item) => item.field))).sort();

export default function CelebrityZodiacPage() {
  const locale = useLocaleShort();
  const [signFilter, setSignFilter] = React.useState<'all' | ZodiacSign>('all');
  const [fieldFilter, setFieldFilter] = React.useState('all');
  const [query, setQuery] = React.useState('');

  const filtered = CELEBRITIES.filter((item) => {
    const signMatches = signFilter === 'all' || item.sign === signFilter;
    const fieldMatches = fieldFilter === 'all' || item.field === fieldFilter;
    const q = query.trim().toLocaleLowerCase('tr-TR');
    const queryMatches = !q || `${item.name} ${item.field} ${ZODIAC_META[item.sign].label}`.toLocaleLowerCase('tr-TR').includes(q);
    return signMatches && fieldMatches && queryMatches;
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
      <div className="mb-10 max-w-3xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-gold/20 bg-brand-gold/10 px-4 py-2 text-sm text-brand-gold">
          <Star className="size-4" />
          Ünlü burç arşivi
        </div>
        <h1 className="text-4xl font-semibold tracking-normal text-foreground md:text-6xl">
          Ünlüler ve burçları
        </h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground md:text-lg">
          Kamuya açık doğum tarihleri üzerinden hazırlanan bu rehber, burç sembollerini tanıdık isimlerin üretim tarzlarıyla birlikte okur.
        </p>
      </div>

      <div className="mb-8 grid gap-3 rounded-2xl border border-border/50 bg-surface p-4 md:grid-cols-[1fr_220px_220px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="İsim, alan veya burç ara"
            className="h-12 w-full rounded-xl border border-border/70 bg-background pl-11 pr-4 text-foreground outline-none focus:border-brand-gold"
          />
        </label>

        <select
          value={signFilter}
          onChange={(event) => setSignFilter(event.target.value as 'all' | ZodiacSign)}
          className="h-12 rounded-xl border border-border/70 bg-background px-4 text-foreground outline-none focus:border-brand-gold"
        >
          <option value="all">Tüm burçlar</option>
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
          <option value="all">Tüm alanlar</option>
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
                    {item.birthday} · {item.field}
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

              <p className="mt-4 text-sm leading-6 text-muted-foreground">{item.note}</p>

              <Link
                href={localizePath(locale, `/burclar/${sign.key}`)}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-gold hover:text-brand-gold/80"
              >
                {sign.label} özelliklerini oku
                <ArrowRight className="size-4" />
              </Link>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border/50 bg-surface p-8 text-center text-muted-foreground">
          Bu filtrelerle eşleşen kayıt bulunamadı.
        </div>
      ) : null}
    </section>
  );
}
