const baseUrl = (process.argv[2] || 'http://localhost:3095').replace(/\/$/, '');

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

const trCorePaths = ['/tr', '/tr/danismanlar', '/tr/fiyatlandirma', '/tr/blog', '/tr/hakkimizda'];
const trCoreImages = trCorePaths.map((path) => {
  const html = pages.find((page) => page.url.endsWith(path))?.text || '';
  return html.match(/<meta property=["']og:image["'] content=["']([^"']+)/i)?.[1] || '';
});
if (new Set(trCoreImages.filter(Boolean)).size !== trCorePaths.length) {
  errors.push(`/tr core pages: og:image values are not page-specific (${trCoreImages.join(', ')})`);
}

const trHome = pages.find((page) => page.url.endsWith('/tr'))?.text || '';
for (const socialUrl of [
  'https://www.instagram.com/goldmood_astro',
  'https://www.facebook.com/1354790577707171',
]) {
  if (!trHome.includes(`href="${socialUrl}"`)) errors.push(`/tr: SSR social link missing (${socialUrl})`);
  if (!trHome.includes(socialUrl)) errors.push(`/tr: Organization sameAs missing (${socialUrl})`);
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
  `SEO catalog regression: ${pages.length} sample pages, ${contentImages.length} measured raw images, ${markdownUrls.length} llms links — clean`,
);
