// Lightweight fetch wrapper for Next.js RSC compatible API calls

interface FetchOptions {
  cache?: RequestCache;
  revalidate?: number;
  tags?: string[];
}

function buildUrl(baseUrl: string, path: string, params?: Record<string, unknown>): string {
  const url = new URL(`${baseUrl}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function apiFetch<T>(
  baseUrl: string,
  path: string,
  params?: Record<string, unknown>,
  options: FetchOptions = {},
): Promise<T> {
  const url = buildUrl(baseUrl, path, params);

  const nextOptions: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {};

  if (options.revalidate !== undefined) {
    nextOptions.next = { revalidate: options.revalidate };
    if (options.tags) nextOptions.next.tags = options.tags;
  } else if (options.cache) {
    nextOptions.cache = options.cache;
  } else {
    nextOptions.cache = 'no-store';
  }

  const res = await fetch(url, nextOptions);

  if (!res.ok) {
    throw new Error(`API Error ${res.status}: ${res.statusText} — ${url}`);
  }

  return res.json() as Promise<T>;
}

export async function apiPost<T>(
  baseUrl: string,
  path: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`API Error ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
