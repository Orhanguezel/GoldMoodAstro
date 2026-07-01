import { readFileSync } from 'node:fs';
import {
  MOBILE_I18N_FALLBACK,
  MOBILE_I18N_SECTION_KEY,
} from '../packages/shared-config/src/mobileI18n';

type Tree = Record<string, unknown>;

function flatten(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [prefix];
  return Object.entries(value as Tree).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key),
  );
}

function diff(left: string[], right: string[]) {
  const r = new Set(right);
  return left.filter((key) => !r.has(key));
}

function parseSeedSnapshot(): unknown {
  const sql = readFileSync('backend/src/db/sql/019_ui_mobile_i18n_seed.sql', 'utf8');
  if (!sql.includes(MOBILE_I18N_SECTION_KEY)) {
    throw new Error(`Seed does not include ${MOBILE_I18N_SECTION_KEY}`);
  }
  const match = sql.match(/'(\{\"tr\":.*\})'\)\s*ON DUPLICATE KEY UPDATE/s);
  if (!match) throw new Error('Could not find ui_mobile_i18n JSON snapshot in seed');
  return JSON.parse(match[1].replace(/''/g, "'"));
}

const locales = Object.keys(MOBILE_I18N_FALLBACK) as Array<keyof typeof MOBILE_I18N_FALLBACK>;
const baseLocale = 'tr' as const;
const baseKeys = flatten(MOBILE_I18N_FALLBACK[baseLocale]).sort();
let hasDrift = false;

for (const locale of locales) {
  const keys = flatten(MOBILE_I18N_FALLBACK[locale]).sort();
  const missing = diff(baseKeys, keys);
  const extra = diff(keys, baseKeys);
  if (missing.length || extra.length) {
    hasDrift = true;
    console.error(`Mobile i18n locale drift detected for ${locale}.`);
    if (missing.length) console.error(`Missing in ${locale}:`, missing.join(', '));
    if (extra.length) console.error(`Extra in ${locale}:`, extra.join(', '));
  }
}

if (hasDrift) {
  console.error('Mobile i18n locale drift detected.');
  process.exit(1);
}

const seed = parseSeedSnapshot() as Partial<Record<keyof typeof MOBILE_I18N_FALLBACK, Tree>>;

for (const locale of locales) {
  const expectedKeys = flatten(MOBILE_I18N_FALLBACK[locale]).sort();
  const seedKeys = flatten(seed[locale]).sort();
  if (diff(expectedKeys, seedKeys).length || diff(seedKeys, expectedKeys).length) {
    console.error(`Mobile i18n seed snapshot drift detected for ${locale}.`);
    process.exit(1);
  }
}

console.log(`Mobile i18n OK (${baseKeys.length} keys per locale; locales: ${locales.join(', ')}).`);
