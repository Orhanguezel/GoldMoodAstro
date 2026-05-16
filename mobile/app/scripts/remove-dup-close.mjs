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

const RE = /\}\);\n\}\n  \}\);\n\}/g;

function fix(fp) {
  let s = fs.readFileSync(fp, 'utf8');
  if (!RE.test(s)) return false;
  RE.lastIndex = 0;
  const n = s.replace(RE, '});\n}');
  fs.writeFileSync(fp, n);
  return true;
}

let c = 0;
for (const f of walk(path.join(ROOT, 'app'))) {
  if (fix(f)) {
    console.log('dedup', path.relative(ROOT, f));
    c++;
  }
}
console.log('total', c);
