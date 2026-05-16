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

const RE = /\n\n(import \{ SafeAreaView \} from 'react-native-safe-area-context';)/g;

function fix(fp) {
  let s = fs.readFileSync(fp, 'utf8');
  if (!s.includes('function buildScreenStyles')) return false;
  if (!RE.test(s)) return false;
  RE.lastIndex = 0;
  const next = s.replace(RE, '\n  });\n}\n\n$1');
  if (next === s) return false;
  fs.writeFileSync(fp, next);
  return true;
}

let n = 0;
for (const f of walk(path.join(ROOT, 'app'))) {
  if (fix(f)) {
    console.log('closed', path.relative(ROOT, f));
    n++;
  }
}
console.log('total', n);
