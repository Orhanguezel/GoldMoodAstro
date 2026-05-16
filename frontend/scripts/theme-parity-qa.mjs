#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const LOCAL_BASE = (process.env.LOCAL_BASE || 'http://localhost:3095').replace(/\/+$/, '');
const LIVE_BASE = (process.env.LIVE_BASE || 'https://goldmoodastro.com').replace(/\/+$/, '');
const OUT_DIR = join(process.cwd(), 'test-results', 'theme-parity');

const routes = [
  { key: 'home', path: '/tr' },
  { key: 'burclar', path: '/tr/burclar' },
  { key: 'consultants', path: '/tr/consultants' },
  { key: 'dashboard', path: '/tr/dashboard' },
  { key: 'legal', path: '/tr/legal-notice' },
  { key: 'blog', path: '/tr/blog' },
];

const watchedVars = [
  '--gm-primary',
  '--gm-gold',
  '--gm-bg',
  '--gm-surface',
  '--gm-text',
  '--gm-border',
  '--gm-w-container',
  '--gm-w-content',
];

const simulatedPresets = [
  {
    id: 'amethyst-gold',
    vars: {
      '--gm-primary': '#9B6FD9',
      '--gm-gold': '#D4AF37',
      '--gm-bg': '#F5EFFF',
      '--gm-surface': '#FFFFFF',
      '--gm-text': '#1B0A3D',
      '--gm-border': 'rgba(155,111,217,0.30)',
    },
  },
  {
    id: 'midnight-onyx',
    vars: {
      '--gm-primary': '#6D5DF6',
      '--gm-gold': '#F5C542',
      '--gm-bg': '#0D1020',
      '--gm-surface': '#161A2E',
      '--gm-text': '#F7F2FF',
      '--gm-border': 'rgba(247,242,255,0.18)',
    },
  },
];

function clean(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

async function inspect(page, url) {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => undefined);
  const status = response?.status() ?? 0;
  const data = await page.evaluate((vars) => {
    const rootStyle = getComputedStyle(document.documentElement);
    const body = document.body;
    const doc = document.documentElement;
    const values = Object.fromEntries(vars.map((v) => [v, rootStyle.getPropertyValue(v).trim()]));
    const appHeaderCandidates = Array.from(
      document.querySelectorAll('[data-test-marker="antigravity-fix-v1"], [data-app-header], body > header'),
    );
    const visibleHeaders = appHeaderCandidates.filter((el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    });
    const maxWidthElements = Array.from(document.querySelectorAll('main, main > *, section, header, footer'))
      .map((el) => Math.round(el.getBoundingClientRect().width))
      .filter((w) => w > 0);
    return {
      title: document.title,
      values,
      headerCount: visibleHeaders.length,
      scrollWidth: Math.max(body.scrollWidth, doc.scrollWidth),
      clientWidth: doc.clientWidth,
      maxElementWidth: Math.max(0, ...maxWidthElements),
      bodyText: body.innerText.slice(0, 5000),
    };
  }, watchedVars);
  return { status, ...data };
}

async function inspectWithPreset(page, url, preset) {
  const result = await inspect(page, url);
  await page.addStyleTag({
    content: `:root{${Object.entries(preset.vars).map(([k, v]) => `${k}:${v}`).join(';')}}`,
  });
  await page.waitForTimeout(150);
  const after = await page.evaluate((vars) => {
    const rootStyle = getComputedStyle(document.documentElement);
    const body = document.body;
    const doc = document.documentElement;
    return {
      values: Object.fromEntries(vars.map((v) => [v, rootStyle.getPropertyValue(v).trim()])),
      scrollWidth: Math.max(body.scrollWidth, doc.scrollWidth),
      clientWidth: doc.clientWidth,
    };
  }, watchedVars);
  return { ...result, preset: preset.id, after };
}

function assertPage(label, result, issues) {
  if (result.status >= 400 || result.status === 0) issues.push(`${label}: bad status ${result.status}`);
  if (/Application error|Unhandled Runtime Error|Hydration failed/i.test(result.bodyText)) {
    issues.push(`${label}: app error text visible`);
  }
  if (result.scrollWidth > result.clientWidth + 3) {
    issues.push(`${label}: horizontal overflow ${result.scrollWidth} > ${result.clientWidth}`);
  }
  if (result.headerCount < 1) issues.push(`${label}: no visible header detected`);
  if (result.headerCount > 2) issues.push(`${label}: too many visible header candidates (${result.headerCount})`);
}

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ignoreHTTPSErrors: true });
const page = await context.newPage();
const issues = [];
const report = {
  generated_at: new Date().toISOString(),
  local_base: LOCAL_BASE,
  live_base: LIVE_BASE,
  routes: [],
  active_theme_parity: [],
  simulated_presets: [],
  issues,
};

for (const route of routes) {
  const local = await inspect(page, `${LOCAL_BASE}${route.path}`);
  const live = await inspect(page, `${LIVE_BASE}${route.path}`);
  assertPage(`local ${route.key}`, local, issues);
  assertPage(`live ${route.key}`, live, issues);
  report.routes.push({ key: route.key, path: route.path, local, live });

  for (const v of watchedVars) {
    const localValue = clean(local.values[v]);
    const liveValue = clean(live.values[v]);
    const comparable = Boolean(localValue && liveValue);
    if (localValue && liveValue && localValue !== liveValue) {
      issues.push(`${route.key}: ${v} differs local(${localValue}) live(${liveValue})`);
    }
    report.active_theme_parity.push({
      route: route.key,
      var: v,
      local: localValue,
      live: liveValue,
      comparable,
      ok: comparable ? localValue === liveValue : true,
    });
  }

  for (const preset of simulatedPresets) {
    const simulated = await inspectWithPreset(page, `${LOCAL_BASE}${route.path}`, preset);
    if (simulated.after.scrollWidth > simulated.after.clientWidth + 3) {
      issues.push(`${route.key}/${preset.id}: horizontal overflow after preset ${simulated.after.scrollWidth} > ${simulated.after.clientWidth}`);
    }
    report.simulated_presets.push({
      route: route.key,
      preset: preset.id,
      scrollWidth: simulated.after.scrollWidth,
      clientWidth: simulated.after.clientWidth,
      ok: simulated.after.scrollWidth <= simulated.after.clientWidth + 3,
    });
  }
}

await browser.close();

const outPath = join(OUT_DIR, 'report.json');
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);

if (issues.length) {
  console.error(`Theme parity QA failed with ${issues.length} issue(s).`);
  for (const issue of issues) console.error(`- ${issue}`);
  console.error(`Report: ${outPath}`);
  process.exit(1);
}

console.log(`Theme parity QA passed for ${routes.length} routes and ${simulatedPresets.length} simulated presets.`);
console.log(`Report: ${outPath}`);
