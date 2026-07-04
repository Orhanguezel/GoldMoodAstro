#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const appRoot = process.cwd();
const mobileRoot = path.resolve(appRoot, '..');

function readJson(relativePath) {
  const fullPath = path.join(appRoot, relativePath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function existsFromApp(relativePath) {
  return typeof relativePath === 'string' && fs.existsSync(path.join(appRoot, relativePath));
}

const app = readJson('app.json').expo;
const eas = readJson('eas.json');

const checks = [];

function check(id, label, ok, detail) {
  checks.push({ id, label, ok, detail });
}

check(
  'E1',
  'Android Firebase google-services.json',
  existsFromApp(app.android?.googleServicesFile),
  app.android?.googleServicesFile || 'android.googleServicesFile tanımsız',
);

check(
  'E1',
  'iOS Firebase GoogleService-Info.plist config',
  typeof app.ios?.googleServicesFile === 'string' && app.ios.googleServicesFile.length > 0,
  app.ios?.googleServicesFile || 'ios.googleServicesFile tanımsız',
);

check(
  'E1',
  'iOS Firebase GoogleService-Info.plist file',
  existsFromApp(app.ios?.googleServicesFile),
  app.ios?.googleServicesFile || './GoogleService-Info.plist bekleniyor',
);

const iosSubmit = eas.submit?.production?.ios ?? {};
check(
  'F4',
  'EAS submit iOS ASC identifiers',
  Boolean(iosSubmit.appleId && iosSubmit.ascAppId && iosSubmit.appleTeamId),
  'appleId + ascAppId + appleTeamId credential olarak doldurulmalı',
);

const androidSubmit = eas.submit?.production?.android ?? {};
check(
  'F4',
  'EAS submit Android production target',
  Boolean(androidSubmit.applicationId && androidSubmit.track && androidSubmit.releaseStatus),
  JSON.stringify(androidSubmit),
);

check(
  'F6',
  'iOS associated domains',
  Array.isArray(app.ios?.associatedDomains) && app.ios.associatedDomains.length > 0,
  (app.ios?.associatedDomains ?? []).join(', ') || 'associatedDomains boş',
);

check(
  'F6',
  'Android HTTPS app links',
  Array.isArray(app.android?.intentFilters) && app.android.intentFilters.length > 0,
  `${app.android?.intentFilters?.length ?? 0} intent filter`,
);

check(
  'F6',
  'Deep link setup document',
  fs.existsSync(path.join(mobileRoot, 'DEEP-LINK-SETUP.md')),
  'mobile/DEEP-LINK-SETUP.md',
);

check(
  'F8',
  'Store metadata document',
  fs.existsSync(path.join(mobileRoot, 'STORE-METADATA.md')),
  'mobile/STORE-METADATA.md',
);

check(
  'J',
  'Manual smoke QA checklist',
  fs.existsSync(path.join(mobileRoot, 'SMOKE-QA-CHECKLIST.md')),
  'mobile/SMOKE-QA-CHECKLIST.md',
);

let failed = 0;
for (const item of checks) {
  const icon = item.ok ? 'OK' : 'MISSING';
  if (!item.ok) failed += 1;
  console.log(`${icon} [${item.id}] ${item.label} - ${item.detail}`);
}

if (failed > 0) {
  console.error(`\nRelease readiness failed: ${failed} item(s) missing.`);
  process.exit(1);
}

console.log('\nRelease readiness OK.');
