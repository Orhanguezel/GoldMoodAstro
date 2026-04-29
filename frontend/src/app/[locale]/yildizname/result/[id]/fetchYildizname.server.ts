import 'server-only';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8094/api').replace(/\/$/, '');

export async function fetchYildiznameReading(id: string) {
  try {
    const res = await fetch(`${API_BASE}/yildizname/reading/${id}`, {
      next: { revalidate: 3600 }, // Cache results for 1 hour
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch (err) {
    console.error('fetchYildiznameReading error:', err);
    return null;
  }
}
