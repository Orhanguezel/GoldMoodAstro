#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const manifestPath = join(root, 'public', 'sounds', 'relax', 'licenses.md');
const presetsPath = join(root, '..', 'packages', 'shared-config', 'relax-music', 'presets.json');
const soundsDir = join(root, 'public', 'sounds', 'relax');

const manifestText = readFileSync(manifestPath, 'utf8');
const presets = JSON.parse(readFileSync(presetsPath, 'utf8'));

const issues = [];

// 1. Check if all stems in presets.json are in the manifest
for (const stem of presets.stems) {
  if (!manifestText.includes(`${stem}.webm`)) {
    issues.push(`Stem "${stem}" listed in presets.json but missing in licenses.md`);
  }
}

// 2. Check if files in sounds directory are in the manifest (Review guard)
if (existsSync(soundsDir)) {
  const files = readdirSync(soundsDir).filter(f => f.endsWith('.webm') || f.endsWith('.mp3'));
  for (const file of files) {
    if (!manifestText.includes(file)) {
      issues.push(`File "${file}" found in directory but missing in licenses.md (LICENSE VIOLATION GUARD)`);
    }
  }
}

if (issues.length > 0) {
  console.error('Relax Music Asset Guard Failed!');
  issues.forEach(issue => console.error(`- ${issue}`));
  process.exit(1);
}

console.log('Relax Music Asset Guard Passed: Manifest is consistent with config and directory.');
process.exit(0);
