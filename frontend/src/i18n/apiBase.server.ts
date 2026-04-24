import 'server-only';

function trimSlash(x: string) {
  return String(x || '').replace(/\/+$/, '');
}

/**
 * Server-side API base resolver.
 *
 * Accepts either:
 * - "http://127.0.0.1:8086/api"
 * - "http://127.0.0.1:8086"        (will append "/api")
 *
 * Uses the same envs as the client-side base resolution to avoid
 * SSR (metadata) reading a different backend than the UI.
 */
export function getServerApiBase(): string {
  const raw =
    (process.env.API_BASE_URL || '').trim() ||
    (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim() ||
    (process.env.NEXT_PUBLIC_API_URL || '').trim();

  const base = trimSlash(raw);
  if (!base) return '';

  if (!/\/api$/i.test(base)) return `${base}/api`;
  return base;
}
