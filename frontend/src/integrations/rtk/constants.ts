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
 *  NEXT_PUBLIC_ENSOTEK_API_URL=...
 *
 * Production'da reverse proxy kullanıyorsan env vermeyip "/api" de kullanabilirsin.
 */
const rawBase =
  (process.env.NEXT_PUBLIC_API_URL as string | undefined) ||
  (process.env.NEXT_PUBLIC_ENSOTEK_API_URL as string | undefined) ||
  '';

// env yoksa reverse proxy ile /api altında bekliyoruz.
export const BASE_URL = rawBase ? trimSlash(rawBase) : '/api';

export const EDGE_URL = BASE_URL;
export const APP_URL = BASE_URL;
