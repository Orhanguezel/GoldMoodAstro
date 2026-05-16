#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const manifestPath = join(root, 'public', 'sounds', 'relax', 'licenses.md');
const presetsPath = join(root, '..', 'packages', 'shared-config', 'relax-music', 'presets.json');
const soundsDir = join(root, 'public', 'sounds', 'relax');
const mobileSoundsDir = join(root, '..', 'mobile', 'app', 'assets', 'sounds', 'relax');

const manifestText = readFileSync(manifestPath, 'utf8');
const presets = JSON.parse(readFileSync(presetsPath, 'utf8'));

const issues = [];
const manifestRows = new Map();
const forbidden = [
  /mynoise\.net/i,
  /personal[- ]use/i,
  /CC-BY/i,
  /CC-NC/i,
  /Uppbeat/i,
  /\bTBD\b/i,
];

for (const line of manifestText.split(/\r?\n/)) {
  if (!line.startsWith('|') || line.includes('------') || line.includes(' file ')) continue;
  const cells = line
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());
  if (cells.length < 5) continue;
  const [file, sourceUrl, license, downloaded, sha256] = cells;
  manifestRows.set(file, { file, sourceUrl, license, downloaded, sha256 });
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function pathFor(file) {
  if (file.endsWith('.m4a')) return join(mobileSoundsDir, file);
  return join(soundsDir, file);
}

function validateManifestEntry(file) {
  const row = manifestRows.get(file);
  if (!row) {
    issues.push(`Required file "${file}" missing in licenses.md`);
    return;
  }
  const haystack = `${row.sourceUrl} ${row.license} ${row.sha256}`;
  for (const re of forbidden) {
    if (re.test(haystack)) {
      issues.push(`Manifest entry "${file}" contains forbidden or placeholder license/source data`);
    }
  }
  if (!/^[a-f0-9]{64}$/i.test(row.sha256)) {
    issues.push(`Manifest entry "${file}" has invalid sha256`);
  }
  const path = pathFor(file);
  if (!existsSync(path)) {
    issues.push(`Manifest entry "${file}" points to missing asset`);
    return;
  }
  const size = statSync(path).size;
  if (size <= 0) issues.push(`Asset "${file}" is empty`);
  if (size > 1_800_000) issues.push(`Asset "${file}" is too large (${size} bytes)`);
  const actual = sha256(path);
  if (/^[a-f0-9]{64}$/i.test(row.sha256) && actual !== row.sha256) {
    issues.push(`Asset "${file}" sha256 mismatch: manifest(${row.sha256}) actual(${actual})`);
  }
}

// 1. Check if all stems in presets.json have complete web + mobile assets.
for (const stem of presets.stems) {
  validateManifestEntry(`${stem}.webm`);
  validateManifestEntry(`${stem}.mp3`);
  validateManifestEntry(`${stem}.m4a`);
}

// 2. Check if files in sounds directories are in the manifest (review guard).
if (existsSync(soundsDir)) {
  const files = readdirSync(soundsDir).filter(f => f.endsWith('.webm') || f.endsWith('.mp3'));
  for (const file of files) {
    if (!manifestRows.has(file)) {
      issues.push(`File "${file}" found in directory but missing in licenses.md (LICENSE VIOLATION GUARD)`);
    }
  }
}
if (existsSync(mobileSoundsDir)) {
  const files = readdirSync(mobileSoundsDir).filter(f => f.endsWith('.m4a'));
  for (const file of files) {
    if (!manifestRows.has(file)) {
      issues.push(`Mobile file "${file}" found in directory but missing in licenses.md (LICENSE VIOLATION GUARD)`);
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
