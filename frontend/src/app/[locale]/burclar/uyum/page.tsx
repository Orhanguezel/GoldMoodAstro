import type { Metadata } from 'next';
import Link from 'next/link';

import PageContainer from '@/components/common/PageContainer';
import { fetchUiStrings } from '@/i18n/fetchUiStrings.server';
import {
  canonicalSignPair,
  toLocalizedPublicPath,
  ZODIAC_SIGN_ORDER,
  type PublicLocale,
} from '@/i18n/localizedRoutes';
import { SIGN_LABELS, SIGN_SYMBOLS } from '@/lib/zodiac/pair';
import { buildPageMetadata } from '@/seo/server';

type Props = { params: Promise<{ locale: string }> };

const FALLBACKS: Record<PublicLocale, Record<string, string>> = {
  tr: {
    ui_compat_hub_eyebrow: '78 burç çifti',
    ui_compat_hub_title: 'Burç Uyumu: Tüm Kombinasyonlar',
    ui_compat_hub_intro: 'Element ve nitelik, iki burcun ilişki ritmini anlamak için başlangıç noktasıdır. Bu rehber kesin sonuç vermez; 78 eşsiz kombinasyonu kişisel farkındalık çerçevesinde karşılaştırır.',
    ui_compat_hub_group_suffix: 'burcu uyumları',
    ui_compat_hub_profile_action: 'Burç profilini aç',
  },
  en: {
    ui_compat_hub_eyebrow: '78 sign pairs',
    ui_compat_hub_title: 'Zodiac Compatibility: All Combinations',
    ui_compat_hub_intro: 'Element and modality are a starting point for understanding how two signs relate. This guide makes no guarantees; it compares all 78 unique combinations for personal reflection.',
    ui_compat_hub_group_suffix: 'compatibility combinations',
    ui_compat_hub_profile_action: 'Open sign profile',
  },
  de: {
    ui_compat_hub_eyebrow: '78 Zeichenpaare',
    ui_compat_hub_title: 'Sternzeichen-Kompatibilität: Alle Kombinationen',
    ui_compat_hub_intro: 'Element und Qualität sind ein Ausgangspunkt, um die Beziehungsdynamik zweier Zeichen zu verstehen. Dieser Leitfaden gibt keine Garantien und vergleicht alle 78 einzigartigen Kombinationen zur persönlichen Reflexion.',
    ui_compat_hub_group_suffix: 'Kompatibilitätskombinationen',
    ui_compat_hub_profile_action: 'Sternzeichenprofil öffnen',
  },
};

const META_FALLBACKS: Record<PublicLocale, { title: string; description: string }> = {
  tr: {
    title: 'Burç Uyumu — 78 Kombinasyon Rehberi',
    description: 'Koçtan Balığa 78 eşsiz burç uyumu kombinasyonunu element, nitelik ve ilişki dinamikleriyle karşılaştırın.',
  },
  en: {
    title: 'Zodiac Compatibility — All 78 Sign Combinations',
    description: 'Compare all 78 unique zodiac compatibility combinations through element, modality and relationship dynamics.',
  },
  de: {
    title: 'Sternzeichen-Kompatibilität — Alle 78 Kombinationen',
    description: 'Vergleiche alle 78 einzigartigen Sternzeichen-Kombinationen nach Element, Qualität und Beziehungsdynamik.',
  },
};

function asLocale(locale: string): PublicLocale {
  return locale === 'en' || locale === 'de' ? locale : 'tr';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = asLocale(rawLocale);
  return buildPageMetadata({
    locale,
    pageKey: 'burclar-uyumu',
    pathname: '/burclar/uyum',
    fallback: META_FALLBACKS[locale],
  });
}

export default async function CompatibilityHubPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = asLocale(rawLocale);
  const ui = await fetchUiStrings(locale, FALLBACKS[locale]);

  return (
    <PageContainer className="bg-(--gm-bg)" verticalPadding="large">
      <header className="mx-auto max-w-4xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-(--gm-gold-dim)">
          {ui.ui_compat_hub_eyebrow}
        </p>
        <h1 className="mt-4 font-serif text-4xl text-(--gm-text) md:text-5xl">
          {ui.ui_compat_hub_title}
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-(--gm-text-dim)">
          {ui.ui_compat_hub_intro}
        </p>
      </header>

      <div className="mx-auto mt-14 grid max-w-6xl gap-8 lg:grid-cols-2">
        {ZODIAC_SIGN_ORDER.map((sign) => {
          const label = SIGN_LABELS[locale]?.[sign] ?? sign;
          const profileHref = `/${locale}${toLocalizedPublicPath(locale, `/burclar/${sign}`)}`;
          return (
            <section key={sign} className="rounded-3xl border border-(--gm-border-soft) bg-(--gm-surface) p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="font-serif text-2xl text-(--gm-text)">
                  <span aria-hidden="true" className="mr-2 text-(--gm-gold)">{SIGN_SYMBOLS[sign]}</span>
                  {label} {ui.ui_compat_hub_group_suffix}
                </h2>
                <Link href={profileHref} className="text-xs font-semibold text-(--gm-gold) hover:underline">
                  {ui.ui_compat_hub_profile_action}
                </Link>
              </div>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ZODIAC_SIGN_ORDER.map((otherSign) => {
                  const pair = canonicalSignPair(sign, otherSign)!;
                  const otherLabel = SIGN_LABELS[locale]?.[otherSign] ?? otherSign;
                  const href = `/${locale}${toLocalizedPublicPath(locale, `/burclar/uyum/${pair.slug}`)}`;
                  return (
                    <li key={otherSign}>
                      <Link
                        href={href}
                        className="block rounded-xl border border-(--gm-border-soft) px-3 py-2 text-sm text-(--gm-text-dim) transition hover:border-(--gm-gold)/50 hover:text-(--gm-gold)"
                      >
                        {label} · {otherLabel}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </PageContainer>
  );
}
