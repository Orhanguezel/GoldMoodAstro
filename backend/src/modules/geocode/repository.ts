import { randomUUID } from 'crypto';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/db/client';
import { geocodeCache } from './schema';
import { geocodeWithNominatim, type GeocodeResult } from './service';

const CACHE_TTL_DAYS = 30;

function normalizeQuery(q: string) {
  return q.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr-TR');
}

function ttlDate() {
  const d = new Date();
  d.setDate(d.getDate() + CACHE_TTL_DAYS);
  return d;
}

export async function searchGeocode(q: string): Promise<GeocodeResult | null> {
  const normalized = normalizeQuery(q);

  const [cached] = await db
    .select()
    .from(geocodeCache)
    .where(and(eq(geocodeCache.q, normalized), gt(geocodeCache.ttl, new Date())))
    .limit(1);

  if (cached) {
    return {
      q: normalized,
      lat: Number(cached.lat),
      lng: Number(cached.lng),
      label: cached.label,
      source: 'cache',
    };
  }

  const fresh = await geocodeWithNominatim(q);
  if (!fresh) return null;

  await db.delete(geocodeCache).where(eq(geocodeCache.q, normalized));
  await db.insert(geocodeCache).values({
    id: randomUUID(),
    q: normalized,
    lat: String(fresh.lat),
    lng: String(fresh.lng),
    label: fresh.label,
    ttl: ttlDate(),
  });

  return { q: normalized, ...fresh, source: 'nominatim' };
}
