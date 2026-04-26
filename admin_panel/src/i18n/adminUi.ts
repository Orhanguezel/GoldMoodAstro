// =============================================================
// FILE: src/i18n/adminUi.ts
// Admin panel i18n support - JSON based translations
// =============================================================
'use client';

import tr from '@/locale/tr.json';
import en from '@/locale/en.json';
import de from '@/locale/de.json';
import { normLocaleTag } from './localeUtils';
import { buildTranslator, getValueByPath, type TranslateFn } from './translation-utils';

type PlainObject = Record<string, unknown>;

function isPlainObject(v: unknown): v is PlainObject {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function getPlainChild(obj: PlainObject | null, key: string): PlainObject | null {
  if (!obj) return null;
  const candidate = obj[key];
  return isPlainObject(candidate) ? (candidate as PlainObject) : null;
}

function normalizeAdminLocaleJson(raw: unknown): PlainObject {
  const base: PlainObject = isPlainObject(raw) ? (raw as PlainObject) : {};
  const adminBase: PlainObject = isPlainObject(base.admin) ? (base.admin as PlainObject) : {};

  // clone only the parts we might mutate
  const admin: PlainObject = { ...adminBase };
  const out: PlainObject = { ...base, admin };

  // de.json gibi: { admin: {...}, db: {...}, services: {...}, siteSettings: {...}, audit: {...} }
  if (!isPlainObject(admin.db) && isPlainObject(base.db)) admin.db = base.db as PlainObject;
  if (!isPlainObject(admin.services) && isPlainObject(base.services))
    admin.services = base.services as PlainObject;
  if (!isPlainObject(admin.siteSettings) && isPlainObject(base.siteSettings))
    admin.siteSettings = base.siteSettings as PlainObject;
  if (!isPlainObject(admin.audit) && isPlainObject(base.audit))
    admin.audit = base.audit as PlainObject;
  if (!isPlainObject(admin.notifications) && isPlainObject(base.notifications))
    admin.notifications = base.notifications as PlainObject;
  if (!isPlainObject(admin.mail) && isPlainObject(base.mail))
    admin.mail = base.mail as PlainObject;
  if (!isPlainObject(admin.availability) && isPlainObject(base.availability))
    admin.availability = base.availability as PlainObject;
  if (!isPlainObject(admin.wallet) && isPlainObject(base.wallet))
    admin.wallet = base.wallet as PlainObject;
  if (!isPlainObject(admin.popups) && isPlainObject(base.popups))
    admin.popups = base.popups as PlainObject;

  // tr.json gibi: admin.db.siteSettings / admin.db.audit (yanlış yerde)
  const adminDb = isPlainObject(admin.db) ? (admin.db as PlainObject) : null;
  const nestedDbSiteSettings = getPlainChild(adminDb, 'siteSettings');
  if (!isPlainObject(admin.siteSettings) && nestedDbSiteSettings) {
    admin.siteSettings = nestedDbSiteSettings;
  }
  const nestedDbAudit = getPlainChild(adminDb, 'audit');
  if (!isPlainObject(admin.audit) && nestedDbAudit) {
    admin.audit = nestedDbAudit;
  }

  // Legacy locale shapes: users/userRoles can be nested under siteSettings.
  // Normalize them to admin.users and admin.userRoles so feature modules can
  // use a consistent key path in all locales.
  const adminSiteSettings = isPlainObject(admin.siteSettings) ? (admin.siteSettings as PlainObject) : null;
  const nestedUsers = getPlainChild(adminSiteSettings, 'users');
  const nestedUserRoles = getPlainChild(adminSiteSettings, 'userRoles');
  const nestedEmailTemplates = getPlainChild(adminSiteSettings, 'emailTemplates');
  if (!isPlainObject(admin.users) && nestedUsers) {
    admin.users = nestedUsers;
  }
  if (!isPlainObject(admin.userRoles) && nestedUserRoles) {
    admin.userRoles = nestedUserRoles;
  }
  if (!isPlainObject(admin.emailTemplates) && nestedEmailTemplates) {
    admin.emailTemplates = nestedEmailTemplates;
  }

  // tr.json gibi: services key'leri root'ta dağınık (en.json admin.services ile uyumlu)
  const looksLikeServicesRoot =
    isPlainObject(base.header) &&
    isPlainObject(base.list) &&
    isPlainObject(base.form) &&
    isPlainObject(base.formHeader) &&
    isPlainObject(base.formImage) &&
    isPlainObject(base.upload) &&
    isPlainObject(base.types);

  if (!isPlainObject(admin.services) && looksLikeServicesRoot) {
    admin.services = {
      header: base.header,
      list: base.list,
      form: base.form,
      formHeader: base.formHeader,
      formImage: base.formImage,
      upload: base.upload,
      types: base.types,
    } as PlainObject;
  }

  return out;
}

const translations = {
  tr: normalizeAdminLocaleJson(tr),
  en: normalizeAdminLocaleJson(en),
  de: normalizeAdminLocaleJson(de),
} as const;

/**
 * Supported languages for admin panel
 */
export type AdminLocale = 'tr' | 'en' | 'de';

/**
 * Dynamically derived list of available admin locales from translations JSON.
 */
export const ADMIN_LOCALE_LIST = Object.keys(translations) as AdminLocale[];

const ADMIN_LOCALE_LABELS: Record<string, string> = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
};

export const ADMIN_LOCALE_OPTIONS: { value: string; label: string }[] =
  ADMIN_LOCALE_LIST.map((code) => ({
    value: code,
    label: ADMIN_LOCALE_LABELS[code] || code.toUpperCase(),
  }));

function isAdminLocale(v: string): v is AdminLocale {
  return (ADMIN_LOCALE_LIST as readonly string[]).includes(v);
}

/**
 * Get translation function for specific locale
 */
export function getAdminTranslations(locale: AdminLocale = 'tr'): TranslateFn {
  const normalized = normLocaleTag(locale);
  const activeLocale: AdminLocale = isAdminLocale(normalized) ? normalized : 'tr';

  const fallbackChain = [activeLocale, 'tr', 'en', 'de'] as const satisfies readonly AdminLocale[];

  return buildTranslator<AdminLocale>({
    translations,
    locales: ADMIN_LOCALE_LIST,
    fallbackChain,
  });
}

/**
 * Hook for admin translations
 * Usage: const t = useAdminTranslations(locale);
 *        t('admin.common.save'); => "Kaydet" (tr) or "Save" (en)
 */
export function useAdminTranslations(locale?: string): TranslateFn {
  const normalized = normLocaleTag(locale) || 'tr';
  const adminLocale: AdminLocale = isAdminLocale(normalized) ? normalized : 'tr';
  return getAdminTranslations(adminLocale);
}

/**
 * Get all translations for a section
 * Usage: const seo = getAdminSection('tr', 'admin.siteSettings.seo');
 */
export function getAdminSection(
  locale: AdminLocale,
  section: string,
): Record<string, string> | undefined {
  const v = getValueByPath(translations[locale], section);
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;

  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === 'string') out[k] = val;
  }
  return Object.keys(out).length ? out : undefined;
}
