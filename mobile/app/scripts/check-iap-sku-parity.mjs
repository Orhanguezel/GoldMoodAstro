#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const appRoot = path.resolve(import.meta.dirname, '..');
const repoRoot = path.resolve(appRoot, '../..');
const eas = JSON.parse(fs.readFileSync(path.join(appRoot, 'eas.json'), 'utf8'));
const mobile = eas.build?.production?.env ?? {};
const backendPath = process.argv[2] ?? path.join(repoRoot, 'backend/.env');
const examplePath = path.join(repoRoot, 'backend/.env.example');
const sourcePath = fs.existsSync(backendPath) ? backendPath : examplePath;
const backend = Object.fromEntries(fs.readFileSync(sourcePath, 'utf8').split(/\r?\n/)
  .filter((line) => /^[A-Z][A-Z0-9_]*=/.test(line))
  .map((line) => { const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1).replace(/^['"]|['"]$/g, '')]; }));

const pairs = [
  ...['MONTHLY', 'YEARLY'].flatMap((period) => ['IOS', 'ANDROID'].map((platform) => [
    `EXPO_PUBLIC_IAP_PRODUCT_${period}_${platform}`,
    `IAP_SUBSCRIPTION_PRODUCT_${period}_${platform}`,
  ])),
  ...['STARTER', 'POPULAR', 'VALUE'].flatMap((code) => ['IOS', 'ANDROID'].map((platform) => [
    `EXPO_PUBLIC_IAP_CREDIT_${code}_${platform}`,
    `IAP_CREDIT_PRODUCT_${code}_${platform}`,
  ])),
];

const failures = [];
for (const [mobileKey, backendKey] of pairs) {
  const mobileSku = mobile[mobileKey];
  const backendSku = backend[backendKey];
  if (!mobileSku || !backendSku) failures.push(`${mobileKey} / ${backendKey}: missing`);
  else if (mobileSku !== backendSku) failures.push(`${mobileKey} / ${backendKey}: mismatch`);
}
for (const platform of ['IOS', 'ANDROID']) {
  const ids = pairs.filter(([key]) => key.endsWith(`_${platform}`)).map(([key]) => mobile[key]);
  if (new Set(ids).size !== ids.length) failures.push(`${platform}: duplicate product IDs`);
}

for (const failure of failures) console.error(`FAIL ${failure}`);
if (failures.length) process.exit(1);
console.log(`IAP SKU parity OK (EAS production ↔ ${path.relative(repoRoot, sourcePath)}).`);
if (sourcePath === examplePath) console.log('Local backend .env is absent; verify deployed env and store console products separately.');
