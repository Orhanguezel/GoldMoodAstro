export const ROUTES = {
  home: '/',
  about: '/about',
  consultants: {
    index: '/consultants',
    detail: (id: string) => `/consultants/${id}`,
  },
  blog: {
    index: '/blog',
    detail: (slug: string) => `/blog/${slug}`,
  },
  booking: {
    start: '/booking',
    payment: '/booking/payment',
  },
  profile: {
    index: '/profile',
    bookings: '/profile/bookings',
  },
  contact: '/contact',
  faqs: '/faqs',
  legal: {
    terms: '/terms',
    privacy: '/privacy-policy',
    cookie: '/cookie-policy',
    kvkk: '/kvkk',
  },
} as const;
