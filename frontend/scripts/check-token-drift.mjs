#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const defaultsPath = join(root, 'src', 'lib', 'tokens', 'defaults.ts');
const seedPath = join(root, '..', 'backend', 'src', 'db/sql/010_site_settings.sql');

const defaultsText = readFileSync(defaultsPath, 'utf8');
const seedText = readFileSync(seedPath, 'utf8');

// Extract JSON from seed SQL
const tokenMatch = seedText.match(/'design_tokens',\s*'\*',\s*'({.+})'/);
if (!tokenMatch) {
  console.error('Could not find design_tokens in 010_site_settings.sql');
  process.exit(1);
}

const seedTokens = JSON.parse(tokenMatch[1]);

// Simple property-by-property check for key colors/typography
// Since defaults.ts is code, we'll check for the existence of values in the text
const criticalPaths = [
  ['colors', 'brand_primary'],
  ['colors', 'bg_base'],
  ['colors', 'text_primary'],
  ['typography', 'font_display'],
  ['branding', 'app_name']
];

const driftIssues = [];

for (const path of criticalPaths) {
  const [section, key] = path;
  const expected = seedTokens[section][key];
  if (!defaultsText.includes(expected)) {
    driftIssues.push(`Drift in ${section}.${key}: Expected "${expected}" (from seed) but not found in defaults.ts`);
  }
}

if (driftIssues.length > 0) {
  console.error('Design Token Drift Detected!');
  driftIssues.forEach(issue => console.error(`- ${issue}`));
  process.exit(1);
}

console.log('Design Token Drift Check Passed: defaults.ts aligns with seed SQL.');
process.exit(0);
