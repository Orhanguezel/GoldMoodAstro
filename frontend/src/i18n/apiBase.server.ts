import 'server-only';

function trimSlash(x: string) {
  return String(x || '').replace(/\/+$/, '');
}

/**
 * Server-side API base resolver.
 *
 * Accepts:
 * - "http://127.0.0.1:8094/api"
 * - "http://127.0.0.1:8094/api/v1"  (versiyonlu prefix de geçerli)
 * - "http://127.0.0.1:8094"         (will append "/api")
 */
export function getServerApiBase(): string {
  const raw =
    (process.env.API_BASE_URL || '').trim() ||
    (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim() ||
    (process.env.NEXT_PUBLIC_API_URL || '').trim();

  const base = trimSlash(raw);
  if (!base) return '';

  // base zaten /api veya /api/v1 ile bitiyorsa double-append yapma
  if (!/\/api(\/v\d+)?$/i.test(base)) return `${base}/api`;
  return base;
}
