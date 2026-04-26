// Centralized API endpoint constants — used by all Ensotek frontends

export const API_ENDPOINTS = {
  HEALTH: '/health',

  PUBLIC: {
    PRODUCTS: {
      LIST: '/products',
      BY_SLUG: (slug: string) => `/products/by-slug/${slug}`,
      BY_ID: (id: string) => `/products/id/${id}`,
    },
    CATEGORIES: {
      LIST: '/categories',
      BY_SLUG: (slug: string) => `/categories/by-slug/${slug}`,
      DETAIL: (id: string) => `/categories/${id}`,
    },
    SUB_CATEGORIES: {
      LIST: '/sub-categories',
      BY_SLUG: (slug: string) => `/sub-categories/by-slug/${slug}`,
      DETAIL: (id: string) => `/sub-categories/${id}`,
    },
    SERVICES: {
      LIST: '/services',
      BY_SLUG: (slug: string) => `/services/by-slug/${slug}`,
      DETAIL: (id: string) => `/services/${id}`,
      IMAGES: (id: string) => `/services/${id}/images`,
    },
    REFERENCES: {
      LIST: '/references',
      BY_SLUG: (slug: string) => `/references/by-slug/${slug}`,
      DETAIL: (id: string) => `/references/${id}`,
    },
    PROJECTS: {
      LIST: '/projects',
      BY_SLUG: (slug: string) => `/projects/by-slug/${slug}`,
      BY_ID: (id: string) => `/projects/${id}`,
      IMAGES: (id: string) => `/projects/${id}/images`,
    },
    SLIDERS: {
      LIST: '/sliders',
      DETAIL: (idOrSlug: string) => `/sliders/${idOrSlug}`,
    },
    MENU_ITEMS: {
      LIST: '/menu_items',
      DETAIL: (id: string) => `/menu_items/${id}`,
    },
    FOOTER_SECTIONS: {
      LIST: '/footer_sections',
      BY_SLUG: (slug: string) => `/footer_sections/by-slug/${slug}`,
    },
    FAQS: {
      LIST: '/faqs',
      BY_SLUG: (slug: string) => `/faqs/by-slug/${slug}`,
    },
    REVIEWS: {
      LIST: '/reviews',
      DETAIL: (id: string) => `/reviews/${id}`,
      REACTIONS: (id: string) => `/reviews/${id}/reactions`,
    },
    SITE_SETTINGS: {
      BY_KEY: (key: string) => `/site_settings/${key}`,
      APP_LOCALES: '/site_settings/app-locales',
      DEFAULT_LOCALE: '/site_settings/default-locale',
    },
    CUSTOM_PAGES: {
      LIST: '/custom_pages',
      BY_SLUG: (slug: string) => `/custom_pages/by-slug/${slug}`,
    },
    LIBRARY: {
      LIST: '/library',
      BY_ID: (id: string) => `/library/${id}`,
      BY_SLUG: (slug: string) => `/library/by-slug/${slug}`,
      IMAGES: (id: string) => `/library/${id}/images`,
      FILES: (id: string) => `/library/${id}/files`,
    },
    CONTACTS: '/contacts',
    OFFERS: '/offers',
    CATALOG_REQUESTS: '/catalog-requests',
    NEWSLETTER: {
      SUBSCRIBE: '/newsletter/subscribe',
      UNSUBSCRIBE: '/newsletter/unsubscribe',
    },
  },
} as const;
