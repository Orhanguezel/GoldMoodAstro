const baseUrl = (process.argv[2] || 'http://localhost:3095').replace(/\/$/, '');
const baseOrigin = new URL(baseUrl).origin;

const samplePaths = [
  '/tr',
  '/en',
  '/de',
  '/tr/danismanlar',
  '/en/consultants',
  '/de/berater',
  '/tr/fiyatlandirma',
  '/en/pricing',
  '/de/preise',
  '/tr/blog',
  '/en/blog',
  '/de/blog',
  '/tr/hakkimizda',
  '/en/about',
  '/de/ueber-uns',
  '/tr/dogum-haritasi',
] as const;

const errors: string[] = [];

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function fetchText(pathOrUrl: string): Promise<{ url: string; status: number; text: string }> {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${baseUrl}${pathOrUrl}`;
  const response = await fetch(url, { redirect: 'follow' });
  return { url, status: response.status, text: await response.text() };
}

const pages = await Promise.all(samplePaths.map(fetchText));

for (const page of pages) {
  if (page.status !== 200) {
    errors.push(`${page.url}: HTTP ${page.status}`);
    continue;
  }

  const title = decodeHtml(page.text.match(/<title>(.*?)<\/title>/s)?.[1]?.trim() || '');
  if (!title) errors.push(`${page.url}: title missing`);
  if (title.length < 30 || title.length > 60) {
    errors.push(`${page.url}: title length ${title.length} outside 30-60 (${title})`);
  }
  const brandMentions = title.match(/goldmoodastro/gi)?.length || 0;
  if (brandMentions > 1) errors.push(`${page.url}: brand repeated in title (${title})`);

  if (/href=["']#["']/i.test(page.text)) errors.push(`${page.url}: hash-only link found`);
  if (/<title>(Visa|Mastercard|PayPal|Stripe)<\/title>/i.test(page.text)) {
    errors.push(`${page.url}: payment SVG title is misclassified as head metadata`);
  }
  if (/rel=["'](?:dns-prefetch|preconnect)["'][^>]+(?:fonts\.googleapis|fonts\.gstatic|res\.cloudinary)/i.test(page.text)) {
    errors.push(`${page.url}: unused global resource hint found`);
  }

  const ogImage = page.text.match(/<meta property=["']og:image["'] content=["']([^"']+)/i)?.[1] || '';
  const twitterImage = page.text.match(/<meta name=["']twitter:image["'] content=["']([^"']+)/i)?.[1] || '';
  if (!ogImage) errors.push(`${page.url}: og:image missing`);
  if (!twitterImage) errors.push(`${page.url}: twitter:image missing`);
}

const localizedCorePaths = samplePaths.slice(0, 15);
const localizedCoreImages = localizedCorePaths.map((path) => {
  const html = pages.find((page) => page.url.endsWith(path))?.text || '';
  return html.match(/<meta property=["']og:image["'] content=["']([^"']+)/i)?.[1] || '';
});
if (new Set(localizedCoreImages.filter(Boolean)).size !== localizedCorePaths.length) {
  errors.push(`localized core pages: og:image values are not page-and-locale-specific (${localizedCoreImages.join(', ')})`);
}
for (const [index, imageUrl] of localizedCoreImages.entries()) {
  if (imageUrl && !imageUrl.includes('/opengraph-image')) {
    errors.push(`${localizedCorePaths[index]}: og:image is not a localized dynamic endpoint (${imageUrl})`);
  }
}

const ogImageResults = await Promise.all(
  localizedCoreImages.filter(Boolean).map(async (imageUrl) => {
    const parsed = new URL(imageUrl);
    const testUrl = new URL(baseUrl).hostname === 'localhost' && parsed.hostname === 'localhost'
      ? `${baseOrigin}${parsed.pathname}${parsed.search}`
      : imageUrl;
    const response = await fetch(testUrl, { redirect: 'follow' });
    return { imageUrl, status: response.status, contentType: response.headers.get('content-type') || '' };
  }),
);
for (const result of ogImageResults) {
  if (result.status !== 200 || !result.contentType.startsWith('image/')) {
    errors.push(`OG image ${result.imageUrl}: HTTP ${result.status}, content-type ${result.contentType || 'missing'}`);
  }
}

const trHome = pages.find((page) => page.url.endsWith('/tr'))?.text || '';
const trHomeTitle = decodeHtml(trHome.match(/<title>(.*?)<\/title>/s)?.[1]?.trim() || '').toLocaleLowerCase('tr-TR');
const trHomeDescription = decodeHtml(
  trHome.match(/<meta name=["']description["'] content=["']([^"']+)/i)?.[1]?.trim() || '',
).toLocaleLowerCase('tr-TR');
for (const keyword of ['astroloji', 'canlı', 'seans']) {
  if (!trHomeTitle.includes(keyword)) errors.push(`/tr: top content keyword missing from title (${keyword})`);
  if (!trHomeDescription.includes(keyword)) errors.push(`/tr: top content keyword missing from description (${keyword})`);
}
const trHomeImages = trHome.match(/<img\b[^>]*>/gi) || [];
for (const image of trHomeImages) {
  if (!/\bwidth=["'][^"']+["']/i.test(image) || !/\bheight=["'][^"']+["']/i.test(image)) {
    errors.push(`/tr: image lacks intrinsic dimensions (${image.slice(0, 140)}…)`);
  }
}
for (const socialUrl of [
  'https://www.instagram.com/goldmood_astro',
  'https://www.facebook.com/1354790577707171',
]) {
  if (!trHome.includes(`href="${socialUrl}"`)) errors.push(`/tr: SSR social link missing (${socialUrl})`);
  if (!trHome.includes(socialUrl)) errors.push(`/tr: Organization sameAs missing (${socialUrl})`);
}

const editorialChecks = [
  { path: '/tr/dogum-haritasi', topicLabel: 'İlgili araç ve rehberler', reviewed: 'Son gözden geçirme: 21 Eylül 2026' },
  { path: '/en/consultants', topicLabel: 'Related tools and guides', reviewed: 'Last reviewed: September 21, 2026' },
  { path: '/de/preise', topicLabel: 'Passende Tools und Ratgeber', reviewed: 'Zuletzt geprüft: 21. September 2026' },
];
for (const check of editorialChecks) {
  const html = pages.find((page) => page.url.endsWith(check.path))?.text || '';
  if (!html.includes(check.topicLabel)) errors.push(`${check.path}: localized topic connections missing`);
  if (!html.includes(check.reviewed)) errors.push(`${check.path}: visible editorial review date missing`);
  if (!html.includes('editorial-policy') && !html.includes('editor-politikasi') && !html.includes('redaktionsrichtlinie')) {
    errors.push(`${check.path}: editorial policy link missing`);
  }
}

const heroStatsSource = await Bun.file(new URL('../src/components/containers/home/HeroStats.tsx', import.meta.url)).text();
for (const fabricatedFallback of ["'500+'", "'20+'", "'4.9'"]) {
  if (heroStatsSource.includes(fabricatedFallback)) {
    errors.push(`HeroStats: fabricated fallback remains (${fabricatedFallback})`);
  }
}

const [trBirthChart, enRisingSign, deDailyHoroscope] = await Promise.all([
  fetchText('/tr/dogum-haritasi'),
  fetchText('/en/rising-sign-calculator'),
  fetchText('/de/sternzeichen/steinbock/heute'),
]);
if (!/<h1[^>]*>\s*Doğum Haritası Hesaplama ve Yorumlama\s*<\/h1>/s.test(trBirthChart.text)) {
  errors.push('/tr/dogum-haritasi: search-intent H1 missing');
}
if (/İçerik Yazarı/i.test(enRisingSign.text)) {
  errors.push('/en/rising-sign-calculator: Turkish author label leaked');
}
for (const leak of ['İçerik Yazarı', 'Überspringen To Hauptinhalt', 'compatibility with all signs', 'All 78 combinations']) {
  if (deDailyHoroscope.text.includes(leak)) errors.push(`/de/sternzeichen/steinbock/heute: visible language leak (${leak})`);
}
const deDailyVisible = decodeHtml(deDailyHoroscope.text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '));
const deDailyUnavailable = /(?:noch nicht veröffentlicht|daily reading is not published yet|henüz yayınlanmadı)/i.test(deDailyVisible);
const deDailyNoindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(deDailyHoroscope.text);
if (deDailyUnavailable && !deDailyNoindex) {
  errors.push('/de/sternzeichen/steinbock/heute: unpublished daily content must be noindex');
}
if (deDailyUnavailable && /<title>[^<]*\b\d{1,2}\.\s+[A-ZÄÖÜ][a-zäöü]+\s+20\d{2}/i.test(deDailyHoroscope.text)) {
  errors.push('/de/sternzeichen/steinbock/heute: unpublished daily content has a dated title');
}
if (deDailyUnavailable && /id=["']jsonld:daily-horoscope-review["']/.test(deDailyHoroscope.text)) {
  errors.push('/de/sternzeichen/steinbock/heute: unpublished daily content exposes Article review schema');
}

const telemetrySource = await Bun.file(new URL('../src/integrations/telemetry.ts', import.meta.url)).text();
const birthChartFormSource = await Bun.file(new URL('../src/components/containers/birth-chart/BirthChartForm.tsx', import.meta.url)).text();
const consultantSource = await Bun.file(new URL('../src/components/containers/consultant/ConsultantDetail.tsx', import.meta.url)).text();
const registerSource = await Bun.file(new URL('../src/components/containers/auth/Register.tsx', import.meta.url)).text();
const authModalSource = await Bun.file(new URL('../src/components/containers/auth/AuthModal.tsx', import.meta.url)).text();
for (const eventName of ['calculator_completed', 'chart_created']) {
  if (!telemetrySource.includes(`'${eventName}'`)) errors.push(`telemetry: ${eventName} contract missing`);
  if (!birthChartFormSource.includes(`gaEvent('${eventName}'`)) errors.push(`GA4: ${eventName} emission missing`);
}
for (const eventName of ['consultant_view', 'booking_start']) {
  if (!consultantSource.includes(`gaEvent('${eventName}'`)) errors.push(`GA4: ${eventName} emission missing`);
}
if (!consultantSource.includes('trackedConsultantIdRef.current === targetId')) {
  errors.push('GA4: consultant_view duplicate guard missing');
}
if (!telemetrySource.includes("'signup_complete'")) errors.push('telemetry: signup_complete contract missing');
for (const [sourceName, source] of [['Register', registerSource], ['AuthModal', authModalSource]] as const) {
  if (!source.includes("trackEvent('signup_complete'")) errors.push(`${sourceName}: signup_complete emission missing`);
  if (!source.includes("gaEvent('sign_up'")) errors.push(`${sourceName}: GA4 sign_up emission missing`);
}

const siteGraph = trHome.match(/<script[^>]+id="jsonld:site-graph"[^>]*>(.*?)<\/script>/s)?.[1];
if (!siteGraph) {
  errors.push('/tr: site JSON-LD graph missing');
} else {
  try {
    const graph = JSON.parse(siteGraph)?.['@graph'];
    const organization = Array.isArray(graph)
      ? graph.find((item: Record<string, unknown>) => item?.['@id'] === 'https://goldmoodastro.com/#org')
      : null;
    const address = organization?.address;
    if (address?.addressCountry !== 'DE' || address?.addressLocality !== 'Grevenbroich') {
      errors.push(`/tr: Organization address mismatch (${JSON.stringify(address)})`);
    }
  } catch (error) {
    errors.push(`/tr: site JSON-LD is invalid (${String(error)})`);
  }
}

const consultantPage = pages.find((page) => page.url.endsWith('/tr/danismanlar'))?.text || '';
const consultantAnchors = consultantPage.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) || [];
for (const anchor of consultantAnchors) {
  const attrs = anchor.match(/^<a\b([^>]*)>/i)?.[1] || '';
  const visibleText = decodeHtml(anchor.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  const ariaLabel = attrs.match(/aria-label=["']([^"']+)["']/i)?.[1]?.trim() || '';
  const title = attrs.match(/title=["']([^"']+)["']/i)?.[1]?.trim() || '';
  const imageAlt = anchor.match(/<img\b[^>]*alt=["']([^"']+)["']/i)?.[1]?.trim() || '';
  if (!visibleText && !ariaLabel && !title && !imageAlt) {
    errors.push(`/tr/danismanlar: link has no accessible name (${anchor.slice(0, 180)}…)`);
  }
}
const rawImages = consultantPage.match(/<img\b[^>]*>/gi) || [];
const contentImages = rawImages.filter((tag) => !/data-nimg=/i.test(tag));
if (!contentImages.length) errors.push('/tr/danismanlar: no consultant content images found');
for (const image of contentImages) {
  if (!/\bwidth=["'][^"']+["']/i.test(image) || !/\bheight=["'][^"']+["']/i.test(image)) {
    errors.push(`/tr/danismanlar: raw image lacks intrinsic dimensions (${image.slice(0, 140)}…)`);
  }
}

const llms = await fetchText('/llms.txt');
if (llms.status !== 200) errors.push(`${llms.url}: HTTP ${llms.status}`);
const forbiddenLlmsClaims = [
  /iyzipay/i,
  /support@goldmoodastro\.com/i,
  /consultant@goldmoodastro\.com/i,
  /end-to-end encrypted/i,
  /data hosted in Türkiye/i,
];
for (const pattern of forbiddenLlmsClaims) {
  if (pattern.test(llms.text)) errors.push(`/llms.txt: stale or unverified claim matches ${pattern}`);
}

const markdownUrls = Array.from(
  new Set(Array.from(llms.text.matchAll(/\]\((https:\/\/goldmoodastro\.com[^)]+)\)/g), (match) => match[1])),
);
if (markdownUrls.length < 20) errors.push(`/llms.txt: only ${markdownUrls.length} Markdown links found`);

const linkResults = await Promise.all(markdownUrls.map(fetchText));
for (const result of linkResults) {
  if (result.status !== 200) errors.push(`/llms.txt: linked URL ${result.url} returned ${result.status}`);
}

if (errors.length) {
  console.error(`SEO catalog regression: ${errors.length} error(s)`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `SEO catalog regression: ${pages.length} sample pages, ${localizedCoreImages.length} unique localized OG images, ${trHomeImages.length + contentImages.length} measured images, ${markdownUrls.length} llms links — clean`,
);
