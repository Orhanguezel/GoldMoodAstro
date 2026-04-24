// src/seo/jsonld.ts
export type Thing = Record<string, unknown>;

export function graph(items: Thing[]): Thing {
  // Google, @graph formatını sever; çoklu schema objesini tek scriptte basmak için idealdir.
  return {
    '@context': 'https://schema.org',
    '@graph': Array.isArray(items) ? items : [],
  };
}

export function sameAsFromSocials(socials?: Record<string, unknown> | null): string[] {
  const s = socials && typeof socials === 'object' ? socials : {};
  const urls: string[] = [];

  for (const key of Object.keys(s)) {
    const raw = (s as any)[key];
    const v = typeof raw === 'string' ? raw.trim() : String(raw ?? '').trim();
    if (!v) continue;

    // Sadece http(s) olanları al
    if (!/^https?:\/\//i.test(v)) continue;

    urls.push(v);
  }

  // uniq
  return Array.from(new Set(urls));
}

export function org(input: {
  id?: string; // e.g. "https://site.com/#org"
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[];
}): Thing {
  return {
    '@type': 'Organization',
    ...(input.id ? { '@id': input.id } : {}),
    name: input.name,
    url: input.url,
    ...(input.logo ? { logo: input.logo } : {}),
    ...(input.sameAs?.length ? { sameAs: input.sameAs } : {}),
  };
}

export function website(input: {
  id?: string; // e.g. "https://site.com/#website"
  name: string;
  url: string;
  publisherId?: string; // org @id reference
  searchUrlTemplate?: string;
}): Thing {
  const base: Thing = {
    '@type': 'WebSite',
    ...(input.id ? { '@id': input.id } : {}),
    name: input.name,
    url: input.url,
    ...(input.publisherId ? { publisher: { '@id': input.publisherId } } : {}),
  };

  if (input.searchUrlTemplate) {
    (base as any).potentialAction = {
      '@type': 'SearchAction',
      target: input.searchUrlTemplate,
      'query-input': 'required name=q',
    };
  }

  return base;
}

export function product(input: {
  name: string;
  description?: string;
  image?: string | string[];
  sku?: string;
  brand?: string;
  offers?:
    | {
        price: number;
        priceCurrency: string;
        availability?: string;
        url?: string;
      }
    | Array<{
        price: number;
        priceCurrency: string;
        availability?: string;
        url?: string;
      }>;
}): Thing {
  return { '@context': 'https://schema.org', '@type': 'Product', ...input };
}

export function article(input: {
  headline: string;
  image?: string | string[];
  datePublished?: string;
  dateModified?: string;
  author?: { name: string };
}): Thing {
  return { '@context': 'https://schema.org', '@type': 'Article', ...input };
}

export function breadcrumb(items: Array<{ name: string; item: string }>): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.item,
    })),
  };
}

export function localBusiness(input: {
  id?: string;
  name: string;
  alternateName?: string;
  description: string;
  url: string;
  telephone?: string;
  email?: string;
  address?: {
    streetAddress?: string;
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry: string;
  };
  geo?: { latitude: number; longitude: number };
  founder?: { name: string };
  priceRange?: string;
  image?: string;
  logo?: string;
  sameAs?: string[];
  openingHours?: string[];
  serviceType?: string;
  areaServed?: string;
}): Thing {
  return {
    '@type': ['HealthAndBeautyBusiness', 'LocalBusiness'],
    ...(input.id ? { '@id': input.id } : {}),
    name: input.name,
    ...(input.alternateName ? { alternateName: input.alternateName } : {}),
    description: input.description,
    url: input.url,
    ...(input.telephone ? { telephone: input.telephone } : {}),
    ...(input.email ? { email: input.email } : {}),
    ...(input.address
      ? {
          address: {
            '@type': 'PostalAddress',
            ...input.address,
          },
        }
      : {}),
    ...(input.geo
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: input.geo.latitude,
            longitude: input.geo.longitude,
          },
        }
      : {}),
    ...(input.founder
      ? { founder: { '@type': 'Person', name: input.founder.name } }
      : {}),
    ...(input.priceRange ? { priceRange: input.priceRange } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.logo ? { logo: input.logo } : {}),
    ...(input.sameAs?.length ? { sameAs: input.sameAs } : {}),
    ...(input.openingHours?.length ? { openingHoursSpecification: input.openingHours } : {}),
    ...(input.serviceType
      ? {
          makesOffer: {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              serviceType: input.serviceType,
              ...(input.areaServed
                ? { areaServed: { '@type': 'City', name: input.areaServed } }
                : {}),
            },
          },
        }
      : {}),
  };
}

export function faqPage(items: Array<{ question: string; answer: string }>): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: it.answer,
      },
    })),
  };
}
