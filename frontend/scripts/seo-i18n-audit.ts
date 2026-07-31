type AuditRow = {
  url: string;
  status: number;
  finalUrl: string;
  htmlLang: string;
  canonical: string;
  issues: string[];
};

const baseUrl = (process.argv[2] || process.env.SEO_AUDIT_BASE_URL || 'http://localhost:3095').replace(/\/$/, '');
const sitemapUrl = `${baseUrl}/sitemap.xml`;
const concurrency = Math.max(1, Math.min(Number(process.env.SEO_AUDIT_CONCURRENCY || 10), 30));

function comparableUrl(value: string): string {
  const url = new URL(value);
  const path = `${url.pathname.replace(/\/$/, '') || '/'}${url.search}`;
  return /localhost|127\.0\.0\.1/.test(baseUrl) ? path : `${url.protocol}//${url.hostname.replace(/^www\./, '')}${path}`;
}

function visibleText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ');
}

async function main() {
  const sitemapResponse = await fetch(sitemapUrl);
  if (!sitemapResponse.ok) throw new Error(`Sitemap alınamadı: ${sitemapResponse.status} ${sitemapUrl}`);
  const sitemap = await sitemapResponse.text();
  const sourceOrigin = new URL(sitemapUrl).origin;
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => {
    const url = new URL(match[1]);
    return `${baseUrl}${url.pathname}${url.search}`;
  });

  const rows: AuditRow[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      try {
        const response = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'GoldMoodAstro-SEO-Audit/1.0' } });
        const html = await response.text();
        const expectedLocale = new URL(response.url).pathname.split('/').filter(Boolean)[0] || 'tr';
        const htmlLang = html.match(/<html[^>]*\slang="([^"]+)"/i)?.[1]?.toLowerCase() || '';
        const canonicalRaw = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1] || '';
        const canonical = canonicalRaw ? canonicalRaw.replace(sourceOrigin, baseUrl) : '';
        const issues: string[] = [];
        if (response.status !== 200) issues.push(`status:${response.status}`);
        if (response.redirected) issues.push('sitemap-url-redirected');
        if (htmlLang !== expectedLocale) issues.push(`html-lang:${htmlLang || 'missing'}!=${expectedLocale}`);
        if (!canonical) issues.push('canonical-missing');
        else if (comparableUrl(canonical) !== comparableUrl(response.url)) issues.push('canonical-not-self');
        const alternates = [...html.matchAll(/<link\s+rel="alternate"\s+hrefLang="([^"]+)"\s+href="([^"]+)"/gi)];
        const alternateLocales = new Set(alternates.map((match) => match[1].toLowerCase()));
        for (const locale of ['tr', 'en', 'de', 'x-default']) {
          if (!alternateLocales.has(locale)) issues.push(`hreflang-missing:${locale}`);
        }
        if (expectedLocale !== 'tr' && /\b(?:Danışman|Danışmanlar|Randevu|Burçlar?|Hakkımızda|Görüşme|Ücretsiz|İçerik|Kullanım|Gizlilik|Ödeme|Bugün|Sağlık|Kariyer)\b/i.test(visibleText(html))) {
          issues.push('possible-turkish-leak');
        }
        rows.push({ url, status: response.status, finalUrl: response.url, htmlLang, canonical, issues });
      } catch (error) {
        rows.push({ url, status: 0, finalUrl: '', htmlLang: '', canonical: '', issues: [`fetch:${(error as Error).message}`] });
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  rows.sort((a, b) => a.url.localeCompare(b.url));
  const failures = rows.filter((row) => row.issues.some((issue) => issue !== 'possible-turkish-leak'));
  const warnings = rows.filter((row) => row.issues.includes('possible-turkish-leak'));

  console.log(`SEO i18n audit: ${rows.length} URL · ${failures.length} hata · ${warnings.length} dil uyarısı`);
  for (const row of rows.filter((item) => item.issues.length)) {
    console.log(`${row.issues.join(',')}\t${row.url}${row.finalUrl && row.finalUrl !== row.url ? `\t→ ${row.finalUrl}` : ''}`);
  }
  if (failures.length) process.exitCode = 1;
}

await main();
