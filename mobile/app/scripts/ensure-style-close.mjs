import fs from 'fs';
import path from 'path';

const ROOT = path.join(import.meta.dirname, '..');
const MARKER = "\n\nimport { SafeAreaView } from 'react-native-safe-area-context';";

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir, n);
    if (n.includes('.sync-conflict')) continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (p.endsWith('.tsx')) acc.push(p);
  }
  return acc;
}

function fix(fp) {
  let s = fs.readFileSync(fp, 'utf8');
  if (!s.includes('function buildScreenStyles')) return false;
  const i = s.indexOf(MARKER);
  if (i === -1) return false;
  const before = s.slice(Math.max(0, i - 400), i);
  if (before.includes('});\n}') || before.includes('});\r\n}')) return false;
  const ins = '\n  });\n}';
  const next = s.slice(0, i) + ins + s.slice(i);
  fs.writeFileSync(fp, next);
  return true;
}

let n = 0;
for (const f of walk(path.join(ROOT, 'app'))) {
  if (fix(f)) {
    console.log('ensured', path.relative(ROOT, f));
    n++;
  }
}
console.log('total', n);
