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

const trKeys = flatten(MOBILE_I18N_FALLBACK.tr).sort();
const enKeys = flatten(MOBILE_I18N_FALLBACK.en).sort();
const missingEn = diff(trKeys, enKeys);
const missingTr = diff(enKeys, trKeys);

if (missingEn.length || missingTr.length) {
  console.error('Mobile i18n locale drift detected.');
  if (missingEn.length) console.error('Missing in en:', missingEn.join(', '));
  if (missingTr.length) console.error('Missing in tr:', missingTr.join(', '));
  process.exit(1);
}

const seed = parseSeedSnapshot() as { tr?: Tree; en?: Tree };
const seedTrKeys = flatten(seed.tr).sort();
const seedEnKeys = flatten(seed.en).sort();

if (diff(trKeys, seedTrKeys).length || diff(enKeys, seedEnKeys).length) {
  console.error('Mobile i18n seed snapshot drift detected.');
  process.exit(1);
}

console.log(`Mobile i18n OK (${trKeys.length} keys per locale).`);
