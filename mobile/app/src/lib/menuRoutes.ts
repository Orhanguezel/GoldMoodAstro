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
  '/me/settings': '/me/settings',
  '/me/readings': '/me/readings',
  '/me/credits': '/me/credits',
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

/** Map backend menu `url`/`href` to in-app navigation or web site URL (Next). Paths backend’den; metin kopyası yok. */
export function resolveMenuLink(
  rawUrl: string,
  locale: string | undefined,
  webOrigin: string,
): ResolvedMenuNavigation | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return { kind: 'webview', url: safeDecodeUrl(trimmed) };
  }

  const pathOnly = normalizePath(trimmed.split('?')[0] ?? '');
  const internal = resolveExpoPath(pathOnly);
  if (internal) return { kind: 'expo', path: internal };

  const lang = appLang(locale);
  const suffix = pathOnly === '/' ? '' : pathOnly;
  const base = webOrigin.replace(/\/+$/, '');
  const webUrl = `${base}/${lang}${suffix}`;
  return { kind: 'webview', url: webUrl };
}
