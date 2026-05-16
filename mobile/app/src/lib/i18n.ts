import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import Constants from 'expo-constants';
import {
  MOBILE_I18N_FALLBACK,
  MOBILE_I18N_SECTION_KEY,
  type MobileI18nLocale,
} from '@goldmood/shared-config/mobileI18n';

type TranslationTree = Record<string, unknown>;
type LocaleResourceMap = Partial<Record<MobileI18nLocale, TranslationTree>>;

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  'http://localhost:8094/api';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function mergeDeep<T extends TranslationTree>(base: T, override: unknown): T {
  if (!isRecord(override)) return base;
  const out: TranslationTree = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const current = out[key];
    out[key] = isRecord(current) && isRecord(value)
      ? mergeDeep(current as TranslationTree, value)
      : value;
  }

  return out as T;
}

function parseSettingValue(value: unknown): LocaleResourceMap | null {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return parseSettingValue(JSON.parse(value));
    } catch {
      return null;
    }
  }
  if (!isRecord(value)) return null;

  const maybeValue = isRecord(value.value) ? value.value : value;
  const tr = isRecord(maybeValue.tr) ? maybeValue.tr : undefined;
  const en = isRecord(maybeValue.en) ? maybeValue.en : undefined;
  if (!tr && !en) return null;

  return { tr, en };
}

async function fetchRemoteMobileI18n(): Promise<LocaleResourceMap | null> {
  try {
    const url = `${API_URL.replace(/\/$/, '')}/site_settings/${MOBILE_I18N_SECTION_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const row = await response.json();
    return parseSettingValue(row?.value);
  } catch {
    return null;
  }
}

function buildResources(remote?: LocaleResourceMap | null) {
  return {
    tr: {
      translation: mergeDeep({ ...MOBILE_I18N_FALLBACK.tr }, remote?.tr),
    },
    en: {
      translation: mergeDeep({ ...MOBILE_I18N_FALLBACK.en }, remote?.en),
    },
  };
}

export function initI18n(): void {
  if (i18n.isInitialized) return;

  const device = Localization.getLocales()[0]?.languageCode ?? 'tr';
  const initial = device === 'tr' ? 'tr' : 'en';

  i18n.use(initReactI18next).init({
    resources: buildResources(),
    lng: initial,
    fallbackLng: 'tr',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v3',
  });

  fetchRemoteMobileI18n()
    .then((remote) => {
      if (!remote) return;
      const resources = buildResources(remote);
      i18n.addResourceBundle('tr', 'translation', resources.tr.translation, true, true);
      i18n.addResourceBundle('en', 'translation', resources.en.translation, true, true);
    })
    .catch(() => {
      // Bundle fallback keeps the app fully translated offline.
    });
}

export { i18n };
