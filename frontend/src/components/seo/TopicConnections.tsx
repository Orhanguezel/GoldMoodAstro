import Link from 'next/link';

import { localizedPath } from '@/integrations/shared';
import type { LandingKey, LandingLocale } from './seo-landing-content';

type TopicLink = {
  path: string;
  label: Record<LandingLocale, string>;
};

const LINKS: Record<LandingKey, TopicLink[]> = {
  'birth-chart': [
    { path: '/yukselen-burc-hesaplayici', label: { tr: 'Yükselen burç', en: 'Rising sign', de: 'Aszendent' } },
    { path: '/buyuk-uclu', label: { tr: 'Büyük üçlü', en: 'Big three', de: 'Die großen Drei' } },
    { path: '/burclar', label: { tr: 'Burç rehberleri', en: 'Zodiac guides', de: 'Sternzeichen-Ratgeber' } },
    { path: '/sinastri', label: { tr: 'Sinastri', en: 'Synastry', de: 'Synastrie' } },
  ],
  'yukselen-burc': [
    { path: '/birth-chart', label: { tr: 'Doğum haritası', en: 'Birth chart', de: 'Geburtshoroskop' } },
    { path: '/buyuk-uclu', label: { tr: 'Büyük üçlü', en: 'Big three', de: 'Die großen Drei' } },
    { path: '/burclar', label: { tr: 'Burç rehberleri', en: 'Zodiac guides', de: 'Sternzeichen-Ratgeber' } },
  ],
  'buyuk-uclu': [
    { path: '/birth-chart', label: { tr: 'Doğum haritası', en: 'Birth chart', de: 'Geburtshoroskop' } },
    { path: '/yukselen-burc-hesaplayici', label: { tr: 'Yükselen burç', en: 'Rising sign', de: 'Aszendent' } },
    { path: '/burcunu-ogren', label: { tr: 'Burcunu öğren', en: 'Discover your sign', de: 'Sternzeichen finden' } },
  ],
  burclar: [
    { path: '/burcunu-ogren', label: { tr: 'Burcunu öğren', en: 'Discover your sign', de: 'Sternzeichen finden' } },
    { path: '/daily', label: { tr: 'Günlük burçlar', en: 'Daily horoscopes', de: 'Tageshoroskope' } },
    { path: '/birth-chart', label: { tr: 'Doğum haritası', en: 'Birth chart', de: 'Geburtshoroskop' } },
  ],
  'burcunu-ogren': [
    { path: '/burclar', label: { tr: 'Burç rehberleri', en: 'Zodiac guides', de: 'Sternzeichen-Ratgeber' } },
    { path: '/birth-chart', label: { tr: 'Doğum haritası', en: 'Birth chart', de: 'Geburtshoroskop' } },
    { path: '/yukselen-burc-hesaplayici', label: { tr: 'Yükselen burç', en: 'Rising sign', de: 'Aszendent' } },
  ],
  sinastri: [
    { path: '/birth-chart', label: { tr: 'Doğum haritası', en: 'Birth chart', de: 'Geburtshoroskop' } },
    { path: '/buyuk-uclu', label: { tr: 'Büyük üçlü', en: 'Big three', de: 'Die großen Drei' } },
    { path: '/consultants', label: { tr: 'Danışmanlar', en: 'Consultants', de: 'Berater' } },
  ],
  tarot: [
    { path: '/kahve-fali', label: { tr: 'Kahve falı', en: 'Coffee reading', de: 'Kaffeesatzlesen' } },
    { path: '/ruya-tabiri', label: { tr: 'Rüya tabiri', en: 'Dream interpretation', de: 'Traumdeutung' } },
    { path: '/consultants', label: { tr: 'Tarot danışmanları', en: 'Tarot consultants', de: 'Tarot-Berater' } },
  ],
  'kahve-fali': [
    { path: '/tarot', label: { tr: 'Tarot', en: 'Tarot', de: 'Tarot' } },
    { path: '/ruya-tabiri', label: { tr: 'Rüya tabiri', en: 'Dream interpretation', de: 'Traumdeutung' } },
    { path: '/consultants', label: { tr: 'Danışmanlar', en: 'Consultants', de: 'Berater' } },
  ],
  'ruya-tabiri': [
    { path: '/kahve-fali', label: { tr: 'Kahve falı', en: 'Coffee reading', de: 'Kaffeesatzlesen' } },
    { path: '/tarot', label: { tr: 'Tarot', en: 'Tarot', de: 'Tarot' } },
    { path: '/blog', label: { tr: 'İlgili rehberler', en: 'Related guides', de: 'Passende Ratgeber' } },
  ],
  numeroloji: [
    { path: '/yildizname', label: { tr: 'Yıldızname', en: 'Yildizname', de: 'Yildizname' } },
    { path: '/birth-chart', label: { tr: 'Doğum haritası', en: 'Birth chart', de: 'Geburtshoroskop' } },
    { path: '/blog', label: { tr: 'Numeroloji rehberleri', en: 'Numerology guides', de: 'Numerologie-Ratgeber' } },
  ],
  yildizname: [
    { path: '/numeroloji', label: { tr: 'Numeroloji', en: 'Numerology', de: 'Numerologie' } },
    { path: '/birth-chart', label: { tr: 'Doğum haritası', en: 'Birth chart', de: 'Geburtshoroskop' } },
    { path: '/consultants', label: { tr: 'Danışmanlar', en: 'Consultants', de: 'Berater' } },
  ],
  consultants: [
    { path: '/pricing', label: { tr: 'Seans ve fiyatlar', en: 'Sessions and pricing', de: 'Sitzungen und Preise' } },
    { path: '/about', label: { tr: 'Onay yaklaşımımız', en: 'Our verification approach', de: 'Unser Prüfverfahren' } },
    { path: '/faqs', label: { tr: 'Sık sorulan sorular', en: 'Frequently asked questions', de: 'Häufige Fragen' } },
  ],
  pricing: [
    { path: '/consultants', label: { tr: 'Danışmanları karşılaştır', en: 'Compare consultants', de: 'Berater vergleichen' } },
    { path: '/faqs', label: { tr: 'Ödeme ve seans SSS', en: 'Payment and session FAQ', de: 'Zahlungs- und Sitzungs-FAQ' } },
    { path: '/about', label: { tr: 'Nasıl çalışıyoruz?', en: 'How we work', de: 'Wie wir arbeiten' } },
  ],
};

export default function TopicConnections({ type, locale }: { type: LandingKey; locale: string }) {
  const lang: LandingLocale = locale === 'en' || locale === 'de' ? locale : 'tr';
  const heading = lang === 'tr' ? 'İlgili araç ve rehberler' : lang === 'de' ? 'Passende Tools und Ratgeber' : 'Related tools and guides';

  return (
    <nav
      aria-label={heading}
      className="mx-auto mt-8 flex max-w-[var(--gm-w-content)] flex-wrap items-center justify-center gap-2 border-t border-(--gm-border-soft) pt-6"
    >
      <span className="mr-2 text-[11px] font-bold uppercase tracking-[0.2em] text-(--gm-text-muted)">{heading}</span>
      {LINKS[type].map((item) => (
        <Link
          key={item.path}
          href={localizedPath(locale, item.path, 'tr')}
          className="rounded-full border border-(--gm-border-soft) px-4 py-2 text-sm text-(--gm-text-dim) no-underline transition-colors hover:border-(--gm-gold)/40 hover:text-(--gm-gold)"
        >
          {item.label[lang]}
        </Link>
      ))}
    </nav>
  );
}
