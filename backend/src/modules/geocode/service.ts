import { env } from '@/core/env';

export interface GeocodeResult {
  q: string;
  lat: number;
  lng: number;
  label: string;
  source: 'cache' | 'nominatim';
}

interface NominatimResult {
  lat?: string;
  lon?: string;
  display_name?: string;
  name?: string;
}

function normalizeCoordinate(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function geocodeWithNominatim(q: string): Promise<Omit<GeocodeResult, 'q' | 'source'> | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '0');

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': `${env.APP_NAME || 'GoldMoodAstro'} geocoder (${env.PUBLIC_URL})`,
    },
  });

  if (!res.ok) {
    const error = new Error('geocode_provider_failed');
    (error as Error & { statusCode?: number }).statusCode = 502;
    throw error;
  }

  const rows = (await res.json()) as NominatimResult[];
  const first = rows[0];
  const lat = normalizeCoordinate(first?.lat);
  const lng = normalizeCoordinate(first?.lon);
  if (lat == null || lng == null) return null;

  return {
    lat,
    lng,
    label: String(first.display_name || first.name || q).slice(0, 500),
  };
}
