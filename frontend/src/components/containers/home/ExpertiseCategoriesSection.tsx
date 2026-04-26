'use client';

import React from 'react';
import Link from 'next/link';
import { BriefcaseBusiness, HeartHandshake, Hash, MoonStar, Sparkles, Stars } from 'lucide-react';
import { useLocaleShort } from '@/i18n';
import { localizePath } from '@/integrations/shared';
import { BASE_URL } from '@/integrations/rtk/constants';

const CATEGORIES = {
  tr: [
    { key: 'astrology', icon: Stars, title: 'Astroloji', desc: 'Doğum haritası, gezegenler ve hayat analizi.' },
    { key: 'tarot', icon: Sparkles, title: 'Tarot', desc: 'Kartlar aracılığıyla içgüdüsel rehberlik.' },
    { key: 'numerology', icon: Hash, title: 'Numeroloji', desc: 'Sayıların gizemi ile kişisel yol haritanız.' },
    { key: 'mood-coaching', icon: MoonStar, title: 'Mood Coaching', desc: 'Enerji, duygu dengesi ve ruhsal farkındalık.' },
    { key: 'career', icon: BriefcaseBusiness, title: 'Kariyer', desc: 'Kozmik perspektifle kariyer ve hedef rehberliği.' },
    { key: 'relationship', icon: HeartHandshake, title: 'İlişki Danışmanlığı', desc: 'Uyum analizi ve duygu rehberliği.' },
  ],
  en: [
    { key: 'astrology', icon: Stars, title: 'Astrology', desc: 'Birth chart, planets, and life path analysis.' },
    { key: 'tarot', icon: Sparkles, title: 'Tarot', desc: 'Intuitive guidance through the cards.' },
    { key: 'numerology', icon: Hash, title: 'Numerology', desc: 'Your personal roadmap through the mystery of numbers.' },
    { key: 'mood-coaching', icon: MoonStar, title: 'Mood Coaching', desc: 'Energy, emotional balance, and spiritual awareness.' },
    { key: 'career', icon: BriefcaseBusiness, title: 'Career', desc: 'Career and goal guidance from a cosmic perspective.' },
    { key: 'relationship', icon: HeartHandshake, title: 'Relationship Guidance', desc: 'Compatibility analysis and emotional guidance.' },
  ],
};

const COPY = {
  tr: {
    label: 'Uzmanlık Alanları',
    title: 'Ne arıyorsunuz?',
    desc: 'Her ihtiyaca özel danışman ve uzmanlık alanı.',
    cta: 'Danışman Ara',
    count: 'danışman',
  },
  en: {
    label: 'Areas of Expertise',
    title: 'What are you looking for?',
    desc: 'Specialists for every need, at your fingertips.',
    cta: 'Browse Consultants',
    count: 'consultants',
  },
};

function asArray(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && Array.isArray((value as any).data)) return (value as any).data;
  if (value && typeof value === 'object' && Array.isArray((value as any).items)) return (value as any).items;
  return [];
}

function normalizeExpertise(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).toLowerCase());
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).toLowerCase());
    } catch {
      return value.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
    }
  }
  return [];
}

function countByExpertise(rows: any[], key: string, title: string): number {
  const needles = new Set([
    key.toLowerCase(),
    title.toLowerCase(),
    title.toLocaleLowerCase('tr-TR'),
  ]);

  return rows.filter((row) => {
    const expertise = normalizeExpertise(row?.expertise);
    return expertise.some((item) => needles.has(item) || item.includes(key.toLowerCase()));
  }).length;
}

export default function ExpertiseCategoriesSection({ locale: explicitLocale }: { locale?: string }) {
  const locale = useLocaleShort(explicitLocale) || 'tr';
  const copy = COPY[locale as keyof typeof COPY] ?? COPY.tr;
  const cats = CATEGORIES[locale as keyof typeof CATEGORIES] ?? CATEGORIES.tr;
  const [counts, setCounts] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    let cancelled = false;

    async function loadCounts() {
      try {
        const res = await fetch(`${BASE_URL}/consultants`);
        if (!res.ok) return;
        const json = await res.json();
        const rows = asArray(json);
        if (cancelled) return;

        setCounts(Object.fromEntries(
          cats.map((cat) => [cat.key, countByExpertise(rows, cat.key, cat.title)]),
        ));
      } catch {
        if (!cancelled) setCounts({});
      }
    }

    loadCounts();
    return () => {
      cancelled = true;
    };
  }, [cats]);

  return (
    <section
      className="py-28 lg:py-36"
      style={{ padding: '7rem 4%', background: 'var(--color-bg-card)' }}
    >
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center max-w-[600px] mx-auto mb-16 reveal">
          <span className="section-label">{copy.label}</span>
          <h2 className="font-serif text-[clamp(2rem,4vw,3.4rem)] font-light leading-[1.2] mb-5">
            {copy.title}
          </h2>
          <p className="text-text-secondary font-light leading-[1.8] text-base">
            {copy.desc}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-6">
          {cats.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Link
                key={i}
                href={`${localizePath(locale, '/consultants')}?expertise=${encodeURIComponent(cat.key)}`}
                className="group flex flex-col items-start gap-3 p-6 rounded-2xl border border-border bg-bg-primary hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all duration-300 reveal"
              >
                <span className="flex size-10 items-center justify-center rounded-full border border-border-light bg-bg-card text-brand-primary transition-colors group-hover:border-brand-primary">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-serif text-[1.05rem] text-text mb-1 group-hover:text-brand-primary transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-text-muted leading-[1.6]">{cat.desc}</p>
                  <p className="mt-3 text-[0.7rem] uppercase tracking-[0.18em] text-brand-primary">
                    {counts[cat.key] ?? 0} {copy.count}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-12 reveal">
          <Link href={localizePath(locale, '/consultants')} className="btn-outline-premium">
            {copy.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
