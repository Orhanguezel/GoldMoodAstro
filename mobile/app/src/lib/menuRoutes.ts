export type ResolvedMenuNavigation =
  | { kind: 'expo'; path: string }
  | { kind: 'webview'; url: string };

const PATH_TO_EXPO: Record<string, string> = {
  '/': '/(tabs)/today',
  '/burclar': '/(tabs)/zodiac',
  '/birth-chart': '/(tabs)/birth-chart',
  '/sinastri': '/synastry',
  '/yildizname': '/yildizname',
  '/daily': '/(tabs)/daily',
  '/tarot': '/(tabs)/tarot',
  '/kahve-fali': '/coffee',
  '/ruya-tabiri': '/dreams',
  '/numeroloji': '/numerology',
  '/consultants': '/(tabs)/connect',
  '/packages': '/packages',
  '/pricing': '/packages',
  '/profile/credits': '/(tabs)/profile/credits',
  '/profile/subscription': '/(tabs)/profile/subscription',
  '/me/settings': '/me/settings',
  '/me/readings': '/me/readings',
  '/me/credits': '/(tabs)/profile/credits',
};

function normalizePath(raw: string): string {
  let p = raw.trim();
  if (!p) return '/';
  if (!p.startsWith('/')) p = `/${p}`;
  if (p.startsWith('/tr/') || p.startsWith('/en/') || p.startsWith('/de/')) {
    const rest = p.split('/').slice(2).join('/');
    const next = rest ? `/${rest}` : '/';
    return next.replace(/\/$/, '') || '/';
  }
  if (p === '/tr' || p === '/en' || p === '/de') return '/';
  const trimmed = p.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

function appLang(locale?: string): 'tr' | 'en' | 'de' {
  const l = (locale || 'tr').toLowerCase();
  if (l.startsWith('de')) return 'de';
  if (l.startsWith('en')) return 'en';
  return 'tr';
}

function resolveExpoPath(pathOnly: string): string | null {
  const exact = PATH_TO_EXPO[pathOnly];
  if (exact) return exact;

  const burclar = /^\/burclar\/([^/]+)$/i.exec(pathOnly);
  if (burclar?.[1]) {
    return `/zodiac/${burclar[1].toLowerCase()}`;
  }

  const consult = /^\/consultants\/([^/]+)$/.exec(pathOnly);
  if (consult?.[1]) {
    return `/consultant/${consult[1]}`;
  }

  return null;
}

function safeDecodeUrl(url: string): string {
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
}

function decodedPath(pathname: string): string {
  let path = pathname;
  // A content link may encode a payment path once or twice. Match the path
  // the web server will ultimately route, and reject malformed encodings.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const next = decodeURIComponent(path);
    if (next === path) break;
    path = next;
  }
  return path;
}

const DIGITAL_PAYMENT_PATH = /^\/(?:pricing|packages|me\/credits|profile\/(?:credits|subscription)|checkout|sepet)(?:\/|$)/i;

function isOwnedSiteHost(hostname: string, webOrigin: string): boolean {
  const configured = new URL(webOrigin).hostname.replace(/^www\./i, '').toLowerCase();
  return hostname.replace(/^www\./i, '').toLowerCase() === configured;
}

/** Generic content WebViews must never become a digital-goods checkout route. */
export function isAllowedContentWebUrl(rawUrl: string, webOrigin: string): boolean {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && /^(?:localhost|127\.0\.0\.1)$/.test(url.hostname))) return false;
    const site = new URL(webOrigin);
    if (!isOwnedSiteHost(url.hostname, site.origin)) return false;
    const normalized = normalizePath(decodedPath(url.pathname));
    if (DIGITAL_PAYMENT_PATH.test(normalized)) return false;
    return true;
  } catch {
    return false;
  }
}

/** Map backend menu `url`/`href` to in-app navigation or web site URL (Next). Paths backend’den; metin kopyası yok. */
export function resolveMenuLink(
  rawUrl: string,
  locale: string | undefined,
  webOrigin: string,
): ResolvedMenuNavigation | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    const url = safeDecodeUrl(trimmed);
    try {
      const site = new URL(webOrigin);
      const parsed = new URL(url);
      if (isOwnedSiteHost(parsed.hostname, site.origin)) {
        const internal = resolveExpoPath(normalizePath(decodedPath(parsed.pathname)));
        if (internal) return { kind: 'expo', path: internal };
      }
    } catch { return null; }
    return isAllowedContentWebUrl(url, webOrigin) ? { kind: 'webview', url } : null;
  }

  const pathOnly = normalizePath(trimmed.split('?')[0] ?? '');
  const internal = resolveExpoPath(pathOnly);
  if (internal) return { kind: 'expo', path: internal };

  const lang = appLang(locale);
  const suffix = pathOnly === '/' ? '' : pathOnly;
  const base = webOrigin.replace(/\/+$/, '');
  const webUrl = `${base}/${lang}${suffix}`;
  return isAllowedContentWebUrl(webUrl, webOrigin) ? { kind: 'webview', url: webUrl } : null;
}
