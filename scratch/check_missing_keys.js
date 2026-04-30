
import fs from 'fs';

const tr = JSON.parse(fs.readFileSync('admin_panel/src/locale/tr.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('admin_panel/src/locale/en.json', 'utf8'));
const de = JSON.parse(fs.readFileSync('admin_panel/src/locale/de.json', 'utf8'));

function getKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const trKeys = new Set(getKeys(tr));
const enKeys = getKeys(en);
const deKeys = getKeys(de);

console.log('Keys in EN but not in TR:');
enKeys.forEach(k => {
  if (!trKeys.has(k)) console.log(k);
});

console.log('\nKeys in DE but not in TR:');
deKeys.forEach(k => {
  if (!trKeys.has(k)) console.log(k);
});
