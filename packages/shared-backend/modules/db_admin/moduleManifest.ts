// =============================================================
// FILE: src/modules/db_admin/moduleManifest.ts
// Ensotek – Module Manifest (DATA-only import/export allowlist)
// Dashboard modülleri ile hizalı + mevcut şemalara BİREBİR oturtuldu
// - i18n tabloları doğru isimlerle eklendi
// - gallery / child tabloları eklendi
// - support: ticket_replies eklendi
// - reviews: review_i18n eklendi
// - products: product_images_i18n / product_spec_i18n YOK (şemada yok) → kaldırıldı
// - custom pages: custom_page_images tabloları YOK (şemada yok) → kaldırıldı
// - services: services_i18n (DB adı: services_i18n) → düzeltildi
// - categories/subcategories: category_i18n / sub_category_i18n → düzeltildi
// =============================================================

export type ModuleKey =
  | 'products'
  | 'services'
  | 'pricing'
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

  /** Import/export sadece data-only. Şema taşınmaz. */
  allowSchema?: false;

  /** Opsiyonel açıklama */
  note?: string;
};

/**
 * Ensotek – Module Manifest (DATA-only import/export allowlist)
 *
 * ÖNEMLİ:
 * - Tablo isimleri DB’deki gerçek isimlerle birebir aynı olmalı.
 * - tablesInOrder: parent -> i18n -> gallery -> gallery_i18n -> other child
 * - truncateInOrder: child -> parent
 */
