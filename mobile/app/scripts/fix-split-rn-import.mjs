/**
 * import {\n\nimport { useAppTheme ... buildScreenStyles } bozulmasını onarır:
 * theme bloğunu kesip tüm import'lardan sonra ekler, RN import'unu birleştirir.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.join(import.meta.dirname, '..');

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir, n);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (p.endsWith('.tsx')) acc.push(p);
  }
  return acc;
}

function endOfBuildScreenStylesFunction(s, fnIdx) {
  const open = s.indexOf('{', fnIdx);
  let depth = 0;
  for (let k = open; k < s.length; k++) {
    if (s[k] === '{') depth++;
    else if (s[k] === '}') {
      depth--;
      if (depth === 0) return k + 1;
    }
  }
  return -1;
}

function lastImportLineEnd(s) {
  const lines = s.split('\n');
  let last = -1;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t === '') continue;
    if (t.startsWith('import ')) last = i;
    else break;
  }
  if (last < 0) return 0;
  let pos = 0;
  for (let i = 0; i <= last; i++) {
    pos += lines[i].length + 1;
  }
  return pos;
}

function fixFile(fp) {
  let s = fs.readFileSync(fp, 'utf8');
  if (!s.includes("import {\n\nimport { useAppTheme")) return false;

  const themeStart = s.indexOf("import { useAppTheme, type AppTheme } from '@/theme';");
  if (themeStart === -1) return false;
  const fnIdx = s.indexOf('function buildScreenStyles', themeStart);
  if (fnIdx === -1) return false;
  const fnEnd = endOfBuildScreenStylesFunction(s, fnIdx);
  if (fnEnd === -1) return false;

  const block = s.slice(themeStart, fnEnd).trimEnd();
  let head = s.slice(0, themeStart);
  head = head.replace(/\n\n$/, '\n');
  const tail = s.slice(fnEnd);
  const stitched = head + tail;

  const ins = lastImportLineEnd(stitched);
  const out = `${stitched.slice(0, ins)}\n\n${block}\n\n${stitched.slice(ins)}`;
  fs.writeFileSync(fp, out);
  return true;
}

let n = 0;
for (const f of walk(path.join(ROOT, 'app'))) {
  if (fixFile(f)) {
    console.log('fixed', path.relative(ROOT, f));
    n++;
  }
}
console.log('total', n);
