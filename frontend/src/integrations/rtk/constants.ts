// =============================================================
// FILE: src/integrations/rtk/constants.ts
// Next.js için API URL sabitleri
// =============================================================

function trimSlash(x: string) {
  return String(x || '').replace(/\/+$/, '');
}

/**
 * Önerilen .env.local:
 *  NEXT_PUBLIC_API_URL=http://127.0.0.1:8086/api
 *
 * Alternatif:
 *
 * Production'da reverse proxy kullanıyorsan env vermeyip "/api" de kullanabilirsin.
 */
const rawBase =
  (process.env.NEXT_PUBLIC_API_URL as string | undefined) ||
  '';

function shouldUseSameOriginProxy(base: string): boolean {
  if (typeof window === 'undefined') return false;
  if (!/^https?:\/\//i.test(base)) return false;
  const host = window.location.hostname;
  if (!['localhost', '127.0.0.1', '0.0.0.0'].includes(host)) return false;
  try {
    return new URL(base).origin !== window.location.origin;
  } catch {
    return false;
  }
}

// env yoksa reverse proxy ile /api altında bekliyoruz.
export const BASE_URL = rawBase && !shouldUseSameOriginProxy(rawBase) ? trimSlash(rawBase) : '/api';

export const EDGE_URL = BASE_URL;
export const APP_URL = BASE_URL;