export const MODULES: Record<ModuleKey, ModuleManifest> = {
  // -------------------------------------------------------------------
  // SITE SETTINGS (locale bazlı)
  // -------------------------------------------------------------------
  site_settings: {
    tablesInOrder: ['site_settings'],
    truncateInOrder: ['site_settings'],
    allowSchema: false,
    note: 'site_settings: key+locale unique. UI metinleri ve config (value genelde JSON-string).',
  },

  // -------------------------------------------------------------------
  // PRODUCTS (şemaya birebir)
  // -------------------------------------------------------------------
  products: {
    tablesInOrder: [
      'products',
      'product_i18n',

      // locale kolonlu child tablolar
      'product_specs',
      'product_faqs',
      'product_images',

      // i18n olmayan ama ürünle bağlı tablolar
      'product_reviews',
      'product_options',
      'product_stock',
    ],
    truncateInOrder: [
      'product_stock',
      'product_options',
      'product_reviews',
      'product_images',
      'product_faqs',
      'product_specs',
      'product_i18n',
      'products',
    ],
    allowSchema: false,
    note: 'Products: products + product_i18n + locale child (specs/faqs/images) + reviews/options/stock.',
  },

  // -------------------------------------------------------------------
  // SERVICES (şemaya birebir: services_i18n + service_images + service_images_i18n)
  // -------------------------------------------------------------------
  services: {
    tablesInOrder: ['services', 'services_i18n', 'service_images', 'service_images_i18n'],
    truncateInOrder: ['service_images_i18n', 'service_images', 'services_i18n', 'services'],
    allowSchema: false,
    note: 'Services: services + services_i18n + service_images + service_images_i18n.',
  },

  pricing: {
    tablesInOrder: ['pricing_plans', 'pricing_plans_i18n'],
    truncateInOrder: ['pricing_plans_i18n', 'pricing_plans'],
    allowSchema: false,
    note: 'Pricing plans: pricing_plans + pricing_plans_i18n.',
  },

  // -------------------------------------------------------------------
  // FAQS (şemaya birebir: faqs + faqs_i18n)
  // -------------------------------------------------------------------
  faqs: {
    tablesInOrder: ['faqs', 'faqs_i18n'],
    truncateInOrder: ['faqs_i18n', 'faqs'],
    allowSchema: false,
    note: 'FAQs: faqs + faqs_i18n (parent+localized content).',
  },

  // -------------------------------------------------------------------
  // CONTACT MESSAGES
  // -------------------------------------------------------------------
  contacts: {
    tablesInOrder: ['contact_messages'],
    truncateInOrder: ['contact_messages'],
    allowSchema: false,
    note: 'Contact messages: contact_messages.',
  },

  // -------------------------------------------------------------------
  // NEWSLETTER
  // -------------------------------------------------------------------
  newsletter: {
    tablesInOrder: ['newsletter_subscribers'],
    truncateInOrder: ['newsletter_subscribers'],
    allowSchema: false,
    note: 'Newsletter: newsletter_subscribers (meta JSON-string, locale meta).',
  },

  // -------------------------------------------------------------------
  // EMAIL TEMPLATES (şemaya birebir: email_templates + email_templates_i18n)
  // -------------------------------------------------------------------
  email_templates: {
    tablesInOrder: ['email_templates', 'email_templates_i18n'],
    truncateInOrder: ['email_templates_i18n', 'email_templates'],
    allowSchema: false,
    note: 'Email templates: email_templates + email_templates_i18n (variables JSON-string).',
  },

  // -------------------------------------------------------------------
  // CUSTOM PAGES (şemaya birebir: custom_pages + custom_pages_i18n)
  // Not: Şemada custom_page_images yok. Görsel array alanları parent’ta.
  // -------------------------------------------------------------------
  custom_pages: {
    tablesInOrder: ['custom_pages', 'custom_pages_i18n'],
    truncateInOrder: ['custom_pages_i18n', 'custom_pages'],
    allowSchema: false,
    note: 'Custom pages: custom_pages + custom_pages_i18n (images/storage_image_ids parent’ta JSON-string array).',
  },

  // -------------------------------------------------------------------
  // MENU ITEMS (şemaya birebir: menu_items + menu_items_i18n)
  // -------------------------------------------------------------------
  menuitem: {
    tablesInOrder: ['menu_items', 'menu_items_i18n'],
    truncateInOrder: ['menu_items_i18n', 'menu_items'],
    allowSchema: false,
    note: 'Menu items: menu_items + menu_items_i18n.',
  },

  // -------------------------------------------------------------------
  // SLIDER (şemaya birebir)
  // -------------------------------------------------------------------
  slider: {
    tablesInOrder: ['slider', 'slider_i18n'],
    truncateInOrder: ['slider_i18n', 'slider'],
    allowSchema: false,
    note: 'Slider: slider + slider_i18n.',
  },

  // -------------------------------------------------------------------
  // FOOTER SECTIONS (şemaya birebir: footer_sections + footer_sections_i18n)
  // -------------------------------------------------------------------
  footer_sections: {
    tablesInOrder: ['footer_sections', 'footer_sections_i18n'],
    truncateInOrder: ['footer_sections_i18n', 'footer_sections'],
    allowSchema: false,
    note: 'Footer sections: footer_sections + footer_sections_i18n.',
  },

  // -------------------------------------------------------------------
  // LIBRARY (şemaya birebir)
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
    note: 'Library: library + library_i18n + gallery(images+i18n) + files.',
  },

  // -------------------------------------------------------------------
  // REVIEWS (şemaya birebir: reviews + review_i18n)
  // -------------------------------------------------------------------
  reviews: {
    tablesInOrder: ['reviews', 'review_i18n'],
    truncateInOrder: ['review_i18n', 'reviews'],
    allowSchema: false,
    note: 'Reviews: reviews + review_i18n.',
  },

  // -------------------------------------------------------------------
  // SUPPORT (şemaya birebir: support_tickets + ticket_replies)
  // -------------------------------------------------------------------
  support: {
    tablesInOrder: ['support_tickets', 'ticket_replies'],
    truncateInOrder: ['ticket_replies', 'support_tickets'],
    allowSchema: false,
    note: 'Support: support_tickets + ticket_replies.',
  },

  // -------------------------------------------------------------------
  // USERS (auth modülü)
  // Not: refresh_tokens ayrı tablo; dashboard’da yok ama auth için kritik.
  // -------------------------------------------------------------------
  users: {
    tablesInOrder: ['users', 'refresh_tokens', 'profiles', 'user_roles'],
    truncateInOrder: ['user_roles', 'profiles', 'refresh_tokens', 'users'],
    allowSchema: false,
    note: 'Users/Auth: users + refresh_tokens + profiles + user_roles.',
  },

  // -------------------------------------------------------------------
  // OFFERS (şemaya birebir: offers + offer_number_counters)
  // -------------------------------------------------------------------
  offers: {
    tablesInOrder: ['offers', 'offer_number_counters'],
    truncateInOrder: ['offer_number_counters', 'offers'],
    allowSchema: false,
    note: 'Offers: offers + offer_number_counters.',
  },

  // -------------------------------------------------------------------
  // STORAGE (assets registry)
  // -------------------------------------------------------------------
  storage: {
    tablesInOrder: ['storage_assets'],
    truncateInOrder: ['storage_assets'],
    allowSchema: false,
    note: 'Storage assets: storage_assets.',
  },
};

/** Yardımcı: module key doğrula */
export function isModuleKey(x: unknown): x is ModuleKey {
  return typeof x === 'string' && (x as string) in MODULES;
}

/** Yardımcı: module tablolarını al (kopya) */
export function getModuleTables(module: ModuleKey): string[] {
  return [...(MODULES[module]?.tablesInOrder || [])];
}
