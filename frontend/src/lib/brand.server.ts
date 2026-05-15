import 'server-only';
import { rowsToBrand, type Brand } from '@/integrations/shared/brand';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8094/api').replace(/\/$/, '');

/**
 * RSC (Server Components) içinde marka ayarlarını çeker.
 * 300sn cache'li (siteSettings revalidate).
 */
export async function getBrandServer(): Promise<Brand> {
  try {
    const res = await fetch(`${API_BASE}/site_settings?group=brand`, {
      next: { revalidate: 300, tags: ['site-settings', 'brand'] },
    });
    if (!res.ok) return rowsToBrand(null);
    const data = await res.json();
    // data: { data: SiteSettingRow[] }
    return rowsToBrand(data.data || data);
  } catch {
    return rowsToBrand(null);
  }
}
