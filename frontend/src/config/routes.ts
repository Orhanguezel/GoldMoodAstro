export const ROUTES = {
  home: '/',
  about: '/uber-mich',
  treatments: {
    index: '/behandlungen',
    detail: (slug: string) => `/behandlungen/${slug}`,
  },
  benefits: '/vorteile',
  pricing: '/preise',
  blog: {
    index: '/blog',
    detail: (slug: string) => `/blog/${slug}`,
  },
  contact: '/kontakt',
  booking: {
    start: '/buchen',
    appointment: '/buchen/termin',
    confirmation: '/buchen/bestatigung',
  },
  legal: {
    imprint: '/impressum',
    privacy: '/datenschutz',
    cookie: '/cookie-richtlinie',
    terms: '/agb',
  },
} as const;

