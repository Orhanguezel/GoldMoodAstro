import Link from 'next/link';

import { fetchUiStrings } from '@/i18n/fetchUiStrings.server';
import { toLocalizedPublicPath, type PublicLocale } from '@/i18n/localizedRoutes';

type Props = { locale: string; mode: 'hub' | 'backlink' };

const TARGETS = [
  { path: '/buyuk-uclu', key: 'ui_rising_cluster_big_three', fallback: { tr: 'Büyük Üçlü', en: 'Big Three', de: 'Die großen Drei' } },
  { path: '/burcunu-ogren', key: 'ui_rising_cluster_find_sign', fallback: { tr: 'Burcunu Öğren', en: 'Find Your Zodiac Sign', de: 'Sternzeichen finden' } },
  { path: '/birth-chart', key: 'ui_rising_cluster_birth_chart', fallback: { tr: 'Doğum Haritası', en: 'Birth Chart', de: 'Geburtshoroskop' } },
  { path: '/burclar/uyum', key: 'ui_rising_cluster_compatibility', fallback: { tr: '78 Burç Uyumu', en: '78 Compatibility Combinations', de: '78 Kompatibilitätskombinationen' } },
] as const;

function asLocale(locale: string): PublicLocale {
  return locale === 'en' || locale === 'de' ? locale : 'tr';
}

export default async function RisingSignClusterLinks({ locale: rawLocale, mode }: Props) {
  const locale = asLocale(rawLocale);
  const selectedTargets = mode === 'hub'
    ? TARGETS
    : [{ path: '/yukselen-burc-hesaplayici', key: 'ui_rising_cluster_calculator', fallback: { tr: 'Yükselen Burç Hesaplayıcı', en: 'Rising Sign Calculator', de: 'Aszendent-Rechner' } }] as const;
  const fallbacks: Record<string, string> = {
    [mode === 'hub' ? 'ui_rising_cluster_hub_title' : 'ui_rising_cluster_back_title']: mode === 'hub'
      ? (locale === 'tr' ? 'Hesaplamanı derinleştir' : locale === 'de' ? 'Berechnung vertiefen' : 'Explore your result further')
      : (locale === 'tr' ? 'Yükselen burcunu hesapla' : locale === 'de' ? 'Aszendenten berechnen' : 'Calculate your rising sign'),
    [mode === 'hub' ? 'ui_rising_cluster_hub_intro' : 'ui_rising_cluster_back_intro']: mode === 'hub'
      ? (locale === 'tr' ? 'Yükseleni büyük üçlü, doğum haritası ve ilişki bağlamıyla birlikte okuyun.' : locale === 'de' ? 'Lies den Aszendenten zusammen mit den großen Drei, dem Geburtshoroskop und dem Beziehungskontext.' : 'Read the ascendant together with the big three, birth chart and relationship context.')
      : (locale === 'tr' ? 'Doğum saati ve yerini kullanarak yükselen burcunu hesapla.' : locale === 'de' ? 'Berechne deinen Aszendenten mit Geburtszeit und Geburtsort.' : 'Use birth time and place to calculate your rising sign.'),
  };
  for (const target of selectedTargets) fallbacks[target.key] = target.fallback[locale];
  const ui = await fetchUiStrings(locale, fallbacks);

  return (
    <section className="mx-auto my-12 max-w-5xl rounded-3xl border border-(--gm-border-soft) bg-(--gm-surface) p-7 md:p-9">
      <h2 className="font-serif text-2xl text-(--gm-text)">
        {ui[mode === 'hub' ? 'ui_rising_cluster_hub_title' : 'ui_rising_cluster_back_title']}
      </h2>
      <p className="mt-2 text-sm leading-6 text-(--gm-text-dim)">
        {ui[mode === 'hub' ? 'ui_rising_cluster_hub_intro' : 'ui_rising_cluster_back_intro']}
      </p>
      <ul className={`mt-5 grid gap-3 ${mode === 'hub' ? 'sm:grid-cols-2 lg:grid-cols-4' : ''}`}>
        {selectedTargets.map((target) => (
          <li key={target.path}>
            <Link
              href={`/${locale}${toLocalizedPublicPath(locale, target.path)}`}
              className="block rounded-xl border border-(--gm-border-soft) px-4 py-3 text-sm font-semibold text-(--gm-gold) transition hover:border-(--gm-gold)/50 hover:bg-(--gm-gold)/5"
            >
              {ui[target.key]} →
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
