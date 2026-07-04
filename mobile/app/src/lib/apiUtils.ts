export function messageFromApiErrorBody(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const o = err as Record<string, unknown>;
  if (typeof o.message === 'string') return o.message;
  const nested = o.error;
  if (typeof nested === 'string') return nested;
  if (nested && typeof nested === 'object' && typeof (nested as { message?: string }).message === 'string') {
    return (nested as { message: string }).message;
  }
  return undefined;
}

export function cacheKey(method: string, path: string, params?: Record<string, string | number>) {
  const qs = params
    ? Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&')
    : '';
  return `${method}:${path}?${qs}`;
}

export function normalizeListResponse<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];

  const res = value as { items?: unknown; data?: unknown };
  const candidate = (res?.data as unknown) ?? res?.items;
  const nested = candidate as { items?: unknown } | null | undefined;
  const fallback = (nested && Array.isArray(nested.items)) ? nested.items : null;
  if (Array.isArray(candidate)) return candidate as T[];
  if (Array.isArray(fallback)) return fallback as T[];

  return [];
}

export function unwrapData<T>(value: unknown): T | null {
  if (!value || typeof value !== 'object') return null;
  if (!('data' in value)) return null;
  return (value as { data: T }).data;
}
