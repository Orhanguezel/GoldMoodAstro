import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

/**
 * GoldMoodAstro Theme Hardcode Guard
 * Scans for hex colors and hardcoded Tailwind color classes.
 */

const HEX_REGEX = /#([0-9a-fA-F]{3,8})/g;
const TW_COLOR_REGEX = /\b(bg|text|border|ring|from|to|via|fill|stroke)-(white|black|slate|gray|zinc|neutral|stone|amber|yellow|orange|red|rose|pink|purple|violet|indigo|blue|sky|cyan|teal|emerald|green|lime)(-?[0-9]{2,3})?\b/g;

const cwd = process.cwd();
const frontendRoot = path.basename(cwd) === 'frontend' ? cwd : path.join(cwd, 'frontend');
const projectRoot = path.basename(frontendRoot) === 'frontend' ? path.dirname(frontendRoot) : cwd;
const baselinePath = path.join(frontendRoot, 'scripts/theme-hardcode-baseline.json');
const reportPath = path.join(projectRoot, 'doc/raporlar/theme-hardcode-inventory.md');
const shouldUpdateBaseline = process.argv.includes('--update-baseline');
const shouldWriteReport = process.argv.includes('--report');

const IGNORE_FILES = [
  'frontend/src/lib/tokens/defaults.ts',
  'frontend/src/lib/tokens/tokensToCSS.ts',
  'frontend/src/lib/tokens/types.ts',
  'frontend/src/lib/zodiac/signs.ts',
  'frontend/src/integrations/shared/legal.ts', // Contained legal text colors
  'frontend/src/integrations/shared/utils.ts', // Color utility maps
];

const IGNORE_PATTERNS = [
  /\.test\.tsx?$/,
  /\.server\.tsx?$/,
  /opengraph-image\.tsx$/,
  /twitter-image\.tsx$/,
];

async function scan() {
  const files = await glob('src/**/*.{ts,tsx}', {
    cwd: frontendRoot,
    ignore: ['**/node_modules/**', '**/dist/**'],
    absolute: true,
  });

  let totalFindings = 0;
  let hexFindings = 0;
  let tailwindFindings = 0;
  const report = [];

  for (const file of files) {
    const displayFile = path.join('frontend', path.relative(frontendRoot, file)).replaceAll(path.sep, '/');

    if (IGNORE_FILES.includes(displayFile) || IGNORE_PATTERNS.some(p => p.test(displayFile))) {
      continue;
    }

    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const fileFindings = [];

    lines.forEach((line, index) => {
      if (line.includes('theme-lint-ignore')) return;

      const hexMatches = line.match(HEX_REGEX);
      if (hexMatches) {
        hexMatches.forEach(m => {
          hexFindings += 1;
          fileFindings.push({ line: index + 1, match: m, type: 'hex' });
        });
      }

      const twMatches = line.match(TW_COLOR_REGEX);
      if (twMatches) {
        twMatches.forEach(m => {
          tailwindFindings += 1;
          fileFindings.push({ line: index + 1, match: m, type: 'tailwind' });
        });
      }
    });

    if (fileFindings.length > 0) {
      totalFindings += fileFindings.length;
      report.push({ file: displayFile, findings: fileFindings });
    }
  }

  const generatedAt = new Date().toISOString();

  console.log(`# Theme Hardcode Report`);
  console.log(`Generated: ${generatedAt}`);
  console.log(`- Files with issues: ${report.length}`);
  console.log(`- Hex colors: ${hexFindings}`);
  console.log(`- Fixed Tailwind color classes: ${tailwindFindings}`);
  console.log(`- Total findings: ${totalFindings}\n`);

  report.forEach(f => {
    console.log(`## ${f.file}`);
    f.findings.forEach(finding => {
      console.log(`- L${finding.line}: [${finding.type}] ${finding.match}`);
    });
    console.log('');
  });

  if (shouldUpdateBaseline) {
    fs.writeFileSync(
      baselinePath,
      `${JSON.stringify({
        generated_at: generatedAt,
        files: report.length,
        hex: hexFindings,
        fixed_tailwind_classes: tailwindFindings,
        total: totalFindings,
      }, null, 2)}\n`,
    );
  }

  if (shouldWriteReport) {
    const lines = [
      '# Tema Hardcode Envanteri',
      '',
      `Generated: ${generatedAt}`,
      '',
      `- Files: ${report.length}`,
      `- Hex colors: ${hexFindings}`,
      `- Fixed Tailwind color classes: ${tailwindFindings}`,
      `- Total findings: ${totalFindings}`,
      '',
      'Bu rapor mevcut sabit renk borcunu dondurmak için üretilir. Yeni renkler token sistemine (`var(--gm-*)`) bağlanmalıdır.',
      '',
    ];

    report.forEach(f => {
      lines.push(`## ${f.file}`);
      f.findings.forEach(finding => {
        lines.push(`- L${finding.line}: [${finding.type}] \`${finding.match}\``);
      });
      lines.push('');
    });

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, `${lines.join('\n').trimEnd()}\n`);
  }

  let allowedFindings = 0;
  if (fs.existsSync(baselinePath)) {
    allowedFindings = JSON.parse(fs.readFileSync(baselinePath, 'utf8')).total ?? 0;
  }

  if (!shouldUpdateBaseline && totalFindings > allowedFindings) {
    console.error(`Theme hardcode findings increased: ${totalFindings} > baseline ${allowedFindings}`);
    process.exit(1);
  }
}

scan().catch(err => {
  console.error(err);
  process.exit(1);
});
