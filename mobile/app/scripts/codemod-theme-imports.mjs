/**
 * @/theme/tokens → useAppTheme; modül StyleSheet → buildScreenStyles + useMemo.
 * cd mobile/app && bun scripts/codemod-theme-imports.mjs
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

function findMatchingBrace(s, openBraceIdx) {
  let depth = 0;
  for (let i = openBraceIdx; i < s.length; i++) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function ensureUseMemoImport(s) {
  const reactNamed = /import\s*\{([^}]*)\}\s*from\s*['"]react['"]/;
  const m = s.match(reactNamed);
  if (m) {
    const inner = m[1]
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    if (!inner.includes('useMemo')) {
      inner.push('useMemo');
      return s.replace(reactNamed, `import { ${inner.join(', ')} } from 'react'`);
    }
    return s;
  }
  if (/import React,/.test(s) || /import React from/.test(s)) {
    if (/import React, \{/.test(s)) {
      return s.replace(/import React, \{([^}]*)\}/, (a, inner) => {
        const parts = inner.split(',').map((x) => x.trim()).filter(Boolean);
        if (!parts.includes('useMemo')) parts.unshift('useMemo');
        return `import React, { ${parts.join(', ')} }`;
      });
    }
    return s.replace(/import React from 'react';/, "import React, { useMemo } from 'react';");
  }
  return `import { useMemo } from 'react';\n` + s;
}

function parseTokenImport(s) {
  const importRe = /import\s*\{([^}]+)\}\s*from\s*['"]@\/theme\/tokens['"]\s*;/;
  const im = s.match(importRe);
  if (!im) return null;
  const names = im[1]
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => x.split(/\s+as\s+/)[0].trim());
  const uniq = [...new Set(names)];
  return { importRe, destructure: uniq.join(', ') };
}

function processFile(filePath) {
  let s = fs.readFileSync(filePath, 'utf8');
  if (!s.includes("@/theme/tokens")) return false;

  const parsed = parseTokenImport(s);
  if (!parsed) return false;
  const { importRe, destructure } = parsed;

  s = s.replace(importRe, '');

  const marker = 'const styles = StyleSheet.create(';
  const si = s.indexOf(marker);
  let themeImport = "import { useAppTheme, type AppTheme } from '@/theme';\n";
  let buildFn = '';
  let hookBlock = `  const { ${destructure} } = useAppTheme();\n`;

  if (si !== -1) {
    const braceOpen = s.indexOf('{', si);
    if (braceOpen === -1) return false;
    const braceClose = findMatchingBrace(s, braceOpen);
    if (braceClose === -1) return false;
    let end = braceClose + 1;
    if (s[end] === ';') end++;
    while (s[end] === '\r' || s[end] === '\n') end++;
    const obj = s.slice(braceOpen, braceClose + 1);
    buildFn = `\nfunction buildScreenStyles(t: AppTheme) {\n  const { ${destructure} } = t;\n  return StyleSheet.create(${obj});\n}\n`;
    s = s.slice(0, si) + s.slice(end);
    hookBlock = `  const theme = useAppTheme();\n  const styles = useMemo(() => buildScreenStyles(theme), [theme]);\n`;
  }

  s = ensureUseMemoImport(s);
  const firstImport = s.search(/^import\s/m);
  if (firstImport === -1) s = themeImport + buildFn + s;
  else {
    let insertAt = 0;
    const lines = s.split('\n');
    let i = 0;
    for (; i < lines.length; i++) {
      if (!lines[i].trim().startsWith('import ')) break;
    }
    insertAt = lines.slice(0, i).join('\n').length + (i > 0 ? 1 : 0);
    s = s.slice(0, insertAt) + themeImport + buildFn + s.slice(insertAt);
  }

  const exportFn = /export default function (\w+)\([^)]*\)\s*\{/;
  const m1 = s.match(exportFn);
  if (m1) {
    const idx = s.indexOf(m1[0]) + m1[0].length;
    s = s.slice(0, idx) + '\n' + hookBlock + s.slice(idx);
  } else {
    const exportAnon = /export default function\s*\([^)]*\)\s*\{/;
    const m2 = s.match(exportAnon);
    if (!m2) {
      console.warn('NO HOOK INSERT', path.relative(ROOT, filePath));
      return false;
    }
    const idx = s.indexOf(m2[0]) + m2[0].length;
    s = s.slice(0, idx) + '\n' + hookBlock + s.slice(idx);
  }

  fs.writeFileSync(filePath, s);
  return true;
}

const targets = [...walk(path.join(ROOT, 'app')), ...walk(path.join(ROOT, 'src', 'components'))];
let n = 0;
for (const f of targets) {
  if (processFile(f)) {
    console.log('OK', path.relative(ROOT, f));
    n++;
  }
}
console.log('Total', n);
