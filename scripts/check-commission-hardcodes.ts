import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();

const scanRoots = [
  'backend/src',
  'packages/shared-backend/modules',
  'frontend/src',
  'admin_panel/src',
];

const extensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.sql',
  '.json',
]);

const ignoredPathParts = [
  '/node_modules/',
  '/.next/',
  '/dist/',
  '/build/',
  '/coverage/',
  '/styles/presets/',
  'theme_presets_seed.sql',
  'design_tokens',
  'theme-hardcode-baseline.json',
  'hardcoded-tr-baseline.json',
];

const commissionContext =
  /(commission|komisyon|provision|hakedi[şs]|earning|kazanc|kazanç|payout|withdraw|para çek|odeme|ödeme|wallet|gross|brüt|net|platform hizmet)/i;
const transitionalContext =
  /(previous_percent|old|legacy|eski|alten|from\s+15|von\s+15|15['’]ten|effective|before|önce|oncesi|öncesi|yürürlük|yururluk|stichtag)/i;

type Finding = {
  file: string;
  line: number;
  reason: string;
  text: string;
};

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const rel = relative(root, path);
    if (ignoredPathParts.some((part) => rel.includes(part))) continue;
    const st = statSync(path);
    if (st.isDirectory()) {
      walk(path, out);
      continue;
    }
    const dot = entry.lastIndexOf('.');
    const ext = dot >= 0 ? entry.slice(dot) : '';
    if (extensions.has(ext)) out.push(path);
  }
  return out;
}

function shouldFlag(line: string): string | null {
  if (/\?\?\s*15\b/.test(line)) return 'fallback ?? 15';

  const hasCommissionContext = commissionContext.test(line);
  if (!hasCommissionContext) return null;

  if (transitionalContext.test(line)) return null;
  if (/previous_percent/.test(line)) return null;

  if (/(^|[^0-9])15\s*%/.test(line) || /%\s*15([^0-9]|$)/.test(line)) return 'literal 15 percent';
  if (/(^|[^0-9])0[.,]15([^0-9]|$)/.test(line)) return 'literal 0.15 rate';
  if (/(^|[^0-9])0[.,]85([^0-9]|$)/.test(line)) return 'literal 0.85 net multiplier';

  return null;
}

const findings: Finding[] = [];

for (const scanRoot of scanRoots) {
  const abs = join(root, scanRoot);
  try {
    statSync(abs);
  } catch {
    continue;
  }
  for (const file of walk(abs)) {
    const rel = relative(root, file);
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      const reason = shouldFlag(line);
      if (!reason) return;
      findings.push({
        file: rel,
        line: index + 1,
        reason,
        text: line.trim(),
      });
    });
  }
}

if (findings.length > 0) {
  console.error('Commission hardcode guard failed. Move rates to site_settings/platform_commission_rate.');
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} [${finding.reason}] ${finding.text}`);
  }
  process.exit(1);
}

console.log('Commission hardcode guard passed.');
