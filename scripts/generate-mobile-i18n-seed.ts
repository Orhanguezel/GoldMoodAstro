import { writeFileSync } from 'node:fs';
import {
  MOBILE_I18N_FALLBACK,
  MOBILE_I18N_SECTION_KEY,
} from '../packages/shared-config/src/mobileI18n';

function sqlString(value: string) {
  return value.replaceAll("'", "''");
}

const snapshot = sqlString(JSON.stringify(MOBILE_I18N_FALLBACK));
const sql = [
  '-- Mobile i18n fallback snapshot; admin can override via site_settings.',
  'INSERT INTO site_settings (id, `key`, locale, value) VALUES',
  `('01000000-0000-4000-8000-00000000051f', '${MOBILE_I18N_SECTION_KEY}', '*', '${snapshot}')`,
  'ON DUPLICATE KEY UPDATE value = VALUES(value);',
  '',
].join('\n');

writeFileSync('backend/src/db/sql/019_ui_mobile_i18n_seed.sql', sql);
