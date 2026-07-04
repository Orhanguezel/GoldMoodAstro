import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
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

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (path.includes('node_modules')) return [];
    const stat = statSync(path);
    if (stat.isDirectory()) return walk(path);
    return /\.(tsx?|jsx?)$/.test(path) ? [path] : [];
  });
}

function findMobileUsageIssues(validKeys: Set<string>) {
  const files = [...walk('mobile/app/app'), ...walk('mobile/app/src')];
  const missing: string[] = [];
  const inlineFallbacks: string[] = [];
  const staticCall = /\bt\(\s*(['"`])([^'"`()]+)\1/g;
  const inlineFallback = /\bt\(\s*(['"`])([^'"`()]+)\1\s*,\s*(['"`])([^'"`]*?)\3/g;

  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(staticCall)) {
      const key = match[2] ?? '';
      if (key && !key.includes('${') && !key.includes('{') && !key.includes('}') && !validKeys.has(key)) {
        missing.push(`${file}:${key}`);
      }
    }
    for (const match of source.matchAll(inlineFallback)) {
      const key = match[2] ?? '';
      const fallback = match[4] ?? '';
      if (/[çğıöşüÇĞİÖŞÜ]/.test(fallback)) inlineFallbacks.push(`${file}:${key}`);
    }
  }

  return { missing, inlineFallbacks };
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
const baseKeySet = new Set(baseKeys);
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

const usage = findMobileUsageIssues(baseKeySet);
if (usage.missing.length) {
  console.error('Mobile i18n missing keys in t(...) usage:');
  console.error(usage.missing.slice(0, 80).join('\n'));
  if (usage.missing.length > 80) console.error(`...and ${usage.missing.length - 80} more`);
  process.exit(1);
}

if (usage.inlineFallbacks.length) {
  console.warn(`Mobile i18n inline Turkish fallback warnings: ${usage.inlineFallbacks.length}`);
}

console.log(`Mobile i18n OK (${baseKeys.length} keys per locale; locales: ${locales.join(', ')}; static usage checked).`);
