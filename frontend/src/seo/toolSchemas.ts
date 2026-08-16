import type { Thing } from './jsonld';

type WebAppInput = {
  siteUrl: string;
  locale: string;
  path: string;
  name: string;
  description: string;
  featureList?: string[];
};

export function webApplicationSchema(input: WebAppInput): Thing {
  const url = `${input.siteUrl}/${input.locale}${input.path}`;

  return {
    '@type': 'WebApplication',
    '@id': `${url}#webapp`,
    name: input.name,
    url,
    description: input.description,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web browser',
    browserRequirements: 'Requires JavaScript and a modern web browser.',
    inLanguage: input.locale,
    provider: { '@id': `${input.siteUrl}/#org` },
    ...(input.featureList?.length ? { featureList: input.featureList } : {}),
    offers: {
      '@type': 'Offer',
      price: 0,
      priceCurrency: 'TRY',
      availability: 'https://schema.org/InStock',
      url,
    },
  };
}

export function pricingOfferCatalogSchema(siteUrl: string, locale: string): Thing {
  const url = `${siteUrl}/${locale}/pricing`;
  const offers = [
    {
      name: locale === 'tr' ? 'Ücretsiz Başlangıç' : 'Free Starter',
      description:
        locale === 'tr'
          ? 'Temel günlük yorumlar ve başlangıç seviye astroloji araçları.'
          : 'Core daily readings and starter astrology tools.',
      price: 0,
    },
    {
      name: locale === 'tr' ? 'Aylık Premium' : 'Monthly Premium',
      description:
        locale === 'tr'
          ? 'Premium yorumlar, sinastri, transit takibi ve öncelikli destek.'
          : 'Premium readings, synastry, transit tracking and priority support.',
      price: 149,
    },
    {
      name: locale === 'tr' ? 'Yıllık Premium' : 'Yearly Premium',
      description:
        locale === 'tr'
          ? 'Yıllık avantajlı premium erişim ve gelişmiş danışmanlık özellikleri.'
          : 'Yearly premium access with advanced guidance features.',
      price: 1499,
    },
  ];

  return {
    '@type': 'OfferCatalog',
    '@id': `${url}#offer-catalog`,
    name: locale === 'tr' ? 'GoldMoodAstro Fiyatlandırma Kataloğu' : 'GoldMoodAstro Pricing Catalog',
    url,
    itemListElement: offers.map((offer) => ({
      '@type': 'Offer',
      name: offer.name,
      description: offer.description,
      price: offer.price,
      priceCurrency: 'TRY',
      availability: 'https://schema.org/InStock',
      url,
      itemOffered: {
        '@type': 'Service',
        name: offer.name,
        provider: { '@id': `${siteUrl}/#org` },
        serviceType: 'Astrology and spiritual consultation',
      },
    })),
  };
}
