// =============================================================
// FILE: src/modules/db_admin/moduleManifest.ts
// Ensotek – Module Manifest (DATA-only import/export allowlist)
// Dashboard modülleri ile hizalı + Ensotek i18n tabloları eklendi
// =============================================================

export type ModuleKey =
  | 'products'
  | 'categories'
  | 'subcategories'
  | 'services'
  | 'faqs'
  | 'contacts'
  | 'newsletter'
  | 'email_templates'
  | 'site_settings'
  | 'custom_pages'
  | 'menuitem'
  | 'slider'
  | 'footer_sections'
  | 'library'
  | 'reviews'
  | 'support'
  | 'users'
  | 'offers'
  | 'storage';

export type ModuleManifest = {
  /** Yalnızca bu tablolar export/import kapsamındadır */
  tablesInOrder: string[];

  /**
   * truncateBefore=true ise bu sırayla TRUNCATE edilir.
   * Yoksa varsayılan olarak tablesInOrder ters çevrilir.
   */
  truncateInOrder?: string[];

  allowSchema?: false;

  /** Opsiyonel açıklama */
  note?: string;
};

export const MODULES: Record<ModuleKey, ModuleManifest> = {
  // -------------------------------------------------------------------
  // SITE SETTINGS (UI JSON'lar, locale bazlı)
  // -------------------------------------------------------------------
  site_settings: {
    tablesInOrder: [
      'site_settings',
      // Eğer locale listesi ayrı tablo ise:
      // 'app_locales',
    ],
    truncateInOrder: [
      'site_settings',
      // 'app_locales',
    ],
    allowSchema: false,
    note: 'site_settings: ui_* ve diğer ayarlar locale bazlı JSON value ile tutulur. UI export/bootstrap için ana kaynak.',
  },

  // -------------------------------------------------------------------
  // PRODUCTS (Ensotek pattern)
  // -------------------------------------------------------------------
  products: {
    tablesInOrder: [
      'products',
      'product_i18n',
      'product_images',
      'product_images_i18n',
      'product_specs',
      'product_spec_i18n',
    ],
    truncateInOrder: [
      'product_spec_i18n',
      'product_specs',
      'product_images_i18n',
      'product_images',
      'product_i18n',
      'products',
    ],
    allowSchema: false,
    note: 'Products: base + i18n + images + specs (Ensotek i18n pattern).',
  },

  // -------------------------------------------------------------------
  // CATEGORIES (Ensotek pattern)
  // -------------------------------------------------------------------
  categories: {
    tablesInOrder: ['categories', 'categories_i18n'],
    truncateInOrder: ['categories_i18n', 'categories'],
    allowSchema: false,
    note: 'Categories: base + i18n.',
  },

  // -------------------------------------------------------------------
  // SUBCATEGORIES (Ensotek pattern)
  // -------------------------------------------------------------------
  subcategories: {
    tablesInOrder: ['sub_categories', 'sub_categories_i18n'],
    truncateInOrder: ['sub_categories_i18n', 'sub_categories'],
    allowSchema: false,
    note: 'Subcategories: base + i18n (DB: sub_categories).',
  },

  // -------------------------------------------------------------------
  // SERVICES (Ensotek pattern)
  // -------------------------------------------------------------------
  services: {
    tablesInOrder: ['services', 'service_i18n', 'service_images', 'service_images_i18n'],
    truncateInOrder: ['service_images_i18n', 'service_images', 'service_i18n', 'services'],
    allowSchema: false,
    note: 'Services: base + i18n + images.',
  },

  // -------------------------------------------------------------------
  // FAQS (çoğunlukla tek tablo; i18n varsa ekli)
  // -------------------------------------------------------------------
  faqs: {
    tablesInOrder: [
      'faqs',
      // i18n kullanıyorsanız:
      // 'faqs_i18n',
    ],
    truncateInOrder: [
      // 'faqs_i18n',
      'faqs',
    ],
    allowSchema: false,
    note: 'FAQs: çoğu projede tek tablo. i18n varsa faqs_i18n ekleyin.',
  },

  // -------------------------------------------------------------------
  // CONTACT MESSAGES (tek tablo)
  // -------------------------------------------------------------------
  contacts: {
    tablesInOrder: ['contact_messages'],
    truncateInOrder: ['contact_messages'],
    allowSchema: false,
    note: 'Contact messages: contact_messages.',
  },

  // -------------------------------------------------------------------
  // NEWSLETTER (tek tablo)
  // -------------------------------------------------------------------
  newsletter: {
    tablesInOrder: ['newsletter_subscribers'],
    truncateInOrder: ['newsletter_subscribers'],
    allowSchema: false,
    note: 'Newsletter subscribers: newsletter_subscribers.',
  },

  // -------------------------------------------------------------------
  // EMAIL TEMPLATES (çoğunlukla tek tablo; i18n varsa ekli)
  // -------------------------------------------------------------------
  email_templates: {
    tablesInOrder: [
      'email_templates',
      // i18n kullanıyorsanız:
      // 'email_templates_i18n',
    ],
    truncateInOrder: [
      // 'email_templates_i18n',
      'email_templates',
    ],
    allowSchema: false,
    note: 'Email templates: email_templates (i18n varsa email_templates_i18n ekleyin).',
  },

  // -------------------------------------------------------------------
  // CUSTOM PAGES (Ensotek pattern: base + i18n + images)
  // -------------------------------------------------------------------
  custom_pages: {
    tablesInOrder: [
      'custom_pages',
      'custom_pages_i18n',
      'custom_page_images',
      'custom_page_images_i18n',
    ],
    truncateInOrder: [
      'custom_page_images_i18n',
      'custom_page_images',
      'custom_pages_i18n',
      'custom_pages',
    ],
    allowSchema: false,
    note: 'Custom pages: base + i18n + images. (Tablo adlarını validate ile doğrulayın).',
  },

  // -------------------------------------------------------------------
  // MENU ITEMS (çoğunlukla tek tablo; i18n varsa ekli)
  // -------------------------------------------------------------------
  menuitem: {
    tablesInOrder: [
      'menu_items',
      // i18n kullanıyorsanız:
      // 'menu_items_i18n',
    ],
    truncateInOrder: [
      // 'menu_items_i18n',
      'menu_items',
    ],
    allowSchema: false,
    note: 'Menu items: menu_items (i18n varsa menu_items_i18n ekleyin).',
  },

  // -------------------------------------------------------------------
  // SLIDER (sizde slider + slider_i18n var)
  // -------------------------------------------------------------------
  slider: {
    tablesInOrder: ['slider', 'slider_i18n'],
    truncateInOrder: ['slider_i18n', 'slider'],
    allowSchema: false,
    note: 'Slider: base + i18n (slider_i18n).',
  },

  // -------------------------------------------------------------------
  // FOOTER SECTIONS (çoğunlukla tek tablo; i18n varsa ekli)
  // -------------------------------------------------------------------
  footer_sections: {
    tablesInOrder: [
      'footer_sections',
      // i18n kullanıyorsanız:
      // 'footer_sections_i18n',
    ],
    truncateInOrder: [
      // 'footer_sections_i18n',
      'footer_sections',
    ],
    allowSchema: false,
    note: 'Footer sections: footer_sections (i18n varsa footer_sections_i18n ekleyin).',
  },

  // -------------------------------------------------------------------
  // LIBRARY (sizde kesin pattern var: library + i18n + images + files)
  // -------------------------------------------------------------------
  library: {
    tablesInOrder: [
      'library',
      'library_i18n',
      'library_images',
      'library_images_i18n',
      'library_files',
    ],
    truncateInOrder: [
      'library_files',
      'library_images_i18n',
      'library_images',
      'library_i18n',
      'library',
    ],
    allowSchema: false,
    note: 'Library: base + i18n + images + files (Ensotek pattern).',
  },

  // -------------------------------------------------------------------
  // REVIEWS (tek tablo)
  // -------------------------------------------------------------------
  reviews: {
    tablesInOrder: ['reviews'],
    truncateInOrder: ['reviews'],
    allowSchema: false,
    note: 'Reviews: reviews.',
  },

  // -------------------------------------------------------------------
  // SUPPORT (çoğunlukla tek tablo)
  // -------------------------------------------------------------------
  support: {
    tablesInOrder: ['support_tickets'],
    truncateInOrder: ['support_tickets'],
    allowSchema: false,
    note: 'Support tickets: support_tickets.',
  },

  // -------------------------------------------------------------------
  // USERS (tek tablo)
  // -------------------------------------------------------------------
  users: {
    tablesInOrder: ['users'],
    truncateInOrder: ['users'],
    allowSchema: false,
    note: 'Users: users.',
  },

  // -------------------------------------------------------------------
  // OFFERS (projeye göre child tablolar olabilir)
  // -------------------------------------------------------------------
  offers: {
    tablesInOrder: [
      'offers',
      // varsa:
      // 'offer_items',
      // 'offer_messages',
      // 'offer_status_history',
    ],
    truncateInOrder: [
      // 'offer_status_history',
      // 'offer_messages',
      // 'offer_items',
      'offers',
    ],
    allowSchema: false,
    note: 'Offers: offers (child tablolar varsa ekleyin).',
  },

  // -------------------------------------------------------------------
  // STORAGE (assets)
  // -------------------------------------------------------------------
  storage: {
    tablesInOrder: ['storage_assets'],
    truncateInOrder: ['storage_assets'],
    allowSchema: false,
    note: 'Storage assets: storage_assets (projede varsa).',
  },
};

export function isModuleKey(x: unknown): x is ModuleKey {
  return typeof x === 'string' && (x as string) in MODULES;
}

export function getModuleTables(module: ModuleKey): string[] {
  return [...(MODULES[module]?.tablesInOrder || [])];
}
