#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Mapping Turkish to English
const ELEMENT_MAP = {
  'Ateş': 'fire',
  'Toprak': 'earth',
  'Hava': 'air',
  'Su': 'water'
};

const MODALITY_MAP = {
  'Öncü': 'cardinal',
  'Sabit': 'fixed',
  'Değişken': 'mutable'
};

const root = process.cwd();
const signsPath = join(root, 'src', 'lib', 'zodiac', 'signs.ts');
const presetsPath = join(root, '..', 'packages', 'shared-config', 'relax-music', 'presets.json');

const signsText = readFileSync(signsPath, 'utf8');
const presets = JSON.parse(readFileSync(presetsPath, 'utf8'));

// Simple regex to extract element/modality from ZODIAC_SIGNS array in signs.ts
const signRegex = /key:\s*'(\w+)',[^}]*element:\s*'([^']+)',\s*modality:\s*'([^']+)'/g;
let match;
const driftIssues = [];

while ((match = signRegex.exec(signsText)) !== null) {
  const [_, key, trElement, trModality] = match;
  const enElement = ELEMENT_MAP[trElement];
  const enModality = MODALITY_MAP[trModality];

  const presetSign = presets.signs[key];
  if (!presetSign) {
    driftIssues.push(`Sign "${key}" missing in presets.json`);
    continue;
  }

  if (presetSign.element !== enElement) {
    driftIssues.push(`Sign "${key}" element mismatch: signs.ts(${enElement}) vs presets.json(${presetSign.element})`);
  }
  if (presetSign.modality !== enModality) {
    driftIssues.push(`Sign "${key}" modality mismatch: signs.ts(${enModality}) vs presets.json(${presetSign.modality})`);
  }
}

if (driftIssues.length > 0) {
  console.error('Relax Music Drift Detected!');
  driftIssues.forEach(issue => console.error(`- ${issue}`));
  process.exit(1);
}

console.log('Relax Music Drift Check Passed: All 12 signs are consistent.');
process.exit(0);
