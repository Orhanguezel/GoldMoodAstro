// src/modules/_shared/app-locales.ts
// App locale meta type and defaults

export interface AppLocaleMeta {
  code: string;
  label: string;
  is_default: boolean;
  is_active: boolean;
}

export const DEFAULT_APP_LOCALES: AppLocaleMeta[] = [
  { code: 'tr', label: 'Türkçe', is_default: true, is_active: true },
  { code: 'en', label: 'English', is_default: false, is_active: true },
  { code: 'de', label: 'Deutsch', is_default: false, is_active: true },
];

/** Immutable default listesinin deep clone'u */
export function cloneDefaultAppLocales(): AppLocaleMeta[] {
  return DEFAULT_APP_LOCALES.map((l) => ({ ...l }));
}
