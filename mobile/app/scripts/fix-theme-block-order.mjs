/**
 * useAppTheme import + buildScreenStyles bloğunu tüm import'ların altına taşır.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.join(import.meta.dirname, '..');

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (p.endsWith('.tsx')) acc.push(p);
  }
  return acc;
}

const BLOCK_RE =
  /^import \{ useAppTheme, type AppTheme \} from '@\/theme';\s*\n(?:function buildScreenStyles\(t: AppTheme\) \{[\s\S]*?\n\}\s*\n)/m;

function lastImportLineIndex(lines) {
  let last = -1;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t === '') continue;
    if (t.startsWith('import ')) last = i;
    else break;
  }
  return last;
}

function processFile(fp) {
  let s = fs.readFileSync(fp, 'utf8');
  if (!s.includes("from '@/theme'")) return false;
  const m = s.match(BLOCK_RE);
  if (!m) return false;
  const block = m[0];
  const without = s.replace(BLOCK_RE, '');
  const lines = without.split('\n');
  const lastImp = lastImportLineIndex(lines);
  if (lastImp < 0) return false;
  const before = lines.slice(0, lastImp + 1).join('\n');
  const after = lines.slice(lastImp + 1).join('\n');
  const next = `${before}\n\n${block}${after.startsWith('\n') ? '' : '\n'}${after}`;
  if (next === s) return false;
  fs.writeFileSync(fp, next);
  return true;
}

let n = 0;
for (const f of [...walk(path.join(ROOT, 'app')), ...walk(path.join(ROOT, 'src'))]) {
  if (processFile(f)) {
    console.log('reorder', path.relative(ROOT, f));
    n++;
  }
}
console.log('reordered', n);
