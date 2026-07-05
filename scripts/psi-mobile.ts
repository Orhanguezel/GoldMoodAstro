#!/usr/bin/env bun

type PsiRun = {
  run: number;
  performance: number;
  lcpMs: number;
  tbtMs: number;
  thirdPartyBlockingMs: number;
  fetchTime?: string;
  error?: string;
};

const DEFAULT_URL = 'https://goldmoodastro.com/tr';

function parseArgs() {
  const args = new Map<string, string>();
  for (const arg of Bun.argv.slice(2)) {
    const [rawKey, ...rest] = arg.replace(/^--/, '').split('=');
    args.set(rawKey, rest.join('=') || 'true');
  }
  return args;
}

async function loadSecrets(path = '.secrets/credentials.env') {
  try {
    const text = await Bun.file(path).text();
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const [key, ...rest] = trimmed.split('=');
      if (process.env[key]) continue;
      let value = rest.join('=').trim();
      value = value.replace(/^['"]|['"]$/g, '');
      process.env[key] = value;
    }
  } catch {
    // Secrets file is optional; PSI can still run unauthenticated until quota limits.
  }
}

function numberArg(args: Map<string, string>, key: string, fallback: number) {
  const value = Number(args.get(key) || process.env[`PSI_${key.toUpperCase()}`] || fallback);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function round(n: number, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}

async function runPsi(url: string, key: string | undefined, run: number): Promise<PsiRun> {
  const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  endpoint.searchParams.set('url', url);
  endpoint.searchParams.set('strategy', 'mobile');
  endpoint.searchParams.set('category', 'performance');
  if (key) endpoint.searchParams.set('key', key);

  const res = await fetch(endpoint);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data?.error?.message || `${res.status} ${res.statusText}`;
    return {
      run,
      performance: 0,
      lcpMs: 0,
      tbtMs: 0,
      thirdPartyBlockingMs: 0,
      error: message,
    };
  }

  const lh = data?.lighthouseResult || {};
  const audits = lh.audits || {};
  const perf = Number(lh.categories?.performance?.score || 0) * 100;
  const lcp = Number(audits['largest-contentful-paint']?.numericValue || 0);
  const tbt = Number(audits['total-blocking-time']?.numericValue || 0);
  const thirdPartyItems = audits['third-party-summary']?.details?.items || [];
  const thirdPartyBlocking = Array.isArray(thirdPartyItems)
    ? thirdPartyItems.reduce((sum: number, item: any) => sum + Number(item.blockingTime || 0), 0)
    : 0;

  return {
    run,
    performance: round(perf),
    lcpMs: round(lcp),
    tbtMs: round(tbt),
    thirdPartyBlockingMs: round(thirdPartyBlocking),
    fetchTime: lh.fetchTime,
  };
}

function formatReport(url: string, runs: PsiRun[], intervalMs: number, keyed: boolean) {
  const okRuns = runs.filter((r) => !r.error);
  const lines = [
    `# PSI Mobile Report — ${new Date().toISOString()}`,
    '',
    `URL: ${url}`,
    `Runs: ${runs.length}`,
    `Interval: ${intervalMs}ms`,
    `API key: ${keyed ? 'yes' : 'no'}`,
    '',
    '| run | performance | LCP | TBT | third-party blocking | fetch time | error |',
    '|---:|---:|---:|---:|---:|---|---|',
    ...runs.map((r) => (
      `| ${r.run} | ${r.error ? '-' : r.performance} | ${r.error ? '-' : `${round(r.lcpMs / 1000, 2)}s`} | ${r.error ? '-' : `${r.tbtMs}ms`} | ${r.error ? '-' : `${r.thirdPartyBlockingMs}ms`} | ${r.fetchTime || '-'} | ${r.error || '-'} |`
    )),
    '',
  ];

  if (okRuns.length) {
    const perfMedian = median(okRuns.map((r) => r.performance));
    const lcpMedian = median(okRuns.map((r) => r.lcpMs));
    const tbtMedian = median(okRuns.map((r) => r.tbtMs));
    const thirdPartyMedian = median(okRuns.map((r) => r.thirdPartyBlockingMs));
    lines.push(
      '## Median',
      '',
      `- Performance: ${round(perfMedian)}`,
      `- LCP: ${round(lcpMedian / 1000, 2)}s`,
      `- TBT: ${round(tbtMedian)}ms`,
      `- Third-party blocking: ${round(thirdPartyMedian)}ms`,
      `- T23 close criteria: ${lcpMedian <= 2500 && perfMedian >= 80 ? 'PASS' : 'FAIL'}`,
      '',
    );
  }

  if (runs.some((r) => r.error)) {
    lines.push(
      '## Notes',
      '',
      '- If PSI returns quota/429 errors, add `PSI_API_KEY` to `.secrets/credentials.env` and rerun.',
      '',
    );
  }

  return `${lines.join('\n')}\n`;
}

async function main() {
  const args = parseArgs();
  await loadSecrets();

  const url = args.get('url') || process.env.PSI_URL || DEFAULT_URL;
  const runsCount = numberArg(args, 'runs', 3);
  const intervalMs = numberArg(args, 'interval-ms', 60_000);
  const out = args.get('out') || process.env.PSI_OUT || '';
  const key = process.env.PSI_API_KEY || process.env.PAGESPEED_API_KEY || '';

  const runs: PsiRun[] = [];
  for (let i = 1; i <= runsCount; i += 1) {
    console.log(`[psi] run ${i}/${runsCount}: ${url}`);
    runs.push(await runPsi(url, key || undefined, i));
    if (i < runsCount) {
      console.log(`[psi] waiting ${intervalMs}ms`);
      await sleep(intervalMs);
    }
  }

  const report = formatReport(url, runs, intervalMs, Boolean(key));
  console.log(report);

  if (out) {
    await Bun.write(out, report);
    console.log(`[psi] wrote ${out}`);
  }

  if (!runs.some((r) => !r.error)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
